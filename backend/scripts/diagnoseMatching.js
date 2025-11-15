const getDb = require("../utils/db");

async function diagnoseMatching() {
  const db = await getDb();
  
  console.log("🔍 DIAGNOSING MATCHING SYSTEM...\n");
  
  // 1. Check users
  const allUsers = db.data.users || [];
  console.log(`📊 Total users: ${allUsers.length}`);
  allUsers.forEach(u => {
    console.log(`   - ${u.name} (${u.id})`);
  });
  
  // 2. Check tastes
  const allTastes = db.data.tastes || [];
  console.log(`\n📊 Total taste profiles: ${allTastes.length}`);
  allTastes.forEach(t => {
    const user = allUsers.find(u => u.id === t.userId);
    const movies = t.movies?.length || 0;
    const music = t.music?.length || 0;
    const shows = t.shows?.length || 0;
    console.log(`   - ${user?.name || 'Unknown'} (${t.userId}): ${movies} movies, ${music} music, ${shows} shows`);
  });
  
  // 3. Check embeddings
  const allEmbeddings = db.data.embeddings || [];
  console.log(`\n📊 Total embeddings: ${allEmbeddings.length}`);
  const usersWithEmbeddings = new Set();
  const usersWithoutEmbeddings = [];
  
  allEmbeddings.forEach(e => {
    const user = allUsers.find(u => u.id === e.userId);
    const hasVector = e.vector && Array.isArray(e.vector);
    if (hasVector) {
      usersWithEmbeddings.add(e.userId);
      console.log(`   ✅ ${user?.name || 'Unknown'} (${e.userId}): Has embedding (${e.vector.length} dimensions)`);
    } else {
      console.log(`   ❌ ${user?.name || 'Unknown'} (${e.userId}): Embedding exists but no vector`);
    }
  });
  
  // Find users without embeddings
  allUsers.forEach(u => {
    if (!usersWithEmbeddings.has(u.id)) {
      const hasTaste = allTastes.some(t => t.userId === u.id);
      if (hasTaste) {
        usersWithoutEmbeddings.push(u);
        console.log(`   ⚠️  ${u.name} (${u.id}): Has preferences but NO embedding!`);
      }
    }
  });
  
  // 4. Test matching for each user
  console.log(`\n🔍 TESTING MATCHES FOR EACH USER:\n`);
  
  for (const user of allUsers) {
    if (!usersWithEmbeddings.has(user.id)) {
      console.log(`\n❌ ${user.name}: Cannot get matches - no embedding`);
      continue;
    }
    
    const userTaste = allTastes.find(t => t.userId === user.id);
    if (!userTaste) {
      console.log(`\n❌ ${user.name}: Cannot get matches - no taste data`);
      continue;
    }
    
    // Find potential matches
    const potentialMatches = [];
    for (const otherEmbedding of allEmbeddings) {
      if (otherEmbedding.userId === user.id) continue;
      if (!otherEmbedding.vector || !Array.isArray(otherEmbedding.vector)) continue;
      
      const otherUser = allUsers.find(u => u.id === otherEmbedding.userId);
      const otherTaste = allTastes.find(t => t.userId === otherEmbedding.userId);
      
      if (!otherUser || !otherTaste) continue;
      
      // Check if already interacted
      const matches = db.data.matches || [];
      const passes = db.data.passes || [];
      
      const alreadyLiked = matches.some(m => m.fromUser === user.id && m.toUser === otherEmbedding.userId);
      const alreadyPassed = passes.some(p => p.fromUser === user.id && p.toUser === otherEmbedding.userId);
      const alreadyMatched = matches.some(m => 
        ((m.fromUser === user.id && m.toUser === otherEmbedding.userId) || 
         (m.fromUser === otherEmbedding.userId && m.toUser === user.id)) && 
        m.status === "confirmed"
      );
      
      if (alreadyLiked || alreadyPassed || alreadyMatched) {
        continue;
      }
      
      // Calculate shared preferences
      const sharedMovies = (userTaste.movies || []).filter(m => {
        const movieId = typeof m === 'object' ? m.id : m;
        return (otherTaste.movies || []).some(om => {
          const otherId = typeof om === 'object' ? om.id : om;
          return movieId === otherId;
        });
      }).length;
      
      potentialMatches.push({
        name: otherUser.name,
        userId: otherEmbedding.userId,
        sharedMovies,
        sharedMusic: 0,
        sharedShows: 0
      });
    }
    
    console.log(`\n✅ ${user.name} (${user.id}):`);
    console.log(`   Preferences: ${userTaste.movies?.length || 0} movies, ${userTaste.music?.length || 0} music, ${userTaste.shows?.length || 0} shows`);
    if (potentialMatches.length > 0) {
      console.log(`   Potential matches: ${potentialMatches.length}`);
      potentialMatches.slice(0, 5).forEach(m => {
        console.log(`      - ${m.name}: ${m.sharedMovies} shared movies`);
      });
    } else {
      console.log(`   ⚠️  No potential matches found`);
    }
  }
  
  // 5. Summary
  console.log(`\n\n📋 SUMMARY:`);
  console.log(`   Users: ${allUsers.length}`);
  console.log(`   Users with preferences: ${allTastes.length}`);
  console.log(`   Users with embeddings: ${usersWithEmbeddings.size}`);
  console.log(`   Users missing embeddings: ${usersWithoutEmbeddings.length}`);
  
  if (usersWithoutEmbeddings.length > 0) {
    console.log(`\n⚠️  ACTION REQUIRED: Generate embeddings for:`);
    usersWithoutEmbeddings.forEach(u => {
      console.log(`      - ${u.name} (${u.id})`);
    });
  }
  
  console.log(`\n✨ Diagnosis complete!`);
}

diagnoseMatching().catch(console.error);

