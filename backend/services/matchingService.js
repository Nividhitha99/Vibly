const getDb = require("../utils/db");
const cosine = require("../utils/cosine");

exports.findMatches = async (currentUserId) => {
  const db = await getDb();
  const allUsers = db.data.users.filter(u => u.id !== currentUserId);

  const currentEmbedding = db.data.embeddings.find(e => e.userId === currentUserId)?.vector || [];

  const scores = allUsers.map(user => {
    const otherEmbedding = db.data.embeddings.find(e => e.userId === user.id)?.vector || [];
    const score = cosine(currentEmbedding, otherEmbedding);
    return { ...user, score };
  });

  return scores.sort((a, b) => b.score - a.score);
};

