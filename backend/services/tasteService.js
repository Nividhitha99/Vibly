const getDb = require("../utils/db");

exports.saveTaste = async (userId, tasteData) => {
  const db = await getDb();
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

