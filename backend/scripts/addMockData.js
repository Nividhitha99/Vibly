const getDb = require("../utils/db");
const embeddingCalculationService = require("../services/embeddingCalculationService");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

async function addMockData() {
  const db = await getDb();
  
  // Mock users with hashed passwords
  const mockUsers = [
    {
      id: crypto.randomUUID(),
      name: "Alex",
      email: "alex@example.com",
      password: await bcrypt.hash("password123", 10)
    },
    {
      id: crypto.randomUUID(),
      name: "Sam",
      email: "sam@example.com",
      password: await bcrypt.hash("password123", 10)
    },
    {
      id: crypto.randomUUID(),
      name: "Jordan",
      email: "jordan@example.com",
      password: await bcrypt.hash("password123", 10)
    },
    {
      id: crypto.randomUUID(),
      name: "Taylor",
      email: "taylor@example.com",
      password: await bcrypt.hash("password123", 10)
    }
  ];

  // Mock taste preferences
  const mockTastes = [
    {
      userId: mockUsers[0].id,
      movies: [
        {
          id: 550,
          title: "Fight Club",
          releaseDate: "1999-10-15",
          overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
          posterPath: "https://image.tmdb.org/t/p/w200/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
          genres: ["Drama", "Thriller"],
          type: "movie"
        },
        {
          id: 13,
          title: "Forrest Gump",
          releaseDate: "1994-06-23",
          overview: "A man with a low IQ has accomplished great things in his life and been present during significant historical events.",
          posterPath: "https://image.tmdb.org/t/p/w200/arw2vcBveWOVZr6pxd9XTd1Td2a.jpg",
          genres: ["Drama", "Romance"],
          type: "movie"
        },
        {
          id: 238,
          title: "The Godfather",
          releaseDate: "1972-03-24",
          overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
          posterPath: "https://image.tmdb.org/t/p/w200/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
          genres: ["Crime", "Drama"],
          type: "movie"
        }
      ],
      music: [
        {
          id: "4uLU6hMCjMI75M1A2tKUQC",
          name: "The Beatles",
          genres: ["rock", "pop", "classic rock"],
          type: "artist"
        },
        {
          id: "1dfeR4HaWDbWqFHLkxsg1d",
          name: "Queen",
          genres: ["rock", "glam rock", "classic rock"],
          type: "artist"
        }
      ],
      shows: [
        {
          id: 1396,
          title: "Breaking Bad",
          firstAirDate: "2008-01-20",
          overview: "A high school chemistry teacher turned methamphetamine manufacturer.",
          posterPath: "https://image.tmdb.org/t/p/w200/ggFHVNu6YYI5v9n6R1gx1Kxjl4S.jpg",
          genres: ["Crime", "Drama", "Thriller"],
          type: "tv"
        }
      ],
      weights: { movies: 0.4, music: 0.4, shows: 0.2 },
      region: "US",
      regionPreference: "any",
      languages: ["en"],
      preferredLanguages: ["en"]
    },
    {
      userId: mockUsers[1].id,
      movies: [
        {
          id: 550,
          title: "Fight Club",
          releaseDate: "1999-10-15",
          overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
          posterPath: "https://image.tmdb.org/t/p/w200/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
          genres: ["Drama", "Thriller"],
          type: "movie"
        },
        {
          id: 13,
          title: "Forrest Gump",
          releaseDate: "1994-06-23",
          overview: "A man with a low IQ has accomplished great things in his life and been present during significant historical events.",
          posterPath: "https://image.tmdb.org/t/p/w200/arw2vcBveWOVZr6pxd9XTd1Td2a.jpg",
          genres: ["Drama", "Romance"],
          type: "movie"
        },
        {
          id: 680,
          title: "Pulp Fiction",
          releaseDate: "1994-09-10",
          overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this crime comedy.",
          posterPath: "https://image.tmdb.org/t/p/w200/d5iIlFn5s0ImszYzBPb8JPIfbsD.jpg",
          genres: ["Crime", "Drama"],
          type: "movie"
        }
      ],
      music: [
        {
          id: "4uLU6hMCjMI75M1A2tKUQC",
          name: "The Beatles",
          genres: ["rock", "pop", "classic rock"],
          type: "artist"
        },
        {
          id: "1dfeR4HaWDbWqFHLkxsg1d",
          name: "Queen",
          genres: ["rock", "glam rock", "classic rock"],
          type: "artist"
        },
        {
          id: "1Xyo4u8uXC1ZmMpatF05PJ",
          name: "The Weeknd",
          genres: ["pop", "r&b", "electronic"],
          type: "artist"
        }
      ],
      shows: [
        {
          id: 1396,
          title: "Breaking Bad",
          firstAirDate: "2008-01-20",
          overview: "A high school chemistry teacher turned methamphetamine manufacturer.",
          posterPath: "https://image.tmdb.org/t/p/w200/ggFHVNu6YYI5v9n6R1gx1Kxjl4S.jpg",
          genres: ["Crime", "Drama", "Thriller"],
          type: "tv"
        },
        {
          id: 1399,
          title: "Game of Thrones",
          firstAirDate: "2011-04-17",
          overview: "Nine noble families fight for control over the lands of Westeros.",
          posterPath: "https://image.tmdb.org/t/p/w200/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
          genres: ["Drama", "Fantasy", "Adventure"],
          type: "tv"
        }
      ],
      weights: { movies: 0.4, music: 0.4, shows: 0.2 },
      region: "US",
      regionPreference: "any",
      languages: ["en"],
      preferredLanguages: ["en"]
    },
    {
      userId: mockUsers[2].id,
      movies: [
        {
          id: 238,
          title: "The Godfather",
          releaseDate: "1972-03-24",
          overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
          posterPath: "https://image.tmdb.org/t/p/w200/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
          genres: ["Crime", "Drama"],
          type: "movie"
        },
        {
          id: 680,
          title: "Pulp Fiction",
          releaseDate: "1994-09-10",
          overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this crime comedy.",
          posterPath: "https://image.tmdb.org/t/p/w200/d5iIlFn5s0ImszYzBPb8JPIfbsD.jpg",
          genres: ["Crime", "Drama"],
          type: "movie"
        },
        {
          id: 424,
          title: "Schindler's List",
          releaseDate: "1993-11-30",
          overview: "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis.",
          posterPath: "https://image.tmdb.org/t/p/w200/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
          genres: ["Drama", "History", "War"],
          type: "movie"
        }
      ],
      music: [
        {
          id: "1dfeR4HaWDbWqFHLkxsg1d",
          name: "Queen",
          genres: ["rock", "glam rock", "classic rock"],
          type: "artist"
        },
        {
          id: "1Xyo4u8uXC1ZmMpatF05PJ",
          name: "The Weeknd",
          genres: ["pop", "r&b", "electronic"],
          type: "artist"
        }
      ],
      shows: [
        {
          id: 1399,
          title: "Game of Thrones",
          firstAirDate: "2011-04-17",
          overview: "Nine noble families fight for control over the lands of Westeros.",
          posterPath: "https://image.tmdb.org/t/p/w200/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
          genres: ["Drama", "Fantasy", "Adventure"],
          type: "tv"
        },
        {
          id: 1396,
          title: "Breaking Bad",
          firstAirDate: "2008-01-20",
          overview: "A high school chemistry teacher turned methamphetamine manufacturer.",
          posterPath: "https://image.tmdb.org/t/p/w200/ggFHVNu6YYI5v9n6R1gx1Kxjl4S.jpg",
          genres: ["Crime", "Drama", "Thriller"],
          type: "tv"
        }
      ],
      weights: { movies: 0.4, music: 0.4, shows: 0.2 },
      region: "US",
      regionPreference: "any",
      languages: ["en"],
      preferredLanguages: ["en"]
    },
    {
      userId: mockUsers[3].id,
      movies: [
        {
          id: 13,
          title: "Forrest Gump",
          releaseDate: "1994-06-23",
          overview: "A man with a low IQ has accomplished great things in his life and been present during significant historical events.",
          posterPath: "https://image.tmdb.org/t/p/w200/arw2vcBveWOVZr6pxd9XTd1Td2a.jpg",
          genres: ["Drama", "Romance"],
          type: "movie"
        },
        {
          id: 424,
          title: "Schindler's List",
          releaseDate: "1993-11-30",
          overview: "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis.",
          posterPath: "https://image.tmdb.org/t/p/w200/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
          genres: ["Drama", "History", "War"],
          type: "movie"
        }
      ],
      music: [
        {
          id: "4uLU6hMCjMI75M1A2tKUQC",
          name: "The Beatles",
          genres: ["rock", "pop", "classic rock"],
          type: "artist"
        }
      ],
      shows: [
        {
          id: 1399,
          title: "Game of Thrones",
          firstAirDate: "2011-04-17",
          overview: "Nine noble families fight for control over the lands of Westeros.",
          posterPath: "https://image.tmdb.org/t/p/w200/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
          genres: ["Drama", "Fantasy", "Adventure"],
          type: "tv"
        }
      ],
      weights: { movies: 0.4, music: 0.4, shows: 0.2 },
      region: "US",
      regionPreference: "any",
      languages: ["en"],
      preferredLanguages: ["en"]
    }
  ];

  console.log("Adding mock users...");
  for (const user of mockUsers) {
    // Check if user already exists
    const existing = db.data.users.find(u => u.email === user.email);
    if (!existing) {
      db.data.users.push(user);
      console.log(`✓ Added user: ${user.name} (${user.email})`);
    } else {
      console.log(`⊘ User already exists: ${user.email}`);
    }
  }

  console.log("\nAdding mock taste preferences...");
  for (const taste of mockTastes) {
    const existing = db.data.tastes.find(t => t.userId === taste.userId);
    if (!existing) {
      db.data.tastes.push(taste);
      console.log(`✓ Added taste preferences for user: ${taste.userId}`);
    } else {
      console.log(`⊘ Taste preferences already exist for user: ${taste.userId}`);
    }
  }

  await db.write();
  console.log("\nGenerating embeddings for mock users...");
  
  // Use the embedding calculation service to generate embeddings
  // This will automatically handle all users and generate real embeddings using Gemini
  const results = await embeddingCalculationService.calculateEmbeddingsForAllUsers(false);
  
  console.log(`\n📊 Embedding Generation Summary:`);
  console.log(`   Total users processed: ${results.total}`);
  console.log(`   Embeddings generated: ${results.generated}`);
  console.log(`   Already had embeddings: ${results.skipped}`);
  console.log(`   Errors: ${results.errors}`);

  console.log("\n✅ Mock data added successfully!");
  console.log("\n📋 Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  for (const user of mockUsers) {
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: password123`);
    console.log(`User ID: ${user.id}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }
}

// Run the script
addMockData()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error adding mock data:", error);
    process.exit(1);
  });

