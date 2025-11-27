#!/bin/bash

# Azure Deployment Script for Local Services Marketplace
# This script prepares your app for Azure deployment

echo "🚀 Preparing for Azure Deployment..."
echo ""

# Step 1: Build the app
echo "📦 Building application..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Build failed! dist folder not found."
  exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 2: Initialize git (if needed)
if [ ! -d ".git" ]; then
  echo "📝 Initializing Git repository..."
  git init
  git add .
  git commit -m "Initial commit - Local Services Marketplace"
  echo "✅ Git initialized!"
  echo ""
  echo "⚠️  Next steps:"
  echo "1. Create a repository on GitHub: https://github.com/new"
  echo "2. Run these commands:"
  echo "   git branch -M main"
  echo "   git remote add origin https://github.com/YOUR_USERNAME/local-services-marketplace.git"
  echo "   git push -u origin main"
  echo ""
else
  echo "✅ Git repository already initialized"
  echo ""
  echo "📤 Pushing to GitHub..."
  git add .
  git commit -m "Update - ready for Azure deployment" || true
  git push
  echo "✅ Pushed to GitHub!"
  echo ""
fi

echo "🎯 Next Steps:"
echo "1. Go to: https://portal.azure.com"
echo "2. Create a new Static Web App"
echo "3. Connect your GitHub repository"
echo "4. Set build preset to: Vite"
echo "5. Set output location to: dist"
echo "6. Add environment variables in Configuration"
echo "7. Your app will deploy automatically!"
echo ""
echo "📱 Once deployed:"
echo "- iOS: Open in Safari → Share → Add to Home Screen"
echo "- Android: Open in Chrome → Menu → Install app"
echo ""
echo "✨ Happy deploying! 🚀"
