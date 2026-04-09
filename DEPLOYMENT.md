# 🚀 Deployment Guide

This guide will help you deploy Series Killer to various platforms.

## 📋 Pre-deployment Checklist

Before deploying, make sure you have:

- ✅ [ ] A Supabase project set up
- ✅ [ ] Environment variables configured
- ✅ [ ] Your code pushed to a Git repository (GitHub, GitLab, etc.)
- ✅ [ ] Node.js 18+ installed locally

## 🌐 Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Pros:** Free, automatic deployments, great performance, easy setup
**Cons:** None for this use case

#### Step-by-step:

1. **Install Vercel CLI**
  ```bash
   npm i -g vercel
  ```
2. **Login to Vercel**
  ```bash
   vercel login
  ```
3. **Deploy**
  ```bash
   npm run deploy
  ```
4. **Follow the prompts:**
  - Link to existing project? → No
  - Project name → series-killer (or your preferred name)
  - Directory → ./ (current directory)
  - Override settings? → No
5. **Add Environment Variables:**
  - Go to your Vercel dashboard
  - Navigate to your project
  - Go to Settings → Environment Variables
  - Add:
    - `VITE_SUPABASE_URL` = your_supabase_project_url
    - `VITE_SUPABASE_ANON_KEY` = your_supabase_anon_key
6. **Redeploy with environment variables:**
  ```bash
   vercel --prod
  ```

**Your app will be live at:** `https://your-project-name.vercel.app`

---

### Option 2: Netlify

**Pros:** Free, automatic deployments, great for static sites
**Cons:** Slightly more complex setup

#### Step-by-step:

1. **Push your code to GitHub**
2. **Go to Netlify:**
  - Visit [netlify.com](https://netlify.com)
  - Sign up/Login with GitHub
3. **Create new site:**
  - Click "New site from Git"
  - Choose GitHub
  - Select your repository
4. **Configure build settings:**
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Click "Deploy site"
5. **Add Environment Variables:**
  - Go to Site settings → Environment variables
  - Add:
    - `VITE_SUPABASE_URL` = your_supabase_project_url
    - `VITE_SUPABASE_ANON_KEY` = your_supabase_anon_key
6. **Trigger a new deployment:**
  - Go to Deploys tab
  - Click "Trigger deploy" → "Deploy site"

**Your app will be live at:** `https://your-site-name.netlify.app`

---

### Option 3: GitHub Pages

**Pros:** Free, integrated with GitHub
**Cons:** Requires manual deployment, no environment variables support

#### Step-by-step:

1. **Install gh-pages:**
  ```bash
   npm install --save-dev gh-pages
  ```
2. **Update package.json:**
  ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     },
     "homepage": "https://your-username.github.io/series-killer"
   }
  ```
3. **Deploy:**
  ```bash
   npm run deploy
  ```
4. **Enable GitHub Pages:**
  - Go to your GitHub repository
  - Settings → Pages
  - Source: Deploy from a branch
  - Branch: gh-pages
  - Save

**Your app will be live at:** `https://your-username.github.io/series-killer`

---

### Option 4: Firebase Hosting

**Pros:** Google's infrastructure, good performance
**Cons:** Requires Google account, slightly more complex

#### Step-by-step:

1. **Install Firebase CLI:**
  ```bash
   npm install -g firebase-tools
  ```
2. **Login to Firebase:**
  ```bash
   firebase login
  ```
3. **Initialize Firebase:**
  ```bash
   firebase init hosting
  ```
4. **Configure:**
  - Public directory: `dist`
  - Single-page app: Yes
  - GitHub Actions: No
5. **Deploy:**
  ```bash
   npm run build
   firebase deploy
  ```

**Your app will be live at:** `https://your-project-id.web.app`

---

## 🔧 Environment Variables

All platforms require these environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### How to get Supabase credentials:

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing
3. Go to Settings → API
4. Copy:
  - Project URL
  - anon/public key

## 🚨 Common Issues & Solutions

### Issue: "Page not found" on refresh

**Solution:** This is normal for SPAs. The deployment configs above handle this with redirects.

### Issue: Environment variables not working

**Solution:** Make sure to add them in your hosting platform's dashboard and redeploy.

### Issue: Build fails

**Solution:** 

1. Test locally: `npm run build`
2. Check for TypeScript errors: `npm run type-check`
3. Make sure all dependencies are installed: `npm install`

### Issue: CORS errors with Supabase

**Solution:** Add your domain to Supabase Auth → Settings → URL Configuration → Site URL.

## 📊 Performance Optimization

The build is already optimized with:

- ✅ Code splitting
- ✅ Tree shaking
- ✅ Gzip compression
- ✅ Asset caching
- ✅ Vendor chunk separation

## 🔄 Continuous Deployment

### Vercel/Netlify:

- Automatic deployments on every push to main branch
- Preview deployments for pull requests

### GitHub Pages:

- Manual deployment required
- Can be automated with GitHub Actions

## 🎉 Success!

Once deployed, your Series Killer app will be live and accessible to users worldwide!

Remember to:

- Test all features on the live site
- Update your README with the live URL
- Share your creation with the world! 🌍

