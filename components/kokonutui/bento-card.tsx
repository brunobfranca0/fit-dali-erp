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
  glowColor = 'default',
  hoverEffect = true,
  ...props
}: BentoCardProps) {
  const glowStyles = {
    default: 'from-pink-500/10 via-emerald-500/5 to-transparent',
    pink: 'from-pink-500/15 via-rose-500/5 to-transparent',
    green: 'from-emerald-500/15 via-green-500/5 to-transparent',
  }[glowColor]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hoverEffect ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-xl border border-gray-200/70 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all',
        hoverEffect && 'hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.08)] hover:border-pink-200/70',
        className
      )}
      {...props}
    >
      {/* Ambient background glow if enabled */}
      {glow && (
        <div
          className={cn(
            'pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br blur-3xl opacity-60',
            glowStyles
          )}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

export default BentoCard
