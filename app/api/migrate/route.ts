import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Rota temporária de diagnóstico — REMOVER APÓS USO
export async function GET() {
  try {
    // Criar tabela se não existir
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id"                 TEXT NOT NULL PRIMARY KEY,
        "email"              TEXT NOT NULL UNIQUE,
        "passwordHash"       TEXT NOT NULL,
        "securityQuestion"   TEXT NOT NULL,
        "securityAnswerHash" TEXT NOT NULL,
        "lockoutUntil"       DATETIME,
        "lockoutAttempts"    INTEGER NOT NULL DEFAULT 0,
        "sessionVersion"     INTEGER NOT NULL DEFAULT 0,
        "createdAt"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Listar usuários cadastrados (sem dados sensíveis)
    const users = await prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
    })

    const dbUrl = (process.env.DATABASE_URL ?? 'not set').replace(/authToken=.*/, 'authToken=***')

    return NextResponse.json({ ok: true, dbUrl, userCount: users.length, users })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
