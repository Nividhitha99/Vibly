const getDb = require("../utils/db");
const { v4: uuidv4 } = require("uuid");

exports.createUser = async (userData) => {
  const db = await getDb();
  const id = uuidv4();

  db.data.users.push({
    id,
    ...userData
  });

  await db.write();
  return { id };
};

exports.getUser = async (id) => {
  const db = await getDb();
  return db.data.users.find(u => u.id === id);
};

exports.updateUser = async (id, updateData) => {
  const db = await getDb();
  const user = db.data.users.find(u => u.id === id);
  if (!user) return null;

  Object.assign(user, updateData);
  await db.write();
  return user;
};

