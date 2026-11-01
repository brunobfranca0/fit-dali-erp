'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ChefHat,
  Calendar,
  CheckCircle2,
  Printer,
  Check,
  ChevronLeft,
  ChevronRight,
  Phone,
  Truck,
  Flame,
  PackageCheck,
  ClipboardList,
} from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import { useFeedback } from '@/components/ui/feedback'
import { EmptyState, PageHeader, Skeleton } from '@/components/ui/page'
import {
  ORDER_STATUS_FLOW,
  addDaysISO,
  cn,
  formatDate,
  formatDateLabel,
  formatPhone,
  getLocalDateISO,
  getStatusColor,
  getStatusLabel,
  shortOrderId,
} from '@/lib/utils'
import { isAppRole, type AppRole } from '@/lib/auth/roles'
import type { OrderStatus } from '@/lib/types'

interface DeliveryOrderItem {
  id: string
  product_name: string
  quantity: number
  category: { id: string; name: string; color: string } | null
}

interface DeliveryOrder {
  id: string
  customer_name: string
  customer_phone: string | null
  status: OrderStatus
  notes: string | null
  order_items: DeliveryOrderItem[]
}

interface ProductionDish {
  product_name: string
  total_quantity: number
  orders_count: number
}

interface ProductionCategory {
  key: string
  name: string
  color: string
  total_quantity: number
  dishes: ProductionDish[]
}

/** Statuses whose items still need to be cooked. `ready` orders only appear in the delivery list. */
const PRODUCTION_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing']
const DELIVERY_STATUSES: OrderStatus[] = [...PRODUCTION_STATUSES, 'ready']
const STATUS_ORDER: Record<string, number> = { preparing: 0, confirmed: 1, pending: 2, ready: 3 }
const DEFAULT_COLOR = '#2e7d32'

const doneStorageKey = (date: string) => `fitdali-production-done-${date}`

function readDone(date: string): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(doneStorageKey(date))
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function writeDone(date: string, value: Record<string, boolean>) {
  try {
    const key = doneStorageKey(date)
    if (Object.values(value).some(Boolean)) window.localStorage.setItem(key, JSON.stringify(value))
    else window.localStorage.removeItem(key)
  } catch {
    // Storage can be unavailable (private mode); the checklist then lives only in memory.
  }
}

export default function ProductionPage() {
  const { toast, confirm } = useFeedback()
  const [targetDate, setTargetDate] = useState(getLocalDateISO())
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<AppRole | null>(null)
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => readDone(getLocalDateISO()))
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)

  const loadProduction = useCallback(async (date: string) => {
    const supabase = createClient()
    const [ordersRes, userRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, customer_name, customer_phone, status, notes, order_items(id, product_name, quantity, category:categories(id, name, color))')
        .eq('delivery_date', date)
        .in('status', DELIVERY_STATUSES)
        .order('created_at', { ascending: true }),
      supabase.auth.getUser(),
    ])

    if (ordersRes.error) {
      toast('error', 'Não foi possível carregar a produção', ordersRes.error.message)
    }

    const roleValue = userRes.data.user?.app_metadata?.role
    setRole(isAppRole(roleValue) ? roleValue : null)
    setOrders((ordersRes.data || []) as unknown as DeliveryOrder[])
    setLoading(false)
  }, [toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch from Supabase whenever the date changes
    loadProduction(targetDate)
  }, [targetDate, loadProduction])

  const changeDate = (date: string) => {
    if (!date || date === targetDate) return
    setLoading(true)
    setCompletedItems(readDone(date))
    setTargetDate(date)
  }

  const production = useMemo(() => {
    const categories = new Map<string, ProductionCategory>()
    const dishOrders = new Map<string, Set<string>>()

    orders
      .filter(order => PRODUCTION_STATUSES.includes(order.status))
      .forEach(order => {
        order.order_items?.forEach(item => {
          const quantity = Number(item.quantity) || 0
          const key = item.category?.id || 'geral'
          const category = categories.get(key) || {
            key,
            name: item.category?.name || 'Geral',
            color: item.category?.color || DEFAULT_COLOR,
            total_quantity: 0,
            dishes: [],
          }
          category.total_quantity += quantity

          let dish = category.dishes.find(d => d.product_name === item.product_name)
          if (!dish) {
            dish = { product_name: item.product_name, total_quantity: 0, orders_count: 0 }
            category.dishes.push(dish)
          }
          dish.total_quantity += quantity

          const seen = dishOrders.get(item.product_name) || new Set<string>()
          seen.add(order.id)
          dishOrders.set(item.product_name, seen)
          dish.orders_count = seen.size

          categories.set(key, category)
        })
      })

    const list = [...categories.values()]
      .map(category => ({
        ...category,
        dishes: category.dishes.sort((a, b) => b.total_quantity - a.total_quantity),
      }))
      .sort((a, b) => b.total_quantity - a.total_quantity)

    const total = list.reduce((sum, category) => sum + category.total_quantity, 0)
    const done = list.reduce(
      (sum, category) =>
        sum + category.dishes.reduce((acc, dish) => acc + (completedItems[dish.product_name] ? dish.total_quantity : 0), 0),
      0
    )
    const dishesCount = list.reduce((sum, category) => sum + category.dishes.length, 0)

    return { categories: list, total, done, dishesCount }
  }, [orders, completedItems])

  const deliveryOrders = useMemo(
    () => [...orders].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)),
    [orders]
  )
  const confirmedOrders = orders.filter(order => order.status === 'confirmed')
  const progress = production.total > 0 ? Math.round((production.done / production.total) * 100) : 0

  const toggleComplete = (name: string) => {
    setCompletedItems(prev => {
      const next = { ...prev, [name]: !prev[name] }
      writeDone(targetDate, next)
      return next
    })
  }

  /** Producao can only move confirmed→preparing→ready→delivered (see RLS policy "production status updates"). */
  const getNextStep = (status: OrderStatus) => {
    if (status === 'pending' && role === 'producao') return undefined
    return ORDER_STATUS_FLOW[status]
  }

  const advanceOrder = async (order: DeliveryOrder) => {
    const step = getNextStep(order.status)
    if (!step) return

    setUpdatingIds(prev => new Set(prev).add(order.id))
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .update({ status: step.next, updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .select('id')

    setUpdatingIds(prev => {
      const next = new Set(prev)
      next.delete(order.id)
      return next
    })

    if (error || !data?.length) {
      toast('error', 'Não foi possível atualizar o pedido', error?.message || 'Seu perfil não tem permissão para esta mudança.')
      return
    }

    const nextStatus = step.next as OrderStatus
    setOrders(prev =>
      nextStatus === 'delivered'
        ? prev.filter(o => o.id !== order.id)
        : prev.map(o => (o.id === order.id ? { ...o, status: nextStatus } : o))
    )
    toast('success', `${shortOrderId(order.id)} → ${getStatusLabel(nextStatus)}`, order.customer_name)
  }

  const startAllPreparation = async () => {
    if (confirmedOrders.length === 0) return
    const confirmed = await confirm({
      title: 'Iniciar preparo de todos?',
      description: `${confirmedOrders.length} pedido(s) confirmado(s) para ${formatDate(targetDate)} passarão para "Preparando".`,
      confirmLabel: 'Iniciar preparo',
    })
    if (!confirmed) return

    setBulkUpdating(true)
    const supabase = createClient()
    const ids = confirmedOrders.map(order => order.id)
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'preparing', updated_at: new Date().toISOString() })
      .in('id', ids)
      .eq('status', 'confirmed')
      .select('id')
    setBulkUpdating(false)

    if (error || !data?.length) {
      toast('error', 'Não foi possível iniciar o preparo', error?.message || 'Nenhum pedido foi atualizado.')
      return
    }

    const updated = new Set(data.map(row => row.id as string))
    setOrders(prev => prev.map(o => (updated.has(o.id) ? { ...o, status: 'preparing' } : o)))
    toast('success', 'Preparo iniciado', `${updated.size} pedido(s) em preparo`)
  }

  const today = getLocalDateISO()
  const tomorrow = addDaysISO(today, 1)

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl print:max-w-none print:space-y-4">
      <PageHeader
        title="Produção da Cozinha"
        description="Lotes por sabor, checklist de preparo e lista de entrega do dia"
        actions={
          <GlowButton variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </GlowButton>
        }
      />

      {/* Print-only heading so the sheet identifies the delivery date */}
      <p className="hidden print:block text-sm font-bold">
        Ficha de produção — entrega em {formatDate(targetDate)} ({formatDateLabel(targetDate)})
      </p>

      {/* Date navigation */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            aria-label="Dia anterior"
            onClick={() => changeDate(addDaysISO(targetDate, -1))}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-l-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <label className="flex items-center gap-2 border-x border-slate-200 dark:border-slate-800 px-3 py-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 capitalize min-w-[4.5rem]">
              {formatDateLabel(targetDate)}
            </span>
            <input
              type="date"
              value={targetDate}
              onChange={event => changeDate(event.target.value)}
              aria-label="Filtrar produção pela data de entrega"
              className="min-w-0 bg-transparent text-xs font-semibold text-slate-600 outline-none dark:text-slate-300"
            />
          </label>
          <button
            type="button"
            aria-label="Próximo dia"
            onClick={() => changeDate(addDaysISO(targetDate, 1))}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-r-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {[
          { date: today, label: 'Hoje' },
          { date: tomorrow, label: 'Amanhã' },
        ].map(shortcut => (
          <button
            key={shortcut.label}
            type="button"
            onClick={() => changeDate(shortcut.date)}
            aria-pressed={targetDate === shortcut.date}
            className={cn(
              'rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
              targetDate === shortcut.date
                ? 'bg-[#2e7d32] text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
          >
            {shortcut.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Carregando produção">
          <Skeleton className="h-36 rounded-[1.4rem]" />
          <Skeleton className="h-64 rounded-[1.4rem]" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <BentoCard className="p-6 print:p-3 print:shadow-none" hoverEffect={false}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 print:hidden">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Meta do Turno
                  </p>
                  <h2 className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                    {production.total} marmitas
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {production.dishesCount} prato(s) distinto(s) • {deliveryOrders.length} pedido(s) na lista
                  </p>
                </div>
              </div>

              {production.total > 0 && (
                <div className="sm:w-64 print:hidden">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Lotes preparados</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {production.done}/{production.total} ({progress}%)
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    aria-label="Progresso da produção"
                    className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2e7d32] to-[#38a149] transition-[width] duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {production.categories.length > 0 && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {production.categories.map(category => (
                  <div
                    key={category.key}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5"
                    style={{ borderLeftWidth: 4, borderLeftColor: category.color }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                      {category.name}
                    </p>
                    <p className="text-xl font-black font-mono" style={{ color: category.color }}>
                      {category.total_quantity}
                      <span className="ml-1 text-[10px] font-bold text-slate-400">un</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>

          {/* Checklist grouped by category */}
          <BentoCard className="p-0 overflow-hidden print:shadow-none" hoverEffect={false}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ficha Técnica por Prato
              </h2>
              <span className="text-xs text-slate-400 font-medium print:hidden">
                Toque no prato para marcar o lote como preparado
              </span>
            </div>

            {production.categories.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Tudo em dia!"
                description={`Não há marmitas pendentes de produção para ${formatDateLabel(targetDate).toLowerCase()}.`}
              />
            ) : (
              <div>
                {production.categories.map(category => (
                  <section key={category.key} aria-label={category.name} className="break-inside-avoid">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          {category.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        {category.total_quantity} un
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {category.dishes.map(dish => {
                        const isDone = !!completedItems[dish.product_name]
                        return (
                          <button
                            type="button"
                            key={dish.product_name}
                            onClick={() => toggleComplete(dish.product_name)}
                            aria-pressed={isDone}
                            className={cn(
                              'w-full p-4 flex items-center justify-between text-left cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2e7d32] print:py-2',
                              isDone
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                                : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  'w-5 h-5 flex-shrink-0 rounded-lg border flex items-center justify-center transition-colors',
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                )}
                              >
                                {isDone && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <span
                                  className={cn(
                                    'font-bold text-sm block truncate',
                                    isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                                  )}
                                >
                                  {dish.product_name}
                                </span>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Presente em {dish.orders_count} pedido(s)
                                </p>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 pl-3">
                              <span
                                className={cn(
                                  'text-xl font-black font-mono',
                                  isDone ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                                )}
                              >
                                {dish.total_quantity}
                              </span>
                              <span className="text-xs text-slate-400 font-semibold ml-1">un</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </BentoCard>

          {/* Delivery list */}
          <BentoCard className="p-0 overflow-hidden print:shadow-none print:break-before-page" hoverEffect={false}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Lista de Entrega
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pedidos ativos com entrega {formatDateLabel(targetDate).toLowerCase() === 'hoje' ? 'hoje' : `em ${formatDate(targetDate)}`}
                </p>
              </div>
              {confirmedOrders.length > 0 && (
                <GlowButton size="sm" onClick={startAllPreparation} disabled={bulkUpdating} className="print:hidden">
                  <Flame className="w-4 h-4" />
                  <span>{bulkUpdating ? 'Atualizando...' : `Iniciar preparo de todos (${confirmedOrders.length})`}</span>
                </GlowButton>
              )}
            </div>

            {deliveryOrders.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Nenhum pedido para entregar"
                description="Pedidos confirmados, em preparo ou prontos para esta data aparecerão aqui."
              />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {deliveryOrders.map(order => {
                  const step = getNextStep(order.status)
                  const isUpdating = updatingIds.has(order.id)
                  const units = order.order_items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0
                  return (
                    <li key={order.id} className="p-4 sm:p-5 break-inside-avoid">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-400">{shortOrderId(order.id)}</span>
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{order.customer_name}</span>
                            <span className={cn('px-2 py-0.5 text-[10.5px] font-bold rounded-full border', getStatusColor(order.status))}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                          {order.customer_phone && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {formatPhone(order.customer_phone)}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {order.order_items?.map(item => {
                              const color = item.category?.color || DEFAULT_COLOR
                              return (
                                <span
                                  key={item.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold"
                                  style={{ backgroundColor: `${color}14`, color }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                  {item.product_name}
                                  <span className="font-mono">×{item.quantity}</span>
                                </span>
                              )
                            })}
                          </div>

                          {order.notes && (
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                              &ldquo;{order.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{units} un</span>
                          {step && (
                            <button
                              type="button"
                              onClick={() => advanceOrder(order)}
                              disabled={isUpdating}
                              className="print:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                            >
                              {order.status === 'ready' ? <Truck className="w-3.5 h-3.5" /> : <PackageCheck className="w-3.5 h-3.5" />}
                              {isUpdating ? 'Salvando...' : step.label}
                            </button>
                          )}
                          <span className="hidden print:inline-block w-4 h-4 border border-slate-400 rounded" aria-hidden="true" />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </BentoCard>
        </>
      )}
    </div>
  )
}
