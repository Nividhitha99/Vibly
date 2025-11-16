const getDb = require("../utils/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const embeddingCalculationService = require("../services/embeddingCalculationService");

// Dummy users that will always show in matches (for testing)
const dummyUsers = [
  {
    name: "Alex",
    email: "alex.dummy@vibly.com",
    gender: "male",
    age: 28,
    birthday: "1996-05-15",
    location: "NY",
    city: "New York",
    lookingFor: ["female", "non-binary"],
    ageRangeMin: 22,
    ageRangeMax: 35,
    maxDistance: 50,
    bio: "Love movies, music, and good conversations!",
    profileImages: [
      "https://api.dicebear.com/8.x/adventurer/svg?seed=alex-dummy-1",
      "https://api.dicebear.com/8.x/adventurer/svg?seed=alex-dummy-2"
    ]
  },
  {
    name: "Emma",
    email: "emma.dummy@vibly.com",
    gender: "female",
    age: 25,
    birthday: "1999-08-20",
    location: "CA",
    city: "Los Angeles",
    lookingFor: ["male", "non-binary"],
    ageRangeMin: 23,
    ageRangeMax: 32,
    maxDistance: 50,
    bio: "Movie enthusiast and music lover!",
    profileImages: [
      "https://api.dicebear.com/8.x/bottts/svg?seed=emma-dummy-1",
      "https://api.dicebear.com/8.x/bottts/svg?seed=emma-dummy-2"
    ]
  },
  {
    name: "Jordan",
    email: "jordan.dummy@vibly.com",
    gender: "non-binary",
    age: 30,
    birthday: "1994-03-10",
    location: "TX",
    city: "Austin",
    lookingFor: ["male", "female", "non-binary"],
    ageRangeMin: 25,
    ageRangeMax: 38,
    maxDistance: 50,
    bio: "Passionate about films and indie music!",
    profileImages: [
      "https://api.dicebear.com/8.x/fun-emoji/svg?seed=jordan-dummy-1",
      "https://api.dicebear.com/8.x/fun-emoji/svg?seed=jordan-dummy-2"
    ]
  },
  {
    name: "Sam",
    email: "sam.dummy@vibly.com",
    gender: "male",
    age: 27,
    birthday: "1997-11-25",
    location: "FL",
    city: "Miami",
    lookingFor: ["female"],
    ageRangeMin: 24,
    ageRangeMax: 33,
    maxDistance: 50,
    bio: "TV series binge-watcher and music producer!",
    profileImages: [
      "https://api.dicebear.com/8.x/adventurer/svg?seed=sam-dummy-1",
      "https://api.dicebear.com/8.x/adventurer/svg?seed=sam-dummy-2"
    ]
  },
  {
    name: "Riley",
    email: "riley.dummy@vibly.com",
    gender: "female",
    age: 26,
    birthday: "1998-07-12",
    location: "WA",
    city: "Seattle",
    lookingFor: ["male", "non-binary"],
    ageRangeMin: 24,
    ageRangeMax: 32,
    maxDistance: 50,
    bio: "Love exploring new shows and discovering music!",
    profileImages: [
      "https://api.dicebear.com/8.x/bottts/svg?seed=riley-dummy-1",
      "https://api.dicebear.com/8.x/bottts/svg?seed=riley-dummy-2"
    ]
  }
];

// Dummy preferences for each user
const dummyTastes = [
  {
    movies: ["The Matrix", "Inception", "Interstellar", "The Dark Knight", "Pulp Fiction"],
    music: ["Radiohead", "The Beatles", "Pink Floyd", "Led Zeppelin", "Nirvana"],
    shows: ["Breaking Bad", "Game of Thrones", "The Office", "Stranger Things", "The Crown"]
  },
  {
    movies: ["La La Land", "The Notebook", "Pride and Prejudice", "Titanic", "The Fault in Our Stars"],
    music: ["Taylor Swift", "Adele", "Ed Sheeran", "Billie Eilish", "Lana Del Rey"],
    shows: ["Friends", "Grey's Anatomy", "The Crown", "Bridgerton", "Gilmore Girls"]
  },
  {
    movies: ["Parasite", "Get Out", "Moonlight", "Call Me By Your Name", "The Shape of Water"],
    music: ["Frank Ocean", "Tyler, The Creator", "FKA twigs", "Solange", "Blood Orange"],
    shows: ["Euphoria", "Pose", "Sense8", "The OA", "Orange is the New Black"]
  },
  {
    movies: ["John Wick", "Mad Max: Fury Road", "The Raid", "Dredd", "Kingsman"],
    music: ["Metallica", "AC/DC", "Iron Maiden", "Slipknot", "System of a Down"],
    shows: ["The Boys", "Daredevil", "The Punisher", "Breaking Bad", "True Detective"]
  },
  {
    movies: ["Little Women", "Lady Bird", "The Favourite", "Booksmart", "Frances Ha"],
    music: ["Phoebe Bridgers", "Clairo", "Snail Mail", "Japanese Breakfast", "Soccer Mommy"],
    shows: ["Fleabag", "Killing Eve", "The Marvelous Mrs. Maisel", "Big Little Lies", "The Handmaid's Tale"]
  }
];

async function createDummyUsers() {
  const db = await getDb();
  
  console.log("🚀 Creating dummy users that always show in matches...\n");
  
  const createdUsers = [];
  const createdTastes = [];
  
  for (let i = 0; i < dummyUsers.length; i++) {
    const dummyUser = dummyUsers[i];
    const dummyTaste = dummyTastes[i];
    
    // Check if user already exists
    const existingUser = db.data.users.find(u => u.email === dummyUser.email);
    if (existingUser) {
      console.log(`⊘ User ${dummyUser.name} already exists, skipping...`);
      continue;
    }
    
    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash("dummy123", 10);
    
    const user = {
      id: userId,
      ...dummyUser,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    const taste = {
      userId: userId,
      movies: dummyTaste.movies,
      music: dummyTaste.music,
      shows: dummyTaste.shows
    };
    
    db.data.users.push(user);
    db.data.tastes.push(taste);
    
    createdUsers.push(user);
    createdTastes.push(taste);
    
    console.log(`✓ Created dummy user: ${user.name} (${user.email})`);
  }
  
  await db.write();
  
  console.log(`\n✅ Created ${createdUsers.length} dummy users!`);
  
  if (createdUsers.length > 0) {
    console.log("\n📊 Generating embeddings for dummy users...");
    const results = await embeddingCalculationService.calculateEmbeddingsForAllUsers(false);
    console.log(`\n✨ Embedding generation complete!`);
    console.log(`   Generated: ${results.generated}`);
    console.log(`   Skipped: ${results.skipped}`);
  }
  
  console.log("\n📋 Dummy User Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  createdUsers.forEach(user => {
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: dummy123`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  });
}

createDummyUsers()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

