'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'pink' | 'green' | 'amber' | 'blue' | 'gray' | 'purple'
  dot?: boolean
  className?: string
}

export function KokonutBadge({
  children,
  variant = 'green',
  dot = false,
  className = '',
}: BadgeProps) {
  const variantStyles = {
    pink: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/50',
    green: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/50',
    amber: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/50',
    blue: 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/50',
    purple: 'bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200/80 dark:border-purple-900/50',
    gray: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  }[variant]

  const dotStyles = {
    pink: 'bg-[#2e7d32]',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    gray: 'bg-slate-400',
  }[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors',
        variantStyles,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotStyles)} />}
      <span>{children}</span>
    </span>
  )
}

export default KokonutBadge
