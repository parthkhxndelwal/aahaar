"use client"

import React from 'react'
import Image from 'next/image'

interface LogoSpinnerProps {
  size?: number
  className?: string
  showText?: boolean
  text?: string
}

export function LogoSpinner({ 
  size = 64, 
  className = "", 
  showText = true,
  text = "Loading..."
}: LogoSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Logo Container with Spinner Animation */}
      <div 
        className="relative flex items-center justify-center"
        style={{
          width: size,
          height: size,
        }}
      >
        {/* Spinning Ring */}
        <div 
          className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-logo-spin"
          style={{
            width: size,
            height: size,
            animationDuration: '3s', // 2 full turns in 3 seconds
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite'
          }}
        />
        
        {/* Logo Image */}
        <div className="relative z-10 bg-white dark:bg-neutral-900 rounded-full p-2 shadow-sm">
          <Image
            src="/logo.png"
            alt="Aahaar Logo"
            width={size * 0.6}
            height={size * 0.6}
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      {/* Loading Text */}
      {showText && (
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-foreground">{text}</p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}

// Smaller variant for inline use
export function LogoSpinnerSmall({ 
  size = 24, 
  className = "",
  showBorder = true 
}: { 
  size?: number
  className?: string
  showBorder?: boolean
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Spinning Ring */}
      {showBorder && (
        <div 
          className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-logo-spin"
          style={{
            width: size,
            height: size,
            animationDuration: '3s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite'
          }}
        />
      )}
      
      {/* Logo Image */}
      <div className="relative z-10">
        <Image
          src="/logo.png"
          alt="Aahaar"
          width={size * (showBorder ? 0.6 : 1)}
          height={size * (showBorder ? 0.6 : 1)}
          className="object-contain"
        />
      </div>
    </div>
  )
}
