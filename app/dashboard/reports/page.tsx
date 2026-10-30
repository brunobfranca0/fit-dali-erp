'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, getLocalDateISO } from '@/lib/utils'
import { TrendingUp, DollarSign, Package, Download, BarChart3 } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import StatWidget from '@/components/kokonutui/stat-widget'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setDateRange({
      start: getLocalDateISO(thirtyDaysAgo),
      end: getLocalDateISO(today),
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
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*, category:categories(*))')
        .gte('order_date', dateRange.start)
        .lte('order_date', dateRange.end)
        .neq('status', 'cancelled')

      if (!orders) return

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
          date: formatDate(date).slice(0, 5),
          revenue: Number(revenue),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Top products
      const productStats: any = {}
      orders.forEach(order => {
        order.order_items?.forEach((item: any) => {
          if (!productStats[item.product_name]) {
            productStats[item.product_name] = {
              name: item.product_name,
              quantity: 0,
              revenue: 0,
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

  const COLORS = ['#e60067', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']

  const handleExportCSV = () => {
    if (!stats || stats.revenueData.length === 0) return
    const csvContent = 'data:text/csv;charset=utf-8,Data,Receita\n' + stats.revenueData.map((d: any) => `${d.date},${d.revenue}`).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `relatorio-receita-${dateRange.start}-a-${dateRange.end}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-2 border-[#e60067] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Processando relatórios...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Relatórios de Desempenho
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Análise consolidada de vendas, ticket médio e linhas mais pedidas
          </p>
        </div>

        <GlowButton variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4" />
          <span>Exportar Dados</span>
        </GlowButton>
      </div>

      {/* Date Range Filter */}
      <BentoCard className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </BentoCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatWidget
          title="Faturamento no Período"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          color="green"
        />

        <StatWidget
          title="Total de Pedidos"
          value={stats?.totalOrders || 0}
          icon={Package}
          color="pink"
        />

        <StatWidget
          title="Ticket Médio"
          value={formatCurrency(stats?.averageTicket || 0)}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Receita por Dia */}
        <BentoCard className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Curva de Receita
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#e60067" strokeWidth={2.5} dot={{ r: 3 }} name="Receita" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Status dos Pedidos */}
        <BentoCard className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Distribuição de Status
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.statusData || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {(stats?.statusData || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>
      </div>
    </div>
  )
}
