// Quick test script to verify Gemini API is working
// Run with: node backend/test-gemini.js

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyC9f18CZUqQE4OEh3bYPtaKr0xTW9HVTcI";

async function testGemini() {
  console.log("🧪 Testing Gemini API connection...");
  console.log(`📝 Using API Key: ${GEMINI_KEY.substring(0, 20)}...`);
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    
    // First, try to list available models
    console.log("\n📋 Fetching available models...");
    try {
      const axios = require("axios");
      const modelsResponse = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`
      );
      
      if (modelsResponse.data && modelsResponse.data.models) {
        console.log(`✅ Found ${modelsResponse.data.models.length} available models:`);
        const modelNames = modelsResponse.data.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace('models/', ''));
        
        console.log("📌 Models that support generateContent:");
        modelNames.forEach(name => console.log(`   - ${name}`));
        
        // Try a stable model (prefer non-preview versions)
        const stableModels = modelNames.filter(m => !m.includes('preview') && !m.includes('exp'));
        const testModel = stableModels.length > 0 ? stableModels[0] : modelNames[0];
        
        if (testModel) {
          console.log(`\n🔄 Testing with model: ${testModel}...`);
          const model = genAI.getGenerativeModel({ model: testModel });
          const result = await model.generateContent("Say 'Hello from Gemini!' in exactly 5 words.");
          const response = result.response.text();
          
          console.log("✅ Gemini API Response:");
          console.log("📥", response);
          console.log(`\n🎉 Gemini API is working correctly with model: ${testModel}!`);
          console.log(`\n💡 Recommended model to use: "${testModel}"`);
          console.log(`   (or use "gemini-flash-latest" for always latest stable version)`);
          return;
        }
      }
    } catch (listError) {
      console.log("⚠️  Could not list models, trying common model names...");
    }
    
    // Fallback: Try different model names
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-1.5-pro", 
      "gemini-pro",
      "gemini-1.5-flash-latest",
      "gemini-1.0-pro",
      "gemini-1.0-pro-latest"
    ];
    
    let model = null;
    let workingModel = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`\n🔄 Trying model: ${modelName}...`);
        model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'Hello' in one word.");
        const response = result.response.text();
        workingModel = modelName;
        console.log(`✅ Model ${modelName} works!`);
        console.log(`📥 Response: ${response}`);
        break;
      } catch (err) {
        console.log(`❌ Model ${modelName} failed: ${err.message.split('\n')[0]}`);
      }
    }
    
    if (!workingModel) {
      throw new Error("None of the tested models worked. Check your API key permissions.");
    }
    
    console.log("\n📤 Testing full request with working model...");
    const fullResult = await model.generateContent("Say 'Hello from Gemini!' in exactly 5 words.");
    const fullResponse = fullResult.response.text();
    
    console.log("✅ Gemini API Response:");
    console.log("📥", fullResponse);
    console.log(`\n🎉 Gemini API is working correctly with model: ${workingModel}!`);
    console.log(`\n💡 Update your code to use: "${workingModel}"`);
    
  } catch (error) {
    console.error("\n❌ Gemini API Error:");
    console.error("   Message:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", JSON.stringify(error.response.data, null, 2));
    }
    console.error("\n💡 Check your API key and network connection");
    process.exit(1);
  }
}

testGemini();

