import { onRequest } from "firebase-functions/v2/https";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import * as admin from "firebase-admin";

//create the router/web framework
// Define the custom variables for the Hono context
type Variables = {
    uid: string;
};

//create the router/web framework
const app = new Hono<{ Variables: Variables }>();
//any origin webiste can access the cloud service
app.use("/*", cors({ origin: "*" }));

//connection to Google AIs
const ai = new GoogleGenAI({
    vertexai: true, // no api keys needed
    project: "locked-in-ai-487607",
    location: "us-central1"
});

// Schema for input validation. Zod
const AnalyseSchema = z.object({
    url: z.string().url(),
    userGoal: z.string().min(1),
    title: z.string().optional()
});

// Initialise Firebase Admin (Only once)
if (!admin.apps.length) { //number of apps running  
    admin.initializeApp();
}

// creates a cloud function called api
// All responses come through here first and then are routed to specific routes
// custom adaptor
export const api = onRequest(async (req, res) => {   //function within a function
    try {
        // 1. Convert Firebase Request to Web Standard Request

        //construct the webReq instance from the firebase request
        const webReq = new Request(req.protocol + "://" + req.get("host") + req.originalUrl, {
            method: req.method, // get or post
            headers: req.headers as HeadersInit, //metadata into a type assertion.


            // Firebase parses body automatically. We need to stringify it back for Hono
            body: (req.method !== "GET" && req.method !== "HEAD" && req.body)
                ? JSON.stringify(req.body) //if all true then turn the js object into a string
                : null, // if any are false
        });

        // 2. Fetch from Hono (Using await handles both Sync and Async responses)
        // Send it the main input of the router -> FETCH
        const webRes = await app.fetch(webReq);


        // 3. Send Response back to Firebase
        // webRes.status: This is the number Hono returned 
        // (e.g., 200 for Success, 404 for Not Found, 500 for Error)
        res.status(webRes.status);


        //format the output headers to send back to firebase
        webRes.headers.forEach((value, key) => res.setHeader(key, value));

        // Send the response
        const text = await webRes.text();
        res.send(text);

    } catch (err) {
        console.error("Bridge Error:", err);
        res.status(500).send("Internal Server Error");
    }
});


//after responses are fetched. Security Check
//MIDDLEWARE:
app.use("*", async (c, next) => { // * means every single route. 

    //Skip Auth for the root health check (optional, but good for debugging)
    if (c.req.path === "/") return await next();

    //Open Preflight requests --> The check before it sends a POST or GET 
    if (c.req.method === "OPTIONS") return await next();

    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized: Missing Token" }, 401);
    }

    // standard web security requires the header to look like this: Authorization: Bearer abc123xyz
    const token = authHeader.split("Bearer ")[1];


    //Verify Identity with the token
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        c.set("uid", decodedToken.uid); // Save User ID for later
        await next(); // Pass to the route
    } catch (error) {
        return c.json({ error: "Unauthorized: Invalid Token" }, 403);
    }
});




// The Route
app.post("/analyze", async (c) => {
    try {
        //Parse Body -- this grabs the data
        const body = await c.req.json();

        // B. Validate
        const result = AnalyseSchema.safeParse(body);
        if (!result.success) {
            return c.json({ error: result.error }, 400);
        }

        //takes the values and inserts them into a new const variable
        const { url, userGoal, title } = result.data;
        const uid = c.get("uid");
        console.log(`[${uid}] checking: ${url} | goal: "${userGoal}"`);

        // C. Construct Prompt 
        const prompt = `
      You are a productivity guardian. Be witty in your reason
      User Goal: "${userGoal}"
      Visiting: ${url} (${title || ""})
      
      Is this distracting to the users goal?
      Reply JSON: { "allow": boolean, "reason": "string" }
    `;

        const sys_prompt = "You are a productivity gatekeeper. Classify sites as 'ALLOW' or 'BLOCK' based on the user's current goal."

        //Call AI
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: {
                    parts: [{ text: sys_prompt }] // we use parts as its a Multimodal model
                },
                responseMimeType: "application/json" //force json response
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        })



        const text = response.text; // Get the json from the response. Response is a raw Gemini SDK object, not a simple JSON string. It contains tons of internal stuff (metadata, candidates, safety ratings, etc.).

        if (!text) { //check to see if text is null. TS knows if a return statement is type conditional and elimanates code below from assuming that the variable has a type.  
            return c.json({ error: "AI returned empty response" }, 500);
        }

        const parsed = JSON.parse(text); // turn the string into a json object '{ "allow": true, "reason": "relevant" }' --> { allow: true, reason: "relevant" }
        console.log(`[${uid}] verdict: ${parsed.allow ? "ALLOW" : "BLOCK"} — ${parsed.reason}`);

        return c.json(parsed);  // send clean object as HTTP response with proper headers to front end 


    } catch (err: any) {
        console.error(err);
        return c.json({ error: "AI Failed: " + (err.message || err.toString()) }, 500);
    }
});

















