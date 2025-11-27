# 🚀 Azure Dynamic App Deployment Guide

Deploy your Local Services Marketplace dynamic app to Microsoft Azure Static Web Apps.

---

## 🎯 Why Azure for Dynamic Apps?

Azure Static Web Apps is perfect for your dynamic app because:
- ✅ **Free tier** with generous limits
- ✅ **Real-time features** work perfectly
- ✅ **Global CDN** for fast performance
- ✅ **Serverless functions** for backend logic
- ✅ **Auto-scaling** for user traffic
- ✅ **Enterprise security** with DDoS protection

---

## 📋 Your Dynamic App Features

Your app has these dynamic features that work great on Azure:
- ✅ Real-time messaging (Supabase)
- ✅ Location sharing (GPS + Maps)
- ✅ AI chatbot (Google Gemini)
- ✅ User authentication
- ✅ Database interactions
- ✅ Real-time notifications

---

## 🚀 Step-by-Step Azure Deployment

### Step 1: Build Your App

```bash
npm run build
```

This creates a `dist` folder optimized for production.

### Step 2: Create Azure Static Web App

1. **Go to Azure Portal**: https://portal.azure.com
2. **Sign in** with your Microsoft account
3. **Click "Create a resource"**
4. **Search for "Static Web App"**
5. **Click "Create"**

### Step 3: Configure Your App

**Basics Tab:**
- **Resource Group**: Create new or select existing
- **Name**: `local-services-marketplace`
- **Region**: Select closest to your users (e.g., East Asia)
- **Plan type**: **Free** (perfect for your app)

**Deployment Tab:**
- **Source**: GitHub
- **Organization**: Select your GitHub account
- **Repository**: `bcs24090021-spec/local_services_app`
- **Branch**: `main`

**Build Tab:**
- **Build Presets**: **Vite**
- **App location**: `/`
- **API location**: Leave empty (your backend is Supabase)
- **Output location**: `dist`

### Step 4: Review and Create

1. **Review all settings**
2. **Click "Create"**
3. **Wait for deployment** (2-3 minutes)

---

## 🔧 Environment Variables Setup

### Step 1: Go to Configuration

1. In Azure Portal, open your Static Web App
2. Click "Configuration" in the left menu
3. Click "Application settings"

### Step 2: Add Environment Variables

Add these variables:

```
VITE_GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Save and Redeploy

1. Click "Save"
2. Azure will automatically redeploy with the new variables

---

## 📱 Dynamic Features Configuration

### Real-time Messaging

Your messaging uses Supabase real-time, which works perfectly on Azure:

```javascript
// This works automatically on Azure
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
```

### Location Sharing

Geolocation requires HTTPS (Azure provides this automatically):

```javascript
// This works on Azure (HTTPS enabled)
navigator.geolocation.getCurrentPosition(
  position => {
    // Handle location
  },
  error => {
    // Handle error
  }
)
```

### AI Chatbot

Google Gemini API calls work from Azure:

```javascript
// This works on Azure
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.VITE_GOOGLE_GEMINI_API_KEY}`
)
```

---

## 🌐 PWA Configuration

Your app is already PWA-ready:

### manifest.json (Already configured)
```json
{
  "name": "Local Services Marketplace",
  "short_name": "Local Services",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6"
}
```

### Service Worker (Already configured)
- Offline caching
- Background sync
- Push notifications ready

---

## 📊 Performance Optimization

### Build Optimization
Your app is already optimized:
- ✅ Code splitting enabled
- ✅ Assets compressed
- ✅ Lazy loading components
- ✅ Bundle size optimized (760 KB)

### Azure CDN
Azure provides:
- ✅ Global CDN
- ✅ Automatic caching
- ✅ Edge optimization
- ✅ HTTP/2 support

---

## 🔄 Auto-Deployment

Once connected to GitHub, Azure automatically deploys:

### On Every Push to Main
```bash
git add .
git commit -m "Your changes"
git push
# Azure automatically builds and deploys!
```

### Deployment Process
1. Azure detects push
2. Builds with Vite
3. Optimizes assets
4. Deploys to global CDN
5. Updates live site

---

## 📱 Mobile Installation

After deployment, users can install your app:

### iOS (Safari)
1. Open your Azure URL
2. Tap Share (⬆️)
3. Tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open your Azure URL
2. Tap Menu (⋮)
3. Tap "Install app"
4. Tap "Install"

---

## 🔍 Testing Your Deployment

### Step 1: Verify App Loads
- Open your Azure URL
- Check all pages load
- Verify no console errors

### Step 2: Test Dynamic Features
- ✅ Messaging works
- ✅ Location sharing works
- ✅ AI chatbot responds
- ✅ Authentication works

### Step 3: Test Mobile
- Test on iOS Safari
- Test on Android Chrome
- Verify PWA installation

### Step 4: Test Performance
- Load time should be < 2 seconds
- Lighthouse score should be 90+
- All interactions should be smooth

---

## 🆘 Troubleshooting

### Build Fails
**Check:**
- Build logs in Azure Portal
- Dependencies installed correctly
- No TypeScript errors

**Fix:**
```bash
# Test build locally
npm run build

# Fix any errors, then push
git add .
git commit -m "Fix build errors"
git push
```

### Environment Variables Not Working
**Check:**
- Variables are set in Azure Configuration
- Variable names match exactly
- API keys are valid

**Fix:**
1. Go to Azure Portal
2. Open your Static Web App
3. Click "Configuration"
4. Verify all variables are set
5. Save and redeploy

### Real-time Features Not Working
**Check:**
- Supabase URL is correct
- Supabase API key is valid
- CORS is configured in Supabase

**Fix:**
1. Go to Supabase Dashboard
2. Click Settings → API
3. Add your Azure URL to allowed origins
4. Save and redeploy

### Location Not Working
**Check:**
- HTTPS is enabled (Azure provides this)
- Browser permissions granted
- Google Maps API key valid

**Fix:**
1. Check browser geolocation permissions
2. Verify Google Maps API key
3. Test on mobile device

### App Shows Blank Page
**Check:**
- Console errors (F12)
- Network requests failing
- Environment variables missing

**Fix:**
1. Open DevTools
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify environment variables

---

## 📈 Monitoring

### Azure Monitor
1. Go to Azure Portal
2. Open your Static Web App
3. Click "Metrics"
4. Monitor:
   - Response times
   - Error rates
   - Bandwidth usage
   - User activity

### Analytics
Azure provides built-in analytics for:
- Page views
- User sessions
- Geographic distribution
- Device types

---

## 💰 Pricing

### Free Tier (Perfect for Your App)
- ✅ 1 Static Web App
- ✅ 100 GB bandwidth/month
- ✅ Global CDN
- ✅ Custom domains
- ✅ SSL/HTTPS
- ✅ DDoS protection

### When to Upgrade
- > 100 GB bandwidth/month
- Need multiple apps
- Need advanced features

---

## 🎯 Production Checklist

- [ ] App builds successfully locally
- [ ] All environment variables set in Azure
- [ ] Supabase CORS configured
- [ ] Google Maps API key valid
- [ ] App loads without errors
- [ ] All dynamic features work
- [ ] Mobile installation works
- [ ] Performance is acceptable
- [ ] Security is configured

---

## 🚀 Deployment Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Build app | 1 min |
| 2 | Create Azure app | 2 min |
| 3 | Configure settings | 1 min |
| 4 | Set environment variables | 1 min |
| 5 | Deploy | 2 min |
| **Total** | | **7 minutes** |

---

## 🎉 You're Ready!

Your dynamic Local Services Marketplace app is ready for Azure deployment!

### Next Steps:
1. **Build your app**: `npm run build`
2. **Create Azure Static Web App**
3. **Configure environment variables**
4. **Deploy and test**
5. **Share with users!**

---

## 📞 Support Resources

- **Azure Docs**: https://docs.microsoft.com/azure/static-web-apps/
- **Vite Guide**: https://vitejs.dev/guide/static-deploy.html#azure-static-web-apps
- **Supabase Docs**: https://supabase.com/docs
- **Google Gemini Docs**: https://ai.google.dev/docs

---

**Deploy your dynamic app to Azure now! 🚀**

**Your app will be live in minutes with full dynamic functionality!**
