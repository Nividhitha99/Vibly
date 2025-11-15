// Image Generation Service
// Generates profile images using Gemini or fallback avatar services

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyDwAi9MThmlibUi7pjXr2qEi3Kp-shFcMI";
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

/**
 * Generate a profile image URL based on gender
 * Since Gemini doesn't have direct image generation, we'll use a combination approach
 */
exports.generateProfileImage = async (gender, userId, name) => {
  try {
    const normalizedGender = (gender || "non-binary").toLowerCase();
    
    // Use a gender-based avatar service as fallback
    // We'll use a service that generates avatars based on gender
    let imageUrl = null;
    
    // Try to use Gemini to generate a prompt for image generation
    // Since Gemini can't generate images directly, we'll use a descriptive approach
    // and fall back to avatar services
    
    // For now, use a reliable avatar generation service based on gender
    if (normalizedGender === "male") {
      imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&gender=male&style=circle`;
    } else if (normalizedGender === "female") {
      imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&gender=female&style=circle`;
    } else {
      imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&style=circle`;
    }
    
    console.log(`[ImageGeneration] Generated avatar for ${gender}: ${imageUrl}`);
    return imageUrl;
    
  } catch (error) {
    console.error("[ImageGeneration] Error generating image:", error);
    // Fallback to a default avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&style=circle`;
  }
};

/**
 * Generate multiple profile images (for 2 image slots)
 */
exports.generateProfileImages = async (gender, userId, name) => {
  try {
    const image1 = await this.generateProfileImage(gender, userId, name);
    // Generate a slightly different variation for the second image
    const image2 = await this.generateProfileImage(gender, `${userId}-2`, name);
    
    return [image1, image2];
  } catch (error) {
    console.error("[ImageGeneration] Error generating images:", error);
    const fallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&style=circle`;
    return [fallback, fallback];
  }
};

