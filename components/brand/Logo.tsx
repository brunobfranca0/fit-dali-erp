'use client'

import React from 'react'
import Image from 'next/image'

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'badge'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showTagline?: boolean
}

export function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  showTagline = true,
}: LogoProps) {
  const dimensions = {
    sm: { width: 120, height: 56, iconSize: 34 },
    md: { width: 160, height: 75, iconSize: 40 },
    lg: { width: 220, height: 104, iconSize: 48 },
    xl: { width: 280, height: 132, iconSize: 64 },
  }[size]

  // Sleek, ultra-sharp vector icon (leaf + heart essence of Fit DaLi)
  if (variant === 'icon') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-[#38a149] to-emerald-700 shadow-sm transition-transform hover:scale-105 flex-shrink-0 text-white ${className}`}
        style={{ width: dimensions.iconSize, height: dimensions.iconSize }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5 drop-shadow-xs"
        >
          <path d="M12 2C6.5 2 2 6.5 2 12c0 4 2.5 7.5 6 9 1-3.5 3-7 4-9" />
          <path d="M12 2c5.5 0 10 4.5 10 10 0 4-2.5 7.5-6 9-1-3.5-3-7-4-9" />
          <path d="M12 2v19" strokeWidth="1.8" />
        </svg>
      </div>
    )
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex flex-col justify-center select-none ${className}`}>
        <div className="flex items-center leading-none tracking-tight">
          <span className="font-black text-2xl text-[#38A149]">Fit</span>
          <span className="font-black text-2xl text-[#2e7d32]">DaLi</span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 italic tracking-wider mt-0.5">
            saudável com sabor
          </span>
        )}
      </div>
    )
  }

  // Default: full brand logo using transparent high-res PNG
  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <Image
        src="/logo.png"
        alt="Fit DaLi"
        width={dimensions.width}
        height={dimensions.height}
        className="w-auto h-auto object-contain drop-shadow-xs dark:brightness-110"
        priority
      />
    </div>
  )
}

export default Logo
