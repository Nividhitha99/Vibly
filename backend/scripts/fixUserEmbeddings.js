const getDb = require("../utils/db");

async function fixUserEmbeddings() {
  const db = await getDb();
  
  console.log("Checking user/embedding mismatches...\n");
  
  // Find all embeddings
  const embeddings = db.data.embeddings;
  const users = db.data.users;
  
  console.log("Embeddings found:");
  embeddings.forEach(e => {
    const user = users.find(u => u.id === e.userId);
    if (user) {
      console.log(`✓ ${e.userId} -> ${user.name} (${user.email})`);
    } else {
      console.log(`✗ ${e.userId} -> NO USER FOUND`);
    }
  });
  
  console.log("\nUsers found:");
  users.forEach(u => {
    const embedding = embeddings.find(e => e.userId === u.id);
    if (embedding) {
      console.log(`✓ ${u.name} (${u.id}) -> HAS EMBEDDING`);
    } else {
      console.log(`✗ ${u.name} (${u.id}) -> NO EMBEDDING`);
    }
  });
  
  // Find embeddings without users
  const orphanEmbeddings = embeddings.filter(e => !users.find(u => u.id === e.userId));
  
  if (orphanEmbeddings.length > 0) {
    console.log(`\n⚠ Found ${orphanEmbeddings.length} embeddings without users.`);
    console.log("These are likely from the mock data script that created new users.");
    console.log("\nTo fix this, we need to either:");
    console.log("1. Create users with those IDs, or");
    console.log("2. Delete those orphaned embeddings");
    
    // Let's create users for the orphaned embeddings
    console.log("\nCreating users for orphaned embeddings...");
    
    const mockUserNames = ["Alex (Mock)", "Sam (Mock)", "Jordan (Mock)", "Taylor (Mock)"];
    const mockEmails = ["alex.mock@example.com", "sam.mock@example.com", "jordan.mock@example.com", "taylor.mock@example.com"];
    
    orphanEmbeddings.forEach((emb, index) => {
      const name = mockUserNames[index] || `User ${index + 1}`;
      const email = mockEmails[index] || `user${index + 1}@example.com`;
      
      // Check if user already exists
      const existing = users.find(u => u.id === emb.userId);
      if (!existing) {
        // Create a simple user (password will need to be set separately)
        db.data.users.push({
          id: emb.userId,
          name: name,
          email: email,
          password: "$2b$10$dummy.hash.for.mock.user.password123" // Dummy hash
        });
        console.log(`✓ Created user: ${name} (${emb.userId})`);
      }
    });
    
    await db.write();
    console.log("\n✅ Fixed! All embeddings now have corresponding users.");
  } else {
    console.log("\n✅ All embeddings have corresponding users!");
  }
}

fixUserEmbeddings().catch(console.error);

