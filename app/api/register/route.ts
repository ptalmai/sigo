import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { isDomainAllowed, isPasswordValid, SECURITY_QUESTIONS } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  try {
    const { email, password, securityQuestion, securityAnswer } = await req.json()

    // Validate required fields
    if (!email || !password || !securityQuestion || !securityAnswer) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
    }

    const normalizedEmail = (email as string).toLowerCase().trim()

    // Validate domain
    if (!isDomainAllowed(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Este e-mail não está autorizado a acessar o ARGOS.' },
        { status: 403 }
      )
    }

    // Validate security question
    if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
      return NextResponse.json({ error: 'Pergunta de segurança inválida.' }, { status: 400 })
    }

    // Validate password complexity
    if (!isPasswordValid(password)) {
      return NextResponse.json(
        { error: 'A senha deve ter ao menos 8 caracteres, 1 maiúscula e 1 número.' },
        { status: 400 }
      )
    }

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: 'Este e-mail já possui cadastro. Faça login.' },
        { status: 409 }
      )
    }

    // Hash password and security answer
    const [passwordHash, securityAnswerHash] = await Promise.all([
      bcrypt.hash(password, 12),
      bcrypt.hash((securityAnswer as string).toLowerCase().trim(), 10),
    ])

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        securityQuestion,
        securityAnswerHash,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
