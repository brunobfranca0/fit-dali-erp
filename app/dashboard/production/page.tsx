'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChefHat, Calendar, CheckCircle2, Clock, Printer, Filter, Check } from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import { getLocalDateISO } from '@/lib/utils'

interface ProductionItem {
  product_name: string
  category_name: string
  category_color: string
  total_quantity: number
  orders_count: number
}

export default function ProductionPage() {
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([])
  const [totalMeals, setTotalMeals] = useState(0)
  const [loading, setLoading] = useState(true)
  const [targetDate, setTargetDate] = useState(getLocalDateISO())
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadProduction()
  }, [targetDate])

  const loadProduction = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Find order items in orders for targetDate or in status confirmed/preparing
      const { data: items } = await supabase
        .from('order_items')
        .select(`
          product_name,
          quantity,
          category:categories(name, color),
          order:orders!inner(id, delivery_date, status)
        `)
        .in('order.status', ['confirmed', 'preparing', 'pending'])
        .eq('order.delivery_date', targetDate)

      const grouped: Record<string, ProductionItem> = {}
      let total = 0

      items?.forEach((item: any) => {
        const key = item.product_name
        const q = Number(item.quantity) || 0
        total += q

        if (!grouped[key]) {
          grouped[key] = {
            product_name: item.product_name,
            category_name: item.category?.name || 'Geral',
            category_color: item.category?.color || '#e60067',
            total_quantity: 0,
            orders_count: 0,
          }
        }
        grouped[key].total_quantity += q
        grouped[key].orders_count += 1
      })

      setProductionItems(Object.values(grouped).sort((a, b) => b.total_quantity - a.total_quantity))
      setTotalMeals(total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleComplete = (name: string) => {
    setCompletedItems(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Produção da Cozinha
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Planejamento de lotes e contagem de marmitas por sabor para os pedidos ativos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Entrega</span>
            <input
              type="date"
              value={targetDate}
              onChange={event => {
                setCompletedItems({})
                setTargetDate(event.target.value)
              }}
              aria-label="Filtrar produção pela data de entrega"
              className="min-w-0 bg-transparent text-xs font-semibold text-slate-900 outline-none dark:text-slate-100"
            />
          </label>
          <GlowButton
            variant="outline"
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </GlowButton>
        </div>
      </div>

      {/* Summary Card */}
      <BentoCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Meta do Turno
              </p>
              <h2 className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {totalMeals} Marmitas Solicitadas
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pratos Distintos:
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
              {productionItems.length} receitas
            </span>
          </div>
        </div>
      </BentoCard>

      {/* Tabela / Checklist de Produção */}
      <BentoCard className="p-0 overflow-hidden" hoverEffect={false}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ficha Técnica por Prato
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Clique no prato para marcar lote preparado
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Calculando lotes de produção...
          </div>
        ) : productionItems.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tudo em dia!
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Não há marmitas pendentes de produção no momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {productionItems.map((item) => {
              const isDone = !!completedItems[item.product_name]
              return (
                <button
                  type="button"
                  key={item.product_name}
                  onClick={() => toggleComplete(item.product_name)}
                  aria-pressed={isDone}
                  className={`w-full p-4 flex items-center justify-between text-left cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e60067] ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 opacity-70'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {item.product_name}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: `${item.category_color}18`,
                            color: item.category_color,
                          }}
                        >
                          {item.category_name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Presente em {item.orders_count} pedido(s)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                      {item.total_quantity}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold ml-1">un</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </BentoCard>
    </div>
  )
}
