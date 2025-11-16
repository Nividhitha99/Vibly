#!/bin/bash

# Deployment script with data preservation
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Step 1: Backup database
echo "📦 Backing up database..."
BACKUP_DIR="../backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp db.json "$BACKUP_DIR/db_backup_$TIMESTAMP.json"
echo "✅ Backup created: $BACKUP_DIR/db_backup_$TIMESTAMP.json"

# Step 2: Create latest backup symlink
ln -sf "db_backup_$TIMESTAMP.json" "$BACKUP_DIR/db_backup_latest.json"

# Step 3: Install/update dependencies
echo "📥 Installing dependencies..."
npm install

# Step 4: Run any migration scripts if needed
# echo "🔄 Running migrations..."
# node scripts/updateUsersWithSexualitySystem.js

# Step 5: Verify database integrity
echo "🔍 Verifying database..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('db.json', 'utf8'));
console.log('Users:', data.users?.length || 0);
console.log('Matches:', data.matches?.length || 0);
console.log('✅ Database is valid');
"

echo "✅ Deployment preparation complete!"
echo "📝 Next steps:"
echo "   1. Review the backup: $BACKUP_DIR/db_backup_$TIMESTAMP.json"
echo "   2. Deploy to your hosting platform"
echo "   3. Ensure db.json is preserved in persistent storage"

