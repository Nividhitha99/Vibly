const fs = require('fs');
const path = require('path');

/**
 * Backup database script
 * Usage: node scripts/backupDatabase.js
 */

const dbPath = path.join(__dirname, '../db.json');
const backupDir = path.join(__dirname, '../../backups');

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Generate timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `db_backup_${timestamp}.json`);

try {
  // Read current database
  const dbData = fs.readFileSync(dbPath, 'utf8');
  
  // Validate JSON
  JSON.parse(dbData);
  
  // Write backup
  fs.writeFileSync(backupPath, dbData, 'utf8');
  
  // Also create latest backup
  const latestBackupPath = path.join(backupDir, 'db_backup_latest.json');
  fs.writeFileSync(latestBackupPath, dbData, 'utf8');
  
  const stats = fs.statSync(dbPath);
  const backupStats = fs.statSync(backupPath);
  
  console.log('✅ Database backup created successfully!');
  console.log(`📁 Backup location: ${backupPath}`);
  console.log(`📊 Original size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📊 Backup size: ${(backupStats.size / 1024).toFixed(2)} KB`);
  
  // Count records
  const data = JSON.parse(dbData);
  console.log(`\n📈 Database Statistics:`);
  console.log(`   Users: ${data.users?.length || 0}`);
  console.log(`   Matches: ${data.matches?.length || 0}`);
  console.log(`   Tastes: ${data.tastes?.length || 0}`);
  console.log(`   Embeddings: ${data.embeddings?.length || 0}`);
  console.log(`   Notifications: ${data.notifications?.length || 0}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
}

