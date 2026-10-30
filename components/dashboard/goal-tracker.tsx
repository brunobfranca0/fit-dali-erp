'use client'

import { useEffect, useState } from 'react'
import { CircleDollarSign, ClipboardList, Pencil, Save, Target, UtensilsCrossed } from 'lucide-react'
import BentoCard from '@/components/kokonutui/bento-card'
import GlowButton from '@/components/kokonutui/glow-button'
import Modal from '@/components/ui/modal'
import { formatCurrency } from '@/lib/utils'

type Period = 'daily' | 'monthly'
type Metric = 'sales' | 'orders' | 'meals'
type Goals = Record<Period, Record<Metric, number>>
type GoalForm = Record<Period, Record<Metric, string>>

interface GoalTrackerProps {
  dailyValues: Record<Metric, number>
  monthlyValues: Record<Metric, number>
}

const STORAGE_KEY = 'fitdali-operational-goals-v1'

const DEFAULT_GOALS: Goals = {
  daily: { sales: 0, orders: 0, meals: 0 },
  monthly: { sales: 0, orders: 0, meals: 0 },
}

const METRICS: Array<{ key: Metric; label: string; icon: typeof CircleDollarSign; format: (value: number) => string }> = [
  { key: 'sales', label: 'Vendas', icon: CircleDollarSign, format: formatCurrency },
  { key: 'orders', label: 'Pedidos', icon: ClipboardList, format: value => `${Math.round(value)} pedidos` },
  { key: 'meals', label: 'Marmitas para entrega', icon: UtensilsCrossed, format: value => `${Math.round(value)} un.` },
]

function toForm(goals: Goals): GoalForm {
  return {
    daily: {
      sales: goals.daily.sales ? String(goals.daily.sales) : '',
      orders: goals.daily.orders ? String(goals.daily.orders) : '',
      meals: goals.daily.meals ? String(goals.daily.meals) : '',
    },
    monthly: {
      sales: goals.monthly.sales ? String(goals.monthly.sales) : '',
      orders: goals.monthly.orders ? String(goals.monthly.orders) : '',
      meals: goals.monthly.meals ? String(goals.monthly.meals) : '',
    },
  }
}

function readGoals(): Goals {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_GOALS

  const parsed = JSON.parse(raw) as Partial<Goals>
  const readValue = (period: Period, metric: Metric) => {
    const value = Number(parsed[period]?.[metric])
    return Number.isFinite(value) && value > 0 ? value : 0
  }

  return {
    daily: { sales: readValue('daily', 'sales'), orders: readValue('daily', 'orders'), meals: readValue('daily', 'meals') },
    monthly: { sales: readValue('monthly', 'sales'), orders: readValue('monthly', 'orders'), meals: readValue('monthly', 'meals') },
  }
}

function GoalProgressRow({ metric, value, target }: { metric: (typeof METRICS)[number]; value: number; target: number }) {
  const Icon = metric.icon
  const hasTarget = target > 0
  const progress = hasTarget ? (value / target) * 100 : 0
  const progressWidth = Math.min(progress, 100)
  const complete = hasTarget && progress >= 100

  return (
    <div className="space-y-2 py-3.5 first:pt-1 last:pb-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{metric.label}</span>
        </div>
        <div className="shrink-0 text-right tabular-nums">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{metric.format(value)}</span>
          {hasTarget && <span className="text-xs text-slate-400"> / {metric.format(target)}</span>}
        </div>
      </div>

      {hasTarget ? (
        <div
          role="progressbar"
          aria-label={`Progresso da meta de ${metric.label.toLowerCase()}`}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={Math.min(value, target)}
          className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${complete ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#2e7d32] to-emerald-400'}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      ) : (
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800" />
      )}

      <p className={`text-[11px] font-medium ${complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
        {hasTarget ? (complete ? `Meta atingida · ${Math.round(progress)}%` : `${Math.floor(progress)}% da meta`) : 'Defina um valor para acompanhar esta meta'}
      </p>
    </div>
  )
}

export default function GoalTracker({ dailyValues, monthlyValues }: GoalTrackerProps) {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS)
  const [form, setForm] = useState<GoalForm>(toForm(DEFAULT_GOALS))
  const [isEditing, setIsEditing] = useState(false)
  const [storageError, setStorageError] = useState('')

  useEffect(() => {
    try {
      const saved = readGoals()
      setGoals(saved)
      setForm(toForm(saved))
    } catch {
      setStorageError('Não foi possível ler as metas salvas neste navegador.')
    }
  }, [])

  const configuredCount = (Object.values(goals.daily) as number[]).filter(value => value > 0).length
    + (Object.values(goals.monthly) as number[]).filter(value => value > 0).length

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextGoals = {} as Goals

    for (const period of ['daily', 'monthly'] as const) {
      nextGoals[period] = {} as Record<Metric, number>
      for (const metric of ['sales', 'orders', 'meals'] as const) {
        const value = Number(form[period][metric])
        nextGoals[period][metric] = Number.isFinite(value) && value > 0 ? value : 0
      }
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextGoals))
      setGoals(nextGoals)
      setStorageError('')
      setIsEditing(false)
    } catch {
      setStorageError('Não foi possível salvar as metas. Verifique o armazenamento do navegador.')
    }
  }

  return (
    <>
      <BentoCard className="overflow-hidden p-0" glow glowColor="green" hoverEffect={false}>
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Target aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Metas da operação</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {configuredCount ? `${configuredCount} metas configuradas` : 'Defina objetivos e acompanhe o ritmo da operação'}
              </p>
            </div>
          </div>
          <GlowButton type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{configuredCount ? 'Editar metas' : 'Definir metas'}</span>
          </GlowButton>
        </div>

        <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-slate-100 dark:md:divide-slate-800">
          {([
            { period: 'daily', title: 'Hoje', subtitle: 'Vendas e entregas do dia', values: dailyValues },
            { period: 'monthly', title: 'Este mês', subtitle: 'Acumulado do mês', values: monthlyValues },
          ] as const).map(({ period, title, subtitle, values }) => (
            <section key={period} aria-labelledby={`goals-${period}`} className="px-5 py-5 sm:px-6">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h3 id={`goals-${period}`} className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <span className="text-[11px] font-medium text-slate-400">{subtitle}</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {METRICS.map(metric => (
                  <GoalProgressRow key={metric.key} metric={metric} value={values[metric.key]} target={goals[period][metric.key]} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-slate-800 sm:px-6">
          Vendas e pedidos contam pela data do pedido; marmitas contam pela data de entrega.
        </p>
      </BentoCard>

      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Metas da operação"
        description="Preencha os objetivos para acompanhar vendas, pedidos e marmitas no painel. Deixe em branco para não definir uma meta."
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            {([
              { period: 'daily', title: 'Metas do dia' },
              { period: 'monthly', title: 'Metas do mês' },
            ] as const).map(({ period, title }) => (
              <fieldset key={period} className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <legend className="px-1 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</legend>
                {METRICS.map(metric => (
                  <label key={metric.key} htmlFor={`goal-${period}-${metric.key}`} className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{metric.label}{metric.key === 'sales' ? ' (R$)' : ''}</span>
                    <input
                      id={`goal-${period}-${metric.key}`}
                      type="number"
                      min="0"
                      step={metric.key === 'sales' ? '0.01' : '1'}
                      inputMode="decimal"
                      value={form[period][metric.key]}
                      onChange={event => {
                        const value = event.target.value
                        setForm(current => ({ ...current, [period]: { ...current[period], [metric.key]: value } }))
                      }}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2e7d32] focus:ring-2 focus:ring-[#2e7d32]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </label>
                ))}
              </fieldset>
            ))}
          </div>

          {storageError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{storageError}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="max-w-xs text-[11px] text-slate-400">As metas ficam salvas neste navegador.</p>
            <div className="flex gap-2">
              <GlowButton type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancelar</GlowButton>
              <GlowButton type="submit" size="sm">
                <Save aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Salvar metas</span>
              </GlowButton>
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
