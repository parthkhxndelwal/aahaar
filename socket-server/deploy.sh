#!/bin/bash

# Deploy script for the socket server

# 1. Install dependencies
npm install

# 2. Set environment variables for production
export NODE_ENV=production
export PORT=3001
export NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app

# 3. Start the server with PM2 (process manager)
# Install PM2 if not already installed: npm install -g pm2
pm2 start server.js --name "aahaar-socket-server"

echo "Socket server deployed successfully!"

# To check status: pm2 status
# To view logs: pm2 logs aahaar-socket-server
# To restart: pm2 restart aahaar-socket-server
