import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = ['/login', '/cadastro', '/recuperar-senha'].some(p =>
        nextUrl.pathname.startsWith(p)
      )

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
      }

      if (!isLoggedIn) return false
      return true
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0
      }
      return token
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { sessionVersion?: number }).sessionVersion =
          token.sessionVersion as number
      }
      return session
    },
  },

  providers: [],
} satisfies NextAuthConfig
