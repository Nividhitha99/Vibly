const db = require("../utils/db");

exports.saveTaste = async (userId, tasteData) => {
  // check if the user already has tastes saved
  const existing = db.data.tastes.find(t => t.userId === userId);

  if (existing) {
    Object.assign(existing, tasteData);
  } else {
    db.data.tastes.push({
      userId,
      ...tasteData
    });
  }

  await db.write();
};

exports.getTaste = async (userId) => {
  return db.data.tastes.find(t => t.userId === userId);
};

exports.saveTaste = async (userId, tasteData) => {
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

