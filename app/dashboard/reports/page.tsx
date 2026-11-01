'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  addDaysISO,
  downloadCSV,
  formatCurrency,
  formatDate,
  getLocalDateISO,
  getStatusLabel,
} from '@/lib/utils'
import {
  CreditCard,
  DollarSign,
  Download,
  Package,
  PieChart as PieChartIcon,
  Receipt,
  TrendingUp,
  Trophy,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import StatWidget from '@/components/kokonutui/stat-widget'
import { Field, inputClass, Segmented } from '@/components/ui/form'
import { EmptyState, PageHeader, PageSkeleton } from '@/components/ui/page'

type Preset = '7d' | '30d' | 'month' | 'lastMonth' | 'custom'

interface DateRange {
  start: string
  end: string
}

interface ReportOrderItem {
  product_name: string
  quantity: number
  subtotal: number
  category: { id: string; name: string; color: string } | null
}

interface ReportOrder {
  id: string
  order_date: string
  delivery_date: string
  customer_name: string
  customer_phone: string | null
  status: string
  payment_status: string
  payment_method: string | null
  discount: number
  total: number
  order_items: ReportOrderItem[] | null
}

interface PreviousOrder {
  total: number
  order_items: { quantity: number }[] | null
}

interface ReportData {
  key: string
  orders: ReportOrder[]
  previousOrders: PreviousOrder[]
  expenses: number | null
  previousExpenses: number | null
}

const PRESET_OPTIONS: { value: Preset; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês passado' },
  { value: 'custom', label: 'Personalizado' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#22c55e',
  delivered: '#64748b',
  cancelled: '#ef4444',
}

const PAYMENT_COLORS = ['#2e7d32', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b']

function getPresetRange(preset: Exclude<Preset, 'custom'>): DateRange {
  const today = getLocalDateISO()
  const now = new Date()
  switch (preset) {
    case '7d':
      return { start: addDaysISO(today, -6), end: today }
    case '30d':
      return { start: addDaysISO(today, -29), end: today }
    case 'month':
      return { start: getLocalDateISO(new Date(now.getFullYear(), now.getMonth(), 1)), end: today }
    case 'lastMonth':
      return {
        start: getLocalDateISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: getLocalDateISO(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
  }
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()
  return Math.round(ms / 86_400_000)
}

function getPreviousRange(range: DateRange): DateRange {
  const end = addDaysISO(range.start, -1)
  return { start: addDaysISO(end, -daysBetween(range.start, range.end)), end }
}

function sumMeals(items: { quantity: number }[] | null | undefined): number {
  return (items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}

function percentChange(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

function formatTrend(change: number | null): string | undefined {
  if (change === null) return undefined
  const rounded = Math.round(change)
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

async function fetchReport(range: DateRange): Promise<ReportData> {
  const supabase = createClient()
  const previous = getPreviousRange(range)

  const [ordersRes, previousRes, expensesRes, previousExpensesRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_date, delivery_date, customer_name, customer_phone, status, payment_status, payment_method, discount, total, order_items(product_name, quantity, subtotal, category:categories(id, name, color))')
      .gte('order_date', range.start)
      .lte('order_date', range.end)
      .order('order_date', { ascending: true }),
    supabase
      .from('orders')
      .select('total, order_items(quantity)')
      .gte('order_date', previous.start)
      .lte('order_date', previous.end)
      .neq('status', 'cancelled'),
    supabase.from('expenses').select('amount').gte('date', range.start).lte('date', range.end),
    supabase.from('expenses').select('amount').gte('date', previous.start).lte('date', previous.end),
  ])

  if (ordersRes.error) console.error('Erro ao carregar relatórios:', ordersRes.error)

  const sumAmounts = (rows: { amount: number }[] | null) =>
    (rows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)

  return {
    key: `${range.start}|${range.end}`,
    orders: (ordersRes.data || []) as unknown as ReportOrder[],
    previousOrders: (previousRes.data || []) as unknown as PreviousOrder[],
    // Expenses are restricted by RLS; without access we simply hide the figures.
    expenses: expensesRes.error ? null : sumAmounts(expensesRes.data),
    previousExpenses: previousExpensesRes.error ? null : sumAmounts(previousExpensesRes.data),
  }
}

interface ChartTooltipProps {
  active?: boolean
  label?: string
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: { fill?: string } }>
  format?: (value: number) => string
}

function ChartTooltip({ active, label, payload, format = formatCurrency }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      {label && <p className="mb-1 font-bold text-slate-900 dark:text-slate-100">{label}</p>}
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.payload?.fill || entry.color }} />
          <span>{entry.name}:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{format(Number(entry.value || 0))}</span>
        </p>
      ))}
    </div>
  )
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: typeof TrendingUp; children: React.ReactNode }) {
  return (
    <BentoCard className="p-5" hoverEffect={false}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h2>
      </div>
      {children}
    </BentoCard>
  )
}

export default function ReportsPage() {
  const [preset, setPreset] = useState<Preset>('30d')
  const [customRange, setCustomRange] = useState<DateRange>(() => getPresetRange('30d'))
  const [data, setData] = useState<ReportData | null>(null)

  const range = preset === 'custom' ? customRange : getPresetRange(preset)
  const rangeKey = `${range.start}|${range.end}`
  const rangeValid = !!range.start && !!range.end && range.start <= range.end

  useEffect(() => {
    if (!rangeValid) return
    let cancelled = false
    const [start, end] = rangeKey.split('|')
    const run = async () => {
      const result = await fetchReport({ start, end })
      if (!cancelled) setData(result)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [rangeKey, rangeValid])

  const refreshing = !!data && data.key !== rangeKey && rangeValid

  const report = useMemo(() => {
    if (!data) return null
    const [start, end] = data.key.split('|')
    const activeOrders = data.orders.filter(order => order.status !== 'cancelled')

    const totalRevenue = activeOrders.reduce((sum, order) => sum + Number(order.total), 0)
    const totalOrders = activeOrders.length
    const averageTicket = totalOrders ? totalRevenue / totalOrders : 0
    const totalMeals = activeOrders.reduce((sum, order) => sum + sumMeals(order.order_items), 0)

    const previousRevenue = data.previousOrders.reduce((sum, order) => sum + Number(order.total), 0)
    const previousOrders = data.previousOrders.length
    const previousTicket = previousOrders ? previousRevenue / previousOrders : 0
    const previousMeals = data.previousOrders.reduce((sum, order) => sum + sumMeals(order.order_items), 0)

    // Daily revenue keyed by ISO date so the chart stays ordered across months, with empty days as zero.
    const revenueByDate = new Map<string, number>()
    for (let day = start; day <= end; day = addDaysISO(day, 1)) revenueByDate.set(day, 0)
    activeOrders.forEach(order => {
      revenueByDate.set(order.order_date, (revenueByDate.get(order.order_date) || 0) + Number(order.total))
    })
    const revenueData = [...revenueByDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date: formatDate(date).slice(0, 5), revenue }))

    const products = new Map<string, { name: string; color: string; quantity: number; revenue: number }>()
    const categories = new Map<string, { name: string; color: string; revenue: number; quantity: number }>()
    activeOrders.forEach(order => {
      order.order_items?.forEach(item => {
        const color = item.category?.color || '#2e7d32'
        const product = products.get(item.product_name) || { name: item.product_name, color, quantity: 0, revenue: 0 }
        product.quantity += Number(item.quantity)
        product.revenue += Number(item.subtotal)
        products.set(item.product_name, product)

        const categoryKey = item.category?.id || 'none'
        const category = categories.get(categoryKey) || { name: item.category?.name || 'Sem categoria', color, revenue: 0, quantity: 0 }
        category.revenue += Number(item.subtotal)
        category.quantity += Number(item.quantity)
        categories.set(categoryKey, category)
      })
    })
    const topProducts = [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    const categoryData = [...categories.values()].sort((a, b) => b.revenue - a.revenue)

    const statusCounts = new Map<string, number>()
    data.orders.forEach(order => statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1))
    const statusData = [...statusCounts.entries()].map(([status, count]) => ({
      status,
      label: getStatusLabel(status),
      count,
      fill: STATUS_COLORS[status] || '#94a3b8',
    }))

    const payments = new Map<string, { method: string; revenue: number; count: number }>()
    activeOrders.forEach(order => {
      const method = order.payment_method || 'Não informado'
      const entry = payments.get(method) || { method, revenue: 0, count: 0 }
      entry.revenue += Number(order.total)
      entry.count += 1
      payments.set(method, entry)
    })
    const paymentData = [...payments.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .map((entry, index) => ({ ...entry, fill: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }))

    const profit = data.expenses === null ? null : totalRevenue - data.expenses
    const previousProfit = data.previousExpenses === null ? null : previousRevenue - data.previousExpenses

    return {
      totalRevenue,
      totalOrders,
      averageTicket,
      totalMeals,
      cancelledCount: data.orders.length - activeOrders.length,
      trends: {
        revenue: percentChange(totalRevenue, previousRevenue),
        orders: percentChange(totalOrders, previousOrders),
        ticket: percentChange(averageTicket, previousTicket),
        meals: percentChange(totalMeals, previousMeals),
        expenses: data.expenses === null || data.previousExpenses === null ? null : percentChange(data.expenses, data.previousExpenses),
        profit: profit === null || previousProfit === null || previousProfit <= 0 ? null : percentChange(profit, previousProfit),
      },
      expenses: data.expenses,
      profit,
      revenueData,
      topProducts,
      categoryData,
      statusData,
      paymentData,
    }
  }, [data])

  const handleExportCSV = () => {
    if (!data || data.orders.length === 0) return
    const rows: Array<Array<string | number>> = [
      ['Pedido', 'Data', 'Entrega', 'Cliente', 'Telefone', 'Status', 'Pagamento', 'Método', 'Itens', 'Marmitas', 'Desconto', 'Total'],
      ...data.orders.map(order => [
        order.id,
        formatDate(order.order_date),
        formatDate(order.delivery_date),
        order.customer_name,
        order.customer_phone || '',
        getStatusLabel(order.status),
        getStatusLabel(order.payment_status),
        order.payment_method || '',
        (order.order_items || []).map(item => `${item.product_name} x${item.quantity}`).join(', '),
        sumMeals(order.order_items),
        Number(order.discount || 0),
        Number(order.total),
      ]),
    ]
    const [start, end] = data.key.split('|')
    downloadCSV(`relatorio-pedidos-${start}-a-${end}.csv`, rows)
  }

  if (!report) return <PageSkeleton cards={6} />

  const trendProps = (change: number | null, invert = false) => ({
    trend: formatTrend(change),
    trendPositive: change === null ? true : invert ? change <= 0 : change >= 0,
  })

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-6xl">
      <PageHeader
        title="Relatórios de Desempenho"
        description="Vendas, ticket médio, linhas mais pedidas e resultado do período"
        actions={
          <GlowButton variant="outline" size="sm" onClick={handleExportCSV} disabled={!data?.orders.length}>
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </GlowButton>
        }
      />

      <BentoCard className="p-4" hoverEffect={false}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            ariaLabel="Período do relatório"
            value={preset}
            options={PRESET_OPTIONS}
            onChange={value => {
              if (value === 'custom') setCustomRange(range)
              setPreset(value)
            }}
          />
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {refreshing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#2e7d32] border-t-transparent" />}
            <span className="font-semibold">
              {formatDate(range.start)} — {formatDate(range.end)}
            </span>
          </div>
        </div>

        {preset === 'custom' && (
          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:grid-cols-2">
            <Field label="Data início" htmlFor="report-start">
              <input
                id="report-start"
                type="date"
                value={customRange.start}
                max={customRange.end}
                onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Data fim" htmlFor="report-end">
              <input
                id="report-end"
                type="date"
                value={customRange.end}
                min={customRange.start}
                onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                className={inputClass}
              />
            </Field>
            {!rangeValid && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 sm:col-span-2">
                A data inicial precisa ser anterior à data final.
              </p>
            )}
          </div>
        )}
      </BentoCard>

      <div className={`space-y-6 sm:space-y-8 transition-opacity duration-200 ${refreshing ? 'opacity-60' : 'opacity-100'}`} aria-busy={refreshing}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatWidget
            title="Faturamento"
            value={formatCurrency(report.totalRevenue)}
            subtitle="vs. período anterior"
            icon={DollarSign}
            color="green"
            {...trendProps(report.trends.revenue)}
          />
          <StatWidget
            title="Pedidos"
            value={report.totalOrders}
            subtitle={report.cancelledCount ? `${report.cancelledCount} cancelado(s) fora da soma` : 'Sem cancelamentos'}
            icon={Package}
            color="green"
            delay={0.03}
            {...trendProps(report.trends.orders)}
          />
          <StatWidget
            title="Ticket Médio"
            value={formatCurrency(report.averageTicket)}
            subtitle="Por pedido não cancelado"
            icon={TrendingUp}
            color="blue"
            delay={0.06}
            {...trendProps(report.trends.ticket)}
          />
          <StatWidget
            title="Marmitas Vendidas"
            value={report.totalMeals}
            subtitle={report.totalOrders ? `${(report.totalMeals / report.totalOrders).toFixed(1)} por pedido` : 'Nenhum pedido'}
            icon={UtensilsCrossed}
            color="pink"
            delay={0.09}
            {...trendProps(report.trends.meals)}
          />
          <StatWidget
            title="Despesas"
            value={report.expenses === null ? '—' : formatCurrency(report.expenses)}
            subtitle={report.expenses === null ? 'Sem acesso ao financeiro' : 'Lançadas no Financeiro'}
            icon={Receipt}
            color="amber"
            delay={0.12}
            {...trendProps(report.trends.expenses, true)}
          />
          <StatWidget
            title="Lucro Estimado"
            value={report.profit === null ? '—' : formatCurrency(report.profit)}
            subtitle={
              report.profit === null
                ? 'Requer acesso ao financeiro'
                : report.totalRevenue
                ? `Margem de ${Math.round((report.profit / report.totalRevenue) * 100)}%`
                : 'Receita − despesas'
            }
            icon={Wallet}
            color={report.profit !== null && report.profit < 0 ? 'pink' : 'green'}
            delay={0.15}
            {...trendProps(report.trends.profit)}
          />
        </div>

        {data && data.orders.length === 0 ? (
          <BentoCard className="p-0" hoverEffect={false}>
            <EmptyState
              icon={TrendingUp}
              title="Nenhum pedido no período"
              description="Escolha outro intervalo de datas para visualizar os gráficos de desempenho."
            />
          </BentoCard>
        ) : (
          <>
            <ChartCard title="Curva de Receita" icon={TrendingUp}>
              <div className="h-72 w-full text-slate-500 dark:text-slate-400">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.revenueData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2e7d32" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2e7d32" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor' }} stroke="currentColor" strokeOpacity={0.3} minTickGap={16} />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      stroke="currentColor"
                      strokeOpacity={0.3}
                      width={56}
                      tickFormatter={value => `R$${Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(1)}k` : value}`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Receita" stroke="#2e7d32" strokeWidth={2.5} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Top 5 Mais Vendidos" icon={Trophy}>
                <div className="space-y-3">
                  {report.topProducts.map((product, index) => {
                    const maxRevenue = report.topProducts[0]?.revenue || 1
                    return (
                      <div key={product.name}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {index + 1}
                            </span>
                            <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{product.name}</span>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-3 font-mono">
                            <span className="text-slate-400">{product.quantity} un</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(product.revenue)}</span>
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{ width: `${(product.revenue / maxRevenue) * 100}%`, backgroundColor: product.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {report.topProducts.length === 0 && (
                    <p className="py-8 text-center text-xs text-slate-400">Sem itens vendidos no período.</p>
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Receita por Linha" icon={PieChartIcon}>
                <div className="h-60 w-full text-slate-500 dark:text-slate-400">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.categoryData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'currentColor' }} stroke="currentColor" strokeOpacity={0.3} tickFormatter={value => `R$${value}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'currentColor' }} stroke="currentColor" strokeOpacity={0.3} width={100} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
                      <Bar dataKey="revenue" name="Receita" radius={[0, 8, 8, 0]} barSize={22}>
                        {report.categoryData.map(category => (
                          <Cell key={category.name} fill={category.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Distribuição de Status" icon={Package}>
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="h-52 w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={report.statusData} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                          {report.statusData.map(entry => (
                            <Cell key={entry.status} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip format={value => `${value} pedido(s)`} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="w-full space-y-2 sm:w-1/2">
                    {report.statusData.map(entry => (
                      <li key={entry.status} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                          {entry.label}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{entry.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ChartCard>

              <ChartCard title="Formas de Pagamento" icon={CreditCard}>
                <div className="space-y-3">
                  {report.paymentData.map(entry => {
                    const share = report.totalRevenue ? (entry.revenue / report.totalRevenue) * 100 : 0
                    return (
                      <div key={entry.method}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                            {entry.method}
                            <span className="font-normal text-slate-400">({entry.count} pedidos)</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(entry.revenue)} <span className="font-normal text-slate-400">· {Math.round(share)}%</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: entry.fill }} />
                        </div>
                      </div>
                    )
                  })}
                  {report.paymentData.length === 0 && (
                    <p className="py-8 text-center text-xs text-slate-400">Sem pagamentos no período.</p>
                  )}
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
