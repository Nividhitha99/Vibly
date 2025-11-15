const matchingService = require("../services/matchingService");

async function testMatching() {
  const alexUserId = "18ec8fd8-1953-4f63-981a-34f9621b5391";
  
  console.log(`Testing matches for Alex (${alexUserId})...\n`);
  
  try {
    const matches = await matchingService.getMatches(alexUserId);
    
    console.log(`Found ${matches.length} matches:\n`);
    
    if (matches.length === 0) {
      console.log("❌ No matches found!");
      console.log("\nThis could mean:");
      console.log("1. No other users have embeddings");
      console.log("2. Alex doesn't have an embedding");
      console.log("3. All other users were filtered out");
    } else {
      matches.forEach((match, index) => {
        console.log(`${index + 1}. ${match.name || 'Unknown'} (${match.userId})`);
        console.log(`   Score: ${(match.score * 100).toFixed(2)}%`);
        console.log(`   Email: ${match.email || 'N/A'}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("Error testing matches:", error);
    console.error(error.stack);
  }
}

testMatching().catch(console.error);

