# 🚨 Quick Fix: Database Not Working on Render

## Problem
- ✅ Can login locally
- ❌ Can't login on Render
- **Cause:** `db.json` file is missing on Render

## 30-Second Fix

1. **Render Dashboard** → Your backend service (`vibly-backend`)

2. **Click "Shell" tab** → **Open Shell**

3. **Click "Upload" button** (in the shell interface)

4. **Select your local file:** `C:\Users\nived\OneDrive\Desktop\Vibly\backend\db.json`

5. **Wait 30 seconds** (Render auto-detects file changes)

6. **Try logging in again** - Should work now! ✅

---

## Verify It Worked

**In Render Shell:**
```bash
ls -la db.json
# Should show: -rw-r--r-- 1 ... 320000 ... db.json
```

**Check Logs:**
- Go to **Logs** tab
- Should see database initialization messages
- Should NOT see "ENOENT" or "file not found" errors

---

## Make It Permanent (Optional)

**Use Persistent Disk so database survives redeploys:**

1. Backend service → **Settings** → **Persistent Disk**
2. **Add Disk:**
   - Mount: `/opt/render/project/src/backend/data`
   - Size: 1 GB
3. **Environment** → Add: `DB_PATH=/opt/render/project/src/backend/data/db.json`
4. **Move db.json:**
   ```bash
   mkdir -p /opt/render/project/src/backend/data
   cp db.json /opt/render/project/src/backend/data/db.json
   ```

---

**That's it! Your login should work now.** 🎉

