const getDb = require("../utils/db");

exports.saveTaste = async (userId, tasteData) => {
  const db = await getDb();
  const existing = db.data.tastes.find(t => t.userId === userId);

  const updatedData = {
    movies: tasteData.movies || [],
    music: tasteData.music || [],
    shows: tasteData.shows || [],
    weights: tasteData.weights || { movies: 0.4, music: 0.4, shows: 0.2 },
    region: tasteData.region || "Unknown",
    regionPreference: tasteData.regionPreference || "any",
    languages: tasteData.languages || [],
    preferredLanguages: tasteData.preferredLanguages || []
  };

  if (existing) {
    Object.assign(existing, updatedData);
  } else {
    db.data.tastes.push({
      userId,
      ...updatedData
    });
  }

  await db.write();
};

exports.getTaste = async (userId) => {
  const db = await getDb();
  return db.data.tastes.find(t => t.userId === userId);
};

