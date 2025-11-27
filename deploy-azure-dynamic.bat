@echo off
REM Azure Dynamic App Deployment Script
REM For Local Services Marketplace - Dynamic Web App

echo.
echo ========================================
echo   Azure Dynamic App Deployment
echo   Local Services Marketplace
echo ========================================
echo.

REM Step 1: Build the app
echo [1/4] Building application...
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

REM Step 2: Check Git status
echo [2/4] Checking Git status...
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
  echo [DONE] Git is clean, no changes to push
) else (
  echo [INFO] Changes detected, committing...
  git add .
  git commit -m "Update for Azure deployment"
  git push
  echo [DONE] Changes pushed to GitHub!
)
echo.

REM Step 3: Azure Portal Instructions
echo [3/4] Azure Portal Setup Instructions
echo.
echo 1. Go to: https://portal.azure.com
echo 2. Click "Create a resource"
echo 3. Search for "Static Web App"
echo 4. Click "Create"
echo.
echo Configuration:
echo    - Name: local-services-marketplace
echo    - Plan: Free
echo    - Source: GitHub
echo    - Repository: bcs24090021-spec/local_services_app
echo    - Branch: main
echo    - Build Presets: Vite
echo    - Output location: dist
echo.

REM Step 4: Environment Variables
echo [4/4] Environment Variables (add in Azure)
echo.
echo Add these in Azure Portal - Configuration:
echo    VITE_GOOGLE_GEMINI_API_KEY=your_api_key
echo    VITE_SUPABASE_URL=your_supabase_url
echo    VITE_SUPABASE_ANON_KEY=your_supabase_key
echo.

echo ========================================
echo   DEPLOYMENT READY!
echo ========================================
echo.
echo Your app is ready for Azure deployment!
echo.
echo Dynamic Features:
echo   ✅ Real-time messaging
echo   ✅ Location sharing
echo   ✅ AI chatbot
echo   ✅ User authentication
echo   ✅ PWA mobile app
echo.
echo After Deployment:
echo   - Test all features
echo   - Install on mobile
echo   - Share with users
echo.
echo Go to Azure Portal and deploy now! 🚀
echo.

pause
