import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/db'
import { isDomainAllowed, isPasswordValid } from '@/lib/auth-utils'

const LOCKOUT_MINUTES = parseInt(process.env.AUTH_LOCKOUT_MINUTES ?? '30', 10)
const MAX_ATTEMPTS = 3
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'fallback-dev-secret')

// ── Step 1: Get security question ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim()

  if (!email) return NextResponse.json({ error: 'E-mail obrigatório.' }, { status: 400 })

  if (!isDomainAllowed(email)) {
    return NextResponse.json(
      { error: 'Este e-mail não está autorizado a acessar o ARGOS.' },
      { status: 403 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { securityQuestion: true },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'E-mail não encontrado. Faça seu primeiro acesso.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ securityQuestion: user.securityQuestion })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { step } = body

    // ── Step 2: Verify security answer ──────────────────────────────────────
    if (step === 'verify') {
      const { email, securityAnswer } = body
      const normalizedEmail = (email as string)?.toLowerCase().trim()
      const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

      if (!normalizedEmail || !securityAnswer) {
        return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
      }

      if (!isDomainAllowed(normalizedEmail)) {
        return NextResponse.json(
          { error: 'Este e-mail não está autorizado a acessar o ARGOS.' },
          { status: 403 }
        )
      }

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (!user) {
        return NextResponse.json(
          { error: 'E-mail não encontrado. Faça seu primeiro acesso.' },
          { status: 404 }
        )
      }

      // Check lockout
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000)
        return NextResponse.json(
          { error: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).`, locked: true, minutesLeft },
          { status: 429 }
        )
      }

      const answerMatch = await bcrypt.compare(
        (securityAnswer as string).toLowerCase().trim(),
        user.securityAnswerHash
      )

      if (!answerMatch) {
        const attempts = user.lockoutAttempts + 1
        const shouldLock = attempts >= MAX_ATTEMPTS

        await prisma.user.update({
          where: { email: normalizedEmail },
          data: {
            lockoutAttempts: shouldLock ? 0 : attempts,
            lockoutUntil: shouldLock
              ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
              : null,
          },
        })

        if (shouldLock) {
          return NextResponse.json(
            { error: `Muitas tentativas. Tente novamente em ${LOCKOUT_MINUTES} minuto(s).`, locked: true, minutesLeft: LOCKOUT_MINUTES },
            { status: 429 }
          )
        }

        const remaining = MAX_ATTEMPTS - attempts
        return NextResponse.json(
          { error: `Resposta incorreta. ${remaining} tentativa(s) restante(s).`, remaining },
          { status: 401 }
        )
      }

      // Correct answer — issue a short-lived recovery token (bound to email + ip)
      const token = await new SignJWT({ email: normalizedEmail, ip, purpose: 'password-reset' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('10m')
        .sign(secret)

      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { lockoutAttempts: 0, lockoutUntil: null },
      })

      return NextResponse.json({ recoveryToken: token })
    }

    // ── Step 3: Reset password ───────────────────────────────────────────────
    if (step === 'reset') {
      const { recoveryToken, newPassword } = body
      const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

      if (!recoveryToken || !newPassword) {
        return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
      }

      let payload: { email: string; ip: string; purpose: string }
      try {
        const { payload: p } = await jwtVerify(recoveryToken, secret)
        payload = p as typeof payload
      } catch {
        return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 })
      }

      if (payload.purpose !== 'password-reset' || payload.ip !== ip) {
        return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
      }

      if (!isPasswordValid(newPassword)) {
        return NextResponse.json(
          { error: 'A senha deve ter ao menos 8 caracteres, 1 maiúscula e 1 número.' },
          { status: 400 }
        )
      }

      const passwordHash = await bcrypt.hash(newPassword, 12)

      await prisma.user.update({
        where: { email: payload.email },
        data: {
          passwordHash,
          sessionVersion: { increment: 1 },
          lockoutAttempts: 0,
          lockoutUntil: null,
        },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Step inválido.' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
