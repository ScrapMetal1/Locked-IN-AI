import { ScanResult } from '../types';
import { getIdToken } from './auth';

// url of our deployed cloud function
const API_URL = 'https://us-central1-locked-in-ai-487607.cloudfunctions.net/api/analyze';

//background script calls this everytime the tab loads. 
export async function analyzeUrl(url: string, title: string, goal: string): Promise<ScanResult> {
  try {
    // grab the user's identity token — this is the key that unlocks our api
    const token = await getIdToken();

    // no token means not logged in — fail safe, just let them through
    if (!token) {
      console.warn("analyzeUrl: user not logged in, allowing by default.");
      return { allowed: true, reason: "User not logged in." };
    }

    // hit the backend with the url, title and goal
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // attaches the user's identity to the request
      },
      body: JSON.stringify({ url, title, userGoal: goal })
    });

    // if the backend throws an error, don't take it out on the user — just allow
    if (!response.ok) {
      console.error("Backend error:", response.status, response.statusText);
      return { allowed: true, reason: "Backend error, allowing by default." };
    }

    // parse what the ai said — should be { allow: boolean, reason: string }
    const verdict = await response.json();

    // map it to the ScanResult shape the rest of the app uses
    return {
      allowed: verdict.allow,
      reason: verdict.reason
    };

  } catch (err: any) {
    console.error("analyzeUrl failed:", err); // log it so we can debug
    // something broke — don't punish the user for it
    return { allowed: true, reason: "Network error, allowing by default." };
  }
}