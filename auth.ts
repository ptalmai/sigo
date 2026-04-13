import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { isDomainAllowed } from '@/lib/auth-utils'
import { authConfig } from './auth.config'

const SESSION_DAYS = parseInt(process.env.SESSION_DURATION_DAYS ?? '7', 10)

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  session: {
    strategy: 'jwt',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  },

  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim()
        const password = credentials?.password as string | undefined

        if (!email || !password) return null
        if (!isDomainAllowed(email)) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
})
