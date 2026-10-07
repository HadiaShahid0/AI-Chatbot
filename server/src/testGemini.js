import "dotenv/config";

import { generateGeminiResponse } from "./services/geminiServices.js";

const testGemini = async () => {
  try {
    console.log("API key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

    console.log("Starting Gemini test...");

    const response = await Promise.race([
      generateGeminiResponse(
        "Implement the basic crud operations in mern for authentication and authorization with jwt and bcryptjs",
      ),

      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Gemini request timed out."));
        }, 30000);
      }),
    ]);

    console.log("\nGemini response:");
    console.log(response);
  } catch (error) {
    console.error("\nGemini error:");
    console.error(error);
  }
};

testGemini();
