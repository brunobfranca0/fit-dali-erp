'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  Users, 
  Plus, 
  TrendingUp, 
  ChefHat, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Filter,
  Check
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getLocalDateISO } from '@/lib/utils'
import { Order, Category, Customer } from '@/lib/types'
import BentoCard from '@/components/kokonutui/bento-card'
import StatWidget from '@/components/kokonutui/stat-widget'
import GlowButton from '@/components/kokonutui/glow-button'
import KokonutBadge from '@/components/kokonutui/badge'
import Modal from '@/components/ui/modal'
import Link from 'next/link'

interface ProductionSummary {
  lowCarb: number
  arrozBranco: number
  arrozIntegral: number
  total: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayOrdersCount: 0,
    todayDeliveredCount: 0,
    pendingOrdersCount: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    activeCustomersCount: 0,
    averageTicket: 0,
  })

  const [production, setProduction] = useState<ProductionSummary>({
    lowCarb: 0,
    arrozBranco: 0,
    arrozIntegral: 0,
    total: 0,
  })

  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fast Quick-Order Modal on Dashboard
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    delivery_date: getLocalDateISO(),
    category_id: '',
    quantity: 10,
    payment_method: 'PIX',
    payment_status: 'paid',
    notes: '',
  })
  const [creatingOrder, setCreatingOrder] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    setRefreshing(true)

    try {
      const today = getLocalDateISO()
      const now = new Date()
      const firstDayOfMonth = getLocalDateISO(new Date(now.getFullYear(), now.getMonth(), 1))

      // Fetch all required data in parallel
      const [
        ordersRes, 
        categoriesRes, 
        customersRes,
        itemsRes
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('*, customer:customers(*)')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('active', true),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase
          .from('order_items')
          .select('quantity, category_id, category:categories(name), order:orders!inner(status)')
          .in('order.status', ['pending', 'confirmed', 'preparing']),
      ])

      const allOrders = ordersRes.data || []
      setCategories(categoriesRes.data || [])
      setRecentOrders(allOrders.slice(0, 7))

      // Today orders
      const todayOrders = allOrders.filter(o => o.order_date === today || o.delivery_date === today)
      const todayDelivered = todayOrders.filter(o => o.status === 'delivered')
      const todayRevenue = todayOrders
        .filter(o => o.payment_status === 'paid' && o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total), 0)

      // Month revenue
      const monthOrders = allOrders.filter(
        o => o.order_date >= firstDayOfMonth && o.status !== 'cancelled'
      )
      const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total), 0)
      const avgTicket = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0

      // Active / in production count
      const inProduction = allOrders.filter(o => 
        ['pending', 'confirmed', 'preparing'].includes(o.status)
      )

      setStats({
        todayOrdersCount: todayOrders.length,
        todayDeliveredCount: todayDelivered.length,
        pendingOrdersCount: inProduction.length,
        todayRevenue,
        monthRevenue,
        activeCustomersCount: customersRes.count || 0,
        averageTicket: avgTicket,
      })

      // Production Breakdown by category
      let lowCarb = 0
      let arrozBranco = 0
      let arrozIntegral = 0

      itemsRes.data?.forEach((item: any) => {
        const catName = item.category?.name || ''
        const q = Number(item.quantity) || 0
        if (catName.includes('Low Carb')) lowCarb += q
        else if (catName.includes('Branco')) arrozBranco += q
        else if (catName.includes('Integral')) arrozIntegral += q
      })

      setProduction({
        lowCarb,
        arrozBranco,
        arrozIntegral,
        total: lowCarb + arrozBranco + arrozIntegral,
      })

      // Also set default category in order form if available
      if (categoriesRes.data && categoriesRes.data.length > 0 && !orderForm.category_id) {
        setOrderForm(prev => ({ ...prev, category_id: categoriesRes.data[0].id }))
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (!error) {
      setRecentOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      )
    }
  }

  const handleCreateFastOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderForm.customer_name) {
      alert('Informe o nome do cliente.')
      return
    }

    setCreatingOrder(true)
    const supabase = createClient()

    try {
      const selectedCategory = categories.find(c => c.id === orderForm.category_id) || categories[0]
      let unitPrice = selectedCategory?.price_unit || 24.9
      let total = unitPrice * orderForm.quantity

      if (orderForm.quantity === 10 && selectedCategory?.price_c10) {
        total = Number(selectedCategory.price_c10)
      } else if (orderForm.quantity === 20 && selectedCategory?.price_c20) {
        total = Number(selectedCategory.price_c20)
      }

      // 1. Create order
      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_name: orderForm.customer_name,
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
      await supabase.from('order_items').insert({
        order_id: newOrder.id,
        category_id: selectedCategory?.id,
        product_name: selectedCategory?.name || 'Marmita Fitness',
        quantity: orderForm.quantity,
        unit_price: unitPrice,
        subtotal: total,
      })

      setShowOrderModal(false)
      setOrderForm({
        customer_id: '',
        customer_name: '',
        customer_phone: '',
        delivery_date: getLocalDateISO(),
        category_id: categories[0]?.id || '',
        quantity: 10,
        payment_method: 'PIX',
        payment_status: 'paid',
        notes: '',
      })
      loadDashboardData()
    } catch (err: any) {
      console.error(err)
      alert('Erro ao registrar pedido: ' + err.message)
    } finally {
      setCreatingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-2 border-[#e60067] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Carregando visão operacional...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header com Data e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Visão Operacional
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Status dos pedidos, metas de produção e expedição em tempo real
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadDashboardData}
            title="Recarregar dados"
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <GlowButton
            variant="primary"
            size="sm"
            onClick={() => setShowOrderModal(true)}
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
          color="pink"
        />

        <StatWidget
          title="Entregas de Hoje"
          value={`${stats.todayDeliveredCount}/${stats.todayOrdersCount}`}
          subtitle={
            stats.todayOrdersCount === 0
              ? 'Nenhuma entrega agendada'
              : stats.todayDeliveredCount === stats.todayOrdersCount
              ? 'Todas as entregas concluídas'
              : `${stats.todayOrdersCount - stats.todayDeliveredCount} pendente(s)`
          }
          icon={Truck}
          color="green"
        />

        <StatWidget
          title="Pedidos a Produzir"
          value={stats.pendingOrdersCount}
          subtitle="Em preparo ou confirmados"
          icon={ChefHat}
          color="amber"
        />

        <StatWidget
          title="Ticket Médio"
          value={formatCurrency(stats.averageTicket)}
          subtitle={`${stats.activeCustomersCount} clientes cadastrados`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Low Carb */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Low Carb
              </span>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Sem arroz • Mais proteína
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                {production.lowCarb}
              </span>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                unidades
              </p>
            </div>
          </div>

          {/* Arroz Branco */}
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Arroz Branco
              </span>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                Tradicional com seleta
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-[#e60067] dark:text-rose-400">
                {production.arrozBranco}
              </span>
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                unidades
              </p>
            </div>
          </div>

          {/* Arroz Integral */}
          <div className="p-4 rounded-2xl bg-lime-50/60 dark:bg-lime-950/30 border border-lime-200/80 dark:border-lime-900/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-lime-900 dark:text-lime-300">
                Arroz Integral
              </span>
              <p className="text-xs text-lime-700 dark:text-lime-400 mt-0.5">
                Rico em fibras
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-lime-800 dark:text-lime-400">
                {production.arrozIntegral}
              </span>
              <p className="text-[10px] font-bold text-lime-700 dark:text-lime-400 uppercase">
                unidades
              </p>
            </div>
          </div>
        </div>
      </BentoCard>

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
            className="text-xs font-bold text-[#e60067] dark:text-rose-400 hover:underline flex items-center gap-1 self-start sm:self-center"
          >
            <span>Gerenciar todos os pedidos</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhum pedido registrado ainda
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Comece cadastrando o primeiro pedido pelo botão abaixo.
            </p>
            <GlowButton size="sm" onClick={() => setShowOrderModal(true)}>
              <Plus className="w-4 h-4" />
              <span>Registrar Primeiro Pedido</span>
            </GlowButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Entrega</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Status do Pedido</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
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

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {formatDate(order.delivery_date)}
                    </td>

                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {formatCurrency(Number(order.total))}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                          order.payment_status === 'paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                        {order.payment_method && ` • ${order.payment_method}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {/* Status Selector direto na tabela */}
                      <select
                        value={order.status}
                        onChange={e => handleUpdateStatus(order.id, e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#e60067]"
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="preparing">Preparando</option>
                        <option value="ready">Pronto</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/dashboard/orders"
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 inline-block"
                        title="Ver detalhes"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                value={orderForm.customer_name}
                onChange={e => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                placeholder="Ex: Amanda Carvalho"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                value={orderForm.customer_phone}
                onChange={e => setOrderForm({ ...orderForm, customer_phone: e.target.value })}
                placeholder="(35) 98888-0000"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Linha da Marmita
              </label>
              <select
                value={orderForm.category_id}
                onChange={e => setOrderForm({ ...orderForm, category_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067]"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (R$ {Number(c.price_unit).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantidade (Combo)
              </label>
              <select
                value={orderForm.quantity}
                onChange={e => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067]"
              >
                <option value={1}>1 unidade (Avulso)</option>
                <option value={5}>5 unidades</option>
                <option value={10}>10 unidades (Preço Especial Combo 10)</option>
                <option value={20}>20 unidades (Preço Especial Combo 20)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data de Entrega
              </label>
              <input
                type="date"
                value={orderForm.delivery_date}
                onChange={e => setOrderForm({ ...orderForm, delivery_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={orderForm.payment_method}
                  onChange={e => setOrderForm({ ...orderForm, payment_method: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="PIX">PIX</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>

                <select
                  value={orderForm.payment_status}
                  onChange={e => setOrderForm({ ...orderForm, payment_status: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações (sabores específicos, sem cebola, etc.)
            </label>
            <textarea
              rows={2}
              value={orderForm.notes}
              onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
              placeholder="Ex: 5 de frango cremoso, 5 de patinho de panela"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#e60067]/20 focus:border-[#e60067]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <GlowButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowOrderModal(false)}
            >
              Cancelar
            </GlowButton>
            <GlowButton type="submit" size="sm" disabled={creatingOrder}>
              {creatingOrder ? 'Salvando...' : 'Confirmar Pedido'}
            </GlowButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
