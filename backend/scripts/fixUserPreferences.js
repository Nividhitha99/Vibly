const getDb = require("../utils/db");

async function fixUserPreferences() {
  const db = await getDb();
  const users = db.data.users;

  console.log(`\n🔄 Fixing user preferences to ensure better matches...\n`);

  // More realistic lookingFor preferences
  // Make sure there's a good mix so people can match
  const preferences = {
    "male": ["female"], // Most males looking for females
    "female": ["male"], // Most females looking for males
    "non-binary": ["male", "female", "non-binary"] // Non-binary open to all
  };

  let updated = 0;
  for (const user of users) {
    if (!user.gender) continue;
    
    // Update lookingFor to be more realistic
    const gender = user.gender.toLowerCase();
    if (gender === "male") {
      // 80% looking for female, 20% open to more
      if (Math.random() > 0.2) {
        user.lookingFor = "female";
      } else {
        user.lookingFor = ["female", "non-binary"];
      }
      updated++;
      console.log(`✓ Updated ${user.name} (${gender}) - looking for: ${Array.isArray(user.lookingFor) ? user.lookingFor.join(", ") : user.lookingFor}`);
    } else if (gender === "female") {
      // 80% looking for male, 20% open to more
      if (Math.random() > 0.2) {
        user.lookingFor = "male";
      } else {
        user.lookingFor = ["male", "non-binary"];
      }
      updated++;
      console.log(`✓ Updated ${user.name} (${gender}) - looking for: ${Array.isArray(user.lookingFor) ? user.lookingFor.join(", ") : user.lookingFor}`);
    } else if (gender === "non-binary") {
      // Non-binary open to all
      user.lookingFor = ["male", "female", "non-binary"];
      updated++;
      console.log(`✓ Updated ${user.name} (${gender}) - looking for: ${Array.isArray(user.lookingFor) ? user.lookingFor.join(", ") : user.lookingFor}`);
    }
  }

  await db.write();
  console.log(`\n✅ Updated ${updated} users with more realistic preferences!`);
}

fixUserPreferences()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

