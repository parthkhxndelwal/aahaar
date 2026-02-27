import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { namespace, room, event, data } = await request.json()
    
    console.log(`🔔 [SocketAPI] Emitting to ${namespace}/${room}: ${event}`)
    
    // Make request to deployed socket server's emit endpoint
    const socketServerUrl = process.env.NODE_ENV === 'development' 
      ? 'https://aahaar-cms-socket.onrender.com' 
      : process.env.NEXT_PUBLIC_SOCKET_URL || 'https://aahaar-cms-socket.onrender.com'
    
    const response = await fetch(`${socketServerUrl}/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        namespace,
        room,
        event,
        data
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ [SocketAPI] Event emitted successfully:', result)
      return NextResponse.json({ success: true, result })
    } else {
      const error = await response.text()
      console.error('❌ [SocketAPI] Failed to emit event:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to emit event', error }, 
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ [SocketAPI] Error emitting event:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message }, 
      { status: 500 }
    )
  }
}
