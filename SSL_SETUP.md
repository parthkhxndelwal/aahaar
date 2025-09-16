# HTTPS Development Setup Instructions

## SSL Certificates Created
- `ca.crt` - Certificate Authority (root certificate)
- `ca.key` - CA private key
- `cert.crt` - Server certificate for localhost and 192.168.1.2
- `cert.key` - Server private key

## Access URLs
- **Local (on your computer)**: https://localhost:3000
- **Network (from mobile)**: https://192.168.1.2:3000

## To avoid security warnings on mobile:

### Option 1: Install CA Certificate on Mobile (Recommended)
1. Copy `ca.crt` to your mobile device
2. On Android:
   - Go to Settings > Security > Install certificates from device storage
   - Select the `ca.crt` file
   - Give it a name like "Local Dev CA"
3. On iOS:
   - Email the `ca.crt` file to yourself
   - Tap the attachment to install
   - Go to Settings > General > About > Certificate Trust Settings
   - Enable full trust for "Local Dev CA"

### Option 2: Accept Security Warning (Quick Test)
1. Navigate to https://192.168.1.2:3000 on your mobile browser
2. You'll see a security warning
3. Tap "Advanced" then "Proceed to 192.168.1.2 (unsafe)"
4. The camera should now work since you're on HTTPS

### Option 3: Chrome Flags (Alternative)
1. Open Chrome on mobile
2. Go to chrome://flags/#unsafely-treat-insecure-origin-as-secure
3. Add "http://192.168.1.2:3000"
4. Restart Chrome
5. Use the HTTP version instead

## Scripts
- `npm run dev` - HTTP development server
- `npm run dev:https` - HTTPS development server (current)

## QR Scanner Testing
Navigate to: https://192.168.1.2:3000/app/auth/court-qrscan
