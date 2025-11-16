const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyC9f18CZUqQE4OEh3bYPtaKr0xTW9HVTcI";
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/**
 * Calculate sexuality score based on physical, sexual, and emotional dimensions
 * @param {number} physically - 0 (man) to 100 (woman)
 * @param {number} sexually - 0 (masculine) to 100 (feminine)
 * @param {number} emotionally - 0 (masculine) to 100 (feminine)
 * @returns {Promise<object>} Object with sexuality score and analysis
 */
exports.calculateSexualityScore = async (physically, sexually, emotionally) => {
  try {
    const prompt = `Based on these three dimensions of a person's identity:
- Physically: ${physically}% (0% = man, 100% = woman)
- Sexually: ${sexually}% (0% = masculine, 100% = feminine)
- Emotionally: ${emotionally}% (0% = masculine, 100% = feminine)

Calculate a comprehensive sexuality score (0-100) that represents their overall identity and compatibility potential. 
Also provide:
1. A sexuality label/description (e.g., "heterosexual", "bisexual", "pansexual", "queer", etc.)
2. Compatibility factors for matching
3. Preferred partner characteristics

Return a JSON object in this EXACT format:
{
  "sexualityScore": 75,
  "label": "bisexual with feminine lean",
  "compatibilityFactors": {
    "preferredPhysicalRange": [30, 70],
    "preferredSexualRange": [40, 80],
    "preferredEmotionalRange": [35, 75]
  },
  "analysis": "Brief 2-3 sentence analysis"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text();

    // Clean JSON if wrapped in markdown
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    }

    const sexualityData = JSON.parse(cleanedContent);
    
    // Ensure score is between 0-100
    sexualityData.sexualityScore = Math.max(0, Math.min(100, sexualityData.sexualityScore || 50));
    
    return sexualityData;
  } catch (error) {
    console.error("[SexualityScore] Error calculating sexuality score:", error);
    // Fallback: calculate simple average
    const avgScore = Math.round((physically + sexually + emotionally) / 3);
    return {
      sexualityScore: avgScore,
      label: "calculated from dimensions",
      compatibilityFactors: {
        preferredPhysicalRange: [Math.max(0, physically - 30), Math.min(100, physically + 30)],
        preferredSexualRange: [Math.max(0, sexually - 30), Math.min(100, sexually + 30)],
        preferredEmotionalRange: [Math.max(0, emotionally - 30), Math.min(100, emotionally + 30)]
      },
      analysis: "Score calculated from physical, sexual, and emotional dimensions"
    };
  }
};

/**
 * Calculate compatibility between two users based on their sexuality scores
 * @param {object} user1Sexuality - First user's sexuality data
 * @param {object} user2Sexuality - Second user's sexuality data
 * @returns {number} Compatibility score (0-1)
 */
exports.calculateSexualityCompatibility = (user1Sexuality, user2Sexuality) => {
  if (!user1Sexuality || !user2Sexuality) return 0.5; // Default compatibility if missing
  
  const score1 = user1Sexuality.sexualityScore || 50;
  const score2 = user2Sexuality.sexualityScore || 50;
  
  // Calculate similarity (closer scores = higher compatibility)
  const scoreDiff = Math.abs(score1 - score2);
  const compatibility = 1 - (scoreDiff / 100); // 0-1 scale
  
  // Boost if their preferred ranges overlap
  let rangeBonus = 0;
  if (user1Sexuality.compatibilityFactors && user2Sexuality.compatibilityFactors) {
    const factors1 = user1Sexuality.compatibilityFactors;
    const factors2 = user2Sexuality.compatibilityFactors;
    
    // Check physical range overlap
    if (factors1.preferredPhysicalRange && factors2.preferredPhysicalRange) {
      const overlap1 = Math.max(0, Math.min(factors1.preferredPhysicalRange[1], factors2.preferredPhysicalRange[1]) - 
                                   Math.max(factors1.preferredPhysicalRange[0], factors2.preferredPhysicalRange[0]));
      if (overlap1 > 0) rangeBonus += 0.1;
    }
    
    // Check sexual range overlap
    if (factors1.preferredSexualRange && factors2.preferredSexualRange) {
      const overlap2 = Math.max(0, Math.min(factors1.preferredSexualRange[1], factors2.preferredSexualRange[1]) - 
                                   Math.max(factors1.preferredSexualRange[0], factors2.preferredSexualRange[0]));
      if (overlap2 > 0) rangeBonus += 0.1;
    }
    
    // Check emotional range overlap
    if (factors1.preferredEmotionalRange && factors2.preferredEmotionalRange) {
      const overlap3 = Math.max(0, Math.min(factors1.preferredEmotionalRange[1], factors2.preferredEmotionalRange[1]) - 
                                   Math.max(factors1.preferredEmotionalRange[0], factors2.preferredEmotionalRange[0]));
      if (overlap3 > 0) rangeBonus += 0.1;
    }
  }
  
  return Math.min(1, compatibility + rangeBonus);
};

