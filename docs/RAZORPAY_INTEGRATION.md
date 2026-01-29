# Razorpay Route Account Integration

This document explains the Razorpay Route Account integration for vendor onboarding and management.

## Overview

The Aahaar platform integrates with Razorpay's Route Account feature to automatically create and manage payment accounts for vendors. This enables seamless payment processing and vendor payouts.

## Features

### ✅ Implemented Features

1. **Automatic Account Creation**
   - Creates Razorpay Route Account when vendor is onboarded
   - Includes PAN and GSTIN validation
   - Stores account ID in vendor record

2. **Account Updates**
   - Updates Razorpay account when vendor details change
   - Syncs business name, PAN, and GSTIN changes
   - Maintains data consistency

3. **Account Fetching**
   - Retrieves current Razorpay account status
   - Shows account details in admin panel
   - API endpoint for account information

4. **Validation & Security**
   - PAN format validation (`AAAAA9999A`)
   - GSTIN format validation (optional)
   - Error handling and logging
   - Rollback support

## API Endpoints

### Vendor Management
- `POST /api/courts/[courtId]/vendors` - Create vendor (with Razorpay account)
- `PUT /api/courts/[courtId]/vendors/[vendorId]` - Update vendor (syncs Razorpay)
- `DELETE /api/courts/[courtId]/vendors/[vendorId]` - Delete vendor (permanent)

### Razorpay Specific
- `GET /api/courts/[courtId]/vendors/[vendorId]/razorpay` - Get Razorpay account details
- `POST /api/courts/[courtId]/vendors/retry-razorpay` - Retry account creation

## Database Schema

### Vendor Model Updates
```javascript
// Added fields to Vendor model
panNumber: {
  type: DataTypes.STRING(10),
  allowNull: false,
  validate: {
    is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  }
},
gstin: {
  type: DataTypes.STRING(15),
  allowNull: true,
  validate: {
    is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  }
},
razorpayAccountId: {
  type: DataTypes.STRING,
  allowNull: true
}
```

## Frontend Integration

### Vendor Add Form
- **Step 3: Bank Details** includes PAN and GSTIN fields
- Real-time validation with visual feedback
- Required PAN, optional GSTIN
- Auto-uppercase input formatting

### Vendor Edit Form
- **Payments Tab** shows PAN/GSTIN fields
- Displays Razorpay account status
- "View Details" button for account information
- Respects edit mode permissions

## Razorpay Utility Functions

### `createRouteAccount(vendorData)`
Creates a new Razorpay Route Account with vendor information.

```javascript
const result = await createRouteAccount({
  email: 'vendor@example.com',
  phone: '9876543210',
  vendorName: 'John Doe',
  stallName: 'Delicious Foods',
  courtId: 'court-123',
  vendorId: 'vendor-456',
  panNumber: 'ABCDE1234F',
  gstin: '18AABCU9603R1ZM' // optional
})
```

### `updateRouteAccount(accountId, updateData)`
Updates an existing Razorpay Route Account.

```javascript
const result = await updateRouteAccount('acc_123456789', {
  vendorName: 'Updated Name',
  stallName: 'Updated Stall',
  courtId: 'court-123',
  panNumber: 'FGHIJ5678K',
  gstin: '19AABCU9603R1ZN'
})
```

### `fetchRouteAccount(accountId)`
Retrieves Razorpay account details.

```javascript
const result = await fetchRouteAccount('acc_123456789')
```

## Error Handling

### Common Issues & Solutions

1. **Reference ID too long**
   - ✅ Fixed: Using shortened reference ID (max 20 chars)
   - Format: `v{timestamp}{vendorHash}`

2. **Invalid PAN/GSTIN format**
   - ✅ Validation on frontend and backend
   - Clear error messages with format examples

3. **Network failures**
   - ✅ Graceful degradation
   - Retry mechanism available
   - Logs for debugging

## Testing

### Manual Testing
1. Create vendor with valid PAN/GSTIN
2. Verify Razorpay account creation
3. Update vendor details
4. Check Razorpay account sync
5. View account details in admin panel

### Automated Testing
```bash
# Run integration tests
node scripts/test-razorpay-integration.js
```

## Configuration

### Environment Variables
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### Database Migration
```bash
# Run migration to add new fields
node scripts/add-pan-gstin-fields.js
```

## Monitoring & Logs

### Success Logs
- `✅ Razorpay account created successfully`
- `✅ Razorpay account updated successfully`

### Error Logs
- `❌ Failed to create Razorpay account`
- `❌ Failed to update Razorpay account`

## Future Enhancements

### Planned Features
- [ ] Webhook integration for account status updates
- [ ] Automated KYC status checking
- [ ] Bulk vendor account operations
- [ ] Enhanced error recovery
- [ ] Analytics dashboard

### Nice to Have
- [ ] Razorpay account health monitoring
- [ ] Automated compliance checking
- [ ] Multi-currency support
- [ ] Advanced reporting

## Troubleshooting

### Vendor Creation Fails
1. Check PAN format (AAAAA9999A)
2. Verify GSTIN format (if provided)
3. Check Razorpay credentials
4. Review server logs

### Account Update Fails
1. Verify account ID exists
2. Check field validation
3. Review Razorpay API logs
4. Check rate limits

### Missing Account ID
1. Check if vendor was created before integration
2. Use retry endpoint to create account
3. Verify database migration

## Support

For issues related to:
- **Razorpay API**: Check Razorpay documentation
- **Integration bugs**: Review application logs
- **Database issues**: Check migration status
- **Frontend issues**: Verify form validation

---

**Note**: This integration requires active Razorpay credentials and proper environment setup. Test thoroughly in development before production deployment.
