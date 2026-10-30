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
  // Dimensions map based on native ratio ~2.1:1
  const dimensions = {
    sm: { width: 120, height: 56, iconSize: 36 },
    md: { width: 160, height: 75, iconSize: 44 },
    lg: { width: 220, height: 104, iconSize: 56 },
    xl: { width: 280, height: 132, iconSize: 72 },
  }[size]

  if (variant === 'icon') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-sm transition-transform hover:scale-105 flex-shrink-0 ${className}`}
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
          width={dimensions.width * 1.2}
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
          className="relative rounded-2xl overflow-hidden shadow-sm flex-shrink-0 bg-white p-1 border border-pink-100"
          style={{ width: dimensions.iconSize, height: dimensions.iconSize }}
        >
          <Image
            src="/logo-icon.svg"
            alt="Fit DaLi"
            width={dimensions.iconSize - 8}
            height={dimensions.iconSize - 8}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 leading-tight">
            <span className="font-extrabold text-xl tracking-tight text-[#38A149]">Fit</span>
            <span className="font-extrabold text-xl tracking-tight text-[#E60067]">DaLi</span>
          </div>
          {showTagline && (
            <span className="text-[11px] font-semibold text-emerald-800 italic tracking-wide">
              saudável com sabor!
            </span>
          )}
        </div>
      </div>
    )
  }

  // Default: full brand logo using transparent high-res PNG
  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <Image
        src="/logo.png"
        alt="Fit DaLi - saudável com sabor!"
        width={dimensions.width}
        height={dimensions.height}
        className="w-auto h-auto object-contain drop-shadow-sm"
        priority
      />
    </div>
  )
}

export default Logo
