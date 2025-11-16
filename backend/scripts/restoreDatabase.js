const fs = require('fs');
const path = require('path');

/**
 * Restore database from backup
 * Usage: node scripts/restoreDatabase.js [backup_file]
 * Example: node scripts/restoreDatabase.js db_backup_latest.json
 */

const backupDir = path.join(__dirname, '../../backups');
const dbPath = path.join(__dirname, '../db.json');

// Get backup file from command line argument or use latest
const backupFile = process.argv[2] || 'db_backup_latest.json';
const backupPath = path.join(backupDir, backupFile);

if (!fs.existsSync(backupPath)) {
  console.error(`❌ Backup file not found: ${backupPath}`);
  console.log('\nAvailable backups:');
  const backups = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  backups.forEach(b => console.log(`   - ${b}`));
  process.exit(1);
}

try {
  // Read backup
  const backupData = fs.readFileSync(backupPath, 'utf8');
  
  // Validate JSON
  JSON.parse(backupData);
  
  // Backup current database first
  const currentBackupPath = path.join(backupDir, `db_before_restore_${Date.now()}.json`);
  if (fs.existsSync(dbPath)) {
    const currentData = fs.readFileSync(dbPath, 'utf8');
    fs.writeFileSync(currentBackupPath, currentData, 'utf8');
    console.log(`📦 Current database backed up to: ${currentBackupPath}`);
  }
  
  // Restore from backup
  fs.writeFileSync(dbPath, backupData, 'utf8');
  
  const stats = fs.statSync(backupPath);
  console.log('✅ Database restored successfully!');
  console.log(`📁 Restored from: ${backupPath}`);
  console.log(`📊 Restored size: ${(stats.size / 1024).toFixed(2)} KB`);
  
  // Count records
  const data = JSON.parse(backupData);
  console.log(`\n📈 Restored Database Statistics:`);
  console.log(`   Users: ${data.users?.length || 0}`);
  console.log(`   Matches: ${data.matches?.length || 0}`);
  console.log(`   Tastes: ${data.tastes?.length || 0}`);
  console.log(`   Embeddings: ${data.embeddings?.length || 0}`);
  console.log(`   Notifications: ${data.notifications?.length || 0}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Restore failed:', error.message);
  process.exit(1);
}

