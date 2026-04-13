'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isDomainAllowed, getPasswordStrength, SECURITY_QUESTIONS } from '@/lib/auth-utils'
import { loginAction } from '@/app/actions/auth'

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done
                  ? 'bg-[var(--primary)] text-white'
                  : active
                    ? 'bg-[var(--primary)] text-white ring-4 ring-purple-200 dark:ring-purple-900'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              }`}
            >
              {done ? <Check size={14} /> : step}
            </div>
            {i < total - 1 && (
              <div
                className={`h-0.5 w-6 transition-colors ${
                  done ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                }`}
              />
            )}
          </div>
        )
      })}
      <span className="ml-2 text-xs text-[var(--muted-foreground)]">
        {current} de {total}
      </span>
    </div>
  )
}

// ── Password strength bar ──────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null
  const strength = getPasswordStrength(password)
  const widths = { fraca: 'w-1/3', média: 'w-2/3', forte: 'w-full' }
  const colors = {
    fraca: 'bg-[var(--destructive)]',
    média: 'bg-yellow-500',
    forte: 'bg-green-500',
  }
  const labels = { fraca: 'Fraca', média: 'Média', forte: 'Forte' }
  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${widths[strength]} ${colors[strength]}`} />
      </div>
      <p className={`text-xs ${colors[strength].replace('bg-', 'text-')}`}>
        Senha {labels[strength]}
      </p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Step 1: Email ──────────────────────────────────────────────────────
  async function handleStep1(e: FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      newErrors.email = 'Campo obrigatório'
    } else if (!isDomainAllowed(normalizedEmail)) {
      newErrors.email = 'Este e-mail não está autorizado a acessar o ARGOS.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Check if already registered
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: '__check__', securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: '__check__' }),
      })
      if (res.status === 409) {
        setErrors({ email: 'Este e-mail já possui cadastro. Faça login.' })
        setLoading(false)
        return
      }
    } catch {
      // network error — proceed anyway, will fail at final submit
    }

    setErrors({})
    setLoading(false)
    setStep(2)
  }

  // ── Step 2: Password ───────────────────────────────────────────────────
  function handleStep2(e: FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!password) {
      newErrors.password = 'Campo obrigatório'
    } else if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      newErrors.password = 'A senha deve ter ao menos 8 caracteres, 1 maiúscula e 1 número'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Campo obrigatório'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setStep(3)
  }

  // ── Step 3: Security question + final submit ───────────────────────────
  async function handleStep3(e: FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!securityQuestion) newErrors.securityQuestion = 'Selecione uma pergunta'
    if (!securityAnswer.trim()) newErrors.securityAnswer = 'Campo obrigatório'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          securityQuestion,
          securityAnswer: securityAnswer.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrors({ form: (data as { error?: string }).error ?? 'Erro ao criar conta. Tente novamente.' })
        setLoading(false)
        return
      }

      // Cadastro concluído — faz login automático e vai direto ao dashboard
      const loginResult = await loginAction(email.trim().toLowerCase(), password)
      if (!loginResult.ok) {
        // Conta criada mas login falhou — redireciona para login manual
        router.push('/login?cadastro=1')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setErrors({ form: 'Erro ao criar conta. Tente novamente.' })
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2 text-center">
        Primeiro Acesso
      </h2>

      <StepIndicator current={step} total={3} />

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleStep1} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail corporativo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@pmenos.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => {
                const v = email.trim().toLowerCase()
                if (v && !isDomainAllowed(v)) {
                  setErrors({ email: 'Este e-mail não está autorizado a acessar o ARGOS.' })
                } else {
                  setErrors({})
                }
              }}
              className={errors.email ? 'border-[var(--destructive)]' : ''}
            />
            {errors.email && (
              <p className="text-xs text-[var(--destructive)]">
                {errors.email}{' '}
                {errors.email.includes('cadastro') && (
                  <Link href="/login" className="underline font-medium">
                    Faça login.
                  </Link>
                )}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Continuar
          </Button>

          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Já tem conta?{' '}
            <Link href="/login" className="text-[var(--primary)] hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handleStep2} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Crie uma senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
            <PasswordStrengthBar password={password} />
            {errors.password && (
              <p className="text-xs text-[var(--destructive)]">{errors.password}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`pr-10 ${errors.confirmPassword ? 'border-[var(--destructive)]' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={showConfirm ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-[var(--destructive)]">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button type="submit" className="flex-1">
              Continuar
            </Button>
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <form onSubmit={handleStep3} noValidate className="space-y-4">
          <p className="text-sm text-[var(--muted-foreground)] -mt-1 mb-1">
            Escolha uma pergunta para recuperar sua senha sem precisar de e-mail.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="securityQuestion">Pergunta de segurança</Label>
            <Select onValueChange={(v) => setSecurityQuestion(v ?? '')} value={securityQuestion}>
              <SelectTrigger
                id="securityQuestion"
                className={errors.securityQuestion ? 'border-[var(--destructive)]' : ''}
              >
                <SelectValue placeholder="Selecione uma pergunta..." />
              </SelectTrigger>
              <SelectContent>
                {SECURITY_QUESTIONS.map(q => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.securityQuestion && (
              <p className="text-xs text-[var(--destructive)]">{errors.securityQuestion}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="securityAnswer">Sua resposta</Label>
            <Input
              id="securityAnswer"
              type="text"
              autoComplete="off"
              placeholder="Resposta (não diferencia maiúsculas)"
              value={securityAnswer}
              onChange={e => setSecurityAnswer(e.target.value)}
              className={errors.securityAnswer ? 'border-[var(--destructive)]' : ''}
            />
            {errors.securityAnswer && (
              <p className="text-xs text-[var(--destructive)]">{errors.securityAnswer}</p>
            )}
          </div>

          {errors.form && (
            <p className="text-xs text-[var(--destructive)] text-center">{errors.form}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Concluir
            </Button>
          </div>
        </form>
      )}
    </>
  )
}
