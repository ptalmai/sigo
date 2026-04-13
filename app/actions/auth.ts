'use server'

import { signIn } from '@/auth'
import { CredentialsSignin } from 'next-auth'

export type LoginResult =
  | { ok: true }
  | { ok: false; field: 'email' | 'password' | 'form'; message: string }

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  try {
    await signIn('credentials', { email, password, redirect: false })
    return { ok: true }
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      const code = error.code ?? ''
      if (code === 'invalid_domain') {
        return { ok: false, field: 'email', message: 'Este e-mail não está autorizado a acessar o ARGOS.' }
      }
      if (code === 'email_not_found') {
        return { ok: false, field: 'email', message: 'E-mail não encontrado.' }
      }
      return { ok: false, field: 'password', message: 'Senha incorreta.' }
    }
    // Re-throw erros internos do Next.js (ex: NEXT_REDIRECT)
    throw error
  }
}
