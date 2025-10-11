/**
 * Quick Test Script for Gemini API
 * 
 * Run this to verify your API key works before testing in the browser
 * 
 * Usage:
 *   1. Make sure .env.local has VITE_GEMINI_API_KEY set
 *   2. Run: npm run test-gemini
 * 
 * Add to package.json scripts:
 *   "test-gemini": "vite-node scripts/testGemini.ts"
 */

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

async function testGeminiConnection() {
  console.log("🧪 Testing Gemini API Connection...\n");

  if (!GEMINI_API_KEY) {
    console.error("❌ ERROR: VITE_GEMINI_API_KEY not found in environment");
    console.error("   Please add it to your .env.local file\n");
    process.exit(1);
  }

  console.log("✅ API Key found");
  console.log(`   Key: ${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}\n`);

  const testPrompt = "You are a helpful assistant. Respond with exactly: 'Connection successful!'";

  try {
    console.log("📡 Sending test request to Gemini API...\n");

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: testPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("✅ SUCCESS! Gemini API is working\n");
    console.log("📝 Response from Gemini:");
    console.log(`   "${aiResponse}"\n`);
    console.log("🚀 You're ready to use AI features in your Fuel Planner!\n");

    // Show usage info
    const finishReason = data.candidates?.[0]?.finishReason;
    console.log("📊 Request Details:");
    console.log(`   Finish Reason: ${finishReason}`);
    console.log(`   Model: gemini-2.0-flash-exp\n`);

  } catch (error) {
    console.error("❌ ERROR: Failed to connect to Gemini API\n");
    
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}\n`);
      
      // Common error scenarios
      if (error.message.includes("API_KEY_INVALID")) {
        console.error("💡 Troubleshooting:");
        console.error("   1. Check your API key at https://aistudio.google.com/app/apikey");
        console.error("   2. Make sure you copied the entire key");
        console.error("   3. Verify there are no extra spaces in .env.local\n");
      } else if (error.message.includes("quota")) {
        console.error("💡 Troubleshooting:");
        console.error("   You've hit the API rate limit (15 requests/min or 1500/day)");
        console.error("   Wait a few minutes and try again\n");
      } else if (error.message.includes("PERMISSION_DENIED")) {
        console.error("💡 Troubleshooting:");
        console.error("   Your API key doesn't have permission to use Gemini");
        console.error("   Make sure you created the key correctly\n");
      }
    } else {
      console.error(`   ${error}\n`);
    }
    
    process.exit(1);
  }
}

// Run the test
testGeminiConnection();
