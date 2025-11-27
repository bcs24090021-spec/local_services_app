#!/bin/bash

# Azure Dynamic App Deployment Script
# For Local Services Marketplace - Dynamic Web App

echo "🚀 Deploying Dynamic App to Azure Static Web Apps"
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

# Step 2: Check if git is clean
echo "🔍 Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
  echo "📝 Changes detected, committing..."
  git add .
  git commit -m "Update for Azure deployment"
  git push
  echo "✅ Changes pushed to GitHub!"
else
  echo "✅ Git is clean, no changes to push"
fi

echo ""
echo "🎯 Next Steps - Azure Portal Setup:"
echo "1. Go to: https://portal.azure.com"
echo "2. Click 'Create a resource'"
echo "3. Search for 'Static Web App'"
echo "4. Click 'Create'"
echo ""
echo "⚙️  Configuration:"
echo "   - Name: local-services-marketplace"
echo "   - Plan: Free"
echo "   - Source: GitHub"
echo "   - Repository: bcs24090021-spec/local_services_app"
echo "   - Branch: main"
echo "   - Build Presets: Vite"
echo "   - Output location: dist"
echo ""
echo "🔑 Environment Variables (add in Azure):"
echo "   VITE_GOOGLE_GEMINI_API_KEY=your_api_key"
echo "   VITE_SUPABASE_URL=your_supabase_url"
echo "   VITE_SUPABASE_ANON_KEY=your_supabase_key"
echo ""
echo "📱 After Deployment:"
echo "   - Test all dynamic features"
echo "   - Install on mobile (iOS: Add to Home Screen, Android: Install app)"
echo "   - Share with users!"
echo ""
echo "✨ Your dynamic app will be live in minutes! 🚀"
