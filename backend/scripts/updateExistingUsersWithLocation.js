const getDb = require("../utils/db");

async function updateExistingUsers() {
  const db = await getDb();
  const users = db.data.users || [];
  
  console.log(`\n🔄 Updating ${users.length} existing users with location and age preferences...\n`);
  
  const cities = {
    "US": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
    "UK": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
    "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"],
    "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"]
  };
  
  function getRandomCity(region) {
    const regionCities = cities[region] || ["Unknown"];
    return regionCities[Math.floor(Math.random() * regionCities.length)];
  }
  
  let updated = 0;
  
  for (const user of users) {
    let needsUpdate = false;
    
    // Add location if missing
    if (!user.location && user.region) {
      user.location = user.region;
      needsUpdate = true;
    }
    
    // Add city if missing
    if (!user.city && user.region) {
      user.city = getRandomCity(user.region);
      needsUpdate = true;
    }
    
    // Calculate age from birthday if missing
    if (!user.age && user.birthday) {
      const today = new Date();
      const birthDate = new Date(user.birthday);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      user.age = age;
      needsUpdate = true;
    }
    
    // Add default age preferences if missing
    if (user.ageRangeMin === undefined) {
      user.ageRangeMin = 18;
      needsUpdate = true;
    }
    if (user.ageRangeMax === undefined) {
      user.ageRangeMax = 45;
      needsUpdate = true;
    }
    
    // Add default distance preference if missing
    if (user.maxDistance === undefined) {
      user.maxDistance = 30;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      updated++;
      console.log(`✓ Updated ${user.name || user.email}`);
    }
  }
  
  await db.write();
  
  console.log(`\n✅ Updated ${updated} users with location, age, and preferences!`);
  console.log(`📊 Total users: ${users.length}\n`);
}

updateExistingUsers()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

