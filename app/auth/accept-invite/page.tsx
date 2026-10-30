'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import GlowButton from '@/components/kokonutui/glow-button'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasInviteSession, setHasInviteSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) {
        setHasInviteSession(Boolean(session))
        setChecking(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) {
        setHasInviteSession(true)
        setChecking(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setComplete(true)
    window.setTimeout(() => {
      router.replace('/dashboard')
      router.refresh()
    }, 900)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(230,0,103,0.12),_transparent_52%)]" />
      <section className="relative w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <div className="mb-7 text-center">
          <div className="mb-5 inline-flex justify-center"><Logo variant="full" size="md" /></div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#e60067] dark:bg-rose-950/50 dark:text-rose-300">
            {complete ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Ative seu acesso</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Crie uma senha para entrar no Fit DaLi ERP.</p>
        </div>

        {checking ? (
          <p className="py-4 text-center text-sm text-slate-500">Validando convite…</p>
        ) : !hasInviteSession ? (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Este convite não está mais ativo. Peça ao administrador para enviar outro.</span>
          </div>
        ) : complete ? (
          <p role="status" className="text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">Senha definida. Abrindo o painel…</p>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-4">
            {error && <p role="alert" className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nova senha</span>
              <span className="relative block">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#e60067] focus:ring-2 focus:ring-[#e60067]/15 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Mínimo 8 caracteres"
                />
              </span>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirme a senha</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#e60067] focus:ring-2 focus:ring-[#e60067]/15 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>

            <GlowButton type="submit" size="md" disabled={saving} className="w-full">
              <KeyRound className="h-4 w-4" />
              <span>{saving ? 'Salvando…' : 'Definir senha e entrar'}</span>
            </GlowButton>
          </form>
        )}
      </section>
    </main>
  )
}
