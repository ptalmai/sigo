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

    // 2. Listar todas as tabelas no banco
    const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    )

    // 3. Contar rows em cada tabela encontrada
    const tableCounts: Record<string, number> = {}
    for (const t of tables) {
      try {
        const rows = await prisma.$queryRawUnsafe<{ c: number }[]>(`SELECT count(*) as c FROM "${t.name}"`)
        tableCounts[t.name] = Number(rows[0]?.c ?? 0)
      } catch { tableCounts[t.name] = -1 }
    }

    return NextResponse.json({ ok: true, dbUrl, hasToken, userCount: users.length, tables, tableCounts })
  } catch (error) {
    return NextResponse.json({ ok: false, dbUrl, hasToken, error: String(error) }, { status: 500 })
  }
}
