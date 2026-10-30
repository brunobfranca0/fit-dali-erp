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
      iconBg: 'bg-rose-50 text-[#e60067] border-rose-100',
      glow: 'group-hover:border-pink-300 group-hover:shadow-[0_8px_30px_rgba(230,0,103,0.12)]',
      dot: 'bg-[#e60067]',
    },
    green: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      glow: 'group-hover:border-emerald-300 group-hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)]',
      dot: 'bg-emerald-500',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      glow: 'group-hover:border-amber-300 group-hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]',
      dot: 'bg-amber-500',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      glow: 'group-hover:border-blue-300 group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]',
      dot: 'bg-blue-500',
    },
  }[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl border border-gray-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between',
        colorMap.glow,
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <div className={cn('p-2.5 rounded-2xl border transition-transform duration-200 group-hover:scale-110', colorMap.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-mono">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
                trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}
            >
              {trend}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', colorMap.dot)} />
            <span>{subtitle}</span>
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default StatWidget
