'use client'

import { useState, FormEvent, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isDomainAllowed } from '@/lib/auth-utils'

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
                className={`h-0.5 w-6 transition-colors ${done ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}
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

export default function RecuperarSenhaPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [recoveryToken, setRecoveryToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lockoutMinutes, setLockoutMinutes] = useState(0)
  const [lockoutCountdown, setLockoutCountdown] = useState(0)

  useEffect(() => {
    if (lockoutCountdown <= 0) return
    const timer = setInterval(() => {
      setLockoutCountdown(v => {
        if (v <= 1) { clearInterval(timer); return 0 }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [lockoutCountdown])

  // ── Step 1: Identify email ─────────────────────────────────────────────
  async function handleStep1(e: FormEvent) {
    e.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const newErrors: Record<string, string> = {}

    if (!normalizedEmail) {
      newErrors.email = 'Campo obrigatório'
    } else if (!isDomainAllowed(normalizedEmail)) {
      newErrors.email = 'Este e-mail não está autorizado a acessar o ARGOS.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch(`/api/recover-password?email=${encodeURIComponent(normalizedEmail)}`)
      const data = await res.json()

      if (!res.ok) {
        setErrors({ email: data.error })
        setLoading(false)
        return
      }

      setSecurityQuestion(data.securityQuestion)
      setStep(2)
    } catch {
      setErrors({ email: 'Erro de rede. Tente novamente.' })
    }

    setLoading(false)
  }

  // ── Step 2: Verify security answer ────────────────────────────────────
  async function handleStep2(e: FormEvent) {
    e.preventDefault()
    if (!securityAnswer.trim()) {
      setErrors({ securityAnswer: 'Campo obrigatório' })
      return
    }

    if (lockoutCountdown > 0) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'verify',
          email: email.trim().toLowerCase(),
          securityAnswer: securityAnswer.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.locked) {
          const mins = data.minutesLeft ?? lockoutMinutes
          setLockoutMinutes(mins)
          setLockoutCountdown(mins * 60)
          setErrors({ securityAnswer: data.error })
        } else {
          setErrors({ securityAnswer: data.error })
        }
        setLoading(false)
        return
      }

      setRecoveryToken(data.recoveryToken)
      setStep(3)
    } catch {
      setErrors({ securityAnswer: 'Erro de rede. Tente novamente.' })
    }

    setLoading(false)
  }

  // ── Step 3: New password ───────────────────────────────────────────────
  async function handleStep3(e: FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!newPassword) {
      newErrors.newPassword = 'Campo obrigatório'
    } else if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'A senha deve ter ao menos 8 caracteres, 1 maiúscula e 1 número'
    }

    if (!confirmNewPassword) {
      newErrors.confirmNewPassword = 'Campo obrigatório'
    } else if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = 'As senhas não coincidem'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'reset', recoveryToken, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ form: data.error })
        setLoading(false)
        return
      }

      // Auto sign-in with new password
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password: newPassword,
        redirect: false,
      })

      if (result?.error) {
        router.push('/login')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setErrors({ form: 'Erro de rede. Tente novamente.' })
      setLoading(false)
    }
  }

  const countdownText =
    lockoutCountdown > 0
      ? `${Math.floor(lockoutCountdown / 60)}:${String(lockoutCountdown % 60).padStart(2, '0')}`
      : null

  return (
    <>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2 text-center">
        Recuperar senha
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Continuar
          </Button>

          <p className="text-center text-sm text-[var(--muted-foreground)]">
            <Link href="/login" className="text-[var(--primary)] hover:underline font-medium">
              Voltar ao login
            </Link>
          </p>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handleStep2} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[var(--muted-foreground)] text-xs">Pergunta de segurança</Label>
            <p className="text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-md px-3 py-2">
              {securityQuestion}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="securityAnswer">Sua resposta</Label>
            <Input
              id="securityAnswer"
              type="text"
              autoComplete="off"
              placeholder="Resposta"
              value={securityAnswer}
              onChange={e => setSecurityAnswer(e.target.value)}
              disabled={lockoutCountdown > 0}
              className={errors.securityAnswer ? 'border-[var(--destructive)]' : ''}
            />
            {errors.securityAnswer && (
              <p className="text-xs text-[var(--destructive)]">{errors.securityAnswer}</p>
            )}
            {countdownText && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Tente novamente em <span className="font-mono font-semibold">{countdownText}</span>
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading || lockoutCountdown > 0}>
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Confirmar resposta
          </Button>
        </form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <form onSubmit={handleStep3} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nova senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={`pr-10 ${errors.newPassword ? 'border-[var(--destructive)]' : ''}`}
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
            {errors.newPassword && (
              <p className="text-xs text-[var(--destructive)]">{errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmNewPassword">Confirmar nova senha</Label>
            <div className="relative">
              <Input
                id="confirmNewPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                className={`pr-10 ${errors.confirmNewPassword ? 'border-[var(--destructive)]' : ''}`}
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
            {errors.confirmNewPassword && (
              <p className="text-xs text-[var(--destructive)]">{errors.confirmNewPassword}</p>
            )}
          </div>

          {errors.form && (
            <p className="text-xs text-[var(--destructive)] text-center">{errors.form}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Salvar nova senha
          </Button>
        </form>
      )}
    </>
  )
}
