"use client"

import React, { useState } from 'react'
import { LogoSpinner, LogoSpinnerSmall } from './logo-spinner'

export function LogoSpinnerDemo() {
  const [showDemo, setShowDemo] = useState(false)

  if (!showDemo) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowDemo(true)}
          className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Show Spinner Demo
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-2xl w-full mx-4 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Logo Spinner Demo</h2>
          <button
            onClick={() => setShowDemo(false)}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Large Spinners */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Large Spinners</h3>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">Default (64px)</p>
                <LogoSpinner />
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">Large (96px)</p>
                <LogoSpinner size={96} text="Loading application..." />
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">Custom text</p>
                <LogoSpinner text="Connecting to server..." />
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">No text</p>
                <LogoSpinner showText={false} />
              </div>
            </div>
          </div>

          {/* Small Spinners */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Small Spinners</h3>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">Small with border (24px)</p>
                <LogoSpinnerSmall />
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">Medium with border (32px)</p>
                <LogoSpinnerSmall size={32} />
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">Without border</p>
                <LogoSpinnerSmall showBorder={false} />
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">Inline usage</p>
                <div className="flex items-center space-x-2">
                  <LogoSpinnerSmall size={16} />
                  <span className="text-sm">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Animation Details</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Completes 2 full rotations in 3 seconds</li>
            <li>• Uses linear timing for smooth continuous motion</li>
            <li>• Infinite loop animation</li>
            <li>• CSS-based with hardware acceleration</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
