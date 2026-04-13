import CadastroForm from './CadastroForm'

// Impede pre-render estático (ISR) — necessário para Server Actions funcionarem
export const dynamic = 'force-dynamic'

export default function CadastroPage() {
  return <CadastroForm />
}
