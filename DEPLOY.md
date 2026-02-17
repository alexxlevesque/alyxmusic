# 🚀 Deploying to Vercel

This guide will help you deploy your Shuffle music player to Vercel.

## Quick Deploy

### Step 1: Add Environment Variables to Vercel

Since your `.env` file is gitignored (for security), you need to add the Firebase credentials directly in Vercel:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or import it from GitHub if you haven't)
3. Go to **Settings** → **Environment Variables**
4. Add each of these variables:

| Variable Name | Value (from your .env file) |
|---------------|----------------------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyA1SI9jm6cGiD0hZf3pZEF0dahfBHbaa7I` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `music-player-17e4a.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `music-player-17e4a` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `music-player-17e4a.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `426784003829` |
| `VITE_FIREBASE_APP_ID` | `1:426784003829:web:615ecf2f5ef725780097bc` |

**Important:** Make sure to select **All** environments (Production, Preview, and Development) for each variable.

### Step 2: Redeploy

After adding the environment variables:
1. Go to **Deployments** tab
2. Click the **three dots** (•••) on the latest deployment
3. Click **Redeploy**
4. Check **"Use existing Build Cache"** is OFF (to ensure fresh build with new env vars)
5. Click **Redeploy**

### Step 3: Verify

Once deployed:
1. Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
2. Check the bottom of the page — it should show "X tracks in library"
3. Click "Shuffle Random Track" to test playback

---

## Alternative: Deploy via CLI

If you prefer using the Vercel CLI:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables via CLI
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID

# Redeploy to production
vercel --prod
```

---

## Troubleshooting

### "Could not connect to music library" on Vercel

**Cause:** Environment variables are missing or incorrect.

**Fix:**
1. Double-check all 6 environment variables are added in Vercel Settings
2. Make sure there are no extra spaces or quotes around the values
3. Redeploy after adding/fixing variables

### CORS errors on deployed site

**Cause:** Firebase Storage rules might not allow your Vercel domain.

**Fix:**
Your current Firebase Storage rules allow all reads, so this shouldn't be an issue. If you see CORS errors:
1. Go to Firebase Console → Storage → Rules
2. Verify the rules allow `read: if true` for the `/music` path
3. If needed, add your Vercel domain to Firebase's authorized domains:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add your Vercel domain (e.g., `your-project.vercel.app`)

### Build fails on Vercel

**Cause:** Missing dependencies or build configuration.

**Fix:**
1. Make sure `package.json` has all dependencies
2. Verify the build command is `vite build` in `package.json`
3. Check Vercel build logs for specific errors

---

## Production Checklist

Before going live:

- [ ] All 6 Firebase environment variables added to Vercel
- [ ] Firebase Storage rules published (allow read on `/music/**`)
- [ ] Music files uploaded to Firebase Storage `/music` folder
- [ ] Test deployment works (can see track count and play music)
- [ ] (Optional) Set up custom domain in Vercel Settings

---

## Custom Domain

To use a custom domain:
1. Go to Vercel project → **Settings** → **Domains**
2. Add your domain (e.g., `music.yourdomain.com`)
3. Follow Vercel's DNS configuration instructions
4. Add the domain to Firebase authorized domains (if using Authentication)

---

**Your app should now be live!** 🎉
