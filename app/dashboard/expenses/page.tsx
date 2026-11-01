'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Expense } from '@/lib/types'
import {
  downloadCSV,
  formatCurrency,
  formatDate,
  getLocalDateISO,
  getStatusLabel,
  PAYMENT_METHODS,
  cn,
} from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Edit,
  HandCoins,
  Plus,
  Receipt,
  Scale,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import StatWidget from '@/components/kokonutui/stat-widget'
import Modal from '@/components/ui/modal'
import { useFeedback } from '@/components/ui/feedback'
import { Field, FormError, inputClass } from '@/components/ui/form'
import { EmptyState, PageHeader, PageSkeleton } from '@/components/ui/page'

const EXPENSE_CATEGORIES = [
  'Ingredientes',
  'Embalagens',
  'Entrega',
  'Funcionários',
  'Aluguel',
  'Contas',
  'Marketing',
  'Outros',
] as const

const CATEGORY_COLORS: Record<string, string> = {
  Ingredientes: '#2e7d32',
  Embalagens: '#0ea5e9',
  Entrega: '#f59e0b',
  Funcionários: '#8b5cf6',
  Aluguel: '#ef4444',
  Contas: '#14b8a6',
  Marketing: '#ec4899',
  Outros: '#64748b',
}

interface ReceivableOrder {
  id: string
  customer_name: string
  customer_phone: string | null
  delivery_date: string
  status: string
  payment_status: string
  payment_method: string | null
  total: number
}

interface FinanceData {
  key: string
  expenses: Expense[]
  monthRevenue: number
  monthOrders: number
  receivables: ReceivableOrder[]
  error: string | null
}

interface ExpenseForm {
  date: string
  category: string
  description: string
  amount: string
  payment_method: string
}

function getMonthBounds(monthStart: string) {
  const [year, month] = monthStart.split('-').map(Number)
  return {
    start: monthStart,
    end: getLocalDateISO(new Date(year, month, 0)),
  }
}

function shiftMonth(monthStart: string, delta: number): string {
  const [year, month] = monthStart.split('-').map(Number)
  return getLocalDateISO(new Date(year, month - 1 + delta, 1))
}

function formatMonthLabel(monthStart: string): string {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${monthStart}T12:00:00`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function currentMonthStart(): string {
  const now = new Date()
  return getLocalDateISO(new Date(now.getFullYear(), now.getMonth(), 1))
}

function defaultDateFor(monthStart: string): string {
  const today = getLocalDateISO()
  const { start, end } = getMonthBounds(monthStart)
  return today >= start && today <= end ? today : start
}

async function fetchFinance(monthStart: string, key: string): Promise<FinanceData> {
  const supabase = createClient()
  const { start, end } = getMonthBounds(monthStart)

  const [expensesRes, ordersRes, receivablesRes] = await Promise.all([
    supabase.from('expenses').select('*').gte('date', start).lte('date', end).order('date', { ascending: false }),
    supabase.from('orders').select('total').gte('order_date', start).lte('order_date', end).neq('status', 'cancelled'),
    supabase
      .from('orders')
      .select('id, customer_name, customer_phone, delivery_date, status, payment_status, payment_method, total')
      .in('payment_status', ['pending', 'partial'])
      .neq('status', 'cancelled')
      .order('delivery_date', { ascending: true }),
  ])

  const error = expensesRes.error || ordersRes.error || receivablesRes.error
  return {
    key,
    expenses: (expensesRes.data || []) as Expense[],
    monthRevenue: (ordersRes.data || []).reduce((sum, order) => sum + Number(order.total || 0), 0),
    monthOrders: ordersRes.data?.length || 0,
    receivables: (receivablesRes.data || []) as ReceivableOrder[],
    error: error ? error.message : null,
  }
}

export default function ExpensesPage() {
  const { toast, confirm } = useFeedback()
  const [month, setMonth] = useState(currentMonthStart)
  const [reloadToken, setReloadToken] = useState(0)
  const [data, setData] = useState<FinanceData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseForm>({
    date: getLocalDateISO(),
    category: 'Ingredientes',
    description: '',
    amount: '',
    payment_method: 'PIX',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)

  const requestKey = `${month}|${reloadToken}`

  useEffect(() => {
    let cancelled = false
    const [monthStart] = requestKey.split('|')
    const run = async () => {
      const result = await fetchFinance(monthStart, requestKey)
      if (!cancelled) setData(result)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [requestKey])

  const refreshing = !!data && data.key !== requestKey
  const reload = () => setReloadToken(token => token + 1)

  const expenses = useMemo(() => data?.expenses ?? [], [data])
  const monthExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const result = (data?.monthRevenue || 0) - monthExpenses
  const receivableTotal = (data?.receivables || []).reduce((sum, order) => sum + Number(order.total), 0)

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>()
    expenses.forEach(expense => totals.set(expense.category, (totals.get(expense.category) || 0) + Number(expense.amount)))
    return [...totals.entries()]
      .map(([category, total]) => ({ category, total, color: CATEGORY_COLORS[category] || '#64748b' }))
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  const filteredExpenses = expenses.filter(expense => {
    const term = searchTerm.trim().toLowerCase()
    const matchesSearch = !term || expense.description.toLowerCase().includes(term) || expense.category.toLowerCase().includes(term)
    return matchesSearch && (categoryFilter === 'all' || expense.category === categoryFilter)
  })

  const openCreateModal = () => {
    setEditingExpense(null)
    setForm({ date: defaultDateFor(month), category: 'Ingredientes', description: '', amount: '', payment_method: 'PIX' })
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense)
    setForm({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: String(Number(expense.amount)).replace('.', ','),
      payment_method: expense.payment_method || 'PIX',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError('')

    const amount = Number(form.amount.includes(',') ? form.amount.replace(/\./g, '').replace(',', '.') : form.amount)
    if (!form.description.trim()) {
      setFormError('Descreva a despesa.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Informe um valor maior que zero.')
      return
    }

    setFormLoading(true)
    const supabase = createClient()
    const payload = {
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount: Math.round(amount * 100) / 100,
      payment_method: form.payment_method,
      updated_at: new Date().toISOString(),
    }

    const { error } = editingExpense
      ? await supabase.from('expenses').update(payload).eq('id', editingExpense.id)
      : await supabase.from('expenses').insert(payload)

    setFormLoading(false)
    if (error) {
      setFormError(`Erro ao salvar despesa: ${error.message}`)
      return
    }

    setShowModal(false)
    toast('success', editingExpense ? 'Despesa atualizada' : 'Despesa lançada', `${payload.description} · ${formatCurrency(payload.amount)}`)
    const savedMonth = `${form.date.slice(0, 7)}-01`
    if (savedMonth !== month) setMonth(savedMonth)
    else reload()
  }

  const handleDelete = async (expense: Expense) => {
    const ok = await confirm({
      title: 'Excluir despesa?',
      description: `"${expense.description}" (${formatCurrency(Number(expense.amount))}) será removida permanentemente.`,
      confirmLabel: 'Excluir',
      destructive: true,
    })
    if (!ok) return

    const supabase = createClient()
    const { error } = await supabase.from('expenses').delete().eq('id', expense.id)
    if (error) {
      toast('error', 'Não foi possível excluir', error.message)
      return
    }
    toast('success', 'Despesa excluída')
    reload()
  }

  const handleMarkPaid = async (order: ReceivableOrder) => {
    setPayingId(order.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', order.id)
    setPayingId(null)
    if (error) {
      toast('error', 'Não foi possível registrar o pagamento', error.message)
      return
    }
    toast('success', 'Pagamento registrado', `${order.customer_name} · ${formatCurrency(Number(order.total))}`)
    reload()
  }

  const handleExport = () => {
    if (filteredExpenses.length === 0) return
    downloadCSV(`despesas-${month.slice(0, 7)}.csv`, [
      ['Data', 'Categoria', 'Descrição', 'Forma de pagamento', 'Valor'],
      ...filteredExpenses.map(expense => [
        formatDate(expense.date),
        expense.category,
        expense.description,
        expense.payment_method || '',
        Number(expense.amount),
      ]),
    ])
  }

  if (!data) return <PageSkeleton cards={4} />

  const maxCategoryTotal = categoryTotals[0]?.total || 1

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        title="Financeiro"
        description="Despesas, resultado do mês e contas a receber"
        actions={
          <>
            <GlowButton variant="outline" size="sm" onClick={handleExport} disabled={filteredExpenses.length === 0}>
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </GlowButton>
            <GlowButton size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              <span>Nova Despesa</span>
            </GlowButton>
          </>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => setMonth(prev => shiftMonth(prev, -1))}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[9.5rem] text-center text-sm font-bold text-slate-900 dark:text-slate-100" aria-live="polite">
            {formatMonthLabel(month)}
          </span>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => setMonth(prev => shiftMonth(prev, 1))}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {refreshing && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#2e7d32] border-t-transparent" />}
          {month !== currentMonthStart() && (
            <button
              type="button"
              onClick={() => setMonth(currentMonthStart())}
              className="text-xs font-bold text-[#2e7d32] hover:underline dark:text-emerald-300"
            >
              Voltar ao mês atual
            </button>
          )}
        </div>
      </div>

      {data.error && (
        <FormError message={`Alguns dados não puderam ser carregados: ${data.error}`} />
      )}

      <div className={`space-y-6 sm:space-y-8 transition-opacity duration-200 ${refreshing ? 'opacity-60' : 'opacity-100'}`} aria-busy={refreshing}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatWidget
            title="Receita do Mês"
            value={formatCurrency(data.monthRevenue)}
            subtitle={`${data.monthOrders} pedido(s) não cancelados`}
            icon={CircleDollarSign}
            color="green"
          />
          <StatWidget
            title="Despesas do Mês"
            value={formatCurrency(monthExpenses)}
            subtitle={`${expenses.length} lançamento(s)`}
            icon={Receipt}
            color="amber"
            delay={0.03}
          />
          <StatWidget
            title="Resultado"
            value={formatCurrency(result)}
            subtitle={data.monthRevenue ? `Margem de ${Math.round((result / data.monthRevenue) * 100)}%` : 'Receita − despesas'}
            icon={Scale}
            color={result < 0 ? 'pink' : 'green'}
            delay={0.06}
          />
          <StatWidget
            title="A Receber"
            value={formatCurrency(receivableTotal)}
            subtitle={`${data.receivables.length} pedido(s) com pagamento pendente`}
            icon={HandCoins}
            color="blue"
            delay={0.09}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BentoCard className="p-0 overflow-hidden lg:col-span-2" hoverEffect={false}>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar despesa..."
                  aria-label="Buscar despesa"
                  className={cn(inputClass, 'pl-9')}
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                aria-label="Filtrar por categoria"
                className={cn(inputClass, 'font-semibold sm:w-48')}
              >
                <option value="all">Todas as categorias</option>
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {filteredExpenses.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title={expenses.length ? 'Nenhuma despesa encontrada' : 'Nenhuma despesa neste mês'}
                description={expenses.length ? 'Ajuste a busca ou o filtro de categoria.' : 'Lance compras de ingredientes, embalagens e demais custos para acompanhar o resultado.'}
                action={
                  !expenses.length && (
                    <GlowButton size="sm" onClick={openCreateModal}>
                      <Plus className="w-4 h-4" />
                      <span>Lançar Despesa</span>
                    </GlowButton>
                  )
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                      <th className="px-4 py-3 text-right"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredExpenses.map(expense => {
                      const color = CATEGORY_COLORS[expense.category] || '#64748b'
                      return (
                        <tr key={expense.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{formatDate(expense.date)}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{expense.description}</p>
                            {expense.payment_method && <p className="text-[11px] text-slate-400">{expense.payment_method}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                              style={{ backgroundColor: `${color}1a`, color }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                              {expense.category}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(Number(expense.amount))}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(expense)}
                                aria-label={`Editar ${expense.description}`}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(expense)}
                                aria-label={`Excluir ${expense.description}`}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="border-t border-slate-200 dark:border-slate-800">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Total {categoryFilter !== 'all' || searchTerm ? 'filtrado' : 'do mês'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </BentoCard>

          <BentoCard className="p-5" hoverEffect={false}>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Por Categoria</h2>
            {categoryTotals.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">Sem despesas lançadas.</p>
            ) : (
              <ul className="space-y-3">
                {categoryTotals.map(entry => (
                  <li key={entry.category}>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter(prev => (prev === entry.category ? 'all' : entry.category))}
                      aria-pressed={categoryFilter === entry.category}
                      className="w-full rounded-lg text-left"
                    >
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className={`font-semibold ${categoryFilter === entry.category ? 'text-[#2e7d32] dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {entry.category}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(entry.total)}
                          <span className="ml-1 font-normal text-slate-400">· {Math.round((entry.total / monthExpenses) * 100)}%</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full" style={{ width: `${(entry.total / maxCategoryTotal) * 100}%`, backgroundColor: entry.color }} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </BentoCard>
        </div>

        <BentoCard className="p-0 overflow-hidden" hoverEffect={false}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Contas a Receber</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Pedidos ativos com pagamento pendente, de qualquer período</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              {formatCurrency(receivableTotal)}
            </span>
          </div>
          {data.receivables.length === 0 ? (
            <EmptyState icon={HandCoins} title="Nada a receber" description="Todos os pedidos ativos estão pagos." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {data.receivables.map(order => {
                const overdue = order.delivery_date < getLocalDateISO()
                return (
                  <li key={order.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{order.customer_name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className={overdue ? 'font-semibold text-rose-600 dark:text-rose-400' : undefined}>
                          Entrega {formatDate(order.delivery_date)}{overdue ? ' (vencido)' : ''}
                        </span>
                        <span>·</span>
                        <span>{getStatusLabel(order.status)}</span>
                        {order.payment_status === 'partial' && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">Pagamento parcial</span>
                          </>
                        )}
                        {order.payment_method && (
                          <>
                            <span>·</span>
                            <span>{order.payment_method}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(Number(order.total))}</span>
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(order)}
                        disabled={payingId === order.id}
                        className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                      >
                        {payingId === order.id ? 'Salvando...' : 'Marcar como pago'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </BentoCard>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
        description="Registre custos para acompanhar o resultado real do negócio."
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <FormError message={formError} />

          <Field label="Descrição *" htmlFor="expense-description">
            <input
              id="expense-description"
              type="text"
              required
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Compra de frango no atacado"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Valor (R$) *" htmlFor="expense-amount">
              <input
                id="expense-amount"
                type="text"
                inputMode="decimal"
                required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value.replace(/[^\d.,]/g, '') })}
                placeholder="0,00"
                className={cn(inputClass, 'font-mono')}
              />
            </Field>
            <Field label="Data" htmlFor="expense-date">
              <input
                id="expense-date"
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Categoria" htmlFor="expense-category">
              <select
                id="expense-category"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
                {!EXPENSE_CATEGORIES.some(category => category === form.category) && (
                  <option value={form.category}>{form.category}</option>
                )}
              </select>
            </Field>
            <Field label="Forma de pagamento" htmlFor="expense-method">
              <select
                id="expense-method"
                value={form.payment_method}
                onChange={e => setForm({ ...form, payment_method: e.target.value })}
                className={inputClass}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
                <option value="Boleto">Boleto</option>
                <option value="Transferência">Transferência</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <GlowButton type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
              Cancelar
            </GlowButton>
            <GlowButton type="submit" size="sm" disabled={formLoading}>
              {formLoading ? 'Salvando...' : editingExpense ? 'Salvar Alterações' : 'Lançar Despesa'}
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
