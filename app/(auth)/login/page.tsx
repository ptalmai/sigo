'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (searchParams.get('cadastro') === '1') {
      setSuccessMessage('Conta criada com sucesso! Faça login para continuar.')
    }
  }, [searchParams])

  function validate() {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Campo obrigatório'
    if (!password) newErrors.password = 'Campo obrigatório'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      if (result.error.includes('autorizado')) {
        setErrors({ email: 'Este e-mail não está autorizado a acessar o ARGOS.' })
      } else if (result.error.includes('encontrado')) {
        setErrors({ email: 'E-mail não encontrado.' })
      } else {
        setErrors({ password: 'Senha incorreta.' })
      }
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 text-center">
        Entrar
      </h2>

      {successMessage && (
        <p className="text-xs text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-center mb-4">
          {successMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail corporativo</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com.br"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={errors.email ? 'border-[var(--destructive)]' : ''}
          />
          {errors.email && (
            <p className="text-xs text-[var(--destructive)]">
              {errors.email}{' '}
              {errors.email.includes('encontrado') && (
                <Link href="/cadastro" className="underline font-medium">
                  Primeiro acesso?
                </Link>
              )}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e as unknown as React.FormEvent)}
              className={`pr-10 ${errors.password ? 'border-[var(--destructive)]' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-[var(--destructive)]">{errors.password}</p>
          )}
        </div>

        {errors.form && (
          <p className="text-xs text-[var(--destructive)] text-center">{errors.form}</p>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          style={{ backgroundColor: '#0066B3', borderColor: '#0066B3' }}
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          Entrar
        </Button>
      </form>

      <div className="mt-5 text-center space-y-2 text-sm">
        <div>
          <Link href="/cadastro" className="font-medium hover:underline" style={{ color: '#0066B3' }}>
            Primeiro acesso? Cadastre-se aqui
          </Link>
        </div>
        <div>
          <Link href="/recuperar-senha" className="hover:underline" style={{ color: '#0066B3' }}>
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
