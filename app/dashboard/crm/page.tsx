// TypeScript / app/dashboard/crm/page.tsx / React 19 / Fit DaLi ERP CRM
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, BadgeCheck, CalendarClock, CircleDollarSign, ContactRound, MessageCircle, Plus, Search, Send, Sparkles, Users, X } from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import Modal from '@/components/ui/modal'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPhone } from '@/lib/utils'

type LeadStage = 'novo' | 'contato' | 'qualificado' | 'convertido' | 'perdido'
interface Lead {
  id: string
  customer_id: string | null
  contact_name: string
  phone: string | null
  email: string | null
  stage: LeadStage
  source: string
  agentforge_session_id: string | null
  agentforge_conversation_id: string | null
  notes: string
  last_activity_at: string
  created_at: string
  updated_at: string
}
interface CRMEvent {
  id: string
  event_name: string
  agent_id: string | null
  conversation_id: string | null
  session_id: string | null
  payload: Record<string, unknown>
  received_at: string
}
interface OrderSummary { customer_id: string | null; total: number; status: string }
interface CustomerSummary { id: string; name: string; phone: string | null; email: string | null }

const stages: Array<{ id: LeadStage; label: string; color: string }> = [
  { id: 'novo', label: 'Novos contatos', color: 'bg-sky-500' },
  { id: 'contato', label: 'Em atendimento', color: 'bg-amber-500' },
  { id: 'qualificado', label: 'Qualificados', color: 'bg-violet-500' },
  { id: 'convertido', label: 'Convertidos', color: 'bg-emerald-500' },
  { id: 'perdido', label: 'Encerrados', color: 'bg-slate-400' },
]

function eventMessage(event: CRMEvent) {
  const data = event.payload?.data
  return data && typeof data === 'object' && typeof (data as Record<string, unknown>).message === 'string'
    ? (data as Record<string, string>).message
    : null
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [events, setEvents] = useState<CRMEvent[]>([])
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ contact_name: '', phone: '', email: '', source: 'manual', notes: '' })
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatReply, setChatReply] = useState('')
  const [chatError, setChatError] = useState('')
  const [chatSessionId] = useState(() => `erp_${crypto.randomUUID()}`)

  const load = useCallback(async () => {
    setError('')
    const supabase = createClient()
    const [leadResult, eventResult, orderResult, customerResult] = await Promise.all([
      supabase.from('crm_leads').select('*').order('updated_at', { ascending: false }).limit(300),
      supabase.from('agentforge_events').select('*').order('received_at', { ascending: false }).limit(20),
      supabase.from('orders').select('customer_id,total,status').neq('status', 'cancelled').limit(1000),
      supabase.from('customers').select('id,name,phone,email').order('name').limit(500),
    ])
    const failed = leadResult.error || eventResult.error || orderResult.error || customerResult.error
    if (failed) setError('Não foi possível carregar o CRM. Aplique a migration do CRM e confira o perfil deste acesso.')
    setLeads(leadResult.data ?? [])
    setEvents(eventResult.data ?? [])
    setOrders((orderResult.data ?? []) as OrderSummary[])
    setCustomers((customerResult.data ?? []) as CustomerSummary[])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const visibleLeads = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return leads
    return leads.filter(lead => [lead.contact_name, lead.email ?? '', lead.phone ?? '', lead.source]
      .some(value => value.toLocaleLowerCase('pt-BR').includes(normalized)))
  }, [leads, search])

  const revenueByCustomer = useMemo(() => orders.reduce<Record<string, number>>((acc, order) => {
    if (order.customer_id) acc[order.customer_id] = (acc[order.customer_id] ?? 0) + Number(order.total || 0)
    return acc
  }, {}), [orders])
  const stats = useMemo(() => ({
    leads: leads.filter(lead => !['convertido', 'perdido'].includes(lead.stage)).length,
    qualified: leads.filter(lead => lead.stage === 'qualificado').length,
    converted: leads.filter(lead => lead.stage === 'convertido').length,
    revenue: orders.reduce((total, order) => total + Number(order.total || 0), 0),
  }), [leads, orders])

  const changeStage = async (lead: Lead, stage: LeadStage) => {
    const supabase = createClient()
    const { error: updateError } = await supabase.from('crm_leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', lead.id)
    if (updateError) { setError('Não foi possível atualizar a etapa deste contato.'); return }
    setLeads(current => current.map(item => item.id === lead.id ? { ...item, stage, updated_at: new Date().toISOString() } : item))
    setNotice(`${lead.contact_name} movido para ${stages.find(item => item.id === stage)?.label.toLowerCase()}.`)
  }

  const createLead = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault()
    setSaving(true); setError(''); setNotice('')
    const supabase = createClient()
    const { data: customer, error: customerError } = await supabase.from('customers').insert({
      name: form.contact_name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null,
    }).select('id').single()
    if (customerError) {
      setError('Não foi possível criar o cliente. Confira os campos e tente novamente.')
      setSaving(false)
      return
    }
    const { data: lead, error: leadError } = await supabase.from('crm_leads').insert({
      customer_id: customer.id, contact_name: form.contact_name.trim(), phone: form.phone.trim() || null,
      email: form.email.trim() || null, source: form.source, notes: form.notes.trim(), stage: 'novo',
    }).select('*').single()
    if (leadError) {
      await supabase.from('customers').delete().eq('id', customer.id)
      setError('O cliente não entrou no funil. Confira se a migration do CRM está aplicada.')
      setSaving(false)
      return
    }
    setLeads(current => [lead, ...current])
    setForm({ contact_name: '', phone: '', email: '', source: 'manual', notes: '' })
    setShowCreate(false); setSaving(false); setNotice('Contato adicionado ao funil.')
  }

  const sendToAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = chatInput.trim()
    if (!message) return
    setChatLoading(true); setChatError(''); setChatReply('')
    try {
      const response = await fetch('/api/integrations/agentforge/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId: chatSessionId }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível consultar o agente.')
      const result = body.result
      const text = result && typeof result === 'object'
        ? ['response', 'reply', 'message', 'answer'].map(key => (result as Record<string, unknown>)[key]).find(value => typeof value === 'string')
        : null
      setChatReply(typeof text === 'string' ? text : JSON.stringify(result))
      setChatInput('')
    } catch (chatRequestError) {
      setChatError(chatRequestError instanceof Error ? chatRequestError.message : 'Não foi possível consultar o agente.')
    } finally { setChatLoading(false) }
  }

  const addCustomerToPipeline = async (customer: CustomerSummary) => {
    if (leads.some(lead => lead.customer_id === customer.id)) { setNotice('Este cliente já está no funil.'); return }
    const supabase = createClient()
    const { data, error: insertError } = await supabase.from('crm_leads').insert({
      customer_id: customer.id, contact_name: customer.name, phone: customer.phone, email: customer.email,
      stage: 'contato', source: 'Base ERP',
    }).select('*').single()
    if (insertError) setError('Não foi possível adicionar o cliente ao CRM.')
    else { setLeads(current => [data, ...current]); setNotice(`${customer.name} adicionado ao funil.`) }
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#182421] px-6 py-7 text-white shadow-xl shadow-emerald-950/10 sm:px-9 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full border border-emerald-100/10 bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-emerald-100/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-100"><Sparkles className="h-3.5 w-3.5" /> RELACIONAMENTO COM CLIENTES</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Cada conversa abre uma oportunidade.</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">Acompanhe contatos, pedidos e conversas dos seus agentes em um só lugar.</p>
          </div>
          <GlowButton size="sm" onClick={() => { setError(''); setShowCreate(true) }}><Plus className="h-4 w-4" /> Novo contato</GlowButton>
        </div>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="Em andamento" value={String(stats.leads)} detail="contatos no funil" color="text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-300" />
        <Metric icon={Sparkles} label="Qualificados" value={String(stats.qualified)} detail="prontos para avançar" color="text-violet-600 bg-violet-50 dark:bg-violet-950/50 dark:text-violet-300" />
        <Metric icon={BadgeCheck} label="Convertidos" value={String(stats.converted)} detail="clientes conquistados" color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300" />
        <Metric icon={CircleDollarSign} label="Vendas registradas" value={formatCurrency(stats.revenue)} detail="pedidos ativos no ERP" color="text-[#c9005a] bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Funil de relacionamento</h2><p className="text-xs text-slate-500 dark:text-slate-400">Clientes e oportunidades conectados aos pedidos do ERP.</p></div>
            <label className="relative block sm:w-64"><Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar contato" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-900" /></label>
          </div>
          {loading ? <BentoCard className="p-12 text-center text-sm text-slate-500">Carregando contatos…</BentoCard> : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {stages.map(stage => {
                const stageLeads = visibleLeads.filter(lead => lead.stage === stage.id)
                return <section key={stage.id} aria-label={stage.label} className="min-h-52 rounded-2xl border border-slate-200/80 bg-slate-100/60 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="mb-3 flex items-center justify-between px-1"><h3 className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><span className={`h-2 w-2 rounded-full ${stage.color}`} />{stage.label}</h3><span className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{stageLeads.length}</span></div>
                  <div className="space-y-2">
                    {stageLeads.map(lead => <LeadCard key={lead.id} lead={lead} revenue={lead.customer_id ? revenueByCustomer[lead.customer_id] ?? 0 : 0} onStageChange={changeStage} />)}
                    {stageLeads.length === 0 && <div className="rounded-xl border border-dashed border-slate-300/80 px-3 py-6 text-center text-[11px] text-slate-400 dark:border-slate-700">Nenhum contato nesta etapa</div>}
                  </div>
                </section>
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <BentoCard className="overflow-hidden p-0" hoverEffect={false}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Conversas do AgentForge</h2><p className="mt-0.5 text-[11px] text-slate-500">Eventos recebidos do My Kora</p></div><span className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><MessageCircle className="h-4 w-4" /></span></div>
            <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {events.map(event => <article key={event.id} className="space-y-2 px-5 py-4">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{event.event_name.replaceAll('.', ' · ')}</span><time className="shrink-0 text-[10px] text-slate-400">{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(event.received_at))}</time></div>
                {eventMessage(event) && <p className="line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">“{eventMessage(event)}”</p>}
                <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">{event.conversation_id && <span className="rounded-md bg-slate-100 px-1.5 py-1 dark:bg-slate-800">conversa {event.conversation_id.slice(0, 8)}</span>}{event.agent_id && <span className="rounded-md bg-slate-100 px-1.5 py-1 dark:bg-slate-800">agente {event.agent_id.slice(0, 8)}</span>}</div>
                {event.session_id && <button type="button" onClick={async () => {
                  const supabase = createClient()
                  const { data: existing } = await supabase.from('crm_leads').select('id').eq('agentforge_session_id', event.session_id).maybeSingle()
                  if (existing) { setNotice('Esta conversa já está associada a um contato.'); return }
                  const { error: insertError } = await supabase.from('crm_leads').insert({ contact_name: `Contato ${event.session_id?.slice(-6)}`, source: 'AgentForge', stage: 'novo', agentforge_session_id: event.session_id, agentforge_conversation_id: event.conversation_id, notes: eventMessage(event) ? `Mensagem inicial: ${eventMessage(event)}` : '' })
                  if (insertError) setError('Não foi possível criar o contato a partir da conversa.')
                  else { setNotice('Conversa adicionada ao funil como novo contato.'); void load() }
                }} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300">Adicionar ao funil <ArrowRight className="h-3 w-3" /></button>}
              </article>)}
              {events.length === 0 && <div className="px-5 py-10 text-center"><Activity className="mx-auto mb-2 h-6 w-6 text-slate-300" /><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Aguardando conversas</p><p className="mx-auto mt-1 max-w-[220px] text-[11px] text-slate-400">Configure o webhook na área de Integrações para trazer as conversas do agente.</p></div>}
            </div>
          </BentoCard>
          <BentoCard className="p-5" hoverEffect={false}>
            <div className="mb-3 flex items-center gap-2"><span className="rounded-xl bg-violet-50 p-2 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"><ContactRound className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Falar com o agente</h2><p className="text-[10px] text-slate-500">Envie uma consulta ao My Kora</p></div></div>
            <form onSubmit={sendToAgent} className="flex gap-2"><input value={chatInput} onChange={event => setChatInput(event.target.value)} maxLength={4000} placeholder="Pergunte sobre cardápio ou pedidos…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950" /><button type="submit" disabled={chatLoading || !chatInput.trim()} aria-label="Enviar mensagem ao agente" className="rounded-xl bg-[#182421] px-3 text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">{chatLoading ? <Activity className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}</button></form>
            {chatError && <p role="alert" className="mt-2 text-[11px] text-rose-700 dark:text-rose-300">{chatError}</p>}
            {chatReply && <p role="status" className="mt-3 whitespace-pre-wrap rounded-xl bg-violet-50 p-3 text-xs leading-relaxed text-violet-950 dark:bg-violet-950/40 dark:text-violet-100">{chatReply}</p>}
            <p className="mt-2 text-[10px] text-slate-400">As mensagens consomem os créditos da conta AgentForge.</p>
          </BentoCard>
          <BentoCard className="overflow-hidden p-0" hoverEffect={false}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Clientes do ERP</h2><p className="mt-0.5 text-[11px] text-slate-500">{customers.length} contatos cadastrados</p></div><Users className="h-4 w-4 text-slate-400" /></div>
            {customers.length === 0 ? <p className="p-5 text-xs text-slate-400">A base de clientes está vazia.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{customers.slice(0, 8).map(customer => {
              const inPipeline = leads.some(lead => lead.customer_id === customer.id)
              return <div key={customer.id} className="flex items-center justify-between gap-2 px-5 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{customer.name}</p><p className="truncate text-[10px] text-slate-400">{customer.phone ? formatPhone(customer.phone) : customer.email || 'Sem contato informado'}</p></div><button type="button" disabled={inPipeline} onClick={() => void addCustomerToPipeline(customer)} className="shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 disabled:text-slate-400 disabled:hover:bg-transparent dark:text-emerald-300 dark:hover:bg-emerald-950/40 dark:disabled:text-slate-600">{inPipeline ? 'No funil' : 'Acompanhar'}</button></div>
            })}</div>}
            {customers.length > 8 && <p className="border-t border-slate-100 px-5 py-2.5 text-center text-[10px] text-slate-400 dark:border-slate-800">Mostrando 8 de {customers.length}. Use a busca para filtrar o funil.</p>}
          </BentoCard>
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" /><p className="text-[11px] leading-relaxed text-emerald-900/80 dark:text-emerald-100/80">Os pedidos e valores são lidos diretamente do ERP. Eventos de conversa aparecem aqui depois da configuração do webhook.</p></div>
        </aside>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Novo contato" description="O contato também será adicionado à base de clientes do ERP." maxWidth="md">
        <form onSubmit={createLead} className="space-y-4">
          <Field label="Nome"><input required autoFocus value={form.contact_name} onChange={event => setForm({ ...form, contact_name: event.target.value })} className={inputClass} placeholder="Nome do contato" /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Telefone"><input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className={inputClass} placeholder="(11) 99999-9999" /></Field><Field label="E-mail"><input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className={inputClass} placeholder="contato@email.com" /></Field></div>
          <Field label="Origem"><select value={form.source} onChange={event => setForm({ ...form, source: event.target.value })} className={inputClass}><option value="manual">Cadastro manual</option><option value="AgentForge">My Kora / AgentForge</option><option value="indicação">Indicação</option><option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option></select></Field>
          <Field label="Anotações"><textarea rows={3} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className={`${inputClass} resize-y`} placeholder="Interesses, preferências ou próximo passo" /></Field>
          {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><GlowButton type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}><X className="h-3.5 w-3.5" /> Cancelar</GlowButton><GlowButton type="submit" size="sm" disabled={saving}><Plus className="h-3.5 w-3.5" />{saving ? 'Salvando…' : 'Adicionar contato'}</GlowButton></div>
        </form>
      </Modal>
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>{children}</label>
}

function Metric({ icon: Icon, label, value, detail, color }: { icon: typeof Users; label: string; value: string; detail: string; color: string }) {
  return <BentoCard className="p-4" hoverEffect={false}><div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{value}</p><p className="mt-0.5 text-[10px] text-slate-400">{detail}</p></div><span className={`rounded-xl p-2 ${color}`}><Icon className="h-4 w-4" /></span></div></BentoCard>
}

function LeadCard({ lead, revenue, onStageChange }: { lead: Lead; revenue: number; onStageChange: (lead: Lead, stage: LeadStage) => void }) {
  const stageIndex = stages.findIndex(stage => stage.id === lead.stage)
  return <article className="group rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-950/[0.025] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h4 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{lead.contact_name}</h4><p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">{lead.phone ? formatPhone(lead.phone) : lead.email || 'Sem telefone ou e-mail'}</p></div><span className="max-w-24 truncate rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{lead.source}</span></div>
    {lead.notes && <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{lead.notes}</p>}
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800"><span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{revenue > 0 ? formatCurrency(revenue) : 'Sem pedidos'}</span><div className="flex gap-1">{lead.phone && <a aria-label={`WhatsApp para ${lead.contact_name}`} href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/50"><MessageCircle className="h-3.5 w-3.5" /></a>}{stageIndex > 0 && <button type="button" aria-label={`Mover ${lead.contact_name} para a etapa anterior`} onClick={() => onStageChange(lead, stages[stageIndex - 1].id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">‹</button>}{stageIndex >= 0 && stageIndex < stages.length - 1 && <button type="button" aria-label={`Avançar ${lead.contact_name}`} onClick={() => onStageChange(lead, stages[stageIndex + 1].id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 dark:hover:bg-slate-800 dark:hover:text-emerald-300"><ArrowRight className="h-3.5 w-3.5" /></button>}</div></div>
  </article>
}
