'use client'

import React from 'react'
import Image from 'next/image'

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'badge' | 'packaging'
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
  // Dimensions map
  const dimensions = {
    sm: { width: 110, height: 50, iconSize: 32 },
    md: { width: 150, height: 68, iconSize: 42 },
    lg: { width: 200, height: 90, iconSize: 56 },
    xl: { width: 260, height: 118, iconSize: 72 },
  }[size]

  if (variant === 'icon') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden shadow-sm transition-transform hover:scale-105 ${className}`}
        style={{ width: dimensions.iconSize, height: dimensions.iconSize }}
      >
        <Image
          src="/logo-icon.svg"
          alt="Fit DaLi Icon"
          width={dimensions.iconSize}
          height={dimensions.iconSize}
          className="w-full h-full object-contain"
          priority
        />
      </div>
    )
  }

  if (variant === 'packaging' || variant === 'badge') {
    return (
      <div className={`relative inline-block ${className}`}>
        <Image
          src="/logo-box.svg"
          alt="Fit DaLi - Marmitas Fitness"
          width={dimensions.width * 1.3}
          height={dimensions.height * 1.1}
          className="w-auto h-auto object-contain max-h-36"
          priority
        />
      </div>
    )
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div
          className="relative rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-white"
          style={{ width: dimensions.iconSize, height: dimensions.iconSize }}
        >
          <Image
            src="/logo-icon.svg"
            alt="Fit DaLi"
            width={dimensions.iconSize}
            height={dimensions.iconSize}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold text-xl tracking-tight text-[#38A149]">Fit</span>
            <span className="font-extrabold text-xl tracking-tight text-[#E60067]">DaLi</span>
          </div>
          {showTagline && (
            <span className="text-[11px] font-medium text-emerald-800/80 italic tracking-wide mt-0.5">
              saudável com sabor!
            </span>
          )}
        </div>
      </div>
    )
  }

  // Default: full brand logo
  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <Image
        src="/logo.svg"
        alt="Fit DaLi - saudável com sabor!"
        width={dimensions.width}
        height={dimensions.height}
        className="w-auto h-auto object-contain"
        priority
      />
    </div>
  )
}

export default Logo

