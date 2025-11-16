const getDb = require("../utils/db");
const sexualityScoreService = require("../services/sexualityScoreService");

async function updateUsersWithSexualitySystem() {
  const db = await getDb();
  const users = db.data.users || [];

  console.log(`\n🔄 Updating ${users.length} users with new sexuality system...\n`);

  let updated = 0;

  for (const user of users) {
    let needsUpdate = false;

    // If user doesn't have sexuality fields, generate them based on existing gender
    if (user.physically === undefined || user.sexually === undefined || user.emotionally === undefined) {
      // Map existing gender to default values
      let physically = 50;
      let sexually = 50;
      let emotionally = 50;

      if (user.gender) {
        const genderLower = user.gender.toLowerCase();
        if (genderLower === "male" || genderLower === "man") {
          physically = 20; // More towards man
          sexually = 30; // More masculine
          emotionally = 35; // Slightly more masculine
        } else if (genderLower === "female" || genderLower === "woman") {
          physically = 80; // More towards woman
          sexually = 75; // More feminine
          emotionally = 70; // More feminine
        } else {
          // Non-binary or other - keep at 50
          physically = 50;
          sexually = 50;
          emotionally = 50;
        }
      }

      user.physically = physically;
      user.sexually = sexually;
      user.emotionally = emotionally;
      needsUpdate = true;
    }

    // Calculate sexuality score if not present
    if (user.sexualityScore === undefined && user.physically !== undefined && user.sexually !== undefined && user.emotionally !== undefined) {
      try {
        console.log(`[Update] Calculating sexuality score for ${user.name || user.email}...`);
        const sexualityData = await sexualityScoreService.calculateSexualityScore(
          user.physically,
          user.sexually,
          user.emotionally
        );
        user.sexualityScore = sexualityData.sexualityScore;
        user.sexualityLabel = sexualityData.label;
        user.sexualityCompatibilityFactors = sexualityData.compatibilityFactors;
        needsUpdate = true;
        console.log(`[Update] ✓ ${user.name || user.email}: Score ${sexualityData.sexualityScore}% (${sexualityData.label})`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[Update] Error calculating sexuality score for ${user.name || user.email}:`, error.message);
        // Fallback: simple average
        user.sexualityScore = Math.round((user.physically + user.sexually + user.emotionally) / 3);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      updated++;
    }
  }

  await db.write();

  console.log(`\n✅ Updated ${updated} users with sexuality system!`);
  console.log(`📊 Total users: ${users.length}\n`);
}

updateUsersWithSexualitySystem()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

