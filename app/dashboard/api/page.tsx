// TypeScript / app/dashboard/api/page.tsx / React 19 / Fit DaLi ERP public API docs
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Braces, Check, Clipboard, Code2, ExternalLink, KeyRound, LockKeyhole, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import SwaggerPanel from './swagger-panel'

interface ApiKeyRow {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

interface NewApiKey extends ApiKeyRow { secret: string }

export default function PublicApiPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [name, setName] = useState('')
  const [access, setAccess] = useState<'read-only' | 'read-write'>('read-only')
  const [newKey, setNewKey] = useState<NewApiKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadKeys = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/admin/api-keys', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar as API keys.')
      setKeys(result.keys)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as API keys.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadKeys() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadKeys])

  const createKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice(''); setNewKey(null)
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, access }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível criar a API key.')
      setNewKey(result.key)
      setName('')
      setNotice('Chave criada. Copie agora; o segredo completo aparece somente nesta tela.')
      await loadKeys()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível criar a API key.')
    } finally { setSaving(false) }
  }

  const revokeKey = async (key: ApiKeyRow) => {
    if (!window.confirm(`Revogar a chave “${key.name}”? Integrações que a utilizam param de funcionar.`)) return
    setError(''); setNotice('')
    try {
      const response = await fetch(`/api/admin/api-keys/${key.id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível revogar a chave.')
      setNotice(`Chave “${key.name}” revogada.`)
      await loadKeys()
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Não foi possível revogar a chave.')
    }
  }

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(true); window.setTimeout(() => setCopied(false), 1800)
  }

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '/api/v1'

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-[2rem] bg-[#182421] px-6 py-7 text-white shadow-xl shadow-emerald-950/10 sm:px-9 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border border-emerald-100/10 bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-emerald-100/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-100"><Braces className="h-3.5 w-3.5" /> DESENVOLVEDORES</p><h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">API pública do CRM</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Conecte sistemas externos à base de clientes e ao funil do Fit DaLi ERP.</p></div>
          <a href="#swagger" className="inline-flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 sm:self-auto"><Code2 className="h-4 w-4" /> Abrir Swagger <ExternalLink className="h-3 w-3" /></a>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <BentoCard className="p-5 sm:p-7" hoverEffect={false}>
          <div className="mb-5 flex items-start gap-3"><span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><KeyRound className="h-5 w-5" /></span><div><h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Gerenciar API keys</h2><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Cada sistema recebe uma chave própria. O token completo só é mostrado na criação.</p></div></div>
          <form onSubmit={createKey} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto] sm:items-end">
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome da integração</span><input required minLength={2} maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: My Kora CRM" className={inputClass} /></label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Permissões</span><select value={access} onChange={event => setAccess(event.target.value as typeof access)} className={inputClass}><option value="read-only">Somente leitura</option><option value="read-write">Leitura e escrita</option></select></label>
            <GlowButton type="submit" size="sm" disabled={saving}>{saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}{saving ? 'Criando…' : 'Criar chave'}</GlowButton>
          </form>

          {newKey && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" /><div className="min-w-0 flex-1"><p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">Copie e guarde a chave agora</p><p className="mt-1 text-[11px] text-emerald-800 dark:text-emerald-200">Por segurança, o ERP guarda apenas o hash e não poderá exibir este segredo novamente.</p><code className="mt-3 block break-all rounded-xl border border-emerald-200 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 dark:border-emerald-800 dark:bg-slate-950 dark:text-slate-100">{newKey.secret}</code><button type="button" onClick={() => void copy(newKey.secret)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 dark:text-emerald-200">{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}{copied ? 'Copiada' : 'Copiar chave'}</button></div></div></div>}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"><div><h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Chaves emitidas</h3><p className="mt-0.5 text-[10px] text-slate-500">{keys.filter(key => !key.revoked_at).length} ativa(s)</p></div><button type="button" onClick={() => void loadKeys()} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800"><RefreshCw className="h-3.5 w-3.5" /></button></div>
            {loading ? <p className="p-6 text-center text-xs text-slate-400">Carregando chaves…</p> : keys.length === 0 ? <p className="p-6 text-center text-xs text-slate-400">Nenhuma API key criada ainda.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{keys.map(key => <div key={key.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{key.name}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{key.key_prefix}••••••••</p><div className="mt-1 flex flex-wrap gap-1.5">{key.scopes.map(scope => <span key={scope} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{scope}</span>)}<span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${key.revoked_at ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'}`}>{key.revoked_at ? 'Revogada' : 'Ativa'}</span></div></div>{!key.revoked_at && <button type="button" onClick={() => void revokeKey(key)} aria-label={`Revogar ${key.name}`} className="self-start rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"><Trash2 className="h-4 w-4" /></button>}</div>)}</div>}
          </div>
        </BentoCard>

        <aside className="space-y-5">
          <BentoCard className="p-5" hoverEffect={false}><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"><LockKeyhole className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />Acesso e segurança</h2><ul className="mt-4 space-y-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400"><li>• Chaves com escopo somente leitura ou leitura e escrita.</li><li>• O banco guarda o hash; o token aparece somente na criação.</li><li>• Envie a chave no header <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">Authorization: Bearer</code>.</li><li>• Use uma chave diferente para cada sistema e revogue a antiga quando necessário.</li></ul></BentoCard>
          <BentoCard className="p-5" hoverEffect={false}><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Endereço base</h2><div className="mt-3 flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-700 dark:bg-slate-950 dark:text-slate-300">{baseUrl}</code><button type="button" aria-label="Copiar endereço base" onClick={() => void copy(baseUrl)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><Clipboard className="h-3.5 w-3.5" /></button></div><a href="/api/openapi.json" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300">Baixar OpenAPI JSON <ExternalLink className="h-3 w-3" /></a></BentoCard>
        </aside>
      </div>

      <section id="swagger" className="scroll-mt-24 space-y-3"><div><h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Referência interativa</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Swagger UI carregado da especificação OpenAPI servida pelo próprio ERP.</p></div><BentoCard className="swagger-shell overflow-hidden p-0" hoverEffect={false}><SwaggerPanel /></BentoCard></section>

      <BentoCard className="p-5" hoverEffect={false}><div className="mb-3 flex items-center gap-2"><Code2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" /><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Exemplo de chamada</h2></div><pre className="overflow-x-auto rounded-xl bg-[#182421] p-4 text-[11px] leading-relaxed text-emerald-50"><code>{`curl "${baseUrl}/crm/leads?stage=novo&limit=20" \\\n  -H "Authorization: Bearer SUA_API_KEY" \\\n  -H "Accept: application/json"`}</code></pre></BentoCard>
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
