'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag,
  DollarSign,
  Plus,
  ChefHat,
  Truck,
  RefreshCw,
  ArrowUpRight,
  Wallet,
  MessageCircle,
  Users,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getLocalDateISO,
  calculatePrice,
  maskPhone,
  getWhatsAppLink,
  shortOrderId,
  getStatusLabel,
  PAYMENT_METHODS,
  cn,
  capitalizeFirst,
} from '@/lib/utils'
import { Order, Category, Customer } from '@/lib/types'
import BentoCard from '@/components/kokonutui/bento-card'
import StatWidget from '@/components/kokonutui/stat-widget'
import GlowButton from '@/components/kokonutui/glow-button'
import Modal from '@/components/ui/modal'
import GoalTracker from '@/components/dashboard/goal-tracker'
import { useFeedback } from '@/components/ui/feedback'
import { Field, FormError, inputClass } from '@/components/ui/form'
import { EmptyState, Skeleton } from '@/components/ui/page'
import Link from 'next/link'

interface ProductionSummary {
  categories: Array<Pick<Category, 'id' | 'name' | 'color'> & { quantity: number }>
  total: number
}

interface GoalProgress {
  daily: { sales: number; orders: number; meals: number }
  monthly: { sales: number; orders: number; meals: number }
}

type CustomerOption = Pick<Customer, 'id' | 'name' | 'phone'>

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const
const QUICK_QUANTITIES = [1, 5, 10, 20]

const emptyOrderForm = (categoryId = '') => ({
  customer_id: '',
  customer_name: '',
  customer_phone: '',
  delivery_date: getLocalDateISO(),
  category_id: categoryId,
  quantity: 10,
  payment_method: 'PIX',
  payment_status: 'paid',
  notes: '',
})

function getGreeting(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function describeBundles(bundles: { c20: number; c10: number; un: number }) {
  const parts = []
  if (bundles.c20) parts.push(`${bundles.c20}× Combo 20`)
  if (bundles.c10) parts.push(`${bundles.c10}× Combo 10`)
  if (bundles.un) parts.push(`${bundles.un} avulsa${bundles.un > 1 ? 's' : ''}`)
  return parts.join(' + ')
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Carregando visão operacional">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-[1.4rem]" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-[1.4rem]" />
      <Skeleton className="h-48 rounded-[1.4rem]" />
      <Skeleton className="h-72 rounded-[1.4rem]" />
    </div>
  )
}

export default function DashboardPage() {
  const { toast } = useFeedback()
  const [stats, setStats] = useState({
    todayDeliveriesCount: 0,
    todayDeliveredCount: 0,
    pendingOrdersCount: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    activeCustomersCount: 0,
    averageTicket: 0,
    receivable: 0,
    receivableCount: 0,
  })

  const [production, setProduction] = useState<ProductionSummary>({
    categories: [],
    total: 0,
  })
  const [goalProgress, setGoalProgress] = useState<GoalProgress>({
    daily: { sales: 0, orders: 0, meals: 0 },
    monthly: { sales: 0, orders: 0, meals: 0 },
  })

  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [todayDeliveries, setTodayDeliveries] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [now, setNow] = useState(() => new Date())

  // Fast Quick-Order Modal on Dashboard
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState(emptyOrderForm)
  const [orderError, setOrderError] = useState('')
  const [creatingOrder, setCreatingOrder] = useState(false)

  const loadDashboardData = async () => {
    const supabase = createClient()
    setRefreshing(true)
    setNow(new Date())

    try {
      const today = getLocalDateISO()
      const current = new Date()
      const firstDayOfMonth = getLocalDateISO(new Date(current.getFullYear(), current.getMonth(), 1))
      const lastDayOfMonth = getLocalDateISO(new Date(current.getFullYear(), current.getMonth() + 1, 0))

      // Fetch all required data in parallel
      const [
        ordersRes,
        categoriesRes,
        customersRes,
        itemsRes
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('*, customer:customers(*), order_items(quantity)')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('active', true),
        supabase.from('customers').select('id, name, phone').order('name'),
        supabase
          .from('order_items')
          .select('quantity, category_id, category:categories(id, name, color), order:orders!inner(status)')
          .in('order.status', ['pending', 'confirmed', 'preparing']),
      ])

      const loadError = ordersRes.error || categoriesRes.error || customersRes.error || itemsRes.error
      if (loadError) {
        toast('error', 'Alguns dados não puderam ser carregados', loadError.message)
      }

      const allOrders: Order[] = ordersRes.data || []
      const customerList: CustomerOption[] = customersRes.data || []
      setCategories(categoriesRes.data || [])
      setCustomers(customerList)
      setRecentOrders(allOrders.slice(0, 7))

      const notCancelled = allOrders.filter(o => o.status !== 'cancelled')

      // Deliveries scheduled for today
      const deliveriesToday = notCancelled.filter(o => o.delivery_date === today)
      const deliveredToday = deliveriesToday.filter(o => o.status === 'delivered')
      setTodayDeliveries(deliveriesToday.filter(o => o.status !== 'delivered'))

      // Revenue received today (orders registered today and already paid)
      const todayRevenue = notCancelled
        .filter(o => o.order_date === today && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0)

      // Month revenue
      const monthOrders = notCancelled.filter(o => o.order_date >= firstDayOfMonth)
      const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total), 0)
      const avgTicket = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0

      // Open balances
      const unpaidOrders = notCancelled.filter(o => o.payment_status === 'pending' || o.payment_status === 'partial')
      const receivable = unpaidOrders.reduce((sum, o) => sum + Number(o.total), 0)

      const goalDailyOrders = notCancelled.filter(order => order.order_date === today)
      const sumSales = (orders: Order[]) => orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
      const sumMeals = (orders: Order[]) => orders.reduce((sum, order) =>
        sum + (order.order_items || []).reduce((itemTotal, item) => itemTotal + Number(item.quantity || 0), 0), 0)
      const mealOrdersThisMonth = notCancelled.filter(order =>
        order.delivery_date >= firstDayOfMonth && order.delivery_date <= lastDayOfMonth
      )

      setGoalProgress({
        daily: {
          sales: sumSales(goalDailyOrders),
          orders: goalDailyOrders.length,
          meals: sumMeals(deliveriesToday),
        },
        monthly: {
          sales: sumSales(monthOrders),
          orders: monthOrders.length,
          meals: sumMeals(mealOrdersThisMonth),
        },
      })

      // Active / in production count
      const inProduction = allOrders.filter(o =>
        ['pending', 'confirmed', 'preparing'].includes(o.status)
      )

      setStats({
        todayDeliveriesCount: deliveriesToday.length,
        todayDeliveredCount: deliveredToday.length,
        pendingOrdersCount: inProduction.length,
        todayRevenue,
        monthRevenue,
        activeCustomersCount: customerList.length,
        averageTicket: avgTicket,
        receivable,
        receivableCount: unpaidOrders.length,
      })

      // Production demand follows the active, user-configurable category list.
      const productionByCategory = new Map<string, ProductionSummary['categories'][number]>(
        (categoriesRes.data || []).map(category => [category.id, {
          id: category.id,
          name: category.name,
          color: category.color || '#2e7d32',
          quantity: 0,
        }])
      )

      type ProductionItemRow = { quantity: number; category: { id?: string; name?: string; color?: string } | null }
      ;(itemsRes.data as unknown as ProductionItemRow[] | null)?.forEach(item => {
        const category = item.category
        if (!category?.id || !category?.name) return
        const currentCategory = productionByCategory.get(category.id) || {
          id: category.id,
          name: category.name,
          color: category.color || '#2e7d32',
          quantity: 0,
        }
        currentCategory.quantity += Number(item.quantity) || 0
        productionByCategory.set(category.id, currentCategory)
      })

      const productionCategories = [...productionByCategory.values()]
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      setProduction({
        categories: productionCategories,
        total: productionCategories.reduce((sum, category) => sum + category.quantity, 0),
      })

      // Also set default category in order form if available
      const firstCategoryId = categoriesRes.data?.[0]?.id
      if (firstCategoryId) {
        setOrderForm(prev => (prev.category_id ? prev : { ...prev, category_id: firstCategoryId }))
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      toast('error', 'Erro ao carregar o painel', error instanceof Error ? error.message : undefined)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Initial fetch from Supabase on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const previous = recentOrders.find(o => o.id === orderId)?.status
    setRecentOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
    )

    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('id')

    // RLS can silently filter the row out, so an empty result also means it was not saved.
    if (error || !data?.length) {
      if (previous) {
        setRecentOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: previous } : o)))
      }
      toast('error', 'Não foi possível atualizar o status', error?.message || 'Seu perfil não tem permissão para esta mudança.')
      return
    }

    toast('success', `Pedido ${shortOrderId(orderId)} atualizado`, `Novo status: ${getStatusLabel(newStatus)}`)
    loadDashboardData()
  }

  const selectedCategory = categories.find(c => c.id === orderForm.category_id) || categories[0]
  const quickQuantity = Math.max(0, Math.floor(orderForm.quantity) || 0)
  const quickPrice = selectedCategory
    ? calculatePrice(
        quickQuantity,
        Number(selectedCategory.price_unit),
        Number(selectedCategory.price_c10),
        Number(selectedCategory.price_c20)
      )
    : null

  const openOrderModal = () => {
    setOrderError('')
    setShowOrderModal(true)
  }

  const handleCustomerSelect = (customerId: string) => {
    const found = customers.find(c => c.id === customerId)
    setOrderForm(prev => ({
      ...prev,
      customer_id: found?.id || '',
      customer_name: found?.name || '',
      customer_phone: found?.phone ? maskPhone(found.phone) : '',
    }))
  }

  const handleCreateFastOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderError('')

    if (!orderForm.customer_name.trim()) {
      setOrderError('Informe o nome do cliente.')
      return
    }
    if (!selectedCategory || !quickPrice) {
      setOrderError('Cadastre uma linha de marmitas antes de lançar pedidos.')
      return
    }
    if (quickQuantity < 1) {
      setOrderError('A quantidade precisa ser de pelo menos 1 marmita.')
      return
    }

    setCreatingOrder(true)
    const supabase = createClient()

    try {
      const total = quickPrice.total

      // 1. Create order
      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_id: orderForm.customer_id || null,
          customer_name: orderForm.customer_name.trim(),
          customer_phone: orderForm.customer_phone,
          order_date: getLocalDateISO(),
          delivery_date: orderForm.delivery_date,
          status: 'confirmed',
          payment_status: orderForm.payment_status,
          payment_method: orderForm.payment_method,
          subtotal: total,
          discount: 0,
          total,
          notes: orderForm.notes,
        })
        .select()
        .single()

      if (orderErr) throw orderErr

      // 2. Create order item
      const { error: itemErr } = await supabase.from('order_items').insert({
        order_id: newOrder.id,
        category_id: selectedCategory.id,
        product_name: selectedCategory.name,
        quantity: quickQuantity,
        unit_price: Number(selectedCategory.price_unit),
        subtotal: total,
      })

      if (itemErr) {
        // Avoid leaving an order without items behind; ignore if the role cannot delete.
        await supabase.from('orders').delete().eq('id', newOrder.id)
        throw itemErr
      }

      setShowOrderModal(false)
      setOrderForm(emptyOrderForm(categories[0]?.id || ''))
      toast(
        'success',
        `Pedido ${shortOrderId(newOrder.id)} registrado`,
        `${quickQuantity} marmita(s) • ${formatCurrency(total)}`
      )
      loadDashboardData()
    } catch (err) {
      console.error(err)
      setOrderError('Erro ao registrar pedido: ' + ((err as { message?: string })?.message || 'tente novamente.'))
    } finally {
      setCreatingOrder(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  const todayLabel = capitalizeFirst(new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now))

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header com Data e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:hidden">{todayLabel}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {getGreeting(now)}! 👋
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Dados atualizados" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ticket médio do mês <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(stats.averageTicket)}</span>
            <span className="mx-1.5 text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {stats.activeCustomersCount} clientes cadastrados
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadDashboardData}
            title="Recarregar dados"
            aria-label="Recarregar dados"
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <GlowButton
            variant="primary"
            size="sm"
            onClick={openOrderModal}
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido</span>
          </GlowButton>
        </div>
      </div>

      {/* Grid com 4 KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Faturamento Hoje"
          value={formatCurrency(stats.todayRevenue)}
          subtitle={`Mês: ${formatCurrency(stats.monthRevenue)}`}
          icon={DollarSign}
          color="green"
        />

        <StatWidget
          title="Entregas de Hoje"
          value={`${stats.todayDeliveredCount}/${stats.todayDeliveriesCount}`}
          subtitle={
            stats.todayDeliveriesCount === 0
              ? 'Nenhuma entrega agendada'
              : stats.todayDeliveredCount === stats.todayDeliveriesCount
              ? 'Todas as entregas concluídas'
              : `${stats.todayDeliveriesCount - stats.todayDeliveredCount} pendente(s)`
          }
          icon={Truck}
          color="green"
        />

        <StatWidget
          title="Pedidos a Produzir"
          value={stats.pendingOrdersCount}
          subtitle="Em preparo ou confirmados"
          icon={ChefHat}
          color="pink"
        />

        <StatWidget
          title="A Receber"
          value={formatCurrency(stats.receivable)}
          subtitle={
            stats.receivableCount === 0
              ? 'Nenhum pagamento em aberto'
              : `${stats.receivableCount} pedido(s) com pagamento em aberto`
          }
          icon={Wallet}
          color="amber"
        />
      </div>

      <GoalTracker dailyValues={goalProgress.daily} monthlyValues={goalProgress.monthly} />

      {/* Card da Cozinha: Demanda de Marmitas por Linha */}
      <BentoCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Demanda da Cozinha • Linhas em Produção
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quantidade de marmitas necessárias para os pedidos em andamento
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total a Expedir:</span>
            <span className="px-3 py-1 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold font-mono">
              {production.total} marmitas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {production.categories.map(category => {
            const isLowCarb = category.name.toLocaleLowerCase('pt-BR').includes('low carb')
            return (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                style={{ borderLeftWidth: 4, borderLeftColor: category.color }}
              >
                <div className="min-w-0 pr-3">
                  <span className={`block truncate text-xs font-bold uppercase tracking-wider ${isLowCarb ? 'text-[#e60067] dark:text-pink-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {category.name}
                  </span>
                  <span
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold"
                    style={{ backgroundColor: `${category.color}18`, color: category.color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                    Produção em andamento
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-mono text-3xl font-black" style={{ color: category.color }}>
                    {category.quantity}
                  </span>
                  <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">unidades</p>
                </div>
              </div>
            )
          })}
          {production.categories.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Cadastre uma categoria para acompanhar a produção aqui.
            </p>
          )}
        </div>
      </BentoCard>

      {/* Entregas pendentes de hoje */}
      {todayDeliveries.length > 0 && (
        <BentoCard className="p-5 sm:p-6" hoverEffect={false}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Entregas pendentes hoje
              </h2>
              <span className="rounded-md bg-slate-100 px-1.5 py-px font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {todayDeliveries.length}
              </span>
            </div>
            <Link
              href="/dashboard/production"
              className="text-xs font-bold text-[#2e7d32] dark:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <span>Ver produção</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {todayDeliveries.slice(0, 9).map(order => {
              const meals = (order.order_items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
              const whatsapp = order.customer_phone
                ? getWhatsAppLink(
                    order.customer_phone,
                    `Olá, ${order.customer_name.split(' ')[0]}! Seu pedido Fit DaLi ${shortOrderId(order.id)} sai para entrega hoje. 💚`
                  )
                : null
              return (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{order.customer_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{shortOrderId(order.id)}</span> • {meals} un. • {formatCurrency(Number(order.total))}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    {whatsapp && (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Avisar cliente no WhatsApp"
                        aria-label={`Avisar ${order.customer_name} no WhatsApp`}
                        className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </BentoCard>
      )}

      {/* Tabela de Pedidos Recentes com Alteração Rápida de Status */}
      <BentoCard className="p-0 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Fila de Pedidos Recentes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Atualize o status dos pedidos diretamente pela tabela
            </p>
          </div>

          <Link
            href="/dashboard/orders"
            className="text-xs font-bold text-[#2e7d32] dark:text-emerald-300 hover:underline flex items-center gap-1 self-start sm:self-center"
          >
            <span>Gerenciar todos os pedidos</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nenhum pedido registrado ainda"
            description="Comece cadastrando o primeiro pedido pelo botão abaixo."
            action={
              <GlowButton size="sm" onClick={openOrderModal}>
                <Plus className="w-4 h-4" />
                <span>Registrar Primeiro Pedido</span>
              </GlowButton>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Entrega</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Status do Pedido</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentOrders.map(order => {
                  const code = shortOrderId(order.id)
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {code}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {order.customer_name}
                        </p>
                        {order.customer_phone && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            {order.customer_phone}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(order.delivery_date)}
                      </td>

                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(Number(order.total))}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {getStatusLabel(order.payment_status)}
                          {order.payment_method && ` • ${order.payment_method}`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {/* Status Selector direto na tabela, colorido conforme o status */}
                        <select
                          value={order.status}
                          onChange={e => handleUpdateStatus(order.id, e.target.value)}
                          aria-label={`Status do pedido ${code}`}
                          className={`text-[11px] font-bold pl-2.5 pr-7 py-1 rounded-full border focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/30 cursor-pointer ${getStatusColor(order.status)}`}
                        >
                          {ORDER_STATUSES.map(status => (
                            <option key={status} value={status} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/orders?q=${code.slice(1)}`}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 inline-block rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Ver detalhes"
                          aria-label={`Ver pedido ${code}`}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>

      {/* Modal Rápido de Novo Pedido */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Novo Pedido Rápido"
        description="Lance um pedido com cálculo automático de combo."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateFastOrder} className="space-y-4">
          <FormError message={orderError} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customers.length > 0 && (
              <Field label="Cliente cadastrado (opcional)" htmlFor="quick-customer" className="sm:col-span-2">
                <select
                  id="quick-customer"
                  value={orderForm.customer_id}
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
            )}

            <Field label="Nome do Cliente *" htmlFor="quick-name">
              <input
                id="quick-name"
                type="text"
                required
                value={orderForm.customer_name}
                onChange={e => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                placeholder="Ex: Amanda Carvalho"
                className={inputClass}
              />
            </Field>

            <Field label="WhatsApp / Telefone" htmlFor="quick-phone">
              <input
                id="quick-phone"
                type="tel"
                inputMode="tel"
                value={orderForm.customer_phone}
                onChange={e => setOrderForm({ ...orderForm, customer_phone: maskPhone(e.target.value) })}
                placeholder="(35) 98888-0000"
                className={inputClass}
              />
            </Field>

            <Field label="Linha da Marmita" htmlFor="quick-category">
              <select
                id="quick-category"
                value={orderForm.category_id}
                onChange={e => setOrderForm({ ...orderForm, category_id: e.target.value })}
                className={inputClass}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({formatCurrency(Number(c.price_unit))}/un)
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Quantidade de marmitas" htmlFor="quick-quantity">
              <div className="flex items-center gap-1.5">
                <input
                  id="quick-quantity"
                  type="number"
                  min={1}
                  max={500}
                  inputMode="numeric"
                  value={orderForm.quantity || ''}
                  onChange={e => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
                  className={cn(inputClass, 'w-20 flex-shrink-0 font-mono font-bold')}
                />
                <div className="flex flex-1 gap-1" role="group" aria-label="Quantidades rápidas">
                  {QUICK_QUANTITIES.map(quantity => (
                    <button
                      key={quantity}
                      type="button"
                      onClick={() => setOrderForm({ ...orderForm, quantity })}
                      aria-pressed={quickQuantity === quantity}
                      className={`flex-1 rounded-lg border px-1 py-2 text-[11px] font-bold transition-colors ${
                        quickQuantity === quantity
                          ? 'border-[#2e7d32] bg-[#2e7d32] text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {quantity}
                    </button>
                  ))}
                </div>
              </div>
            </Field>

            <Field label="Data de Entrega" htmlFor="quick-delivery">
              <input
                id="quick-delivery"
                type="date"
                value={orderForm.delivery_date}
                onChange={e => setOrderForm({ ...orderForm, delivery_date: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Pagamento">
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Método de pagamento"
                  value={orderForm.payment_method}
                  onChange={e => setOrderForm({ ...orderForm, payment_method: e.target.value })}
                  className={inputClass}
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>

                <select
                  aria-label="Status do pagamento"
                  value={orderForm.payment_status}
                  onChange={e => setOrderForm({ ...orderForm, payment_status: e.target.value })}
                  className={inputClass}
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </Field>
          </div>

          {quickPrice && quickQuantity > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="min-w-0 text-[11px] text-slate-600 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-300">{describeBundles(quickPrice.bundles)}</p>
                {quickPrice.savings > 0 && (
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">
                    Economia de {formatCurrency(quickPrice.savings)} com combo
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total previsto</span>
                <span className="text-base font-black font-mono text-[#2e7d32] dark:text-emerald-300">
                  {formatCurrency(quickPrice.total)}
                </span>
              </div>
            </div>
          )}

          <Field label="Observações (sabores específicos, sem cebola, etc.)" htmlFor="quick-notes">
            <textarea
              id="quick-notes"
              rows={2}
              value={orderForm.notes}
              onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
              placeholder="Ex: 5 de frango cremoso, 5 de patinho de panela"
              className={inputClass}
            />
          </Field>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <GlowButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowOrderModal(false)}
            >
              Cancelar
            </GlowButton>
            <GlowButton type="submit" size="sm" disabled={creatingOrder || categories.length === 0}>
              {creatingOrder ? 'Salvando...' : 'Confirmar Pedido'}
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
