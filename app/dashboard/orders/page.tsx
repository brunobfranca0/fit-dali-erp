'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, Category, Customer, OrderStatus } from '@/lib/types'
import {
  formatCurrency,
  formatDate,
  formatDateLabel,
  getStatusColor,
  getStatusLabel,
  calculatePrice,
  getLocalDateISO,
  addDaysISO,
  shortOrderId,
  maskPhone,
  getWhatsAppLink,
  downloadCSV,
  ORDER_STATUS_FLOW,
  PAYMENT_METHODS,
  cn,
} from '@/lib/utils'
import {
  Plus,
  Minus,
  Search,
  Calendar,
  Phone,
  Trash2,
  CheckCircle,
  Clock,
  Package,
  Truck,
  X,
  Ban,
  Pencil,
  MessageCircle,
  Wallet,
  Download,
  BadgePercent,
} from 'lucide-react'
import GlowButton from '@/components/kokonutui/glow-button'
import BentoCard from '@/components/kokonutui/bento-card'
import Modal from '@/components/ui/modal'
import { useFeedback } from '@/components/ui/feedback'
import { Field, FormError, Segmented, inputClass } from '@/components/ui/form'
import { EmptyState, PageHeader, PageSkeleton } from '@/components/ui/page'

type StatusFilter = 'active' | 'all' | OrderStatus
type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'overdue'
type ItemDraft = { category_id: string; quantity: number }

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready']
const STATUS_ICONS: Record<string, typeof Clock> = {
  confirmed: CheckCircle,
  preparing: Clock,
  ready: Package,
  delivered: Truck,
}
const QUICK_QUANTITIES = [1, 5, 10, 20]

const emptyForm = () => ({
  customer_id: '',
  customer_name: '',
  customer_phone: '',
  delivery_date: getLocalDateISO(),
  payment_method: 'PIX',
  payment_status: 'paid',
  discount: '',
  notes: '',
  save_customer: true,
})

function buildWhatsAppSummary(order: Order): string {
  const lines = (order.order_items || []).map(item => `• ${item.quantity}x ${item.product_name} — ${formatCurrency(Number(item.subtotal))}`)
  return [
    `Olá, ${order.customer_name.split(' ')[0]}! Aqui é da Fit DaLi 💚`,
    `Pedido ${shortOrderId(order.id)} — entrega ${formatDate(order.delivery_date)}`,
    ...lines,
    Number(order.discount) > 0 ? `Desconto: -${formatCurrency(Number(order.discount))}` : '',
    `Total: ${formatCurrency(Number(order.total))} (${order.payment_status === 'paid' ? 'pago' : `pagamento pendente${order.payment_method ? ` via ${order.payment_method}` : ''}`})`,
  ].filter(Boolean).join('\n')
}

export default function OrdersPage() {
  const { toast, confirm } = useFeedback()
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [onlyUnpaid, setOnlyUnpaid] = useState(false)
  const [canDeleteOrders, setCanDeleteOrders] = useState(false)
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [items, setItems] = useState<ItemDraft[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const loadData = useCallback(async () => {
    const supabase = createClient()

    try {
      const [ordersRes, categoriesRes, customersRes, userRes] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            customer:customers(*),
            order_items(*, category:categories(*))
          `)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('active', true).order('name'),
        supabase.from('customers').select('*').order('name'),
        supabase.auth.getUser(),
      ])

      if (ordersRes.error) throw ordersRes.error
      setOrders(ordersRes.data || [])
      setCategories(categoriesRes.data || [])
      setCustomers(customersRes.data || [])
      setCanDeleteOrders(['admin', 'gestor'].includes(userRes.data.user?.app_metadata?.role))
      return (categoriesRes.data || []) as Category[]
    } catch (error) {
      console.error('Error loading data:', error)
      toast('error', 'Não foi possível carregar os pedidos', 'Verifique sua conexão e tente novamente.')
      return [] as Category[]
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // Deep links from the command palette: ?q=<busca> and ?new=1.
    const params = new URLSearchParams(window.location.search)
    const initialQuery = params.get('q')
    const shouldOpenNew = params.get('new') === '1'
    if (initialQuery || shouldOpenNew) window.history.replaceState(null, '', window.location.pathname)

    const initialLoad = async () => {
      const loadedCategories = await loadData()
      if (initialQuery) {
        setSearchTerm(initialQuery)
        setStatusFilter('all')
      }
      if (shouldOpenNew) {
        setItems(loadedCategories.length ? [{ category_id: loadedCategories[0].id, quantity: 10 }] : [])
        setShowOrderModal(true)
      }
    }
    initialLoad()
  }, [loadData])

  const today = getLocalDateISO()
  const tomorrow = addDaysISO(today, 1)
  const weekEnd = addDaysISO(today, 7)

  const matchesDate = useCallback((order: Order) => {
    switch (dateFilter) {
      case 'today': return order.delivery_date === today
      case 'tomorrow': return order.delivery_date === tomorrow
      case 'week': return order.delivery_date >= today && order.delivery_date <= weekEnd
      case 'overdue': return order.delivery_date < today && ACTIVE_STATUSES.includes(order.status)
      default: return true
    }
  }, [dateFilter, today, tomorrow, weekEnd])

  const searchedOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase().replace(/^#/, '')
    return orders.filter(order => {
      const matchesSearch = !term
        || order.customer_name.toLowerCase().includes(term)
        || order.customer_phone?.replace(/\D/g, '').includes(term.replace(/\D/g, '') || '\u0000')
        || shortOrderId(order.id).toLowerCase().includes(term)
        || order.notes?.toLowerCase().includes(term)
      const matchesPayment = !onlyUnpaid || (order.payment_status !== 'paid' && order.status !== 'cancelled')
      return matchesSearch && matchesPayment && matchesDate(order)
    })
  }, [orders, searchTerm, onlyUnpaid, matchesDate])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: searchedOrders.length, active: 0 }
    searchedOrders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1
      if (ACTIVE_STATUSES.includes(order.status)) counts.active += 1
    })
    return counts
  }, [searchedOrders])

  const filteredOrders = searchedOrders.filter(order =>
    statusFilter === 'all' || (statusFilter === 'active' ? ACTIVE_STATUSES.includes(order.status) : order.status === statusFilter)
  )

  const filteredTotal = filteredOrders
    .filter(order => order.status !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.total), 0)
  const filteredMeals = filteredOrders
    .filter(order => order.status !== 'cancelled')
    .reduce((sum, order) => sum + (order.order_items || []).reduce((acc, item) => acc + Number(item.quantity), 0), 0)
  const unpaidTotal = orders
    .filter(order => order.payment_status !== 'paid' && order.status !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.total), 0)

  const patchOrder = async (order: Order, patch: Partial<Order>, successMessage: string) => {
    setBusyOrderId(order.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', order.id)
    setBusyOrderId(null)

    if (error) {
      toast('error', 'Não foi possível atualizar o pedido', error.message)
      return
    }
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, ...patch } : o)))
    toast('success', successMessage, `${shortOrderId(order.id)} • ${order.customer_name}`)
  }

  const cancelOrder = async (order: Order) => {
    const ok = await confirm({
      title: 'Cancelar este pedido?',
      description: `${shortOrderId(order.id)} de ${order.customer_name} sairá da fila de produção e dos relatórios de faturamento.`,
      confirmLabel: 'Cancelar pedido',
      destructive: true,
    })
    if (ok) patchOrder(order, { status: 'cancelled' }, 'Pedido cancelado')
  }

  const deleteOrder = async (order: Order) => {
    const ok = await confirm({
      title: 'Excluir pedido definitivamente?',
      description: 'Esta ação não pode ser desfeita. Prefira cancelar se quiser manter o histórico.',
      confirmLabel: 'Excluir',
      destructive: true,
    })
    if (!ok) return

    const supabase = createClient()
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (error) {
      toast('error', 'Não foi possível excluir o pedido', error.message)
      return
    }
    setOrders(prev => prev.filter(o => o.id !== order.id))
    toast('success', 'Pedido excluído')
  }

  const linePrice = (item: ItemDraft) => {
    const category = categories.find(c => c.id === item.category_id)
    if (!category || item.quantity <= 0) return null
    return calculatePrice(item.quantity, Number(category.price_unit), Number(category.price_c10), Number(category.price_c20))
  }

  const subtotal = items.reduce((sum, item) => sum + (linePrice(item)?.total || 0), 0)
  const totalSavings = items.reduce((sum, item) => sum + (linePrice(item)?.savings || 0), 0)
  const discount = Math.min(Math.max(Number(formData.discount.replace(',', '.')) || 0, 0), subtotal)
  const orderTotal = Math.round((subtotal - discount) * 100) / 100

  const openCreateModal = () => {
    setEditingOrder(null)
    setFormData(emptyForm())
    setItems(categories.length ? [{ category_id: categories[0].id, quantity: 10 }] : [])
    setFormError('')
    setShowOrderModal(true)
  }

  const openEditModal = (order: Order) => {
    setEditingOrder(order)
    setFormData({
      customer_id: order.customer_id || '',
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || '',
      delivery_date: order.delivery_date,
      payment_method: order.payment_method || 'PIX',
      payment_status: order.payment_status,
      discount: Number(order.discount) > 0 ? String(order.discount) : '',
      notes: order.notes || '',
      save_customer: false,
    })
    setItems((order.order_items || [])
      .filter(item => item.category_id)
      .map(item => ({ category_id: item.category_id as string, quantity: item.quantity })))
    setFormError('')
    setShowOrderModal(true)
  }

  const handleCustomerSelect = (customerId: string) => {
    const found = customers.find(c => c.id === customerId)
    setFormData(prev => ({
      ...prev,
      customer_id: found?.id || '',
      customer_name: found?.name || '',
      customer_phone: found?.phone ? maskPhone(found.phone) : '',
    }))
  }

  const updateItem = (index: number, patch: Partial<ItemDraft>) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.customer_name.trim()) {
      setFormError('Informe o nome do cliente.')
      return
    }
    if (items.length === 0 || items.some(item => !item.category_id || item.quantity < 1)) {
      setFormError('Adicione pelo menos um item com quantidade válida.')
      return
    }

    setModalLoading(true)
    const supabase = createClient()

    try {
      let customerId = formData.customer_id || null
      if (!customerId && formData.save_customer) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({ name: formData.customer_name.trim(), phone: formData.customer_phone || null })
          .select()
          .single()
        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      const orderPayload = {
        customer_id: customerId,
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone,
        delivery_date: formData.delivery_date,
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
        subtotal,
        discount,
        total: orderTotal,
        notes: formData.notes,
      }

      let orderId: string
      if (editingOrder) {
        const { error } = await supabase
          .from('orders')
          .update({ ...orderPayload, updated_at: new Date().toISOString() })
          .eq('id', editingOrder.id)
        if (error) throw error
        const { error: deleteError } = await supabase.from('order_items').delete().eq('order_id', editingOrder.id)
        if (deleteError) throw deleteError
        orderId = editingOrder.id
      } else {
        const { data: order, error } = await supabase
          .from('orders')
          .insert({ ...orderPayload, order_date: getLocalDateISO(), status: 'confirmed' })
          .select()
          .single()
        if (error) throw error
        orderId = order.id
      }

      const orderItems = items.map(item => {
        const category = categories.find(c => c.id === item.category_id)!
        return {
          order_id: orderId,
          category_id: item.category_id,
          product_name: category.name,
          quantity: item.quantity,
          unit_price: category.price_unit,
          subtotal: linePrice(item)?.total || 0,
        }
      })

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) {
        // Avoid leaving a brand-new order without items behind.
        if (!editingOrder) await supabase.from('orders').delete().eq('id', orderId)
        throw itemsError
      }

      setShowOrderModal(false)
      toast('success', editingOrder ? 'Pedido atualizado' : 'Pedido criado', `${shortOrderId(orderId)} • ${formatCurrency(orderTotal)}`)
      loadData()
    } catch (err) {
      console.error(err)
      setFormError('Erro ao salvar pedido: ' + (err instanceof Error ? err.message : (err as { message?: string })?.message || 'tente novamente.'))
    } finally {
      setModalLoading(false)
    }
  }

  const handleExport = () => {
    downloadCSV(`pedidos-${getLocalDateISO()}.csv`, [
      ['Pedido', 'Data', 'Entrega', 'Cliente', 'Telefone', 'Status', 'Pagamento', 'Método', 'Itens', 'Desconto', 'Total', 'Observações'],
      ...filteredOrders.map(order => [
        shortOrderId(order.id),
        formatDate(order.order_date),
        formatDate(order.delivery_date),
        order.customer_name,
        order.customer_phone,
        getStatusLabel(order.status),
        getStatusLabel(order.payment_status),
        order.payment_method,
        (order.order_items || []).map(item => `${item.quantity}x ${item.product_name}`).join(', '),
        Number(order.discount) || 0,
        Number(order.total),
        order.notes,
      ]),
    ])
  }

  if (loading) return <PageSkeleton />

  const statusOptions: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: 'active', label: 'Em aberto', count: statusCounts.active },
    { value: 'all', label: 'Todos', count: statusCounts.all },
    ...(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as OrderStatus[]).map(status => ({
      value: status,
      label: getStatusLabel(status),
      count: statusCounts[status] || 0,
    })),
  ]

  const dateOptions: Array<{ value: DateFilter; label: string }> = [
    { value: 'all', label: 'Qualquer data' },
    { value: 'today', label: 'Entrega hoje' },
    { value: 'tomorrow', label: 'Amanhã' },
    { value: 'week', label: 'Próximos 7 dias' },
    { value: 'overdue', label: 'Atrasados' },
  ]

  const hasFilters = !!searchTerm || statusFilter !== 'active' || dateFilter !== 'all' || onlyUnpaid

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestão de Pedidos"
        description="Controle de pedidos, status de entrega e faturamento"
        actions={
          <>
            <GlowButton variant="outline" size="sm" onClick={handleExport} disabled={filteredOrders.length === 0}>
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </GlowButton>
            <GlowButton variant="primary" size="sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              <span>Novo Pedido</span>
            </GlowButton>
          </>
        }
      />

      {/* Filters */}
      <BentoCard className="space-y-3 p-4" hoverEffect={false}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar por cliente, telefone, nº do pedido ou observação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Buscar pedidos"
              className={cn(inputClass, 'py-2.5 pl-10')}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as DateFilter)}
              aria-label="Filtrar por data de entrega"
              className={cn(inputClass, 'w-auto py-2.5 font-semibold')}
            >
              {dateOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button
              type="button"
              aria-pressed={onlyUnpaid}
              onClick={() => setOnlyUnpaid(value => !value)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                onlyUnpaid
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              A receber
            </button>
          </div>
        </div>
        <Segmented ariaLabel="Filtrar por status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
      </BentoCard>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Pedidos listados', value: String(filteredOrders.length) },
          { label: 'Marmitas', value: `${filteredMeals} un.` },
          { label: 'Valor listado', value: formatCurrency(filteredTotal) },
          { label: 'Total a receber', value: formatCurrency(unpaidTotal), tone: unpaidTotal > 0 ? 'text-amber-600 dark:text-amber-400' : '' },
        ].map(metric => (
          <div key={metric.label} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{metric.label}</p>
            <p className={`mt-0.5 font-mono text-base font-black tabular-nums text-slate-900 dark:text-slate-100 ${metric.tone || ''}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <BentoCard hoverEffect={false} className="p-0">
          <EmptyState
            icon={Package}
            title={hasFilters ? 'Nenhum pedido encontrado' : 'Nenhum pedido cadastrado'}
            description={hasFilters ? 'Ajuste a busca ou os filtros para ver outros pedidos.' : 'Registre o primeiro pedido para começar.'}
            action={hasFilters ? (
              <GlowButton
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('active')
                  setDateFilter('all')
                  setOnlyUnpaid(false)
                }}
              >
                Limpar filtros
              </GlowButton>
            ) : (
              <GlowButton size="sm" onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                <span>Cadastrar Pedido</span>
              </GlowButton>
            )}
          />
        </BentoCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map(order => {
            const nextStep = ORDER_STATUS_FLOW[order.status]
            const NextIcon = nextStep ? STATUS_ICONS[nextStep.next] || CheckCircle : null
            const whatsapp = order.customer_phone ? getWhatsAppLink(order.customer_phone, buildWhatsAppSummary(order)) : null
            const isOverdue = order.delivery_date < today && ACTIVE_STATUSES.includes(order.status)
            const isBusy = busyOrderId === order.id
            const isClosed = order.status === 'cancelled' || order.status === 'delivered'

            return (
              <BentoCard key={order.id} className={`flex flex-col justify-between p-5 ${order.status === 'cancelled' ? 'opacity-70' : ''}`}>
                <div>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] font-bold tracking-wider text-slate-400">{shortOrderId(order.id)}</p>
                      <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{order.customer_name}</h3>
                      {order.customer_phone && (
                        <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-slate-400">
                          <Phone className="h-3 w-3" />
                          {order.customer_phone}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <span className={`rounded-full border px-2 py-px text-[10px] font-bold ${getStatusColor(order.payment_status)}`}>
                        {order.payment_status === 'paid' ? 'Pago' : order.payment_status === 'partial' ? 'Parcial' : 'A receber'}
                        {order.payment_method && ` • ${order.payment_method}`}
                      </span>
                    </div>
                  </div>

                  <div className={`mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-medium dark:border-slate-800 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Entrega: <span className="font-semibold">{formatDateLabel(order.delivery_date)}</span>
                      {!['Hoje', 'Amanhã', 'Ontem'].includes(formatDateLabel(order.delivery_date)) ? '' : ` (${formatDate(order.delivery_date)})`}
                    </span>
                    {isOverdue && <span className="rounded-md bg-rose-50 px-1.5 py-px text-[10px] font-bold dark:bg-rose-950/50">Atrasado</span>}
                  </div>

                  <div className="mb-4 space-y-1.5">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.category?.color || '#2e7d32' }} />
                          <span className="truncate font-medium text-slate-700 dark:text-slate-300">{item.product_name}</span>
                          <span className="font-mono text-slate-400">×{item.quantity}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(Number(item.subtotal))}</span>
                      </div>
                    ))}
                    {Number(order.discount) > 0 && (
                      <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                        <span className="flex items-center gap-1.5"><BadgePercent className="h-3.5 w-3.5" /> Desconto</span>
                        <span className="font-mono font-bold">-{formatCurrency(Number(order.discount))}</span>
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <p className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-2 text-[11px] italic text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                      &ldquo;{order.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total do Pedido</span>
                    <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100">{formatCurrency(Number(order.total))}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {nextStep && NextIcon && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => patchOrder(order, { status: nextStep.next as OrderStatus }, `Pedido ${getStatusLabel(nextStep.next).toLowerCase()}`)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2e7d32] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#25692b] disabled:opacity-60"
                      >
                        <NextIcon className="h-3.5 w-3.5" />
                        {nextStep.label}
                      </button>
                    )}
                    {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => patchOrder(order, { payment_status: 'paid' }, 'Pagamento registrado')}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/50"
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        Marcar pago
                      </button>
                    )}

                    <div className="ml-auto flex items-center gap-0.5">
                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar resumo no WhatsApp"
                          aria-label="Enviar resumo no WhatsApp"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      {!isClosed && (
                        <>
                          <button
                            type="button"
                            title="Editar pedido"
                            aria-label="Editar pedido"
                            onClick={() => openEditModal(order)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Cancelar pedido"
                            aria-label="Cancelar pedido"
                            onClick={() => cancelOrder(order)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40 dark:hover:text-amber-400"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {canDeleteOrders && (
                        <button
                          type="button"
                          title="Excluir pedido"
                          aria-label="Excluir pedido"
                          onClick={() => deleteOrder(order)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </BentoCard>
            )
          })}
        </div>
      )}

      {/* Order modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title={editingOrder ? `Editar Pedido ${shortOrderId(editingOrder.id)}` : 'Cadastrar Novo Pedido'}
        description="Selecione o cliente, adicione as linhas de marmitas e configure a entrega."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveOrder} className="space-y-4">
          <FormError message={formError} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Cliente cadastrado" htmlFor="order-customer" className="sm:col-span-2">
              <select
                id="order-customer"
                value={formData.customer_id}
                onChange={e => handleCustomerSelect(e.target.value)}
                className={inputClass}
              >
                <option value="">Novo cliente / entrada manual</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nome do cliente *" htmlFor="order-name">
              <input
                id="order-name"
                type="text"
                required
                value={formData.customer_name}
                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Ex: Carlos Oliveira"
                className={inputClass}
              />
            </Field>

            <Field label="WhatsApp / Telefone" htmlFor="order-phone">
              <input
                id="order-phone"
                type="tel"
                inputMode="tel"
                value={formData.customer_phone}
                onChange={e => setFormData({ ...formData, customer_phone: maskPhone(e.target.value) })}
                placeholder="(35) 98888-0000"
                className={inputClass}
              />
            </Field>

            {!formData.customer_id && !editingOrder && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={formData.save_customer}
                  onChange={e => setFormData({ ...formData, save_customer: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#2e7d32]"
                />
                Salvar este cliente na base de clientes
              </label>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Marmitas / Linhas do Pedido</span>
              <button
                type="button"
                onClick={() => categories.length && setItems(prev => [...prev, { category_id: categories[0].id, quantity: 10 }])}
                className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold text-[#2e7d32] hover:underline dark:text-emerald-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar linha
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => {
                const price = linePrice(item)
                return (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <select
                        value={item.category_id}
                        onChange={e => updateItem(idx, { category_id: e.target.value })}
                        aria-label="Linha da marmita"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name} — {formatCurrency(Number(c.price_unit))}/un</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                          <button
                            type="button"
                            aria-label="Diminuir quantidade"
                            onClick={() => updateItem(idx, { quantity: Math.max(1, item.quantity - 1) })}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity || ''}
                            onChange={e => updateItem(idx, { quantity: Math.max(0, Math.floor(Number(e.target.value))) })}
                            aria-label="Quantidade"
                            className="w-12 bg-transparent text-center font-mono text-xs font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            aria-label="Aumentar quantidade"
                            onClick={() => updateItem(idx, { quantity: item.quantity + 1 })}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {QUICK_QUANTITIES.map(quantity => (
                          <button
                            key={quantity}
                            type="button"
                            onClick={() => updateItem(idx, { quantity })}
                            className={`rounded-lg px-2 py-1.5 font-mono text-[11px] font-bold transition-colors ${
                              item.quantity === quantity
                                ? 'bg-[#2e7d32] text-white'
                                : 'bg-white text-slate-500 hover:text-slate-900 dark:bg-slate-900 dark:hover:text-slate-100'
                            }`}
                          >
                            {quantity}
                          </button>
                        ))}
                        {items.length > 1 && (
                          <button
                            type="button"
                            aria-label="Remover linha"
                            onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {price && (
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 px-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono">
                          {[
                            price.bundles.c20 && `${price.bundles.c20}× combo 20`,
                            price.bundles.c10 && `${price.bundles.c10}× combo 10`,
                            price.bundles.un && `${price.bundles.un} avulsa(s)`,
                          ].filter(Boolean).join(' + ')}
                        </span>
                        <span className="flex items-center gap-2">
                          {price.savings > 0 && (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">economia {formatCurrency(price.savings)}</span>
                          )}
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(price.total)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Desconto (R$)" htmlFor="order-discount" hint={totalSavings > 0 ? `Combos já aplicam ${formatCurrency(totalSavings)} de economia.` : undefined}>
                <input
                  id="order-discount"
                  type="text"
                  inputMode="decimal"
                  value={formData.discount}
                  onChange={e => setFormData({ ...formData, discount: e.target.value.replace(/[^\d.,]/g, '') })}
                  placeholder="0,00"
                  className={inputClass}
                />
              </Field>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-right dark:border-emerald-900/40 dark:bg-emerald-950/20">
                {discount > 0 && (
                  <p className="font-mono text-[11px] text-slate-500 line-through">{formatCurrency(subtotal)}</p>
                )}
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total</p>
                <p className="font-mono text-lg font-black text-[#2e7d32] dark:text-emerald-300">{formatCurrency(orderTotal)}</p>
              </div>
            </div>
          </div>

          {/* Delivery & payment */}
          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:grid-cols-3">
            <Field label="Data de entrega" htmlFor="order-delivery">
              <input
                id="order-delivery"
                type="date"
                value={formData.delivery_date}
                onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                className={inputClass}
              />
              <div className="mt-1.5 flex gap-1">
                {[{ label: 'Hoje', value: today }, { label: 'Amanhã', value: tomorrow }].map(option => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, delivery_date: option.value })}
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      formData.delivery_date === option.value
                        ? 'bg-emerald-50 text-[#2e7d32] dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Método de pagamento" htmlFor="order-method">
              <select
                id="order-method"
                value={formData.payment_method}
                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                className={inputClass}
              >
                {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </Field>

            <Field label="Status do pagamento" htmlFor="order-payment">
              <select
                id="order-payment"
                value={formData.payment_status}
                onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                className={inputClass}
              >
                <option value="paid">Pago</option>
                <option value="partial">Parcial</option>
                <option value="pending">Pendente</option>
              </select>
            </Field>
          </div>

          <Field label="Observações (pratos escolhidos, restrições, endereço)" htmlFor="order-notes">
            <textarea
              id="order-notes"
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: 5 frango cremoso, 5 carne de panela"
              className={inputClass}
            />
          </Field>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <GlowButton type="button" variant="outline" size="sm" onClick={() => setShowOrderModal(false)}>
              Cancelar
            </GlowButton>
            <GlowButton type="submit" size="sm" disabled={modalLoading}>
              {modalLoading ? 'Salvando...' : editingOrder ? 'Salvar alterações' : `Salvar pedido • ${formatCurrency(orderTotal)}`}
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
