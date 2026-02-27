const express = require('express');
const router = express.Router();
const { emitToVendor, emitToUser, emitToOrder } = require('./socket');

// Emit to vendor endpoint
router.post('/vendor/:vendorId', (req, res) => {
  const { vendorId } = req.params;
  const { event, data } = req.body;
  
  if (!event) {
    return res.status(400).json({
      success: false,
      message: 'Missing event name'
    });
  }
  
  try {
    const result = emitToVendor(vendorId, event, data);
    
    res.status(200).json({
      success: result,
      message: result 
        ? `Event ${event} emitted to vendor ${vendorId}` 
        : `Failed to emit event to vendor ${vendorId}`
    });
  } catch (error) {
    console.error(`Error emitting to vendor ${vendorId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while emitting event',
      error: error.message
    });
  }
});

// Emit to user endpoint
router.post('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const { event, data } = req.body;
  
  if (!event) {
    return res.status(400).json({
      success: false,
      message: 'Missing event name'
    });
  }
  
  try {
    const result = emitToUser(userId, event, data);
    
    res.status(200).json({
      success: result,
      message: result 
        ? `Event ${event} emitted to user ${userId}` 
        : `Failed to emit event to user ${userId}`
    });
  } catch (error) {
    console.error(`Error emitting to user ${userId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while emitting event',
      error: error.message
    });
  }
});

// Emit to order endpoint
router.post('/order/:parentOrderId', (req, res) => {
  const { parentOrderId } = req.params;
  const { event, data } = req.body;
  
  if (!event) {
    return res.status(400).json({
      success: false,
      message: 'Missing event name'
    });
  }
  
  try {
    const result = emitToOrder(parentOrderId, event, data);
    
    res.status(200).json({
      success: result,
      message: result 
        ? `Event ${event} emitted to order ${parentOrderId}` 
        : `Failed to emit event to order ${parentOrderId}`
    });
  } catch (error) {
    console.error(`Error emitting to order ${parentOrderId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while emitting event',
      error: error.message
    });
  }
});

module.exports = router;
