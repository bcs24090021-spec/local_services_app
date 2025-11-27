# 🚀 Deploy to Azure Static Web Apps

Azure Static Web Apps is perfect for your React/Vite app. Here's how to deploy:

---

## 📋 Prerequisites

1. **Azure Account** (free tier available)
   - Sign up at: https://azure.microsoft.com/free/

2. **GitHub Account** (required for Azure deployment)
   - Sign up at: https://github.com/signup

3. **Your code on GitHub**
   - Push your project to GitHub

---

## 🔧 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Local Services Marketplace"

# Create main branch
git branch -M main

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/local-services-marketplace.git

# Push to GitHub
git push -u origin main
```

### Step 2: Create Azure Static Web App

1. **Go to Azure Portal**:
   - Visit: https://portal.azure.com

2. **Create New Resource**:
   - Click "Create a resource"
   - Search for "Static Web App"
   - Click "Create"

3. **Fill in Details**:
   - **Resource Group**: Create new or select existing
   - **Name**: `local-services-marketplace`
   - **Plan Type**: Free
   - **Region**: Select closest to you (e.g., Southeast Asia)

4. **GitHub Connection**:
   - Click "Sign in with GitHub"
   - Authorize Azure to access your GitHub
   - **Organization**: Select your GitHub username
   - **Repository**: `local-services-marketplace`
   - **Branch**: `main`

5. **Build Details**:
   - **Build Presets**: `Vite`
   - **App location**: `/`
   - **API location**: Leave empty
   - **Output location**: `dist`

6. **Review & Create**:
   - Click "Create"
   - Wait for deployment (2-3 minutes)

### Step 3: Set Environment Variables

1. **Go to Configuration**:
   - In Azure Portal, open your Static Web App
   - Click "Configuration" in left menu

2. **Add Application Settings**:
   - Click "New application setting"
   - Add these variables:
     ```
     VITE_GOOGLE_GEMINI_API_KEY=your_api_key
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_key
     ```

3. **Save**:
   - Click "Save"
   - Wait for configuration to update

### Step 4: Verify Deployment

1. **Check Status**:
   - Go to "Overview" in Azure Portal
   - Look for your app URL
   - Click the URL to open your app

2. **Your App is Live!** 🎉
   - URL format: `https://your-app-name.azurestaticapps.net`

---

## 🔄 Auto-Deployment

Once connected to GitHub, every push to `main` branch automatically deploys:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Azure automatically deploys! ✅
```

---

## 📱 Install on Mobile

### iOS (Safari)
1. Open your Azure URL
2. Tap Share (⬆️)
3. Tap "Add to Home Screen"

### Android (Chrome)
1. Open your Azure URL
2. Tap Menu (⋮)
3. Tap "Install app"

---

## 🆘 Troubleshooting

### Build Fails
**Check build logs:**
1. Go to Azure Portal
2. Click "Build History"
3. View failed build details
4. Fix issues and push again

### Environment Variables Not Working
**Solution:**
1. Verify variables are set in Configuration
2. Rebuild: Push empty commit
   ```bash
   git commit --allow-empty -m "Trigger rebuild"
   git push
   ```

### App Shows Blank Page
**Solution:**
1. Check browser console (F12)
2. Verify API keys are correct
3. Check CORS settings in Supabase

### Location Sharing Not Working
**Solution:**
1. Ensure HTTPS (Azure provides this)
2. Check browser geolocation permissions
3. Verify Google Maps API key

---

## 💰 Pricing

**Azure Static Web Apps Free Tier:**
- ✅ 1 free app
- ✅ 100 GB bandwidth/month
- ✅ Custom domains
- ✅ SSL/HTTPS included
- ✅ Auto-scaling

**Perfect for your app!**

---

## 🎯 Custom Domain (Optional)

1. **Go to Custom Domains**:
   - In Azure Portal, click "Custom domains"
   - Click "Add"

2. **Enter Domain**:
   - Type your domain name
   - Follow DNS configuration steps

3. **Verify & Deploy**:
   - Update DNS records
   - Azure verifies and deploys

---

## 📊 Monitoring

**View Analytics:**
1. Go to "Overview" in Azure Portal
2. See traffic, errors, and performance
3. Monitor bandwidth usage

---

## 🔐 Security

**Azure provides:**
- ✅ HTTPS/SSL by default
- ✅ DDoS protection
- ✅ WAF (Web Application Firewall)
- ✅ Automatic backups

---

## 🚀 Deployment Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Push to GitHub | 1 min |
| 2 | Create Azure App | 2 min |
| 3 | Set Environment Variables | 1 min |
| 4 | Verify Deployment | 1 min |
| **Total** | | **5 minutes** |

---

## 📞 Support

- **Azure Docs**: https://docs.microsoft.com/azure/static-web-apps/
- **Vite Guide**: https://vitejs.dev/guide/static-deploy.html#azure-static-web-apps
- **Azure Support**: https://azure.microsoft.com/support/

---

## ✅ Checklist

- [ ] GitHub account created
- [ ] Code pushed to GitHub
- [ ] Azure account created
- [ ] Static Web App created
- [ ] GitHub connected
- [ ] Environment variables set
- [ ] App deployed and live
- [ ] Mobile installation tested

---

**Your app is now deployed on Azure! 🎉**

**Next: Test on mobile and share with users!**
