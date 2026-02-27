"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSocket } from '@/hooks/use-socket'
import { LogoSpinner } from '@/components/ui/logo-spinner'

interface SocketConnectionContextType {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnectAttempt: number
  retryConnection: () => void
  shouldConnect: boolean
}

const SocketConnectionContext = createContext<SocketConnectionContextType | undefined>(undefined)

interface SocketConnectionProviderProps {
  children: React.ReactNode
  namespace?: string
  showLoadingScreen?: boolean
  timeout?: number
  autoConnect?: boolean // New prop to control auto-connection
}

export function SocketConnectionProvider({ 
  children, 
  namespace = '', 
  showLoadingScreen = true,
  timeout = 10000, // 10 seconds default timeout
  autoConnect = false // Default to false - only connect when explicitly needed
}: SocketConnectionProviderProps) {
  const pathname = usePathname()
  
  // Determine if we should connect based on the current route
  const shouldConnect = autoConnect || isOrderRelatedPage(pathname)
  
  const { socket, isConnected, error, reconnectAttempt, forceReconnect } = useSocket(
    shouldConnect ? namespace : undefined // Only pass namespace if we should connect
  )
  
  const [isConnecting, setIsConnecting] = useState(shouldConnect)
  const [connectionTimeout, setConnectionTimeout] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Helper function to determine if current page needs socket connection
  function isOrderRelatedPage(path: string): boolean {
    const orderRoutes = [
      '/orders',
      '/queue',
      '/orders/',
      '/queue/',
    ]
    
    return orderRoutes.some(route => path.includes(route))
  }

  useEffect(() => {
    // Reset connection state when shouldConnect changes
    if (!shouldConnect) {
      setIsConnecting(false)
      setConnectionTimeout(false)
      setRetryCount(0)
      return
    }
    
    if (isConnected) {
      console.log('✅ [SocketConnection] Connected successfully')
      setIsConnecting(false)
      setConnectionTimeout(false)
      setRetryCount(0)
    } else if (error) {
      console.log('❌ [SocketConnection] Connection error:', error)
      setIsConnecting(false)
      
      // Auto-retry for timeout errors
      if (error.includes('timeout') || error.includes('retrying')) {
        console.log('🔄 [SocketConnection] Auto-retrying for timeout error...')
        setTimeout(() => {
          if (!isConnected && shouldConnect) {
            retryConnection()
          }
        }, 3000) // Retry after 3 seconds for timeout errors
      }
    }
  }, [isConnected, error, shouldConnect])

  useEffect(() => {
    // Set timeout for connection only if we should connect
    if (!shouldConnect) return
    
    const timer = setTimeout(() => {
      if (!isConnected && isConnecting && reconnectAttempt === 0) {
        console.log('⏰ [SocketConnection] Initial connection timeout')
        setConnectionTimeout(true)
        setIsConnecting(false)
      }
    }, timeout)

    return () => clearTimeout(timer)
  }, [isConnected, isConnecting, timeout, reconnectAttempt, shouldConnect])

  const retryConnection = () => {
    if (!shouldConnect) {
      console.log('⚠️ [SocketConnection] Cannot retry - not on order page')
      return
    }
    
    console.log('🔄 [SocketConnection] Manual retry requested...')
    setIsConnecting(true)
    setConnectionTimeout(false)
    setRetryCount(prev => prev + 1)
    
    // Use the enhanced force reconnect
    if (forceReconnect) {
      forceReconnect()
    } else if (socket) {
      // Fallback to basic reconnection
      socket.connect()
    }
  }

  const contextValue: SocketConnectionContextType = {
    isConnected: shouldConnect ? isConnected : false, // Always false if we shouldn't connect
    isConnecting: shouldConnect ? isConnecting : false,
    error: shouldConnect ? (error || (connectionTimeout ? 'Connection timeout' : null)) : null,
    reconnectAttempt: shouldConnect ? (reconnectAttempt || 0) : 0,
    retryConnection,
    shouldConnect
  }

  // Show loading screen while connecting (if enabled and should connect)
  if (showLoadingScreen && shouldConnect && (isConnecting || (!isConnected && !error && !connectionTimeout))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <LogoSpinner 
            size={80} 
            text="Connecting to server..."
            className="mx-auto"
          />
          <p className="text-muted-foreground max-w-sm mx-auto">
            Establishing real-time connection for live updates
          </p>
        </div>
      </div>
    )
  }

  // Show error screen if connection failed (only if should connect)
  if (showLoadingScreen && shouldConnect && (error || connectionTimeout) && !isConnected) {
    const isRetrying = error && (error.includes('retrying') || error.includes('timeout'))
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          {isRetrying ? (
            <LogoSpinner 
              size={64} 
              text="Reconnecting..."
              className="mx-auto"
            />
          ) : (
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )}
          
          {!isRetrying && (
            <h2 className="text-xl font-semibold text-destructive">
              Connection Failed
            </h2>
          )}
          
          <div className="space-y-2">
            <p className="text-muted-foreground">
              {error || 'Unable to connect to the server'}
            </p>
            
            {reconnectAttempt > 0 && (
              <p className="text-sm text-orange-600">
                Reconnection attempt: {reconnectAttempt}
              </p>
            )}
            
            {isRetrying && (
              <p className="text-sm text-muted-foreground">
                Please wait while we restore your connection...
              </p>
            )}
          </div>
          
          {!isRetrying && (
            <div className="space-y-2">
              <button 
                onClick={retryConnection}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full font-medium"
              >
                Retry Connection
              </button>
              
              <p className="text-xs text-muted-foreground">
                If connection issues persist, try refreshing the page
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <SocketConnectionContext.Provider value={contextValue}>
      {children}
    </SocketConnectionContext.Provider>
  )
}

export function useSocketConnection() {
  const context = useContext(SocketConnectionContext)
  if (context === undefined) {
    throw new Error('useSocketConnection must be used within a SocketConnectionProvider')
  }
  return context
}
