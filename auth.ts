import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { isDomainAllowed } from '@/lib/auth-utils'
import { authConfig } from './auth.config'

// Erros tipados para distinguir falhas de login no server action
class InvalidDomainError extends CredentialsSignin { code = 'invalid_domain' }
class EmailNotFoundError extends CredentialsSignin { code = 'email_not_found' }
class WrongPasswordError extends CredentialsSignin { code = 'wrong_password' }

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

        if (!email || !password) throw new WrongPasswordError()
        if (!isDomainAllowed(email)) throw new InvalidDomainError()

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) throw new EmailNotFoundError()

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) throw new WrongPasswordError()

        return {
          id: user.id,
          email: user.email,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
})
