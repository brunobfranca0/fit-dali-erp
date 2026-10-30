'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Clock,
  Package,
  AlertCircle,
  Sparkles,
  Heart,
  ArrowRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Order } from '@/lib/types'
import Logo from '@/components/brand/Logo'

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
        .limit(5)

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
      title: 'Pedidos Hoje',
      value: stats.todayOrders,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pedidos Pendentes',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Receita Semana',
      value: formatCurrency(stats.weekRevenue),
      icon: TrendingUp,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Receita Total',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu negócio e produção</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-200 text-[#e60067] rounded-xl text-sm font-semibold hover:bg-pink-100 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Identidade & Cardápio Oficial
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Brand Highlight Banner */}
      <div className="bg-gradient-to-r from-pink-50/90 via-white to-emerald-50/80 rounded-2xl p-6 border border-pink-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-pink-100 flex-shrink-0">
            <Logo variant="full" size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-lg text-gray-900">Fit DaLi</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Marmitas Fitness
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
              <span>Comida de verdade para uma vida mais leve!</span>
              <Heart className="w-3 h-3 text-[#e60067] fill-[#e60067]" />
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Pedidos WhatsApp: <span className="font-semibold text-emerald-700">(35) 98832-3788</span> | <span className="font-semibold text-emerald-700">(35) 98851-1608</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium">
            🥗 <strong>Low Carb</strong> (a partir de R$ 24,90)
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium">
            🍚 <strong>Arroz Branco</strong> (a partir de R$ 21,90)
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium">
            🌾 <strong>Arroz Integral</strong> (a partir de R$ 22,90)
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Pedidos Recentes</h2>
            <a
              href="/dashboard/orders"
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              Ver todos
            </a>
          </div>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhum pedido encontrado</p>
              <a
                href="/dashboard/orders"
                className="inline-block mt-4 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Criar Primeiro Pedido
              </a>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Entrega
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </div>
                      {order.customer_phone && (
                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.delivery_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/dashboard/orders"
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all group"
        >
          <ShoppingBag className="w-8 h-8 text-pink-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900 mb-1">Novo Pedido</h3>
          <p className="text-sm text-gray-600">Criar um novo pedido</p>
        </a>
        
        <a
          href="/dashboard/production"
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all group"
        >
          <Package className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900 mb-1">Produção</h3>
          <p className="text-sm text-gray-600">Gerenciar produção diária</p>
        </a>
        
        <a
          href="/dashboard/reports"
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all group"
        >
          <TrendingUp className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900 mb-1">Relatórios</h3>
          <p className="text-sm text-gray-600">Visualizar relatórios</p>
        </a>
      </div>
    </div>
  )
}
