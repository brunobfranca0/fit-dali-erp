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
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  }[size]

  const variantStyles = {
    primary: cn(
      'bg-gradient-to-r from-[#e60067] via-[#f02279] to-[#ff2a85] text-white shadow-[0_4px_16px_rgba(230,0,103,0.3)]',
      glow && 'hover:shadow-[0_8px_24px_rgba(230,0,103,0.45)]'
    ),
    secondary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)]',
    outline: 'bg-white/80 hover:bg-white text-gray-700 border border-gray-200/90 hover:border-pink-300 shadow-xs',
    ghost: 'bg-transparent hover:bg-gray-100/70 text-gray-600 hover:text-gray-900',
  }[variant]

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className={cn(baseStyles, sizeStyles, variantStyles, className)}
      disabled={disabled}
      {...props}
    >
      {/* Shimmer sweep effect on primary */}
      {variant === 'primary' && !disabled && (
        <span className="pointer-events-none absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  )
}

export default GlowButton
