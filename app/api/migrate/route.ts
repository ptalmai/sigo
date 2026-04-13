import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Rota temporária para criar tabelas no Turso — REMOVER APÓS USO
export async function GET() {
  try {
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
    return NextResponse.json({ ok: true, message: 'Tabela User criada/verificada com sucesso.' })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
