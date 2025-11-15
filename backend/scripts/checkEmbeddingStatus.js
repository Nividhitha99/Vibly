const getDb = require("../utils/db");

async function checkStatus() {
  const db = await getDb();
  const users = db.data.users || [];
  const tastes = db.data.tastes || [];
  const embeddings = db.data.embeddings || [];
  
  console.log('\n📊 User Embedding Status Report:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let ready = 0;
  let missingEmbedding = 0;
  let noPreferences = 0;
  
  users.forEach(u => {
    const taste = tastes.find(t => t.userId === u.id);
    const embedding = embeddings.find(e => e.userId === u.id);
    
    const hasPrefs = taste && (
      (taste.movies && taste.movies.length > 0) || 
      (taste.music && taste.music.length > 0) || 
      (taste.shows && taste.shows.length > 0)
    );
    
    const hasEmbedding = embedding && embedding.vector && Array.isArray(embedding.vector) && embedding.vector.length > 0;
    
    let status;
    if (hasPrefs && hasEmbedding) {
      status = '✅ Ready for Matching';
      ready++;
    } else if (hasPrefs) {
      status = '⚠️  Missing Embedding';
      missingEmbedding++;
    } else {
      status = '⏭️  No Preferences';
      noPreferences++;
    }
    
    const prefCount = hasPrefs ? 
      `${(taste.movies?.length || 0) + (taste.music?.length || 0) + (taste.shows?.length || 0)} prefs` : 
      'no prefs';
    
    console.log(`${status} - ${u.name} (${u.email}) - ${prefCount}`);
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nSummary:`);
  console.log(`  ✅ Ready for matching: ${ready}`);
  console.log(`  ⚠️  Missing embeddings: ${missingEmbedding}`);
  console.log(`  ⏭️  No preferences: ${noPreferences}`);
  console.log(`  📊 Total users: ${users.length}\n`);
}

checkStatus()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

