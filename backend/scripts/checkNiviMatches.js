const getDb = require("../utils/db");
const matchingService = require("../services/matchingService");

async function checkNiviMatches() {
  const db = await getDb();
  const nivi = db.data.users.find(u => u.email === 'nivedu99@gmail.com');
  
  if (!nivi) {
    console.log('❌ Nivi not found');
    return;
  }
  
  console.log(`\n🔍 Checking matches for ${nivi.name} (${nivi.email})...`);
  console.log(`   User ID: ${nivi.id}`);
  console.log(`   Age: ${nivi.age || 'N/A'}, Gender: ${nivi.gender || 'N/A'}`);
  console.log(`   Location: ${nivi.city || 'N/A'}, ${nivi.location || 'N/A'}`);
  
  const taste = db.data.tastes.find(t => t.userId === nivi.id);
  const totalPrefs = (taste?.movies?.length || 0) + (taste?.music?.length || 0) + (taste?.shows?.length || 0);
  console.log(`   Preferences: ${totalPrefs} total (${taste?.movies?.length || 0} movies, ${taste?.music?.length || 0} music, ${taste?.shows?.length || 0} shows)`);
  
  if (totalPrefs === 0) {
    console.log('\n⚠️  No matches can be found because Nivi has no preferences saved.');
    console.log('   To get matches, Nivi needs to:');
    console.log('   1. Go to "Go to Preference Browsing" from the profile page');
    console.log('   2. Add at least some movies, music, or TV shows');
    console.log('   3. Save preferences');
    console.log('   4. Embeddings will be automatically calculated');
    return;
  }
  
  const embedding = db.data.embeddings.find(e => e.userId === nivi.id);
  if (!embedding || !embedding.vector) {
    console.log('\n⚠️  No embedding found. Embedding will be generated automatically when preferences are saved.');
    return;
  }
  
  try {
    const matches = await matchingService.getMatches(nivi.id);
    console.log(`\n✅ Total matches found: ${matches.length}`);
    
    if (matches.length > 0) {
      console.log('\n📊 Top 5 matches:');
      matches.slice(0, 5).forEach((m, i) => {
        console.log(`   ${i+1}. ${m.name} - Score: ${((m.score || 0) * 100).toFixed(1)}%`);
      });
    } else {
      console.log('\n⚠️  No matches found above 60% compatibility threshold.');
      console.log('   This could be because:');
      console.log('   - No other users have similar preferences');
      console.log('   - Age/distance filters are too restrictive');
      console.log('   - Gender preferences don\'t match');
    }
  } catch (err) {
    console.error('\n❌ Error checking matches:', err.message);
  }
}

checkNiviMatches()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

