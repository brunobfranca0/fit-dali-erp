'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatWidgetProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'pink' | 'green' | 'amber' | 'blue'
  trend?: string
  trendPositive?: boolean
  className?: string
  delay?: number
}

export function StatWidget({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'pink',
  trend,
  trendPositive = true,
  className = '',
  delay = 0,
}: StatWidgetProps) {
  const colorMap = {
    pink: {
      iconBg: 'bg-rose-50 text-[#e60067] border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50',
      glow: 'hover:border-rose-300 dark:hover:border-rose-700/60',
      dot: 'bg-[#e60067] dark:bg-rose-400',
    },
    green: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
      glow: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
      dot: 'bg-emerald-500 dark:bg-emerald-400',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
      glow: 'hover:border-amber-300 dark:hover:border-amber-700/60',
      dot: 'bg-amber-500 dark:bg-amber-400',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50',
      glow: 'hover:border-blue-300 dark:hover:border-blue-700/60',
      dot: 'bg-blue-500 dark:bg-blue-400',
    },
  }[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        'group relative overflow-hidden rounded-[1.4rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-[0_10px_34px_-26px_rgba(15,23,42,0.45)] dark:shadow-none transition-all duration-200 flex flex-col justify-between',
        colorMap.glow,
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={cn('p-2.5 rounded-2xl border transition-transform duration-200 group-hover:scale-105', colorMap.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight tabular-nums">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
                trendPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              )}
            >
              {trend}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colorMap.dot)} />
            <span className="truncate">{subtitle}</span>
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default StatWidget
