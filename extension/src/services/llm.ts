import { ScanResult } from '../types';
import { GoogleGenAI } from '@google/generative-ai'; // assuming this is your wrapper/sdk

// initialize outside to keep things fast
const ai = new GoogleGenAI({
    vertexai: true,
    project: "locked-in-ai-487607",
    location: "us-central1"
});

export async function analyzeUrl(url: string, title: string, goal: string): Promise<ScanResult> {
  try {
    // setup the guardrails for the model
    const sys_prompt = "you are a productivity gatekeeper. classify sites as 'ALLOW' or 'BLOCK' based on the user's current goal.";
    
    // focus the ai on the relationship between the url and the intent
    const prompt = `
      user goal: "${goal}"
      visiting: ${url} (${title || "no title"})
      
      is this distracting?
      reply json: { "allow": boolean, "reason": "string" }
    `;

    // trigger the ai call
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash", // updated to match current available flash models
        config: {
            systemInstruction: {
                parts: [{ text: sys_prompt }]
            },
            responseMimeType: "application/json"
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    // parse the string response into an object
    const decision = JSON.parse(response.text);

    // map the ai verdict back to our scanresult format
    return {
      url,
      isRelevant: decision.allow,
      confidence: 0.9, // ai is usually pretty certain
      summary: decision.reason
    };

  } catch (err: any) {
    // log the failure and fail-safe to 'relevant' so we don't break the user's flow
    console.error("ai analysis failed:", err);
    return {
      url,
      isRelevant: true, 
      confidence: 0,
      summary: "error in ai processing; defaulting to allow."
    };
  }
}