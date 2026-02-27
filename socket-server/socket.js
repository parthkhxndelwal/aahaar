const { io, vendorNamespace, appNamespace } = require('./server');

/**
 * Emit event to a vendor room
 * @param {string} vendorId - The vendor ID
 * @param {string} event - The event name
 * @param {any} data - The data to emit
 * @returns {boolean} - True if emitted successfully
 */
const emitToVendor = (vendorId, event, data) => {
  if (vendorNamespace) {
    console.log(`🔔 Emitting to vendor ${vendorId}: ${event}`, data);
    vendorNamespace.to(`vendor-${vendorId}`).emit(event, data);
    return true;
  }
  console.warn(`⚠️ Socket not available for vendor ${vendorId}`);
  return false;
};

/**
 * Emit event to a user room
 * @param {string} userId - The user ID
 * @param {string} event - The event name
 * @param {any} data - The data to emit
 * @returns {boolean} - True if emitted successfully
 */
const emitToUser = (userId, event, data) => {
  if (appNamespace) {
    console.log(`🔔 Emitting to user ${userId}: ${event}`, data);
    appNamespace.to(`user-${userId}`).emit(event, data);
    return true;
  }
  console.warn(`⚠️ Socket not available for user ${userId}`);
  return false;
};

/**
 * Emit event to an order room
 * @param {string} parentOrderId - The parent order ID
 * @param {string} event - The event name
 * @param {any} data - The data to emit
 * @returns {boolean} - True if emitted successfully
 */
const emitToOrder = (parentOrderId, event, data) => {
  if (appNamespace) {
    console.log(`🔔 Emitting to order ${parentOrderId}: ${event}`, data);
    appNamespace.to(`order-${parentOrderId}`).emit(event, data);
    return true;
  }
  console.warn(`⚠️ Socket not available for order ${parentOrderId}`);
  return false;
};

module.exports = {
  io,
  vendorNamespace,
  appNamespace,
  emitToVendor,
  emitToUser,
  emitToOrder
};
