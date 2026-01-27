/**
 * Socket utility functions for server-side socket.io operations
 * These functions can be used in API routes to emit real-time updates
 */

/**
 * Emit a new order notification to a specific vendor
 * @param {string} vendorId - The vendor ID to notify
 * @param {Object} orderData - The order data to send
 */
export const notifyVendorNewOrder = (vendorId, orderData) => {
  if (global.io) {
    global.io.to(`vendor-queue-${vendorId}`).emit('new-order', {
      type: 'new-order',
      order: orderData,
      timestamp: new Date().toISOString()
    })
    console.log(`Sent new order notification to vendor ${vendorId}`)
  }
}

/**
 * Emit an order status update to a specific vendor
 * @param {string} vendorId - The vendor ID to notify
 * @param {Object} orderData - The updated order data
 */
export const notifyVendorOrderUpdate = (vendorId, orderData) => {
  if (global.io) {
    global.io.to(`vendor-queue-${vendorId}`).emit('order-update', {
      type: 'order-update',
      order: orderData,
      timestamp: new Date().toISOString()
    })
    console.log(`Sent order update to vendor ${vendorId}`)
  }
}

/**
 * Emit a queue update to a specific vendor
 * @param {string} vendorId - The vendor ID to notify
 * @param {Object} queueData - The updated queue data
 */
export const notifyVendorQueueUpdate = (vendorId, queueData) => {
  if (global.io) {
    global.io.to(`vendor-queue-${vendorId}`).emit('queue-update', {
      type: 'queue-update',
      queue: queueData,
      timestamp: new Date().toISOString()
    })
    console.log(`Sent queue update to vendor ${vendorId}`)
  }
}

/**
 * Emit order status change notification
 * @param {string} vendorId - The vendor ID to notify
 * @param {string} orderId - The order ID that was updated
 * @param {string} oldStatus - Previous order status
 * @param {string} newStatus - New order status
 * @param {Object} orderData - Complete order data
 */
export const notifyOrderStatusChange = (vendorId, orderId, oldStatus, newStatus, orderData) => {
  if (global.io) {
    global.io.to(`vendor-queue-${vendorId}`).emit('order-status-change', {
      type: 'order-status-change',
      orderId,
      oldStatus,
      newStatus,
      order: orderData,
      timestamp: new Date().toISOString()
    })
    console.log(`Sent order status change notification to vendor ${vendorId}: ${oldStatus} -> ${newStatus}`)
  }
}

/**
 * Check if socket.io server is available
 * @returns {boolean} - True if socket.io is available
 */
export const isSocketAvailable = () => {
  return !!global.io
}

/**
 * Customer notification functions
 */

/**
 * Emit order status update to customer for a specific order
 * @param {string} parentOrderId - The parent order ID
 * @param {Object} orderData - The updated order data
 */
export const notifyCustomerOrderUpdate = (parentOrderId, orderData) => {
  if (global.io) {
    const roomName = `customer-order-${parentOrderId}`
    console.log(`[Socket] Emitting customer-order-update to room: ${roomName}`)
    console.log(`[Socket] Order data:`, { parentOrderId, orderId: orderData.id, status: orderData.status })
    
    global.io.to(roomName).emit('customer-order-update', {
      type: 'customer-order-update',
      parentOrderId,
      order: orderData,
      timestamp: new Date().toISOString()
    })
    console.log(`Sent order update to customers watching order ${parentOrderId}`)
  } else {
    console.warn('[Socket] No io instance available for notifyCustomerOrderUpdate')
  }
}

/**
 * Emit order status change to customer for a specific order
 * @param {string} parentOrderId - The parent order ID
 * @param {string} vendorOrderId - The vendor order ID that changed
 * @param {string} oldStatus - Previous order status
 * @param {string} newStatus - New order status
 * @param {Object} orderData - Complete order data
 */
export const notifyCustomerOrderStatusChange = (parentOrderId, vendorOrderId, oldStatus, newStatus, orderData) => {
  if (global.io) {
    const roomName = `customer-order-${parentOrderId}`
    console.log(`[Socket] Emitting customer-order-status-change to room: ${roomName}`)
    console.log(`[Socket] Status change: ${oldStatus} -> ${newStatus} for order ${vendorOrderId}`)
    
    global.io.to(roomName).emit('customer-order-status-change', {
      type: 'customer-order-status-change',
      parentOrderId,
      vendorOrderId,
      oldStatus,
      newStatus,
      order: orderData,
      timestamp: new Date().toISOString()
    })
    console.log(`Sent order status change to customers watching order ${parentOrderId}: ${oldStatus} -> ${newStatus}`)
  } else {
    console.warn('[Socket] No io instance available for notifyCustomerOrderStatusChange')
  }
}

/**
 * Emit order update to customer for all their orders
 * @param {string} userId - The customer user ID
 * @param {Object} orderData - The updated order data
 */
export const notifyCustomerOrdersUpdate = (userId, orderData) => {
  if (global.io) {
    const roomName = `customer-orders-${userId}`
    console.log(`[Socket] Emitting customer-order-update to room: ${roomName}`)
    console.log(`[Socket] Order data for user ${userId}:`, { orderId: orderData.id, status: orderData.status })
    
    global.io.to(roomName).emit('customer-order-update', {
      type: 'customer-orders-update',
      userId,
      order: orderData,
      timestamp: new Date().toISOString()
    })
    console.log(`Sent orders update to customer ${userId}`)
  } else {
    console.warn('[Socket] No io instance available for notifyCustomerOrdersUpdate')
  }
}
