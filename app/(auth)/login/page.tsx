import { Suspense } from 'react'
import LoginForm from './LoginForm'

// Impede pre-render estático (ISR) — necessário para Server Actions funcionarem
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
