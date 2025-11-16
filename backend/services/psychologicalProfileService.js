// Psychological Profiling Service
// Uses AI to analyze entertainment preferences and extract psychological traits

const { GoogleGenerativeAI } = require("@google/generative-ai");
const itemAnalysisService = require("./itemAnalysisService");

const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyC9f18CZUqQE4OEh3bYPtaKr0xTW9HVTcI";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/**
 * Analyze entertainment preferences and extract psychological traits
 * Examples:
 * - Thriller movies → anxious, thrill-seeking
 * - Romantic comedies → optimistic, relationship-focused
 * - Heavy metal → intense, rebellious
 * - Classical music → calm, introspective
 */
exports.analyzePsychologicalProfile = async (movies, music, shows) => {
  try {
    // Extract titles/names
    const movieTitles = (movies || []).map(m => {
      if (typeof m === 'object' && m.title) return m.title;
      if (typeof m === 'object' && m.name) return m.name;
      return String(m);
    }).filter(Boolean);

    const musicNames = (music || []).map(mu => {
      if (typeof mu === 'object' && mu.name) return mu.name;
      if (typeof mu === 'object' && mu.title) return mu.title;
      return String(mu);
    }).filter(Boolean);

    const showTitles = (shows || []).map(s => {
      if (typeof s === 'object' && s.title) return s.title;
      if (typeof s === 'object' && s.name) return s.name;
      return String(s);
    }).filter(Boolean);

    if (movieTitles.length === 0 && musicNames.length === 0 && showTitles.length === 0) {
      return {
        traits: [],
        psychologicalSummary: "No preferences provided",
        emotionalProfile: {},
        personalityInsights: [],
        personalityType: "Unknown",
        dominantTraits: []
      };
    }

    // NEW: Use comprehensive item-by-item analysis
    console.log(`[Psychological Profile] 🧠 Starting deep AI analysis of individual items...`);
    const comprehensiveProfile = await itemAnalysisService.analyzeAllItems(movies, music, shows);
    
    // Map to the expected format
    return {
      traits: comprehensiveProfile.dominantTraits || [],
      psychologicalSummary: comprehensiveProfile.psychologicalSummary || "No analysis available",
      emotionalProfile: comprehensiveProfile.emotionalProfile || {
        energyLevel: "medium",
        emotionalIntensity: "medium",
        stressCoping: "active",
        socialOrientation: "ambivert"
      },
      personalityInsights: comprehensiveProfile.personalityInsights || [],
      personalityType: comprehensiveProfile.personalityType || "Entertainment Enthusiast",
      entertainmentProfile: comprehensiveProfile.entertainmentProfile || {},
      compatibilityFactors: comprehensiveProfile.compatibilityFactors || {},
      individualAnalyses: comprehensiveProfile.individualAnalyses || []
    };

  } catch (error) {
    console.error("❌ [Gemini API] Psychological profiling error:", error.message);
    console.error("❌ [Gemini API] Error details:", error);
    if (error.response) {
      console.error("❌ [Gemini API] API Response:", error.response.status, error.response.data);
    }
    // Return default profile on error
    return {
      traits: ["open-minded", "entertainment-enjoyer"],
      psychologicalSummary: "Unable to analyze preferences",
      emotionalProfile: {
        energyLevel: "medium",
        emotionalIntensity: "medium",
        stressCoping: "active",
        socialOrientation: "ambivert"
      },
      personalityInsights: ["Preferences indicate diverse interests"],
      personalityType: "Entertainment Enthusiast",
      dominantTraits: ["open-minded"]
    };
  }
};

/**
 * Generate a rich text description combining preferences with psychological insights
 * This will be used for embedding generation to capture both content and psychological meaning
 */
exports.generatePsychologicalEmbeddingText = async (movies, music, shows) => {
  try {
    // Get psychological profile
    const profile = await this.analyzePsychologicalProfile(movies, music, shows);

    // Extract titles/names
    const movieTitles = (movies || []).map(m => {
      if (typeof m === 'object' && m.title) return m.title;
      if (typeof m === 'object' && m.name) return m.name;
      return String(m);
    }).filter(Boolean);

    const musicNames = (music || []).map(mu => {
      if (typeof mu === 'object' && mu.name) return mu.name;
      if (typeof mu === 'object' && mu.title) return mu.title;
      return String(mu);
    }).filter(Boolean);

    const showTitles = (shows || []).map(s => {
      if (typeof s === 'object' && s.title) return s.title;
      if (typeof s === 'object' && s.name) return s.name;
      return String(s);
    }).filter(Boolean);

    // Extract genres
    const movieGenres = (movies || [])
      .filter(m => typeof m === 'object' && m.genres)
      .flatMap(m => m.genres || [])
      .filter((v, i, a) => a.indexOf(v) === i);

    const musicGenres = (music || [])
      .filter(m => typeof m === 'object' && m.genres)
      .flatMap(m => m.genres || [])
      .filter((v, i, a) => a.indexOf(v) === i);

    // Build rich text that includes content, psychological, cultural, thematic, and regional meaning
    const culturalInfo = profile.culturalProfile ? 
      `Cultures: ${(profile.culturalProfile.preferredCultures || []).join(", ") || "None"}` : "";
    const thematicInfo = profile.thematicProfile ? 
      `Themes: ${(profile.thematicProfile.preferredThemes || []).join(", ") || "None"}` : "";
    const regionalInfo = profile.regionalProfile ? 
      `Regions: ${(profile.regionalProfile.preferredRegions || []).join(", ") || "None"}` : "";

    const text = `
Entertainment Preferences:
Movies: ${movieTitles.join(", ") || "None"}
Music: ${musicNames.join(", ") || "None"}
TV Shows: ${showTitles.join(", ") || "None"}
Genres: ${[...movieGenres, ...musicGenres].join(", ") || "None"}

Psychological Profile:
Traits: ${profile.traits?.join(", ") || "Unknown"}
Summary: ${profile.psychologicalSummary || "No analysis available"}
Emotional Profile: Energy ${profile.emotionalProfile?.energyLevel || "medium"}, Intensity ${profile.emotionalProfile?.emotionalIntensity || "medium"}, Coping ${profile.emotionalProfile?.stressCoping || "active"}, Social ${profile.emotionalProfile?.socialOrientation || "ambivert"}
Insights: ${profile.personalityInsights?.join(". ") || "No insights available"}

Cultural & Regional Profile:
${culturalInfo}
${thematicInfo}
${regionalInfo}
`.trim();

    return text;

  } catch (error) {
    console.error("Error generating psychological embedding text:", error);
    // Fallback to basic text
    const movieTitles = (movies || []).map(m => {
      if (typeof m === 'object' && m.title) return m.title;
      if (typeof m === 'object' && m.name) return m.name;
      return String(m);
    }).filter(Boolean);
    const musicNames = (music || []).map(mu => {
      if (typeof mu === 'object' && mu.name) return mu.name;
      if (typeof mu === 'object' && mu.title) return mu.title;
      return String(mu);
    }).filter(Boolean);
    const showTitles = (shows || []).map(s => {
      if (typeof s === 'object' && s.title) return s.title;
      if (typeof s === 'object' && s.name) return s.name;
      return String(s);
    }).filter(Boolean);
    
    return `Movies: ${movieTitles.join(", ") || ""}. Music: ${musicNames.join(", ") || ""}. TV Shows: ${showTitles.join(", ") || ""}.`;
  }
};

