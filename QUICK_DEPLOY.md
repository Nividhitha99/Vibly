# Quick Deployment Guide

## 🚨 Before You Deploy - BACKUP YOUR DATA!

```bash
# Run backup script
node backend/scripts/backupDatabase.js
```

This creates a backup in `backups/` directory.

## Option 1: Railway (Easiest - Recommended)

### Step 1: Backup Data
```bash
node backend/scripts/backupDatabase.js
```

### Step 2: Deploy Backend
1. Go to [railway.app](https://railway.app)
2. Sign up/login
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your Vibly repository
5. Railway will auto-detect it's a Node.js app

### Step 3: Configure Environment Variables
In Railway dashboard, go to Variables tab and add:
```
GEMINI_KEY=AIzaSyC9f18CZUqQE4OEh3bYPtaKr0xTW9HVTcI
TMDB_API_KEY=e3f340ed60a45e0fd320fb3e4b624b3c
SPOTIFY_CLIENT_ID=ecd944e392f245a7a893dceacfca6834
SPOTIFY_CLIENT_SECRET=1e2c66214bae4630a2513415864bd993
YOUTUBE_API_KEY=AIzaSyD1MV5ve8UtKrxLJNAdjQemTqe_3UzGRuo
PORT=5001
NODE_ENV=production
```

### Step 4: Preserve Database
1. In Railway, go to your service
2. Click "Settings" → "Volumes"
3. Add a volume mount: `/app/backend/db.json`
4. **IMPORTANT**: After first deploy, upload your `backend/db.json` file to this volume

### Step 5: Update Build Settings
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

### Step 6: Deploy Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Root Directory: `frontend/vibly-ui`
4. Build Command: `npm run build`
5. Output Directory: `build`
6. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-railway-app.railway.app
   ```

### Step 7: Update CORS
In Railway, add to environment variables:
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.vercel.app
```

## Option 2: Render (Free Tier)

### Backend:
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Name: `vibly-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
5. Add environment variables (same as Railway)
6. **CRITICAL**: Use Render's persistent disk for `db.json`

### Frontend:
1. New → Static Site
2. Connect GitHub repo
3. Settings:
   - Root Directory: `frontend/vibly-ui`
   - Build Command: `npm run build`
   - Publish Directory: `build`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com
   ```

## Option 3: Heroku

### Step 1: Install Heroku CLI
```bash
# Download from heroku.com
```

### Step 2: Login
```bash
heroku login
```

### Step 3: Create App
```bash
cd backend
heroku create your-app-name
```

### Step 4: Set Environment Variables
```bash
heroku config:set GEMINI_KEY=your_key
heroku config:set TMDB_API_KEY=your_key
# ... set all other vars
```

### Step 5: Deploy
```bash
git push heroku main
```

### Step 6: Upload Database
```bash
# Use Heroku Postgres addon (recommended)
heroku addons:create heroku-postgresql:hobby-dev

# Or use Heroku Filesystem (ephemeral - not recommended)
```

## Post-Deployment Checklist

- [ ] Backup created before deployment
- [ ] Backend is accessible (test `/health` endpoint)
- [ ] Database file is preserved/uploaded
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] Frontend API URL updated
- [ ] Test login/signup
- [ ] Test matching functionality
- [ ] Verify existing users are still there

## Emergency: Restore Database

If data is lost:
```bash
node backend/scripts/restoreDatabase.js db_backup_latest.json
```

## Monitoring

- Check logs regularly
- Set up error monitoring (Sentry, etc.)
- Monitor API usage (Gemini, TMDB, etc.)

---

**Remember**: JSON file databases are NOT production-ready. Consider migrating to MongoDB or PostgreSQL for better reliability.

