'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlowButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  glow?: boolean
}

export function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  glow = true,
  disabled,
  ...props
}: GlowButtonProps) {
  const baseStyles = 'relative inline-flex items-center justify-center font-bold tracking-tight rounded-2xl transition-all overflow-hidden select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  }[size]

  const variantStyles = {
    primary: cn(
      'bg-gradient-to-r from-[#e60067] via-[#ec1a75] to-[#f43f5e] text-white shadow-xs',
      glow && 'hover:shadow-md hover:shadow-rose-500/20'
    ),
    secondary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
    outline: 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-xs',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
  }[variant]

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.015 } : undefined}
      whileTap={!disabled ? { scale: 0.985 } : undefined}
      className={cn(baseStyles, sizeStyles, variantStyles, className)}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  )
}

export default GlowButton
