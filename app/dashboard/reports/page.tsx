'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, Calendar, DollarSign, Package, Download } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize dates on client side
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setDateRange({
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    })
  }, [])

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadReports()
    }
  }, [dateRange])

  const loadReports = async () => {
    const supabase = createClient()
    
    try {
      // Get orders in date range
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*, category:categories(*))')
        .gte('order_date', dateRange.start)
        .lte('order_date', dateRange.end)
        .neq('status', 'cancelled')

      if (!orders) return

      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0)
      const totalOrders = orders.length
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Revenue by day
      const revenueByDay = orders.reduce((acc: any, order) => {
        const date = order.order_date
        if (!acc[date]) acc[date] = 0
        acc[date] += Number(order.total)
        return acc
      }, {})

      const revenueData = Object.entries(revenueByDay)
        .map(([date, revenue]) => ({
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          revenue: Number(revenue),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Top products
      const productStats: any = {}
      orders.forEach(order => {
        order.order_items?.forEach((item: any) => {
          if (!productStats[item.product_name]) {
            productStats[item.product_name] = {
              name: item.product_name,
              quantity: 0,
              revenue: 0,
              color: item.category?.color || '#d42a6f',
            }
          }
          productStats[item.product_name].quantity += item.quantity
          productStats[item.product_name].revenue += Number(item.subtotal)
        })
      })

      const topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5)

      // Orders by status
      const statusCounts = orders.reduce((acc: any, order) => {
        if (!acc[order.status]) acc[order.status] = 0
        acc[order.status]++
        return acc
      }, {})

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        status: status === 'pending' ? 'Pendente' : 
                status === 'confirmed' ? 'Confirmado' :
                status === 'preparing' ? 'Preparando' :
                status === 'ready' ? 'Pronto' :
                status === 'delivered' ? 'Entregue' : status,
        count: Number(count),
      }))

      setStats({
        totalRevenue,
        totalOrders,
        averageTicket,
        revenueData,
        topProducts,
        statusData,
      })
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#d42a6f', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise de vendas e desempenho</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-5 h-5" />
          Exportar PDF
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Receita Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total de Pedidos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-pink-50">
              <TrendingUp className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageTicket)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Receita por Dia</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" style={{ fontSize: '12px' }} />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#d42a6f" strokeWidth={2} name="Receita" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pedidos por Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.statusData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {stats.statusData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Top 5 Produtos</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.topProducts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="quantity" fill="#3b82f6" name="Quantidade" />
            <Bar dataKey="revenue" fill="#d42a6f" name="Receita" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
