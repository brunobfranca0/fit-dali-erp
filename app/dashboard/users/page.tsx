'use client'

import { useCallback, useEffect, useState } from 'react'
import { KeyRound, MailPlus, ShieldCheck, Users, UserRound, AlertCircle } from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import Modal from '@/components/ui/modal'
import { APP_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type AppRole } from '@/lib/auth/roles'

interface AccessUser {
  id: string
  email: string
  createdAt: string
  emailConfirmed: boolean
  bannedUntil: string | null
  role: AppRole | null
}

const roleOptions = APP_ROLES.map(role => ({ value: role, label: ROLE_LABELS[role] }))

export default function UserAccessPage() {
  const [users, setUsers] = useState<AccessUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AppRole>('atendimento')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar os acessos.')
      setUsers(result.users)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os acessos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível enviar o convite.')

      setNotice(`Convite enviado para ${result.user.email}.`)
      setEmail('')
      setRole('atendimento')
      setShowInvite(false)
      await loadUsers()
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Não foi possível enviar o convite.')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (user: AccessUser, nextRole: AppRole) => {
    if (user.role === nextRole) return
    setError('')
    setNotice('')
    setUpdatingUserId(user.id)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: nextRole }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível alterar o perfil.')
      setUsers(current => current.map(item => item.id === user.id ? result.user : item))
      setNotice(`Perfil de ${user.email} atualizado para ${ROLE_LABELS[nextRole]}.`)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível alterar o perfil.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#25692b] dark:bg-emerald-950/50 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Administração
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">Acessos e perfis</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Convide pessoas e controle quais áreas do ERP cada perfil pode acessar.</p>
        </div>
        <GlowButton size="sm" onClick={() => { setError(''); setShowInvite(true) }}>
          <MailPlus className="h-4 w-4" />
          <span>Convidar pessoa</span>
        </GlowButton>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {notice && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {APP_ROLES.map(itemRole => {
          const Icon = itemRole === 'admin' ? ShieldCheck : itemRole === 'gestor' ? KeyRound : UserRound
          return (
            <BentoCard key={itemRole} className="p-4" hoverEffect={false}>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Icon className="h-4 w-4" /></span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{ROLE_LABELS[itemRole]}</h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{ROLE_DESCRIPTIONS[itemRole]}</p>
            </BentoCard>
          )
        })}
      </div>

      <BentoCard className="overflow-hidden p-0" hoverEffect={false}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Pessoas com acesso</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{users.length} conta(s) cadastrada(s)</p>
          </div>
          <Users aria-hidden="true" className="h-5 w-5 text-slate-400" />
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando acessos…</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nenhuma conta encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map(user => (
              <div key={user.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {user.email.slice(0, 1) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.email}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {user.emailConfirmed ? 'E-mail confirmado' : 'Convite aguardando aceite'}
                      {' · '}{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(user.createdAt))}
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Perfil</span>
                  <select
                    aria-label={`Perfil de ${user.email}`}
                    value={user.role ?? ''}
                    disabled={updatingUserId === user.id}
                    onChange={event => void handleRoleChange(user, event.target.value as AppRole)}
                    className="min-w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#2e7d32] focus:ring-2 focus:ring-[#2e7d32]/15 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {user.role ? null : <option value="">Sem perfil</option>}
                    {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      <Modal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Convidar para o ERP"
        description="A pessoa receberá um link por e-mail para definir a senha e entrar com o perfil selecionado."
        maxWidth="md"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="nome@empresa.com.br"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2e7d32] focus:ring-2 focus:ring-[#2e7d32]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Perfil de acesso</span>
            <select
              value={role}
              onChange={event => setRole(event.target.value as AppRole)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2e7d32] focus:ring-2 focus:ring-[#2e7d32]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <span className="block text-[11px] leading-relaxed text-slate-400">{ROLE_DESCRIPTIONS[role]}</span>
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <GlowButton type="button" variant="ghost" size="sm" onClick={() => setShowInvite(false)}>Cancelar</GlowButton>
            <GlowButton type="submit" size="sm" disabled={saving}>
              <MailPlus className="h-3.5 w-3.5" />
              <span>{saving ? 'Enviando convite…' : 'Enviar convite'}</span>
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
