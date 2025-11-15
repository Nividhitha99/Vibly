const getDb = require("../utils/db");

function calculateAge(birthday) {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function generateBirthday(minAge = 18, maxAge = 45) {
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const year = new Date().getFullYear() - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const regions = ["US", "UK", "India", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "Mexico", "Spain", "Italy"];
const cities = {
  "US": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"],
  "UK": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Glasgow", "Edinburgh", "Bristol", "Sheffield", "Cardiff"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Winnipeg", "Quebec City", "Hamilton", "Kitchener"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Sunshine Coast", "Wollongong"],
  "Germany": ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"],
  "Japan": ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kawasaki", "Kyoto", "Saitama"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre"],
  "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Juárez", "Torreón", "Querétaro", "San Luis Potosí"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas", "Bilbao"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania"]
};

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function updateAllUsersWithAgeLocation() {
  const db = await getDb();
  const users = db.data.users;

  console.log(`\n🔄 Updating ${users.length} users with age and location...\n`);

  for (const user of users) {
    let updated = false;

    // Add age if missing
    if (!user.age || user.age === null || user.age === undefined) {
      if (!user.birthday) {
        user.birthday = generateBirthday(18, 45);
      }
      user.age = calculateAge(user.birthday);
      updated = true;
      console.log(`✓ Added age ${user.age} to ${user.name}`);
    }

    // Add location if missing
    if (!user.location || !user.city) {
      const region = getRandomElement(regions);
      user.region = user.region || region;
      user.location = user.location || region;
      user.city = user.city || getRandomElement(cities[region] || ["Unknown City"]);
      updated = true;
      console.log(`✓ Added location ${user.city}, ${user.location} to ${user.name}`);
    }

    // Ensure age range and distance preferences exist
    if (user.ageRangeMin === undefined || user.ageRangeMin === null) {
      user.ageRangeMin = 18;
      updated = true;
    }
    if (user.ageRangeMax === undefined || user.ageRangeMax === null) {
      user.ageRangeMax = 45;
      updated = true;
    }
    if (user.maxDistance === undefined || user.maxDistance === null) {
      user.maxDistance = 30;
      updated = true;
    }

    // Ensure gender and lookingFor exist for matching
    if (!user.gender) {
      const genders = ["male", "female", "non-binary"];
      user.gender = getRandomElement(genders);
      updated = true;
      console.log(`✓ Added gender ${user.gender} to ${user.name}`);
    }

    if (!user.lookingFor) {
      const lookingForMap = {
        "male": ["female", "non-binary"],
        "female": ["male", "non-binary"],
        "non-binary": ["male", "female", "non-binary"]
      };
      user.lookingFor = getRandomElement(lookingForMap[user.gender] || ["male", "female"]);
      updated = true;
      console.log(`✓ Added lookingFor ${user.lookingFor} to ${user.name}`);
    }

    if (!updated) {
      console.log(`⊘ ${user.name} already has all required fields`);
    }
  }

  await db.write();
  console.log(`\n✅ Updated ${users.length} users with age, location, and preferences!`);
  console.log(`📊 Summary:`);
  const usersWithAge = users.filter(u => u.age).length;
  const usersWithLocation = users.filter(u => u.location && u.city).length;
  const usersWithGender = users.filter(u => u.gender).length;
  console.log(`   Users with age: ${usersWithAge}/${users.length}`);
  console.log(`   Users with location: ${usersWithLocation}/${users.length}`);
  console.log(`   Users with gender: ${usersWithGender}/${users.length}`);
}

updateAllUsersWithAgeLocation()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error updating users:", error);
    process.exit(1);
  });

