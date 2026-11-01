'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/lib/types'
import {
  addDaysISO,
  downloadCSV,
  formatCurrency,
  formatDate,
  formatPhone,
  getLocalDateISO,
  getWhatsAppLink,
  maskPhone,
  cn,
} from '@/lib/utils'
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit,
  Users,
  Download,
  MessageCircle,
  UserCheck,
  Receipt,
} from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import StatWidget from '@/components/kokonutui/stat-widget'
import Modal from '@/components/ui/modal'
import { useFeedback } from '@/components/ui/feedback'
import { Field, FormError, Segmented, inputClass } from '@/components/ui/form'
import { EmptyState, PageHeader, PageSkeleton } from '@/components/ui/page'

interface CustomerStats {
  ordersCount: number
  totalSpent: number
  lastOrderDate: string | null
}

interface CustomerOrderRow {
  customer_id: string | null
  total: number | string
  order_date: string
  status: string
}

type SortMode = 'name' | 'spent' | 'recent' | 'inactive'

const INACTIVE_DAYS = 30

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
}

const EMPTY_STATS: CustomerStats = { ordersCount: 0, totalSpent: 0, lastOrderDate: null }

export default function CustomersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomersView />
    </Suspense>
  )
}

function CustomersView() {
  const { toast, confirm } = useFeedback()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [statsByCustomer, setStatsByCustomer] = useState<Record<string, CustomerStats>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('name')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Deep links from the global quick search: ?q=<term> fills the search, ?new=1 opens the form.
  // Adjusting state during render (instead of in an effect) also covers same-page navigations.
  const searchParams = useSearchParams()
  const paramsKey = searchParams.toString()
  const [handledParams, setHandledParams] = useState<string | null>(null)
  if (paramsKey !== handledParams) {
    setHandledParams(paramsKey)
    const query = searchParams.get('q')
    if (query !== null) {
      setSearchTerm(query)
      setSortMode('name')
    }
    if (searchParams.get('new') === '1') {
      setEditingCustomer(null)
      setFormData(EMPTY_FORM)
      setFormError('')
      setShowModal(true)
    }
  }

  const loadCustomers = useCallback(async () => {
    const supabase = createClient()
    const [customersRes, ordersRes] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase
        .from('orders')
        .select('customer_id, total, order_date, status')
        .not('customer_id', 'is', null)
        .neq('status', 'cancelled'),
    ])

    if (customersRes.error) {
      toast('error', 'Não foi possível carregar os clientes', customersRes.error.message)
    }

    const stats: Record<string, CustomerStats> = {}
    ;((ordersRes.data || []) as CustomerOrderRow[]).forEach(order => {
      if (!order.customer_id) return
      const current = stats[order.customer_id] || { ...EMPTY_STATS }
      current.ordersCount += 1
      current.totalSpent += Number(order.total) || 0
      if (!current.lastOrderDate || order.order_date > current.lastOrderDate) {
        current.lastOrderDate = order.order_date
      }
      stats[order.customer_id] = current
    })

    setCustomers(customersRes.data || [])
    setStatsByCustomer(stats)
    setLoading(false)
  }, [toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Supabase
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    // Drop consumed deep-link params so a reload does not reopen the modal.
    if (paramsKey) window.history.replaceState(null, '', window.location.pathname)
  }, [paramsKey])

  const inactiveCutoff = addDaysISO(getLocalDateISO(), -INACTIVE_DAYS)
  const getStats = useCallback((id: string) => statsByCustomer[id] || EMPTY_STATS, [statsByCustomer])

  const summary = useMemo(() => {
    const withOrders = customers.filter(c => getStats(c.id).ordersCount > 0)
    const active = customers.filter(c => {
      const last = getStats(c.id).lastOrderDate
      return !!last && last >= inactiveCutoff
    })
    const totalSpent = withOrders.reduce((sum, c) => sum + getStats(c.id).totalSpent, 0)
    return {
      total: customers.length,
      active: active.length,
      inactive: customers.length - active.length,
      averagePerCustomer: withOrders.length > 0 ? totalSpent / withOrders.length : 0,
    }
  }, [customers, getStats, inactiveCutoff])

  const visibleCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const digits = term.replace(/\D/g, '')
    const filtered = customers.filter(customer => {
      const matchesSearch = !term
        || customer.name.toLowerCase().includes(term)
        || (!!digits && customer.phone?.replace(/\D/g, '').includes(digits))
        || customer.email?.toLowerCase().includes(term)
        || customer.address?.toLowerCase().includes(term)
      if (!matchesSearch) return false
      if (sortMode === 'inactive') {
        const last = getStats(customer.id).lastOrderDate
        return !last || last < inactiveCutoff
      }
      return true
    })

    return [...filtered].sort((a, b) => {
      const statsA = getStats(a.id)
      const statsB = getStats(b.id)
      if (sortMode === 'spent') return statsB.totalSpent - statsA.totalSpent
      if (sortMode === 'recent') return (statsB.lastOrderDate || '').localeCompare(statsA.lastOrderDate || '')
      if (sortMode === 'inactive') return (statsB.lastOrderDate || '').localeCompare(statsA.lastOrderDate || '')
      return a.name.localeCompare(b.name, 'pt-BR')
    })
  }, [customers, searchTerm, sortMode, getStats, inactiveCutoff])

  const handleOpenCreateModal = () => {
    setEditingCustomer(null)
    setFormData(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c)
    setFormData({
      name: c.name || '',
      phone: c.phone ? maskPhone(c.phone) : '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    const ordersCount = getStats(customer.id).ordersCount
    const confirmed = await confirm({
      title: `Excluir ${customer.name}?`,
      description: ordersCount > 0
        ? `O histórico de ${ordersCount} pedido(s) será mantido, mas sem vínculo com o cadastro.`
        : 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir cliente',
      destructive: true,
    })
    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.from('customers').delete().eq('id', customer.id)
    if (error) {
      toast('error', 'Não foi possível excluir o cliente', error.message)
      return
    }
    setCustomers(prev => prev.filter(c => c.id !== customer.id))
    toast('success', 'Cliente excluído')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('Informe o nome do cliente.')
      return
    }

    setFormLoading(true)
    const supabase = createClient()
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      notes: formData.notes.trim(),
    }

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingCustomer.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('customers').insert(payload)
        if (error) throw error
      }

      setShowModal(false)
      toast('success', editingCustomer ? 'Cliente atualizado' : 'Cliente cadastrado', payload.name)
      loadCustomers()
    } catch (err) {
      const message = err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err)
      setFormError('Erro ao salvar cliente: ' + message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (customers.length === 0) {
      toast('info', 'Não há clientes para exportar')
      return
    }
    downloadCSV(`clientes-fitdali-${getLocalDateISO()}.csv`, [
      ['Nome', 'Telefone', 'E-mail', 'Endereço', 'Observações', 'Pedidos', 'Total gasto', 'Último pedido'],
      ...visibleCustomers.map(customer => {
        const stats = getStats(customer.id)
        return [
          customer.name,
          customer.phone ? formatPhone(customer.phone) : '',
          customer.email,
          customer.address,
          customer.notes,
          stats.ordersCount,
          Math.round(stats.totalSpent * 100) / 100,
          stats.lastOrderDate ? formatDate(stats.lastOrderDate) : '',
        ]
      }),
    ])
    toast('success', 'Planilha exportada', `${visibleCustomers.length} cliente(s)`)
  }

  if (loading) return <PageSkeleton />

  const sortOptions: Array<{ value: SortMode; label: string; count?: number }> = [
    { value: 'name', label: 'Nome' },
    { value: 'spent', label: 'Maior gasto' },
    { value: 'recent', label: 'Mais recentes' },
    { value: 'inactive', label: `Inativos +${INACTIVE_DAYS} dias`, count: summary.inactive },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        title="Base de Clientes"
        description="Contatos, histórico de compras e preferências alimentares"
        actions={
          <>
            <GlowButton variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </GlowButton>
            <GlowButton variant="primary" size="sm" onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4" />
              <span>Novo Cliente</span>
            </GlowButton>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatWidget
          title="Clientes cadastrados"
          value={summary.total}
          subtitle={`${summary.inactive} sem pedidos há +${INACTIVE_DAYS} dias`}
          icon={Users}
          color="green"
        />
        <StatWidget
          title={`Ativos (${INACTIVE_DAYS} dias)`}
          value={summary.active}
          subtitle={summary.total > 0 ? `${Math.round((summary.active / summary.total) * 100)}% da base` : 'Nenhum cliente ainda'}
          icon={UserCheck}
          color="blue"
          delay={0.05}
        />
        <StatWidget
          title="Gasto médio por cliente"
          value={formatCurrency(summary.averagePerCustomer)}
          subtitle="Clientes com ao menos 1 pedido"
          icon={Receipt}
          color="amber"
          delay={0.1}
        />
      </div>

      <BentoCard className="p-4" hoverEffect={false}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              aria-label="Buscar clientes"
              placeholder="Buscar por nome, telefone, e-mail ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(inputClass, 'pl-10 py-2.5')}
            />
          </div>
          <Segmented ariaLabel="Ordenar clientes" value={sortMode} options={sortOptions} onChange={setSortMode} />
        </div>
      </BentoCard>

      {visibleCustomers.length === 0 ? (
        <BentoCard className="p-0" hoverEffect={false}>
          <EmptyState
            icon={Users}
            title={searchTerm || sortMode === 'inactive' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            description={
              sortMode === 'inactive' && !searchTerm
                ? 'Todos os clientes fizeram pedidos recentemente.'
                : searchTerm
                ? 'Tente outro termo de busca.'
                : 'Cadastre o primeiro cliente da marmitaria.'
            }
            action={
              !searchTerm && sortMode !== 'inactive' ? (
                <GlowButton size="sm" onClick={handleOpenCreateModal}>
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Cliente</span>
                </GlowButton>
              ) : undefined
            }
          />
        </BentoCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCustomers.map(customer => {
            const stats = getStats(customer.id)
            const isInactive = !stats.lastOrderDate || stats.lastOrderDate < inactiveCutoff
            const firstName = customer.name.split(' ')[0]
            const whatsApp = customer.phone
              ? getWhatsAppLink(
                  customer.phone,
                  isInactive && stats.ordersCount > 0
                    ? `Olá, ${firstName}! Sentimos sua falta aqui na Fit DaLi 💚 Que tal garantir suas marmitas da semana?`
                    : `Olá, ${firstName}! Tudo bem? Aqui é da Fit DaLi.`
                )
              : null

            return (
              <BentoCard key={customer.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-[#38a149] flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {customer.name}
                        </h3>
                        {customer.phone && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{formatPhone(customer.phone)}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {whatsApp && (
                        <a
                          href={whatsApp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="Conversar no WhatsApp"
                          aria-label={`Conversar com ${customer.name} no WhatsApp`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(customer)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar"
                        aria-label={`Editar ${customer.name}`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(customer)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Excluir"
                        aria-label={`Excluir ${customer.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pedidos</p>
                      <p className="text-sm font-black font-mono text-slate-900 dark:text-slate-100">{stats.ordersCount}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gasto</p>
                      <p className="text-sm font-black font-mono text-slate-900 dark:text-slate-100 truncate">
                        {formatCurrency(stats.totalSpent)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Último</p>
                      <p
                        className={`text-sm font-black font-mono ${
                          isInactive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {stats.lastOrderDate ? formatDate(stats.lastOrderDate).slice(0, 5) : '—'}
                      </p>
                    </div>
                  </div>

                  {(customer.email || customer.address) && (
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pb-3 border-b border-slate-100 dark:border-slate-800">
                      {customer.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}

                      {customer.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {customer.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl mt-3 border border-slate-100 dark:border-slate-800">
                      &ldquo;{customer.notes}&rdquo;
                    </p>
                  )}
                </div>
              </BentoCard>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        description="Cadastre os dados de contato e endereço de entrega do cliente."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <FormError message={formError} />

          <Field label="Nome Completo *" htmlFor="customer-name">
            <input
              id="customer-name"
              type="text"
              required
              autoComplete="off"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Juliana Mendes"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="WhatsApp / Telefone" htmlFor="customer-phone">
              <input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                placeholder="(35) 98888-0000"
                className={inputClass}
              />
            </Field>

            <Field label="E-mail" htmlFor="customer-email">
              <input
                id="customer-email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@email.com"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Endereço Completo de Entrega" htmlFor="customer-address">
            <input
              id="customer-address"
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, complemento, bairro"
              className={inputClass}
            />
          </Field>

          <Field label="Preferências & Restrições Alimentares" htmlFor="customer-notes">
            <textarea
              id="customer-notes"
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Prefere marmitas Low Carb, sem lactose, entregar após as 18h"
              className={inputClass}
            />
          </Field>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <GlowButton type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
              Cancelar
            </GlowButton>
            <GlowButton type="submit" size="sm" disabled={formLoading}>
              {formLoading ? 'Salvando...' : editingCustomer ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
