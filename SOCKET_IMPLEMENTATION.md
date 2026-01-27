# Real-time Order Queue Implementation

This implementation adds real-time socket.io-based updates to the vendor dashboard order queue, eliminating the need for manual refresh.

## Key Components

### Server Side
- **`server.js`**: Custom Next.js server with Socket.io integration
- **`lib/socket-server.js`**: Server-side socket utility functions for emitting events
- **API Route Updates**: Modified to emit socket events when orders are created/updated

### Client Side
- **`lib/socket.ts`**: Socket manager singleton for client connections
- **`hooks/use-vendor-socket.ts`**: React hook for managing vendor socket connections
- **Updated Queue Page**: Modified to use real-time updates instead of manual refresh

## Features

1. **Real-time Order Updates**: New orders appear automatically in vendor dashboard
2. **Live Status Changes**: Order status changes (accept/reject/preparing/ready/complete) update in real-time
3. **Connection Status**: Visual indicators show if socket connection is active
4. **Graceful Fallback**: Manual refresh still available if socket connection fails
5. **Automatic Reconnection**: Socket automatically reconnects if connection is lost

## Socket Events

### Emitted to Vendors
- `new-order`: When a customer places a new order
- `order-update`: When order details are updated
- `order-status-change`: When order status changes
- `queue-update`: When queue data needs to be refreshed

### Socket Rooms
- `vendor-{userId}`: General vendor room
- `vendor-queue-{vendorId}`: Specific vendor queue room for order updates

## Usage

The socket connection is automatically established when a vendor visits their queue page. The system:

1. Authenticates the user via JWT token
2. Joins the vendor to their specific queue room
3. Listens for relevant order events
4. Updates the UI in real-time when events are received
5. Shows connection status to the vendor

## Environment Variables

Make sure your `.env.local` file includes:
```
JWT_SECRET=your_jwt_secret_here
```

## Running the Application

The application now uses a custom server for Socket.io support:

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The server will run on `http://localhost:3000` with Socket.io support enabled.
