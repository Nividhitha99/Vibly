const getDb = require("../utils/db");
const crypto = require("crypto");

exports.createUser = async (data) => {
  const db = await getDb();
  const id = crypto.randomUUID();

  db.data.users.push({
    id,
    ...data
  });

  await db.write();

  return { id };
};

exports.findByEmail = async (email) => {
  const db = await getDb();
  return db.data.users.find(u => u.email === email);
};

exports.getUser = async (id) => {
  const db = await getDb();
  return db.data.users.find(u => u.id === id);
};
