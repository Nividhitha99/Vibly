const getDb = require("../utils/db");
const matchingService = require("../services/matchingService");

async function checkAllMatches() {
  const db = await getDb();
  const users = db.data.users;
  const tastes = db.data.tastes;
  const embeddings = db.data.embeddings;

  console.log("\n=== USER STATUS REPORT ===\n");
  
  for (const user of users) {
    const taste = tastes.find(t => t.userId === user.id);
    const embedding = embeddings.find(e => e.userId === user.id);
    const prefs = (taste?.movies?.length || 0) + (taste?.music?.length || 0) + (taste?.shows?.length || 0);
    
    console.log(`\n👤 ${user.name} (${user.email})`);
    console.log(`   Preferences: ${prefs} total (${taste?.movies?.length || 0} movies, ${taste?.music?.length || 0} music, ${taste?.shows?.length || 0} shows)`);
    console.log(`   Embedding: ${embedding && embedding.vector ? '✅ Yes' : '❌ No'}`);
    console.log(`   Gender: ${user.gender || 'N/A'}, Age: ${user.age || 'N/A'}, Looking for: ${user.lookingFor || 'N/A'}`);
    console.log(`   Location: ${user.city || 'N/A'}, ${user.location || 'N/A'}`);
    console.log(`   Age range: ${user.ageRangeMin || 'N/A'}-${user.ageRangeMax || 'N/A'}, Max distance: ${user.maxDistance || 'N/A'} miles`);
    
    if (prefs > 0 && embedding && embedding.vector) {
      try {
        const matches = await matchingService.getMatches(user.id);
        console.log(`   Matches: ${matches.length} found`);
        if (matches.length > 0) {
          console.log(`   Top 3:`);
          matches.slice(0, 3).forEach((m, i) => {
            console.log(`      ${i+1}. ${m.name} - ${((m.score || 0) * 100).toFixed(1)}%`);
          });
        } else {
          console.log(`   ⚠️  No matches found (may be filtered by age/gender/distance or low compatibility)`);
        }
      } catch (err) {
        console.log(`   ❌ Error getting matches: ${err.message}`);
      }
    } else if (prefs === 0) {
      console.log(`   ⚠️  No preferences - cannot generate matches`);
    } else if (!embedding || !embedding.vector) {
      console.log(`   ⚠️  No embedding - cannot generate matches`);
    }
  }
  
  console.log("\n=== SUMMARY ===\n");
  const usersWithPrefs = users.filter(u => {
    const t = tastes.find(t => t.userId === u.id);
    return (t?.movies?.length || 0) + (t?.music?.length || 0) + (t?.shows?.length || 0) > 0;
  });
  const usersWithEmbeddings = users.filter(u => {
    const e = embeddings.find(e => e.userId === u.id);
    return e && e.vector;
  });
  
  console.log(`Total users: ${users.length}`);
  console.log(`Users with preferences: ${usersWithPrefs.length}`);
  console.log(`Users with embeddings: ${usersWithEmbeddings.length}`);
  console.log(`Users ready for matching: ${usersWithPrefs.filter(u => {
    const e = embeddings.find(e => e.userId === u.id);
    return e && e.vector;
  }).length}`);
}

checkAllMatches()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

