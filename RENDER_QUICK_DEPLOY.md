# Render.com Quick Deploy - 10 Minutes

## 🚀 Fastest Way to Get Your App Live

Render.com offers free tier hosting that deploys in ~5 minutes from GitHub.

---

## Step 1: Push to GitHub (2 min)

**If your code isn't on GitHub yet:**

```bash
# Make sure you're in the project directory
cd C:\Users\nived\OneDrive\Desktop\Vibly

# Check git status
git status

# Add and commit any changes
git add .
git commit -m "Ready for deployment"

# Push to GitHub
git push origin main
```

**If you don't have a GitHub repo:**
1. Go to https://github.com/new
2. Create new repository: `Vibly`
3. Don't initialize with README
4. Copy the commands it shows and run them

---

## Step 2: Create Render Account (1 min)

1. Go to https://render.com
2. Sign up with GitHub (easiest)
3. Authorize Render to access your repositories

---

## Step 3: Deploy Backend (3 min)

1. **Dashboard** → **New** → **Web Service**

2. **Connect GitHub** → Select `Vibly` repository

3. **Configure:**
   - **Name**: `vibly-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Root Directory**: `backend`

4. **Environment Variables** → Add:
   ```
   GEMINI_KEY=AIzaSyC9f18CZUqQE4OEh3bYPtaKr0xTW9HVTcI
   TMDB_API_KEY=e3f340ed60a45e0fd320fb3e4b624b3c
   SPOTIFY_CLIENT_ID=ecd944e392f245a7a893dceacfca6834
   SPOTIFY_CLIENT_SECRET=1e2c66214bae4630a2513415864bd993
   YOUTUBE_API_KEY=AIzaSyD1MV5ve8UtKrxLJNAdjQemTqe_3UzGRuo
   PORT=10000
   NODE_ENV=production
   ```

5. **Plan**: Free

6. **Create Web Service**

7. **Wait 3-5 minutes** for deployment

8. **Note your backend URL**: `https://vibly-backend.onrender.com`

---

## Step 4: Upload Database (2 min)

**Option A: Via Render Shell (Easiest)**

1. Go to your service → **Shell** tab
2. Click **Open Shell**
3. Upload `db.json`:
   ```bash
   # In Render shell
   cd backend
   # Use the upload button in Render shell or:
   # Create a temporary file and paste your db.json content
   ```

**Option B: Via GitHub (Recommended)**

1. **Temporarily** add `db.json` to your repo:
   ```bash
   git add backend/db.json
   git commit -m "Add db.json for deployment"
   git push origin main
   ```
2. After deployment, remove it:
   ```bash
   git rm --cached backend/db.json
   git commit -m "Remove db.json from repo"
   git push origin main
   ```

**Option C: Use Render Persistent Disk (Best)**

1. Go to your service → **Settings** → **Persistent Disk**
2. **Mount Path**: `/opt/render/project/src/backend`
3. **Size**: 1 GB (free)
4. Upload `db.json` via Shell after disk is mounted

---

## Step 5: Deploy Frontend (3 min)

1. **Dashboard** → **New** → **Static Site**

2. **Connect GitHub** → Select `Vibly` repository

3. **Configure:**
   - **Name**: `vibly-frontend`
   - **Root Directory**: `frontend/vibly-ui`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Note:** The `.npmrc` file automatically handles peer dependency conflicts

4. **Environment Variables** → Add:
   ```
   REACT_APP_API_URL=https://vibly-backend.onrender.com
   ```

5. **Create Static Site**

6. **Wait 2-3 minutes** for deployment

7. **Your frontend URL**: `https://vibly-frontend.onrender.com`

---

## Step 6: Update CORS (1 min)

1. Go to backend service → **Environment**
2. Add:
   ```
   ALLOWED_ORIGINS=https://vibly-frontend.onrender.com
   ```
3. **Save Changes** → Service will redeploy

---

## ✅ Done!

**Your app is live:**
- **Frontend**: `https://vibly-frontend.onrender.com`
- **Backend**: `https://vibly-backend.onrender.com`

---

## Important Notes

### Free Tier Limitations:
- **Spins down after 15 min inactivity** (takes ~30 sec to wake up)
- **750 hours/month free** (enough for 6 hours)
- **512 MB RAM** (should be fine for your app)

### To Keep It Active:
- Visit the frontend URL every 10-15 minutes, OR
- Use a free uptime monitor like https://uptimerobot.com

### Database Persistence:
- Use **Persistent Disk** (free 1 GB) for `db.json`
- Or use a free database like **MongoDB Atlas** (better for production)

---

## Troubleshooting

**Backend not responding:**
- Check logs: Service → **Logs** tab
- Verify environment variables are set
- Check if service is "Live" (green)

**Frontend can't connect:**
- Verify `REACT_APP_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend CORS includes frontend URL

**Database not persisting:**
- Use Persistent Disk (Settings → Persistent Disk)
- Mount path: `/opt/render/project/src/backend`

---

## Quick Commands

```bash
# View backend logs
# Go to Render dashboard → Your service → Logs

# Restart service
# Go to Render dashboard → Your service → Manual Deploy → Clear build cache & deploy
```

---

**Total Time: ~10 minutes**

**Your app will be live for 6+ hours on free tier!**

