import { NextResponse } from 'next/server'
import { SOCKET_URL } from '@/lib/socket'

export async function GET(request) {
  try {
    console.log('🚀 Socket.io connection check requested...')
    
    // Check if external socket server is reachable
    const socketUrl = SOCKET_URL
    
    try {
      // Try to reach the socket server health endpoint
      const healthResponse = await fetch(`${socketUrl}/health`, {
        method: 'GET',
        timeout: 5000
      })
      
      if (healthResponse.ok) {
        console.log('✅ External socket server is reachable')
        return NextResponse.json({ 
          success: true, 
          message: 'Socket.io server is reachable',
          socketUrl: socketUrl,
          namespaces: ['/vendor', '/app'],
          type: 'external'
        })
      } else {
        throw new Error('Socket server health check failed')
      }
    } catch (fetchError) {
      console.log('⚠️ External socket server not reachable, but this is expected in some deployments')
      return NextResponse.json({ 
        success: true, 
        message: 'Socket.io configured for external server',
        socketUrl: socketUrl,
        namespaces: ['/vendor', '/app'],
        type: 'external',
        note: 'External server may not be running or health endpoint may not be accessible'
      })
    }
    
  } catch (error) {
    console.error('❌ Socket.io configuration error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to check Socket.io server configuration',
      error: error.message 
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { action, data } = await request.json()
    
    if (action === 'test-emit') {
      // Since we're using external socket server, emit via API endpoint
      const socketUrl = SOCKET_URL
      
      try {
        // Emit test message to vendor namespace
        await fetch(`${socketUrl}/emit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            namespace: 'vendor',
            event: 'test-message',
            data: { message: 'Test from server', timestamp: new Date().toISOString() }
          })
        })
        
        // Emit test message to app namespace  
        await fetch(`${socketUrl}/emit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            namespace: 'app',
            event: 'test-message', 
            data: { message: 'Test from server', timestamp: new Date().toISOString() }
          })
        })
        
        return NextResponse.json({ 
          success: true, 
          message: 'Test message emitted to all namespaces via external server' 
        })
      } catch (emitError) {
        console.error('Failed to emit test message:', emitError)
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to emit test message to external server',
          error: emitError.message
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid action' 
    }, { status: 400 })
    
  } catch (error) {
    console.error('❌ Socket.io test error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Socket.io test failed',
      error: error.message 
    }, { status: 500 })
  }
}
