# Deployment Guide - Preserving Existing Data

## 🚨 IMPORTANT: Backup Your Data First!

Before deploying, **ALWAYS backup your `backend/db.json` file** which contains all your user data, matches, preferences, etc.

## Step 1: Backup Current Data

### Option A: Manual Backup
```bash
# Create a backup directory
mkdir backups
# Copy db.json with timestamp
cp backend/db.json backups/db_backup_$(date +%Y%m%d_%H%M%S).json
```

### Option B: Git Backup (Recommended)
```bash
# Commit current db.json to a backup branch
git checkout -b backup-before-deploy
git add backend/db.json
git commit -m "Backup db.json before deployment"
git push origin backup-before-deploy
git checkout main
```

## Step 2: Choose Deployment Platform

### Option 1: Railway (Recommended for Node.js + JSON DB)
- **Pros**: Easy setup, persistent storage, supports file-based databases
- **Cons**: Paid after free tier

**Steps:**
1. Sign up at [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Add environment variables:
   - `GEMINI_KEY=your_key`
   - `TMDB_API_KEY=your_key`
   - `SPOTIFY_CLIENT_ID=your_key`
   - `SPOTIFY_CLIENT_SECRET=your_key`
   - `YOUTUBE_API_KEY=your_key`
   - `PORT=5001`
4. **CRITICAL**: Upload `db.json` as a volume or use Railway's persistent storage
5. Set build command: `cd backend && npm install`
6. Set start command: `cd backend && npm start`

### Option 2: Render
- **Pros**: Free tier, persistent disk storage
- **Cons**: Slower cold starts

**Steps:**
1. Sign up at [render.com](https://render.com)
2. Create new Web Service → Connect GitHub
3. Settings:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: Node
4. Add environment variables (same as Railway)
5. **CRITICAL**: Use Render's persistent disk for `db.json`

### Option 3: Heroku
- **Pros**: Well-established, good documentation
- **Cons**: No free tier anymore

**Steps:**
1. Install Heroku CLI
2. Create `Procfile` in backend:
   ```
   web: node server.js
   ```
3. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set GEMINI_KEY=your_key
   # ... set other env vars
   git push heroku main
   ```
4. **CRITICAL**: Use Heroku add-ons for persistent storage or migrate to PostgreSQL

### Option 4: Vercel/Netlify (Frontend) + Separate Backend
- **Pros**: Best for frontend, free tier
- **Cons**: Need separate backend hosting

**Frontend (Vercel/Netlify):**
```bash
cd frontend/vibly-ui
npm run build
# Deploy build folder to Vercel/Netlify
```

**Backend**: Use Railway, Render, or Heroku (see above)

## Step 3: Preserve Database During Deployment

### Method 1: Use Persistent Storage (Recommended)

**For Railway:**
1. Add a volume mount for `backend/db.json`
2. The file persists across deployments

**For Render:**
1. Use Render's persistent disk
2. Store `db.json` in `/opt/render/project/src/backend/db.json`

**For Heroku:**
1. Use Heroku Postgres (migrate from JSON)
2. Or use Heroku Filesystem (ephemeral - not recommended)

### Method 2: Database Migration (Best for Production)

**Migrate to MongoDB Atlas (Free):**
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Update `backend/utils/db.js` to use MongoDB instead of lowdb
5. Run migration script to transfer data

**Migrate to PostgreSQL:**
1. Use Railway/Render PostgreSQL add-on
2. Create schema matching your JSON structure
3. Write migration script

### Method 3: Backup Before Each Deploy

Create a deployment script:

```bash
#!/bin/bash
# deploy.sh

# 1. Backup database
cp backend/db.json backups/db_backup_$(date +%Y%m%d_%H%M%S).json

# 2. Pull latest code
git pull origin main

# 3. Restore database if needed (only if db.json was overwritten)
# cp backups/db_backup_latest.json backend/db.json

# 4. Install dependencies
cd backend && npm install
cd ../frontend/vibly-ui && npm install

# 5. Build frontend
cd ../frontend/vibly-ui && npm run build

# 6. Restart services (depends on your hosting)
# pm2 restart all
# or
# systemctl restart your-app
```

## Step 4: Environment Variables

Create `.env` file in backend (don't commit to Git):

```env
GEMINI_KEY=AIzaSyC9f18CZUqQE4OEh3bYPtaKr0xTW9HVTcI
TMDB_API_KEY=your_tmdb_key
SPOTIFY_CLIENT_ID=your_spotify_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret
YOUTUBE_API_KEY=your_youtube_key
PORT=5001
NODE_ENV=production
```

**Add to `.gitignore`:**
```
backend/.env
backend/db.json
backups/
```

## Step 5: Update Frontend API URLs

Update `frontend/vibly-ui/src/utils/api.js` or directly in components:

```javascript
// For production
const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend.railway.app';

// For development
// const API_URL = 'http://localhost:5001';
```

Set `REACT_APP_API_URL` in Vercel/Netlify environment variables.

## Step 6: CORS Configuration

Update `backend/app.js`:

```javascript
const cors = require("cors");

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app',
    'https://your-frontend.netlify.app'
  ],
  credentials: true
}));
```

## Step 7: Deployment Checklist

- [ ] Backup `backend/db.json`
- [ ] Set all environment variables
- [ ] Update CORS settings
- [ ] Update frontend API URLs
- [ ] Test locally with production settings
- [ ] Deploy backend first
- [ ] Verify backend is accessible
- [ ] Deploy frontend
- [ ] Test end-to-end
- [ ] Monitor logs for errors

## Step 8: Post-Deployment

1. **Verify Data Integrity:**
   ```bash
   # Check if users are still there
   curl https://your-backend.railway.app/api/user/all
   ```

2. **Monitor Logs:**
   - Railway: Dashboard → Logs
   - Render: Dashboard → Logs
   - Heroku: `heroku logs --tail`

3. **Set up Automated Backups:**
   - Schedule daily backups of `db.json`
   - Store backups in S3, Google Drive, or Git

## Recommended: Migrate to Proper Database

For production, consider migrating from JSON to a real database:

### MongoDB Migration Script

```javascript
// backend/scripts/migrateToMongo.js
const mongoose = require('mongoose');
const getDb = require('../utils/db');

async function migrate() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Read JSON data
  const db = await getDb();
  const data = db.data;
  
  // Migrate users
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  await User.insertMany(data.users);
  
  // Migrate other collections...
  
  console.log('Migration complete!');
  process.exit(0);
}

migrate();
```

## Quick Deploy Commands

### Railway
```bash
railway login
railway init
railway up
```

### Render
```bash
# Just push to GitHub, Render auto-deploys
git push origin main
```

### Heroku
```bash
heroku create your-app
git push heroku main
```

## Emergency Data Recovery

If data is lost:

```bash
# Restore from backup
cp backups/db_backup_YYYYMMDD_HHMMSS.json backend/db.json

# Or from Git backup branch
git checkout backup-before-deploy -- backend/db.json
```

---

**⚠️ WARNING**: JSON file-based databases are NOT recommended for production. Consider migrating to MongoDB, PostgreSQL, or another database service for better reliability and scalability.

