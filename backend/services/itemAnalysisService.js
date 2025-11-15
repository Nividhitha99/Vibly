// Individual Item Analysis Service
// Analyzes each movie/song/show individually with AI to extract deep insights

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyDwAi9MThmlibUi7pjXr2qEi3Kp-shFcMI";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/**
 * Analyze a single entertainment item (movie, song, or show) deeply
 * Extracts psychological traits, themes, emotional impact, and personality indicators
 */
exports.analyzeItem = async (item, type) => {
  try {
    const title = typeof item === 'object' ? (item.title || item.name || 'Unknown') : String(item);
    const genres = typeof item === 'object' && Array.isArray(item.genres) ? item.genres : [];
    const description = typeof item === 'object' ? (item.overview || item.description || '') : '';

    const prompt = `Analyze this ${type} deeply to understand what it reveals about someone's personality, psychological traits, emotional needs, cultural background, themes, and regional connections.

${type === 'movie' ? 'Movie' : type === 'music' ? 'Music/Artist' : 'TV Show'}: "${title}"
${genres.length > 0 ? `Genres: ${genres.join(", ")}` : ''}
${description ? `Description: ${description.substring(0, 300)}` : ''}

Perform a comprehensive analysis considering:
1. Psychological traits it reveals (e.g., thrill-seeking, introspective, optimistic)
2. Emotional themes and impact (e.g., anxiety, joy, nostalgia, intensity)
3. Personality indicators (e.g., open-mindedness, risk-taking, emotional depth)
4. Social and relationship patterns (e.g., romantic, independent, social)
5. Cognitive style (e.g., analytical, creative, practical)
6. Values and worldview (e.g., traditional, progressive, existential)
7. CULTURAL CONTEXT: Identify the cultural background, traditions, and cultural themes (e.g., Western, Eastern, Latin American, African, Middle Eastern, Asian, European, etc.)
8. THEMATIC ELEMENTS: Identify major themes (e.g., coming-of-age, family dynamics, social justice, historical events, fantasy, sci-fi, romance, adventure, etc.)
9. REGIONAL CONNECTIONS: Identify the region/country where it's set, produced, or originates from (e.g., North America, South Asia, East Asia, Europe, Latin America, Middle East, Africa, etc.)

Return a JSON object in this EXACT format:
{
  "psychologicalTraits": ["trait1", "trait2", "trait3"],
  "emotionalThemes": ["theme1", "theme2"],
  "personalityIndicators": ["indicator1", "indicator2"],
  "socialPatterns": ["pattern1", "pattern2"],
  "cognitiveStyle": "analytical|creative|practical|intuitive",
  "values": ["value1", "value2"],
  "culturalContext": ["culture1", "culture2"],
  "thematicElements": ["theme1", "theme2", "theme3"],
  "regionalConnections": ["region1", "region2"],
  "analysis": "A detailed 2-3 sentence analysis of what this ${type} reveals about the person"
}`;

    console.log(`[Item Analysis] Analyzing ${type}: "${title}"`);

    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });

    const content = result.response.text();
    const analysis = JSON.parse(content);

    console.log(`[Item Analysis] ✅ Analyzed "${title}" - Found ${analysis.psychologicalTraits?.length || 0} traits`);

    return {
      item: title,
      type: type,
      ...analysis
    };

  } catch (error) {
    console.error(`[Item Analysis] ❌ Error analyzing item:`, error.message);
    // Return minimal analysis on error
    return {
      item: typeof item === 'object' ? (item.title || item.name || 'Unknown') : String(item),
      type: type,
      psychologicalTraits: [],
      emotionalThemes: [],
      personalityIndicators: [],
      socialPatterns: [],
      cognitiveStyle: "balanced",
      values: [],
      culturalContext: [],
      thematicElements: [],
      regionalConnections: [],
      analysis: "Unable to analyze this item"
    };
  }
};

/**
 * Analyze all items collectively to build comprehensive personality profile
 */
exports.analyzeAllItems = async (movies, music, shows) => {
  try {
    console.log(`[Item Analysis] Starting comprehensive analysis of all items...`);
    console.log(`[Item Analysis] Movies: ${movies?.length || 0}, Music: ${music?.length || 0}, Shows: ${shows?.length || 0}`);

    const allAnalyses = [];

    // Analyze each movie individually
    if (movies && movies.length > 0) {
      for (const movie of movies.slice(0, 10)) { // Limit to 10 to avoid too many API calls
        const analysis = await this.analyzeItem(movie, 'movie');
        allAnalyses.push(analysis);
      }
    }

    // Analyze each music item individually
    if (music && music.length > 0) {
      for (const musicItem of music.slice(0, 10)) {
        const analysis = await this.analyzeItem(musicItem, 'music');
        allAnalyses.push(analysis);
      }
    }

    // Analyze each show individually
    if (shows && shows.length > 0) {
      for (const show of shows.slice(0, 10)) {
        const analysis = await this.analyzeItem(show, 'show');
        allAnalyses.push(analysis);
      }
    }

    console.log(`[Item Analysis] ✅ Completed analysis of ${allAnalyses.length} items`);

    // Now combine all analyses using AI to create comprehensive personality profile
    return await this.combineAnalyses(allAnalyses, movies, music, shows);

  } catch (error) {
    console.error(`[Item Analysis] ❌ Error in comprehensive analysis:`, error.message);
    throw error;
  }
};

/**
 * Use AI to combine individual item analyses into a comprehensive personality profile
 */
exports.combineAnalyses = async (itemAnalyses, movies, music, shows) => {
  try {
    // Extract all traits, themes, indicators from individual analyses
    const allTraits = itemAnalyses.flatMap(a => a.psychologicalTraits || []);
    const allThemes = itemAnalyses.flatMap(a => a.emotionalThemes || []);
    const allIndicators = itemAnalyses.flatMap(a => a.personalityIndicators || []);
    const allSocialPatterns = itemAnalyses.flatMap(a => a.socialPatterns || []);
    const allValues = itemAnalyses.flatMap(a => a.values || []);
    const cognitiveStyles = itemAnalyses.map(a => a.cognitiveStyle).filter(Boolean);
    const allCulturalContexts = itemAnalyses.flatMap(a => a.culturalContext || []);
    const allThematicElements = itemAnalyses.flatMap(a => a.thematicElements || []);
    const allRegionalConnections = itemAnalyses.flatMap(a => a.regionalConnections || []);

    // Get unique items
    const uniqueTraits = [...new Set(allTraits)];
    const uniqueThemes = [...new Set(allThemes)];
    const uniqueIndicators = [...new Set(allIndicators)];
    const uniqueSocialPatterns = [...new Set(allSocialPatterns)];
    const uniqueValues = [...new Set(allValues)];
    const uniqueCultures = [...new Set(allCulturalContexts)];
    const uniqueThemesDetailed = [...new Set(allThematicElements)];
    const uniqueRegions = [...new Set(allRegionalConnections)];

    const prompt = `Based on deep individual analysis of ${itemAnalyses.length} entertainment items, create a comprehensive personality profile that includes psychological, cultural, thematic, and regional insights.

Individual Item Analyses Summary:
- Psychological Traits Found: ${uniqueTraits.join(", ") || "None"}
- Emotional Themes: ${uniqueThemes.join(", ") || "None"}
- Personality Indicators: ${uniqueIndicators.join(", ") || "None"}
- Social Patterns: ${uniqueSocialPatterns.join(", ") || "None"}
- Values: ${uniqueValues.join(", ") || "None"}
- Cognitive Styles: ${cognitiveStyles.join(", ") || "None"}
- Cultural Contexts: ${uniqueCultures.join(", ") || "None"}
- Thematic Elements: ${uniqueThemesDetailed.join(", ") || "None"}
- Regional Connections: ${uniqueRegions.join(", ") || "None"}

Entertainment Collection:
- Movies: ${movies?.length || 0} items
- Music: ${music?.length || 0} items
- TV Shows: ${shows?.length || 0} items

Create a comprehensive personality profile that:
1. Synthesizes all individual analyses into a cohesive personality type
2. Identifies dominant traits and patterns
3. Reveals emotional needs and psychological makeup
4. Identifies cultural preferences and connections
5. Identifies thematic preferences (what themes they're drawn to)
6. Identifies regional/cultural connections
7. Provides insights into relationship compatibility based on shared culture/theme/region
8. Describes their entertainment taste profile

Return a JSON object in this EXACT format:
{
  "personalityType": "A brief personality type description (e.g., 'The Thrill-Seeking Intellectual')",
  "dominantTraits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "emotionalProfile": {
    "energyLevel": "low|medium|high",
    "emotionalIntensity": "low|medium|high",
    "stressCoping": "active|passive|avoidant|creative",
    "socialOrientation": "introverted|ambivert|extroverted",
    "emotionalNeeds": ["need1", "need2", "need3"]
  },
  "psychologicalSummary": "A comprehensive 3-4 sentence summary of their psychological profile based on all analyses",
  "culturalProfile": {
    "preferredCultures": ["culture1", "culture2", "culture3"],
    "culturalOpenness": "low|medium|high",
    "culturalConnections": ["connection1", "connection2"]
  },
  "thematicProfile": {
    "preferredThemes": ["theme1", "theme2", "theme3"],
    "themeComplexity": "simple|moderate|complex",
    "thematicInterests": ["interest1", "interest2"]
  },
  "regionalProfile": {
    "preferredRegions": ["region1", "region2", "region3"],
    "regionalDiversity": "low|medium|high",
    "regionalConnections": ["connection1", "connection2"]
  },
  "entertainmentProfile": {
    "preferredGenres": ["genre1", "genre2"],
    "tasteComplexity": "simple|moderate|complex",
    "preferenceStyle": "mainstream|niche|eclectic|curated"
  },
  "compatibilityFactors": {
    "idealMatchTraits": ["trait1", "trait2"],
    "compatiblePersonalityTypes": ["type1", "type2"],
    "relationshipStyle": "independent|interdependent|co-dependent",
    "culturalCompatibility": ["culture1", "culture2"],
    "thematicCompatibility": ["theme1", "theme2"],
    "regionalCompatibility": ["region1", "region2"]
  },
  "personalityInsights": [
    "Deep insight 1 about their personality",
    "Deep insight 2 about their personality",
    "Deep insight 3 about their personality"
  ]
}`;

    console.log(`[Item Analysis] 🔄 Combining ${itemAnalyses.length} individual analyses into comprehensive profile...`);

    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json"
      }
    });

    const content = result.response.text();
    const comprehensiveProfile = JSON.parse(content);

    // Add the individual analyses for reference
    comprehensiveProfile.individualAnalyses = itemAnalyses;

    console.log(`[Item Analysis] ✅ Comprehensive personality profile created: "${comprehensiveProfile.personalityType}"`);
    console.log(`[Item Analysis] Dominant traits:`, comprehensiveProfile.dominantTraits);

    return comprehensiveProfile;

  } catch (error) {
    console.error(`[Item Analysis] ❌ Error combining analyses:`, error.message);
    throw error;
  }
};

