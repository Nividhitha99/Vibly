const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get Gemini API key (from env or hardcoded)
const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyC9f18CZUqQE4OEh3bYPtaKr0xTW9HVTcI";

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

// Get conversation starters for a new chat
exports.getConversationStarters = async (req, res) => {
  try {
    const { userId, matchUserId } = req.body;

    if (!userId || !matchUserId) {
      return res.status(400).json({ error: "User IDs are required" });
    }

    const getDb = require("../utils/db");
    const db = await getDb();
    
    const currentUser = db.data.users.find(u => u.id === userId);
    const matchUser = db.data.users.find(u => u.id === matchUserId);
    
    if (!currentUser || !matchUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user preferences for context
    const currentTaste = db.data.tastes.find(t => t.userId === userId);
    const matchTaste = db.data.tastes.find(t => t.userId === matchUserId);

    const prompt = `You are a dating app assistant helping ${currentUser.name} start a conversation with ${matchUser.name}.

Current User's Interests:
${currentTaste ? `Movies: ${(currentTaste.movies || []).slice(0, 3).map(m => typeof m === 'object' ? m.title : m).join(", ")}
Music: ${(currentTaste.music || []).slice(0, 3).map(m => typeof m === 'object' ? m.name : m).join(", ")}
Shows: ${(currentTaste.shows || []).slice(0, 3).map(s => typeof s === 'object' ? s.title : s).join(", ")}` : "No preferences available"}

Match's Interests:
${matchTaste ? `Movies: ${(matchTaste.movies || []).slice(0, 3).map(m => typeof m === 'object' ? m.title : m).join(", ")}
Music: ${(matchTaste.music || []).slice(0, 3).map(m => typeof m === 'object' ? m.name : m).join(", ")}
Shows: ${(matchTaste.shows || []).slice(0, 3).map(s => typeof s === 'object' ? s.title : s).join(", ")}` : "No preferences available"}

Generate 5 conversation starter messages that are:
1. Warm and friendly
2. Reference shared interests if any
3. Open-ended to encourage response
4. Not too long (1-2 sentences max)
5. Appropriate and respectful

Return ONLY a JSON array of strings, no other text:
["message1", "message2", "message3", "message4", "message5"]`;

    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json"
      }
    });

    let starters = [];
    try {
      const content = result.response.text().trim();
      // Clean markdown code blocks if present
      const cleanedContent = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      starters = JSON.parse(cleanedContent);
    } catch (parseErr) {
      console.error("Error parsing conversation starters:", parseErr);
      // Fallback starters
      starters = [
        `Hey ${matchUser.name}! I noticed we have similar taste in entertainment. What's been your favorite recent watch?`,
        `Hi ${matchUser.name}! I'd love to hear more about your interests. What are you passionate about?`,
        `Hey! I think we'd have great conversations. What's something that made you smile recently?`,
        `Hi ${matchUser.name}! I'm excited to get to know you better. What's your ideal way to spend a weekend?`,
        `Hey! I'd love to chat. What's something you're looking forward to this week?`
      ];
    }

    res.json({ success: true, starters });
  } catch (error) {
    console.error("Error generating conversation starters:", error);
    res.status(500).json({ error: "Failed to generate conversation starters" });
  }
};

// Analyze chat and suggest responses
exports.analyzeChat = async (req, res) => {
  try {
    const { messages, userId, matchUserId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const getDb = require("../utils/db");
    const db = await getDb();
    
    const currentUser = db.data.users.find(u => u.id === userId);
    const matchUser = db.data.users.find(u => u.id === matchUserId);

    // Get recent messages (last 10)
    const recentMessages = messages.slice(-10).map(m => ({
      sender: m.senderId === userId ? currentUser?.name || "You" : matchUser?.name || "Them",
      message: m.message,
      timestamp: m.timestamp
    }));

    const prompt = `Analyze this conversation between ${currentUser?.name || "User"} and ${matchUser?.name || "Match"}:

${recentMessages.map(m => `${m.sender}: ${m.message}`).join("\n")}

Based on the conversation context, provide:
1. Response suggestions (3 options) - natural, engaging responses
2. Conversation tone analysis - is it friendly, flirty, serious, etc.?
3. Topics to explore - what could they discuss next?
4. Any red flags or concerns (if any)

Return JSON:
{
  "responseSuggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "tone": "friendly|flirty|serious|playful|etc",
  "topicsToExplore": ["topic1", "topic2", "topic3"],
  "redFlags": [],
  "advice": "Brief advice on how to continue the conversation"
}`;

    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });

    let analysis = {};
    try {
      const content = result.response.text().trim();
      const cleanedContent = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseErr) {
      console.error("Error parsing chat analysis:", parseErr);
      analysis = {
        responseSuggestions: ["That's interesting! Tell me more.", "I'd love to hear your thoughts on that.", "Sounds great! What do you think about...?"],
        tone: "friendly",
        topicsToExplore: ["shared interests", "future plans", "hobbies"],
        redFlags: [],
        advice: "Keep the conversation light and engaging."
      };
    }

    res.json({ success: true, analysis });
  } catch (error) {
    console.error("Error analyzing chat:", error);
    res.status(500).json({ error: "Failed to analyze chat" });
  }
};

// Get flirty message suggestions
exports.getFlirtySuggestions = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const prompt = `Rewrite this message to be playful, flirty, and charming while remaining respectful and appropriate:

Original message: "${message}"
${context ? `Context: ${context}` : ""}

Generate 3 variations:
1. Playful and light
2. More flirty but still respectful
3. Charming and witty

Return JSON:
{
  "suggestions": ["variation1", "variation2", "variation3"],
  "tone": "playful|flirty|charming"
}`;

    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json"
      }
    });

    let suggestions = {};
    try {
      const content = result.response.text().trim();
      const cleanedContent = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      suggestions = JSON.parse(cleanedContent);
    } catch (parseErr) {
      console.error("Error parsing flirty suggestions:", parseErr);
      suggestions = {
        suggestions: [message, message, message],
        tone: "playful"
      };
    }

    res.json({ success: true, suggestions });
  } catch (error) {
    console.error("Error generating flirty suggestions:", error);
    res.status(500).json({ error: "Failed to generate flirty suggestions" });
  }
};

// Get conflict resolution suggestions
exports.getConflictResolution = async (req, res) => {
  try {
    const { messages, userId, matchUserId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const getDb = require("../utils/db");
    const db = await getDb();
    
    const currentUser = db.data.users.find(u => u.id === userId);
    const matchUser = db.data.users.find(u => u.id === matchUserId);

    // Get recent messages that might indicate conflict
    const recentMessages = messages.slice(-10).map(m => ({
      sender: m.senderId === userId ? currentUser?.name || "You" : matchUser?.name || "Them",
      message: m.message
    }));

    const prompt = `Analyze this conversation for potential conflict, misunderstanding, or tension:

${recentMessages.map(m => `${m.sender}: ${m.message}`).join("\n")}

If there's a conflict or misunderstanding, provide:
1. What the issue might be
2. Suggested response to de-escalate
3. How to address the concern
4. Ways to rebuild rapport

If there's no conflict, suggest ways to keep the conversation positive.

Return JSON:
{
  "hasConflict": true/false,
  "issue": "description of issue if any",
  "suggestedResponse": "suggested message to send",
  "advice": "advice on how to handle this",
  "tone": "apologetic|understanding|reassuring|etc"
}`;

    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json"
      }
    });

    let resolution = {};
    try {
      const content = result.response.text().trim();
      const cleanedContent = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      resolution = JSON.parse(cleanedContent);
    } catch (parseErr) {
      console.error("Error parsing conflict resolution:", parseErr);
      resolution = {
        hasConflict: false,
        issue: "",
        suggestedResponse: "I understand your perspective. Let's talk about this.",
        advice: "Listen actively and respond with empathy.",
        tone: "understanding"
      };
    }

    res.json({ success: true, resolution });
  } catch (error) {
    console.error("Error analyzing conflict:", error);
    res.status(500).json({ error: "Failed to analyze conflict" });
  }
};
  
