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
  variant = 'pink',
  dot = false,
  className = '',
}: BadgeProps) {
  const variantStyles = {
    pink: 'bg-rose-50 text-[#e60067] border-rose-200/80',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    blue: 'bg-blue-50 text-blue-800 border-blue-200/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }[variant]

  const dotStyles = {
    pink: 'bg-[#e60067]',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-400',
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

