// TypeScript / components/ui/page.tsx / React / Fit Dali ERP browser UI
import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/70', className)} />
}

/** Placeholder layout shown while a list page loads its first batch of data. */
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-[1.4rem]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-48 rounded-[1.4rem]" />
        ))}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
