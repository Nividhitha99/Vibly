const getDb = require("../utils/db");
const embeddingCalculationService = require("../services/embeddingCalculationService");
const tasteService = require("../services/tasteService");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Sample data for generating diverse users
const firstNames = [
  "Alex", "Sam", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn", "Sage",
  "River", "Phoenix", "Blake", "Cameron", "Dakota", "Emery", "Finley", "Harper", "Hayden", "Jamie",
  "Kai", "Logan", "Mason", "Noah", "Olivia", "Parker", "Reese", "Rowan", "Skylar", "Tyler",
  "Willow", "Zoe", "Aiden", "Bella", "Carter", "Diana", "Ethan", "Fiona", "Grace", "Henry",
  "Isabella", "Jack", "Katherine", "Liam", "Mia", "Nathan", "Owen", "Penelope", "Quinn", "Rachel"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
  "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams"
];

const genders = ["male", "female", "non-binary"];
const lookingFor = {
  "male": ["female", "non-binary"],
  "female": ["male", "non-binary"],
  "non-binary": ["male", "female", "non-binary"]
};

const regions = ["US", "UK", "India", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "Mexico", "Spain", "Italy"];
const cities = {
  "US": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
  "UK": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"]
};

const sampleMovies = [
  { id: 550, title: "Fight Club", genres: ["Drama", "Thriller"] },
  { id: 13, title: "Forrest Gump", genres: ["Drama", "Romance"] },
  { id: 238, title: "The Godfather", genres: ["Crime", "Drama"] },
  { id: 27205, title: "Inception", genres: ["Action", "Sci-Fi", "Thriller"] },
  { id: 157336, title: "Interstellar", genres: ["Drama", "Sci-Fi"] },
  { id: 155, title: "The Dark Knight", genres: ["Action", "Crime", "Drama"] },
  { id: 680, title: "Pulp Fiction", genres: ["Crime", "Drama"] },
  { id: 424, title: "Schindler's List", genres: ["Biography", "Drama", "History"] },
  { id: 497, title: "The Green Mile", genres: ["Crime", "Drama", "Fantasy"] },
  { id: 278, title: "The Shawshank Redemption", genres: ["Drama"] }
];

const sampleMusic = [
  { id: "4uLU6hMCjMI75M1A2tKUQC", name: "The Beatles", genres: ["rock", "pop"] },
  { id: "1dfeR4HaWDbWqFHLkxsg1d", name: "Queen", genres: ["rock", "glam rock"] },
  { id: "3Nrfpe0tUJi4K4DXYWgMUX", name: "The Weeknd", genres: ["pop", "r&b"] },
  { id: "06HL4l02vHVeX2L2g4gO2a", name: "Taylor Swift", genres: ["pop", "country"] },
  { id: "1Xyo4u8uXC1ZmMpatF05PJ", name: "The Weeknd", genres: ["pop", "r&b"] },
  { id: "5K4W6rqBFWDnAN6FQUkS6x", name: "Adele", genres: ["pop", "soul"] },
  { id: "4Z8W4fKeB5YxbusRsdQVPb", name: "Radiohead", genres: ["alternative", "rock"] },
  { id: "4Z8W4fKeB5YxbusRsdQVPb", name: "Coldplay", genres: ["pop", "rock"] }
];

const sampleShows = [
  { id: 1396, title: "Breaking Bad", genres: ["Crime", "Drama"] },
  { id: 1399, title: "Game of Thrones", genres: ["Drama", "Fantasy"] },
  { id: 66732, title: "Stranger Things", genres: ["Drama", "Fantasy", "Horror"] },
  { id: 1398, title: "The Office", genres: ["Comedy"] },
  { id: 456, title: "The Simpsons", genres: ["Animation", "Comedy"] }
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

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
  const day = Math.floor(Math.random() * 28) + 1; // Use 28 to avoid month-end issues
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function add50MockUsers() {
  const db = await getDb();
  
  console.log("🚀 Starting to create 50 mock users with full profiles...\n");
  
  const newUsers = [];
  const newTastes = [];
  
  for (let i = 0; i < 50; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const gender = getRandomElement(genders);
    const birthday = generateBirthday(18, 45);
    const age = calculateAge(birthday);
    const region = getRandomElement(regions);
    const city = cities[region] ? getRandomElement(cities[region]) : "Unknown";
    const lookingForGender = getRandomElement(lookingFor[gender]);
    
    const userId = crypto.randomUUID();
    
    // Create user with full profile
    const user = {
      id: userId,
      name: name,
      email: email,
      password: await bcrypt.hash("password123", 10),
      gender: gender,
      birthday: birthday,
      age: age,
      region: region,
      location: region, // Add location field
      city: city,
      lookingFor: lookingForGender,
      bio: `Hi! I'm ${firstName}, ${age} years old from ${city}, ${region}. Love movies, music, and shows!`,
      profilePicture: `https://i.pravatar.cc/150?img=${i + 1}`,
      ageRangeMin: 18, // Default age preferences
      ageRangeMax: 45,
      maxDistance: 30, // Default distance preference
      createdAt: new Date().toISOString()
    };
    
    newUsers.push(user);
    
    // Create taste preferences
    const numMovies = Math.floor(Math.random() * 5) + 2; // 2-6 movies
    const numMusic = Math.floor(Math.random() * 4) + 2; // 2-5 music
    const numShows = Math.floor(Math.random() * 3) + 1; // 1-3 shows
    
    const movies = getRandomElements(sampleMovies, numMovies).map(m => ({
      ...m,
      releaseDate: "1990-01-01",
      overview: `A great ${m.genres[0]} movie`,
      posterPath: `https://image.tmdb.org/t/p/w200/poster${m.id}.jpg`,
      type: "movie"
    }));
    
    const music = getRandomElements(sampleMusic, numMusic).map(m => ({
      ...m,
      type: "artist"
    }));
    
    const shows = getRandomElements(sampleShows, numShows).map(s => ({
      ...s,
      firstAirDate: "2010-01-01",
      overview: `A great ${s.genres[0]} show`,
      posterPath: `https://image.tmdb.org/t/p/w200/poster${s.id}.jpg`,
      type: "tv"
    }));
    
    const taste = {
      userId: userId,
      movies: movies,
      music: music,
      shows: shows,
      weights: { movies: 0.4, music: 0.4, shows: 0.2 },
      region: region,
      regionPreference: Math.random() > 0.7 ? "same" : "any", // 30% prefer same region
      languages: ["en"],
      preferredLanguages: ["en"]
    };
    
    newTastes.push(taste);
    
    console.log(`✓ Created user ${i + 1}/50: ${name} (${gender}, ${age}yo, ${region})`);
  }
  
  // Add users to database
  db.data.users.push(...newUsers);
  await db.write();
  console.log(`\n✅ Added ${newUsers.length} users to database`);
  
  // Add tastes to database
  db.data.tastes.push(...newTastes);
  await db.write();
  console.log(`✅ Added ${newTastes.length} taste profiles to database`);
  
  // Generate embeddings for all users using the embedding calculation service
  console.log(`\n🧠 Generating embeddings using Gemini AI...`);
  console.log(`This may take a few minutes as we analyze ${newTastes.length} user profiles...\n`);
  
  // Use the bulk embedding calculation service
  const results = await embeddingCalculationService.calculateEmbeddingsForAllUsers(false);
  
  console.log(`\n📊 Embedding Generation Summary:`);
  console.log(`   Total users processed: ${results.total}`);
  console.log(`   Embeddings generated: ${results.generated}`);
  console.log(`   Already had embeddings: ${results.skipped}`);
  console.log(`   Errors: ${results.errors}`);
  
  console.log(`\n✅ Successfully created 50 mock users with full profiles!`);
  console.log(`\n📋 Login Credentials (all users use the same password):`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Password: password123`);
  console.log(`\nSample users:`);
  newUsers.slice(0, 5).forEach(user => {
    console.log(`  - ${user.name} (${user.email}) - ${user.gender}, ${user.age}yo, ${user.region}`);
  });
  console.log(`  ... and ${newUsers.length - 5} more users`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

// Run the script
add50MockUsers()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

