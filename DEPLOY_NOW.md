# 🚀 Deploy in 10 Minutes - Step by Step

## Quickest Path to Live App

### 1. Push to GitHub (2 min)

```bash
cd C:\Users\nived\OneDrive\Desktop\Vibly
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

**If no GitHub repo exists:**
- Go to https://github.com/new
- Create repo: `Vibly`
- Run the commands GitHub shows

---

### 2. Sign Up Render (1 min)

- Go to https://render.com
- **Sign up with GitHub** (one click)

---

### 3. Deploy Backend (3 min)

1. **New** → **Web Service**
2. **Connect** your `Vibly` repo
3. **Settings:**
   - Name: `vibly-backend`
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `node server.js`
4. **Environment Variables:**
   ```
   GEMINI_KEY=AIzaSyC9f18CZUqQE4OEh3bYPtaKr0xTW9HVTcI
   TMDB_API_KEY=e3f340ed60a45e0fd320fb3e4b624b3c
   SPOTIFY_CLIENT_ID=ecd944e392f245a7a893dceacfca6834
   SPOTIFY_CLIENT_SECRET=1e2c66214bae4630a2513415864bd993
   YOUTUBE_API_KEY=AIzaSyD1MV5ve8UtKrxLJNAdjQemTqe_3UzGRuo
   PORT=10000
   NODE_ENV=production
   ```
5. **Create** → Wait 3-5 min
6. **Copy backend URL**: `https://vibly-backend.onrender.com`

---

### 4. Upload Database (2 min) ⚠️ CRITICAL STEP

**Method 1: Via Render Shell (Recommended)**

1. Go to backend service → **Shell** tab
2. Click **Open Shell**
3. Click **Upload** button in the shell
4. Select your local `backend/db.json` file
5. Verify: `ls -la db.json` (should show file size)
6. Service will auto-restart

**Method 2: Via GitHub (Temporary)**

```bash
git add backend/db.json
git commit -m "Add db for deployment"
git push
# After deploy, remove: git rm --cached backend/db.json && git push
```

**⚠️ Without db.json, login won't work!**

---

### 5. Deploy Frontend (2 min)

1. **New** → **Static Site**
2. **Connect** your `Vibly` repo
3. **Settings:**
   - Name: `vibly-frontend`
   - Root Directory: `frontend/vibly-ui`
   - Build: `npm install && npm run build`
   - Publish: `build`
   - **Note:** The `.npmrc` file will automatically use `--legacy-peer-deps`
4. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://vibly-backend.onrender.com
   ```
5. **Create** → Wait 2-3 min

---

### 6. Update CORS (1 min)

1. Backend service → **Environment**
2. Add: `ALLOWED_ORIGINS=https://vibly-frontend.onrender.com`
3. **Save** (auto-redeploys)

---

## ✅ Done!

**Your app:** `https://vibly-frontend.onrender.com`

**Keep it awake:** Visit every 10-15 min (or use uptimerobot.com)

---

**Total time: ~10 minutes**

