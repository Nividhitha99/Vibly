const { OpenAI } = require("openai");

// Hardcode key locally only
const client = new OpenAI({
  apiKey: "YOUR_API_KEY"
});

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

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    res.json({
      success: true,
      output: response.choices[0].message.content.trim()
    });

  } catch (error) {
    console.log("Enhancer error:", error);
    res.status(500).json({ error: "Enhancement failed" });
  }
};

exports.moderateMessage = async (req, res) => {
    try {
      const { text } = req.body;
  
      const response = await client.moderations.create({
        model: "omni-moderation-latest",
        input: text
      });
  
      const result = response.results[0];
  
      if (result.flagged) {
        return res.status(400).json({
          allowed: false,
          reason: result.categories
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
  
