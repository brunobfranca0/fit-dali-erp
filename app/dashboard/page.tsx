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
  Calendar, 
  ChefHat,
  ArrowUpRight,
  UtensilsCrossed,
  CheckCircle2
} from 'lucide-react'
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Order } from '@/lib/types'
import Logo from '@/components/brand/Logo'
import BentoCard from '@/components/kokonutui/bento-card'
import StatWidget from '@/components/kokonutui/stat-widget'
import GlowButton from '@/components/kokonutui/glow-button'
import KokonutBadge from '@/components/kokonutui/badge'
import Link from 'next/link'
import { motion } from 'framer-motion'

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

      // Orders for today
      const { data: todayData } = await supabase
        .from('orders')
        .select('*')
        .eq('order_date', today)

      // Pending / in-production orders
      const { data: pendingData } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'confirmed', 'preparing'])

      // Revenue queries
      const { data: allOrders } = await supabase
        .from('orders')
        .select('total, order_date, status')
        .neq('status', 'cancelled')

      // Recent orders list
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-10 h-10 border-2 border-[#e60067] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Carregando indicadores...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Painel Geral
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Métricas de faturamento, pedidos e operação da marmitaria
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/settings">
            <GlowButton variant="outline" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-[#e60067]" />
              <span>Identidade Visual</span>
            </GlowButton>
          </Link>
          <Link href="/dashboard/orders">
            <GlowButton variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              <span>Novo Pedido</span>
            </GlowButton>
          </Link>
        </div>
      </div>

      {/* Bento Hero Card - Kokonut UI inspired */}
      <BentoCard glow glowColor="pink" className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-pink-100 flex-shrink-0 transition-transform hover:scale-105">
              <Logo variant="full" size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-extrabold text-xl text-gray-900 tracking-tight">Fit DaLi</span>
                <KokonutBadge variant="green" dot>
                  Marmitas Fitness
                </KokonutBadge>
                <KokonutBadge variant="pink">
                  Gestão Integrada
                </KokonutBadge>
              </div>
              <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
                <span>Comida de verdade para uma vida mais leve!</span>
                <Heart className="w-3.5 h-3.5 text-[#e60067] fill-[#e60067]" />
              </p>
              <p className="text-xs text-emerald-800 font-bold italic mt-0.5">
                &ldquo;saudável com sabor!&rdquo;
              </p>
            </div>
          </div>

          {/* Category badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-2 rounded-2xl bg-white/90 border border-emerald-200/80 text-xs font-bold text-emerald-900 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Low Carb</span>
              <span className="text-[10px] text-emerald-600 font-medium">(Mais Proteína)</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/90 border border-pink-200/80 text-xs font-bold text-pink-900 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e60067]" />
              <span>Arroz Branco</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/90 border border-lime-200/80 text-xs font-bold text-lime-900 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#689f38]" />
              <span>Arroz Integral</span>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Bento Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatWidget
          title="Pedidos Hoje"
          value={stats.todayOrders}
          subtitle="Entregas programadas"
          icon={ShoppingBag}
          color="pink"
          delay={0.05}
        />
        <StatWidget
          title="Em Produção"
          value={stats.pendingOrders}
          subtitle="Fila da cozinha"
          icon={Clock}
          color="amber"
          delay={0.1}
        />
        <StatWidget
          title="Receita Semanal"
          value={formatCurrency(stats.weekRevenue)}
          subtitle="Últimos 7 dias"
          icon={TrendingUp}
          color="green"
          trend="+12%"
          trendPositive
          delay={0.15}
        />
        <StatWidget
          title="Faturamento Total"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Histórico geral"
          icon={DollarSign}
          color="blue"
          delay={0.2}
        />
      </div>

      {/* Bento Section: Recent Orders Table */}
      <BentoCard className="p-0 overflow-hidden" hoverEffect={false}>
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              Pedidos Recentes
            </h2>
            <p className="text-xs text-gray-500 font-medium">Acompanhe o fluxo e status das marmitas</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e60067] hover:text-[#c2185b] transition-colors group"
          >
            <span>Ver todos os pedidos</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-rose-50 text-[#e60067] rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Nenhum pedido registrado</h3>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                Cadastre o primeiro pedido para iniciar a gestão de produção e entrega.
              </p>
              <Link href="/dashboard/orders">
                <GlowButton size="sm">
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Pedido</span>
                </GlowButton>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Data de Entrega</th>
                  <th className="px-6 py-4">Status do Pedido</th>
                  <th className="px-6 py-4">Pagamento</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#e60067] font-black text-xs flex items-center justify-center shadow-2xs">
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
                      <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold capitalize border shadow-2xs ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        order.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-gray-900 text-sm font-mono">
                      {formatCurrency(Number(order.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </BentoCard>

      {/* Bento Grid: Quick Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Link href="/dashboard/orders">
          <BentoCard className="p-6 group cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#e60067] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Módulo de Pedidos</h3>
                <p className="text-xs text-gray-500 font-medium">Fluxo de pedidos, status e entregas</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#e60067] transition-colors" />
            </div>
          </BentoCard>
        </Link>

        <Link href="/dashboard/products">
          <BentoCard className="p-6 group cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Cardápio & Combos</h3>
                <p className="text-xs text-gray-500 font-medium">Combos 10 e 20 com preços progressivos</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
            </div>
          </BentoCard>
        </Link>

        <Link href="/dashboard/reports">
          <BentoCard className="p-6 group cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Relatórios Visuais</h3>
                <p className="text-xs text-gray-500 font-medium">Gráficos de vendas e receitas</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
            </div>
          </BentoCard>
        </Link>
      </div>
    </div>
  )
}
