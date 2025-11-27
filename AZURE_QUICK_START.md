# ⚡ Azure Deployment - Quick Start

## 🎯 Deploy in 5 Minutes

### Step 1: Run Deployment Script

**Windows (PowerShell):**
```powershell
.\deploy-azure.bat
```

**Mac/Linux:**
```bash
bash deploy-azure.sh
```

This will:
- ✅ Build your app
- ✅ Initialize Git (if needed)
- ✅ Push to GitHub

### Step 2: Create Azure Static Web App

1. Go to: https://portal.azure.com
2. Click "Create a resource"
3. Search for "Static Web App"
4. Click "Create"

### Step 3: Configure

**Basic Settings:**
- Name: `local-services-marketplace`
- Region: Select your region
- Plan: Free
- GitHub: Sign in and authorize

**Build Details:**
- Build Presets: **Vite**
- App location: `/`
- Output location: `dist`

### Step 4: Set Environment Variables

1. Go to your Static Web App in Azure Portal
2. Click "Configuration"
3. Add these variables:
   ```
   VITE_GOOGLE_GEMINI_API_KEY=your_key
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. Click "Save"

### Step 5: Deploy

- Click "Create"
- Azure automatically builds and deploys
- Wait 2-3 minutes
- Your app is live! 🎉

---

## 📱 Your App URL

Once deployed, you'll get a URL like:
```
https://local-services-marketplace.azurestaticapps.net
```

---

## 📱 Install on Phone

### iOS
1. Open URL in Safari
2. Tap Share (⬆️)
3. Tap "Add to Home Screen"
4. Tap "Add"

### Android
1. Open URL in Chrome
2. Tap Menu (⋮)
3. Tap "Install app"
4. Tap "Install"

---

## 🔄 Auto-Deploy

Every time you push to GitHub, Azure automatically deploys:

```bash
git add .
git commit -m "Your changes"
git push
```

Your app updates in seconds! ✨

---

## 📋 Checklist

- [ ] Run deployment script
- [ ] Create Azure account (free)
- [ ] Create Static Web App
- [ ] Connect GitHub
- [ ] Set environment variables
- [ ] Verify deployment
- [ ] Test on mobile
- [ ] Share with users

---

## 🆘 Issues?

**Build fails?**
- Check build logs in Azure Portal
- Verify `dist` folder exists
- Run `npm run build` locally first

**App shows blank?**
- Check browser console (F12)
- Verify API keys are correct
- Check CORS in Supabase

**Location not working?**
- Ensure HTTPS (Azure provides this)
- Check browser permissions
- Verify Google Maps API key

---

## 📞 Help

- **Azure Docs**: https://docs.microsoft.com/azure/static-web-apps/
- **Vite Guide**: https://vitejs.dev/guide/static-deploy.html#azure-static-web-apps
- **Full Guide**: See `AZURE_DEPLOYMENT.md`

---

**Your app is ready for Azure! 🚀**

**Run the deployment script and follow the steps above!**
