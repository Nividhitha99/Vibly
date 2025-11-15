const getDb = require("../utils/db");
const embeddingService = require("../services/embeddingService");

async function addPreferencesForAlex() {
  const db = await getDb();
  
  // The existing Alex user ID
  const alexUserId = "18ec8fd8-1953-4f63-981a-34f9621b5391";
  
  console.log(`Adding preferences for Alex (${alexUserId})...\n`);
  
  // Mock preferences for Alex
  const alexPreferences = {
    userId: alexUserId,
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
  };
  
  // Add or update taste preferences
  const existingTaste = db.data.tastes.find(t => t.userId === alexUserId);
  if (existingTaste) {
    Object.assign(existingTaste, alexPreferences);
    console.log("✓ Updated existing taste preferences");
  } else {
    db.data.tastes.push(alexPreferences);
    console.log("✓ Added new taste preferences");
  }
  
  await db.write();
  
  // Generate embedding
  console.log("\nGenerating embedding...");
  
  // Generate mock embedding (since OpenAI API key is invalid)
  const generateMockEmbedding = (seed) => {
    const vector = [];
    for (let i = 0; i < 1536; i++) {
      const value = Math.sin(seed + i) * 0.1 + Math.random() * 0.01;
      vector.push(value);
    }
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => v / magnitude);
  };
  
  try {
    // Try real embedding first
    await embeddingService.generateEmbedding(
      alexUserId,
      alexPreferences.movies,
      alexPreferences.music,
      alexPreferences.shows
    );
    console.log("✓ Real embedding generated");
  } catch (error) {
    // Use mock embedding
    console.log("⚠ Using mock embedding (OpenAI API not available)");
    
    const seed = alexPreferences.movies.length + alexPreferences.music.length + alexPreferences.shows.length;
    const mockVector = generateMockEmbedding(seed);
    
    const existing = db.data.embeddings.find(e => e.userId === alexUserId);
    if (existing) {
      existing.vector = mockVector;
    } else {
      db.data.embeddings.push({
        userId: alexUserId,
        vector: mockVector
      });
    }
    
    await db.write();
    console.log("✓ Mock embedding saved");
  }
  
  console.log("\n✅ Done! Alex now has preferences and an embedding.");
  console.log("\nYou can now check the match list and should see matches!");
}

addPreferencesForAlex().catch(console.error);

