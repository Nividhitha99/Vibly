const bcrypt = require("bcrypt");
const getDb = require("../utils/db");

async function setTestPasswords() {
  const db = await getDb();
  const testPassword = "test123"; // Simple test password
  
  // Find users
  const alex = db.data.users.find(u => u.email === "alex@example.com");
  const taylor = db.data.users.find(u => u.email === "taylor.mock@example.com");
  
  if (alex) {
    const hash = await bcrypt.hash(testPassword, 10);
    alex.password = hash;
    console.log("✓ Set password for Alex (alex@example.com)");
  } else {
    console.log("✗ Alex not found");
  }
  
  if (taylor) {
    const hash = await bcrypt.hash(testPassword, 10);
    taylor.password = hash;
    console.log("✓ Set password for Taylor (taylor.mock@example.com)");
  } else {
    console.log("✗ Taylor not found");
  }
  
  await db.write();
  console.log("\n✅ Test passwords set!");
  console.log("\nLogin credentials:");
  console.log("Alex: alex@example.com / test123");
  console.log("Taylor: taylor.mock@example.com / test123");
}

setTestPasswords().catch(console.error);

