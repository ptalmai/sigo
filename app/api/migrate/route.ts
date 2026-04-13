import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Rota temporária de diagnóstico — REMOVER APÓS USO
export async function GET() {
  const dbUrl = (process.env.DATABASE_URL ?? 'NOT SET')
  const hasToken = !!process.env.TURSO_AUTH_TOKEN

  try {
    // 1. Listar usuários existentes
    const users = await prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
    })

    // 2. Testar escrita + leitura
    const testEmail = '__diag__@pmenos.com.br'
    let writeTest: string
    try {
      await prisma.user.upsert({
        where: { email: testEmail },
        update: {},
        create: {
          id: 'diag-test-001',
          email: testEmail,
          passwordHash: 'test',
          securityQuestion: 'test',
          securityAnswerHash: 'test',
        },
      })
      const found = await prisma.user.findUnique({ where: { email: testEmail } })
      writeTest = found ? 'OK — escrita e leitura funcionam' : 'FALHOU — escreveu mas não leu'
      // limpar registro de teste
      await prisma.user.delete({ where: { email: testEmail } }).catch(() => null)
    } catch (e) {
      writeTest = `ERRO: ${String(e)}`
    }

    return NextResponse.json({ ok: true, dbUrl, hasToken, userCount: users.length, users, writeTest })
  } catch (error) {
    return NextResponse.json({ ok: false, dbUrl, hasToken, error: String(error) }, { status: 500 })
  }
}
