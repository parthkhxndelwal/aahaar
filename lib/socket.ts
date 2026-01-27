import { io, Socket } from 'socket.io-client'

class SocketManager {
  private socket: Socket | null = null
  private token: string | null = null
  private connectionCount: number = 0

  connect(token: string) {
    this.connectionCount++
    console.log('[SocketManager] Connection requested. Count:', this.connectionCount)
    
    if (this.socket?.connected) {
      return this.socket
    }

    this.token = token
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    
    console.log('[SocketManager] Connecting to socket server:', {
      url: socketUrl,
      tokenLength: token.length,
      hasExistingSocket: !!this.socket,
      connectionCount: this.connectionCount
    })

    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    })

    this.socket.on('connect', () => {
      console.log('[SocketManager] Connected to socket server successfully')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketManager] Disconnected from socket server:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('[SocketManager] Socket connection error:', error)
    })

    return this.socket
  }

  disconnect() {
    this.connectionCount = Math.max(0, this.connectionCount - 1)
    console.log('[SocketManager] Disconnect requested. Count:', this.connectionCount)
    
    // Only actually disconnect when no components are using the socket
    if (this.connectionCount === 0) {
      console.log('[SocketManager] All components disconnected, closing socket connection')
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
    } else {
      console.log('[SocketManager] Socket still in use by', this.connectionCount, 'component(s)')
    }
  }

  getSocket() {
    return this.socket
  }

  // Vendor-specific methods
  joinVendorQueue(vendorId: string) {
    if (this.socket) {
      this.socket.emit('join-vendor-queue', vendorId)
    }
  }

  leaveVendorQueue(vendorId: string) {
    if (this.socket) {
      this.socket.emit('leave-vendor-queue', vendorId)
    }
  }

  // Listen for order updates
  onOrderUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('order-update', callback)
    }
  }

  // Listen for new orders
  onNewOrder(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new-order', callback)
    }
  }

  // Listen for queue updates
  onQueueUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('queue-update', callback)
    }
  }

  // Customer-specific methods
  joinCustomerOrderRoom(parentOrderId: string) {
    if (this.socket) {
      console.log('[SocketManager] Emitting join-customer-order:', parentOrderId)
      this.socket.emit('join-customer-order', parentOrderId)
    } else {
      console.warn('[SocketManager] No socket connection for joinCustomerOrderRoom')
    }
  }

  leaveCustomerOrderRoom(parentOrderId: string) {
    if (this.socket) {
      console.log('[SocketManager] Emitting leave-customer-order:', parentOrderId)
      this.socket.emit('leave-customer-order', parentOrderId)
    } else {
      console.warn('[SocketManager] No socket connection for leaveCustomerOrderRoom')
    }
  }

  joinCustomerOrdersRoom(userId: string) {
    if (this.socket) {
      console.log('[SocketManager] Emitting join-customer-orders:', userId)
      this.socket.emit('join-customer-orders', userId)
    } else {
      console.warn('[SocketManager] No socket connection for joinCustomerOrdersRoom')
    }
  }

  leaveCustomerOrdersRoom(userId: string) {
    if (this.socket) {
      console.log('[SocketManager] Emitting leave-customer-orders:', userId)
      this.socket.emit('leave-customer-orders', userId)
    } else {
      console.warn('[SocketManager] No socket connection for leaveCustomerOrdersRoom')
    }
  }

  // Listen for customer order updates
  onCustomerOrderUpdate(callback: (data: any) => void) {
    if (this.socket) {
      console.log('[SocketManager] Setting up customer-order-update listener')
      // Remove any existing listeners first
      this.socket.off('customer-order-update')
      this.socket.on('customer-order-update', (data) => {
        console.log('[SocketManager] Received customer-order-update event:', data)
        callback(data)
      })
    } else {
      console.warn('[SocketManager] No socket connection for onCustomerOrderUpdate')
    }
  }

  // Listen for customer order status changes
  onCustomerOrderStatusChange(callback: (data: any) => void) {
    if (this.socket) {
      console.log('[SocketManager] Setting up customer-order-status-change listener')
      // Remove any existing listeners first
      this.socket.off('customer-order-status-change')
      this.socket.on('customer-order-status-change', (data) => {
        console.log('[SocketManager] Received customer-order-status-change event:', data)
        callback(data)
      })
    } else {
      console.warn('[SocketManager] No socket connection for onCustomerOrderStatusChange')
    }
  }

  // Remove listeners
  offOrderUpdate(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('order-update', callback)
      } else {
        this.socket.off('order-update')
      }
    }
  }

  offNewOrder(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('new-order', callback)
      } else {
        this.socket.off('new-order')
      }
    }
  }

  offQueueUpdate(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('queue-update', callback)
      } else {
        this.socket.off('queue-update')
      }
    }
  }

  // Remove customer listeners
  offCustomerOrderUpdate(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('customer-order-update', callback)
      } else {
        this.socket.off('customer-order-update')
      }
    }
  }

  offCustomerOrderStatusChange(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('customer-order-status-change', callback)
      } else {
        this.socket.off('customer-order-status-change')
      }
    }
  }
}

// Export singleton instance
export const socketManager = new SocketManager()
export default socketManager
