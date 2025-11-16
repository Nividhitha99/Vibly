# Upload Database to Render - Fix Login Issue

## Problem
You can login locally but not on Render = Database file (`db.json`) is missing on Render.

## Solution: Upload db.json to Render

### Method 1: Via Render Shell (Easiest - Recommended)

1. **Go to Render Dashboard** → Your backend service (`vibly-backend`)

2. **Click "Shell" tab** → **Open Shell**

3. **Check current directory:**
   ```bash
   pwd
   # Should show: /opt/render/project/src/backend
   ```

4. **Check if db.json exists:**
   ```bash
   ls -la db.json
   # If it says "No such file", we need to upload it
   ```

5. **In Render Shell, click the "Upload" button** (or use the upload icon)

6. **Select your local `backend/db.json` file**

7. **After upload, verify:**
   ```bash
   ls -la db.json
   # Should show the file with size ~320 KB or more
   ```

8. **Restart your service:**
   - Go to **Events** tab
   - Click **Manual Deploy** → **Deploy latest commit**
   - OR just wait - Render will auto-detect the file change

---

### Method 2: Via GitHub (Temporary - Less Secure)

**⚠️ Only use this if Method 1 doesn't work. Remove db.json from repo after deployment.**

1. **Temporarily add db.json to git:**
   ```bash
   git add backend/db.json
   git commit -m "Add db.json for deployment (temporary)"
   git push origin main
   ```

2. **Wait for Render to redeploy** (auto-deploys on push)

3. **After deployment succeeds, remove from git:**
   ```bash
   git rm --cached backend/db.json
   git commit -m "Remove db.json from repo"
   git push origin main
   ```

4. **Use Render Persistent Disk** (see Method 3) for permanent storage

---

### Method 3: Use Render Persistent Disk (Best for Production)

1. **Go to your backend service** → **Settings** tab

2. **Scroll to "Persistent Disk"** section

3. **Click "Add Persistent Disk"**

4. **Configure:**
   - **Mount Path**: `/opt/render/project/src/backend/data`
   - **Size**: 1 GB (free tier)
   - **Save**

5. **Wait for disk to be created** (~1 minute)

6. **Update environment variable:**
   - Go to **Environment** tab
   - Add: `DB_PATH=/opt/render/project/src/backend/data/db.json`
   - **Save Changes**

7. **Upload db.json via Shell:**
   ```bash
   # Create data directory
   mkdir -p /opt/render/project/src/backend/data
   
   # Upload db.json to this location (use Shell upload button)
   # Or copy from current location:
   cp db.json /opt/render/project/src/backend/data/db.json
   ```

8. **Restart service** (it will auto-restart after env var change)

---

## Verify Database is Working

1. **Check logs:**
   - Go to **Logs** tab
   - Look for: `[DB] Database initialized` or similar
   - Should NOT see: `Error: ENOENT: no such file or directory`

2. **Test login:**
   - Go to your frontend URL
   - Try logging in with your credentials
   - Should work now!

---

## Quick Fix (Fastest)

**If you just want it working NOW:**

1. Render Dashboard → Backend service → **Shell** tab
2. Click **Upload** button
3. Select `backend/db.json` from your local machine
4. Wait 30 seconds for service to detect change
5. Try logging in again

---

## Troubleshooting

**Still can't login after upload:**
- Check file permissions: `chmod 644 db.json`
- Check file location: `pwd` and `ls -la`
- Check logs for database errors
- Verify file size matches local: `ls -lh db.json`

**Database not persisting after restart:**
- Use Persistent Disk (Method 3)
- Database on regular filesystem gets wiped on redeploy

**File upload not working in Shell:**
- Use Method 2 (GitHub) as temporary workaround
- Then setup Persistent Disk

---

**After uploading, your login should work!** ✅

