@echo off
REM Azure Deployment Script for Local Services Marketplace
REM This script prepares your app for Azure deployment

echo.
echo ========================================
echo   Azure Deployment Script
echo   Local Services Marketplace
echo ========================================
echo.

REM Step 1: Build the app
echo [1/3] Building application...
call npm run build

if not exist "dist" (
  echo.
  echo ERROR: Build failed! dist folder not found.
  pause
  exit /b 1
)

echo.
echo [DONE] Build successful!
echo.

REM Step 2: Check Git
if not exist ".git" (
  echo [2/3] Initializing Git repository...
  call git init
  call git add .
  call git commit -m "Initial commit - Local Services Marketplace"
  echo.
  echo [DONE] Git initialized!
  echo.
  echo WARNING: Next steps:
  echo 1. Create a repository on GitHub: https://github.com/new
  echo 2. Run these commands in PowerShell:
  echo    git branch -M main
  echo    git remote add origin https://github.com/YOUR_USERNAME/local-services-marketplace.git
  echo    git push -u origin main
  echo.
) else (
  echo [2/3] Git repository already initialized
  echo.
  echo [3/3] Pushing to GitHub...
  call git add .
  call git commit -m "Update - ready for Azure deployment" 2>nul
  call git push
  echo.
  echo [DONE] Pushed to GitHub!
  echo.
)

echo.
echo ========================================
echo   NEXT STEPS
echo ========================================
echo.
echo 1. Go to: https://portal.azure.com
echo 2. Create a new Static Web App
echo 3. Connect your GitHub repository
echo 4. Set build preset to: Vite
echo 5. Set output location to: dist
echo 6. Add environment variables in Configuration:
echo    - VITE_GOOGLE_GEMINI_API_KEY
echo    - VITE_SUPABASE_URL
echo    - VITE_SUPABASE_ANON_KEY
echo 7. Your app will deploy automatically!
echo.
echo ========================================
echo   MOBILE INSTALLATION
echo ========================================
echo.
echo iOS (Safari):
echo   1. Open your Azure URL
echo   2. Tap Share (^)
echo   3. Tap "Add to Home Screen"
echo.
echo Android (Chrome):
echo   1. Open your Azure URL
echo   2. Tap Menu (...)
echo   3. Tap "Install app"
echo.
echo ========================================
echo   Happy deploying! 🚀
echo ========================================
echo.

pause
