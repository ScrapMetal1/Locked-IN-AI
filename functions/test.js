// A simple test script
const fetch = require('node-fetch'); // Make sure to npm install node-fetch or use native fetch in Node 18+

async function testBackend() {
  const url = 'https://us-central1-locked-in-ai-487607.cloudfunctions.net/api/analyze';

  const body = {
    url: "https://www.youtube.com",
    title: "YouTube",
    userGoal: "I need to study for my exam"
  };

  console.log("Sending request to:", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.text();
    console.log("Response:", data);
  } catch (error) {
    console.error("Test Failed:", error);
  }
}

testBackend();