// TypeScript / app/dashboard/integrations/page.tsx / React 19 / Fit DaLi ERP integrations
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, ArrowUpRight, Check, CheckCircle2, CircleHelp, Clipboard, CloudCog, ExternalLink, KeyRound, Link2, LoaderCircle, LockKeyhole, RefreshCw, Save, ShieldCheck, Webhook } from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'

interface ConnectionStatus {
  configured: boolean
  webhookConfigured: boolean
  agentId: string
  updatedAt: string | null
  webhookUrl: string
}

export default function IntegrationsPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [agentId, setAgentId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadStatus = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/integrations/agentforge/config', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar a integração.')
      setStatus(result)
      setAgentId(result.agentId || '')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a integração.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadStatus() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadStatus])

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/integrations/agentforge/config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, webhookSecret, agentId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar a integração.')
      setApiKey(''); setWebhookSecret('')
      setNotice('Credenciais salvas e criptografadas no servidor.')
      await loadStatus()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a integração.')
    } finally { setSaving(false) }
  }

  const test = async () => {
    setTesting(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/integrations/agentforge/test', { method: 'POST' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível validar a conexão.')
      setNotice(`Conexão ativa. ${result.agentCount} agente(s) disponíveis.`)
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Não foi possível validar a conexão.')
    } finally { setTesting(false) }
  }

  const copyWebhook = async () => {
    if (!status?.webhookUrl) return
    await navigator.clipboard.writeText(status.webhookUrl)
    setCopied(true); window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-[2rem] bg-[#182421] px-6 py-7 text-white shadow-xl shadow-emerald-950/10 sm:px-9 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border border-emerald-100/10 bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-emerald-100/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-100"><Link2 className="h-3.5 w-3.5" /> CONEXÕES DO ERP</p><h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Integrações</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Conecte os agentes do My Kora ao relacionamento com clientes e pedidos do Fit DaLi.</p></div>
          <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-semibold sm:self-auto ${status?.configured && status.webhookConfigured ? 'border-emerald-200/20 bg-emerald-300/10 text-emerald-100' : 'border-white/15 bg-white/5 text-slate-300'}`}><span className={`h-2 w-2 rounded-full ${status?.configured && status.webhookConfigured ? 'bg-emerald-400' : 'bg-slate-400'}`} />{loading ? 'Verificando…' : status?.configured && status.webhookConfigured ? 'AgentForge conectado' : 'Configuração pendente'}</div>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-5">
          <BentoCard className="p-5 sm:p-7" hoverEffect={false}>
            <div className="mb-6 flex items-start gap-3"><span className="rounded-2xl bg-violet-50 p-3 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"><CloudCog className="h-5 w-5" /></span><div><h2 className="text-base font-bold text-slate-900 dark:text-slate-100">My Kora / AgentForge</h2><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">As conversas chegam por webhook; a API é usada para validar sua conta e consultar agentes.</p></div></div>
            <form onSubmit={save} className="space-y-4">
              <label className="block space-y-1.5"><span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"><KeyRound className="h-3.5 w-3.5" />Chave de API{status?.configured && <span className="font-normal text-emerald-700 dark:text-emerald-300">· já configurada</span>}</span><input type="password" autoComplete="new-password" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder={status?.configured ? 'Deixe vazio para manter a chave atual' : 'Cole a chave criada em Settings → API Keys'} className={inputClass} /></label>
              <label className="block space-y-1.5"><span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"><LockKeyhole className="h-3.5 w-3.5" />Segredo de assinatura do webhook{status?.webhookConfigured && <span className="font-normal text-emerald-700 dark:text-emerald-300">· já configurado</span>}</span><input type="password" autoComplete="new-password" value={webhookSecret} onChange={event => setWebhookSecret(event.target.value)} placeholder={status?.webhookConfigured ? 'Deixe vazio para manter o segredo atual' : 'Segredo indicado na configuração do webhook'} className={inputClass} /></label>
              <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">ID do agente <span className="font-normal text-slate-400">(necessário para conversar pelo CRM)</span></span><input value={agentId} onChange={event => setAgentId(event.target.value)} placeholder="ID exibido no painel de agentes do My Kora" className={inputClass} /></label>
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-between"><GlowButton type="button" variant="ghost" size="sm" onClick={() => void loadStatus()}><RefreshCw className="h-3.5 w-3.5" /> Atualizar status</GlowButton><div className="flex gap-2"><GlowButton type="button" variant="secondary" size="sm" onClick={() => void test()} disabled={testing || !status?.configured}>{testing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}{testing ? 'Testando…' : 'Testar conexão'}</GlowButton><GlowButton type="submit" size="sm" disabled={saving}>{saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{saving ? 'Salvando…' : 'Salvar conexão'}</GlowButton></div></div>
            </form>
          </BentoCard>

          <BentoCard className="p-5 sm:p-7" hoverEffect={false}>
            <div className="mb-5 flex items-start gap-3"><span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><Webhook className="h-5 w-5" /></span><div><h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Receber conversas no ERP</h2><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Cadastre a URL abaixo no painel do AgentForge e ative os eventos de conversa.</p></div></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50"><div className="flex items-center justify-between gap-3"><code className="min-w-0 break-all text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">{loading ? 'Carregando endereço…' : status?.webhookUrl ?? '—'}</code><button type="button" onClick={() => void copyWebhook()} disabled={!status?.webhookUrl} aria-label="Copiar URL do webhook" className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-emerald-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"><Clipboard className="h-4 w-4" /></button></div>{copied && <p role="status" className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><Check className="h-3 w-3" />URL copiada</p>}</div>
            <div className="mt-4 flex flex-wrap gap-2">{['conversation.started', 'agent.message_received', 'agent.message_sent', 'conversation.ended'].map(event => <span key={event} className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">{event}</span>)}</div>
          </BentoCard>
        </div>

        <aside className="space-y-5">
          <BentoCard className="p-5" hoverEffect={false}><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"><ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />Conexão protegida</h2><ul className="mt-4 space-y-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400"><li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Chaves criptografadas no servidor antes de serem gravadas.</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Webhooks validados pela assinatura HMAC do AgentForge.</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Eventos repetidos são deduplicados.</li></ul></BentoCard>
          <BentoCard className="p-5" hoverEffect={false}><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"><CircleHelp className="h-4 w-4 text-violet-600" />Como conectar</h2><ol className="mt-4 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400"><li className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">1</span><span>Crie uma chave em <strong>Settings → API Keys</strong> no AgentForge e informe acima.</span></li><li className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">2</span><span>Cadastre a URL em <strong>Integrations → Webhooks</strong> e selecione eventos de conversa.</span></li><li className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">3</span><span>Copie o segredo de assinatura do AgentForge para o campo acima e salve.</span></li></ol><a href="https://agentforge.solutions/docs" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 dark:text-violet-300">Abrir documentação <ExternalLink className="h-3 w-3" /></a></BentoCard>
          {status?.updatedAt && <p className="px-1 text-[10px] text-slate-400">Credenciais atualizadas em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(status.updatedAt))}.</p>}
          {!status?.configured && !loading && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"><ArrowUpRight className="mr-1 inline h-3.5 w-3.5" />A conta ainda não está conectada. A página do CRM já está pronta para receber eventos depois da configuração.</p>}
        </aside>
      </div>
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
