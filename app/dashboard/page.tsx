'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Clock,
  Package, 
  Sparkles,
  Heart,
  ArrowRight,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Order } from '@/lib/types'
import Logo from '@/components/brand/Logo'
import Link from 'next/link'

interface Stats {
  todayOrders: number
  pendingOrders: number
  totalRevenue: number
  weekRevenue: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    weekRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Get today's orders
      const { data: todayData } = await supabase
        .from('orders')
        .select('*')
        .eq('order_date', today)

      // Get pending orders
      const { data: pendingData } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'confirmed', 'preparing'])

      // Get all orders for revenue
      const { data: allOrders } = await supabase
        .from('orders')
        .select('total, order_date, status')
        .neq('status', 'cancelled')

      // Get recent orders
      const { data: recentData } = await supabase
        .from('orders')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false })
        .limit(6)

      const totalRevenue = allOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0
      const weekRevenue = allOrders
        ?.filter(order => order.order_date >= weekAgo)
        .reduce((sum, order) => sum + Number(order.total), 0) || 0

      setStats({
        todayOrders: todayData?.length || 0,
        pendingOrders: pendingData?.length || 0,
        totalRevenue,
        weekRevenue,
      })

      setRecentOrders(recentData || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Pedidos de Hoje',
      value: stats.todayOrders,
      icon: ShoppingBag,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      badge: 'Entregas do dia'
    },
    {
      title: 'Em Preparo / Pendentes',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      badge: 'Fila de cozinha'
    },
    {
      title: 'Faturamento Semanal',
      value: formatCurrency(stats.weekRevenue),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      badge: 'Últimos 7 dias'
    },
    {
      title: 'Receita Total',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-[#e60067]',
      bgColor: 'bg-pink-50',
      badge: 'Acumulado'
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-pink-600 border-t-transparent"></div>
        <p className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Carregando painel...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Painel Geral
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Gestão operacional, métricas de vendas e cardápio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#e60067]" />
            Identidade da Marca
          </Link>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#e60067] to-[#ec4899] text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-md shadow-pink-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Pedido
          </Link>
        </div>
      </div>

      {/* Brand Hero Banner */}
      <div className="bg-gradient-to-r from-rose-50/80 via-white to-emerald-50/70 rounded-3xl p-6 sm:p-7 border border-pink-100/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-pink-100 flex-shrink-0">
              <Logo variant="full" size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-extrabold text-lg text-gray-900 tracking-tight">Fit DaLi</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                  Marmitas Fitness
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-pink-100 text-[#e60067] font-bold uppercase tracking-wider">
                  Gestão Integrada
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                <span>Comida de verdade para uma vida mais leve!</span>
                <Heart className="w-3.5 h-3.5 text-[#e60067] fill-[#e60067]" />
              </p>
              <p className="text-xs text-emerald-800/90 font-semibold italic mt-0.5">
                Equilíbrio, sabor e praticidade em cada refeição.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-emerald-200 text-xs text-emerald-900 font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Low Carb (Proteica)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-pink-200 text-xs text-pink-900 font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#e60067]" />
              Arroz Branco
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-lime-200 text-xs text-lime-900 font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#689f38]" />
              Arroz Integral
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`p-2.5 rounded-xl ${stat.bgColor} ${stat.color} transition-transform group-hover:scale-105`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {stat.value}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-1">
                <span>{stat.badge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Pedidos Recentes
            </h2>
            <p className="text-xs text-gray-500">Acompanhamento dos últimos pedidos realizados</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#e60067] hover:text-[#c2185b] transition-colors"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-rose-50 text-[#e60067] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Nenhum pedido cadastrado</h3>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                Crie o primeiro pedido para movimentar o fluxo da cozinha e faturamento.
              </p>
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e60067] to-[#ec4899] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Pedido
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Cliente</th>
                  <th className="px-6 py-3.5">Entrega</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Pagamento</th>
                  <th className="px-6 py-3.5 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-pink-100 text-[#e60067] font-bold text-xs flex items-center justify-center">
                          {order.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <span>{order.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(order.delivery_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        order.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-gray-900 text-sm">
                      {formatCurrency(Number(order.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Link
          href="/dashboard/orders"
          className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md hover:border-pink-200 transition-all group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#e60067] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Módulo de Pedidos</h3>
            <p className="text-xs text-gray-500">Cadastre e acompanhe entregas de marmitas</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#e60067] transition-colors" />
        </Link>

        <Link
          href="/dashboard/products"
          className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Cardápio & Combos</h3>
            <p className="text-xs text-gray-500">Preços progressivos de 10 e 20 unidades</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
        </Link>

        <Link
          href="/dashboard/reports"
          className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Relatórios Visuais</h3>
            <p className="text-xs text-gray-500">Faturamento e desempenho de vendas</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
        </Link>
      </div>
    </div>
  )
}
