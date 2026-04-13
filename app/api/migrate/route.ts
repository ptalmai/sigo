import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Rota temporária de diagnóstico — REMOVER APÓS USO
export async function GET() {
  const dbUrl = (process.env.DATABASE_URL ?? 'NOT SET')
  const hasToken = !!process.env.TURSO_AUTH_TOKEN

  try {
    // 1. Listar usuários
    const users = await prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
    })

    return NextResponse.json({
      ok: true,
      dbUrl,
      hasToken,
      userCount: users.length,
      users,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, dbUrl, hasToken, error: String(error) }, { status: 500 })
  }
}
