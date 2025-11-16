const getDb = require("../utils/db");

async function listUsers() {
  const db = await getDb();
  const excludeNames = ['Sam', 'Jordan', 'Taylor', 'Reetu'];
  const users = db.data.users.filter(u => 
    !excludeNames.includes(u.name) && 
    !u.name.includes('(Mock)') &&
    u.email // Make sure email exists
  );

  console.log('\n📋 Available Users for Testing (excluding Sam, Jordan, Taylor, Reetu):\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  users.slice(0, 15).forEach((u, idx) => {
    console.log(`${idx + 1}. ${u.name}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Password: password123 (default for most users)`);
    console.log(`   Age: ${u.age || 'N/A'}`);
    console.log(`   Gender: ${u.gender || 'N/A'}`);
    console.log(`   Location: ${u.city || u.location || 'N/A'}`);
    console.log(`   Looking for: ${Array.isArray(u.lookingFor) ? u.lookingFor.join(', ') : u.lookingFor || 'N/A'}`);
    console.log(`   Age Range: ${u.ageRangeMin || 18}-${u.ageRangeMax || 45}`);
    console.log(`   Max Distance: ${u.maxDistance || 30} miles`);
    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

listUsers().catch(console.error);

