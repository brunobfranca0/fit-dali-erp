// TypeScript / components/kokonutui/bento-card.tsx / React / Fit Dali ERP browser UI
'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BentoCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  glow?: boolean
  glowColor?: 'pink' | 'green' | 'default'
  hoverEffect?: boolean
}

export function BentoCard({
  children,
  className = '',
  glow = false,
  glowColor = 'green',
  hoverEffect = true,
  ...props
}: BentoCardProps) {
  const glowStyles = {
    default: 'from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/5 dark:via-emerald-500/5',
    pink: 'from-emerald-500/15 via-green-500/5 to-transparent dark:from-emerald-500/10 dark:via-green-500/5',
    green: 'from-emerald-500/15 via-green-500/5 to-transparent dark:from-emerald-500/10 dark:via-green-500/5',
  }[glowColor]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.15 } } : undefined}
      className={cn(
        'relative overflow-hidden rounded-[1.4rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-[0_10px_34px_-26px_rgba(15,23,42,0.45)] dark:shadow-none text-slate-900 dark:text-slate-100 transition-all duration-200',
        hoverEffect && 'hover:shadow-[0_16px_42px_-26px_rgba(15,23,42,0.5)] hover:border-slate-300 dark:hover:border-slate-700',
        className
      )}
      {...props}
    >
      {glow && (
        <div
          className={cn(
            'pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br blur-3xl opacity-50 dark:opacity-20',
            glowStyles
          )}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

export default BentoCard
