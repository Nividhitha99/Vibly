const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

exports.generateEmbedding = async (text) => {
  const response = await client.embeddings.create({
    model: "text-embedding-3-large",
    input: text
  });

  return response.data[0].embedding;
};
