const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get Gemini API key (from env or hardcoded)
const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyDwAi9MThmlibUi7pjXr2qEi3Kp-shFcMI";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

exports.enhanceChat = async (req, res) => {
  try {
    const { text, mode } = req.body;

    const instructions = {
      flirty: "Rewrite this message to sound warm, playful, flirty, but respectful.",
      funny: "Rewrite this message to be light-hearted and subtly humorous.",
      shorter: "Rewrite this message to be shorter and more concise.",
      nicer: "Rewrite this message to be friendlier, polite, and smooth.",
      clearer: "Rewrite this message to be easier to understand."
    };

    const prompt = `
Rewrite this message based on the following rule:
Mode: ${mode}
Rule: ${instructions[mode]}

Message:
"${text}"

Return only the rewritten message string, no JSON formatting.
    `;

    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.7
      }
    });

    res.json({
      success: true,
      output: result.response.text().trim()
    });

  } catch (error) {
    console.log("Enhancer error:", error);
    res.status(500).json({ error: "Enhancement failed" });
  }
};

exports.moderateMessage = async (req, res) => {
    try {
      const { text } = req.body;
  
      // Use Gemini for moderation
      const moderationPrompt = `Analyze this message for inappropriate content, hate speech, harassment, or explicit material. Return JSON: {"flagged": true/false, "reason": "reason if flagged"}\n\nMessage: "${text}"`;
      
      const result = await model.generateContent(moderationPrompt, {
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });
  
      const moderationResult = JSON.parse(result.response.text());
  
      if (moderationResult.flagged) {
        return res.status(400).json({
          allowed: false,
          reason: moderationResult.reason || "Inappropriate content detected"
        });
      }
  
      res.json({
        allowed: true
      });
  
    } catch (error) {
      console.log("Moderation error:", error);
      res.status(500).json({ error: "Moderation failed" });
    }
  };
  
