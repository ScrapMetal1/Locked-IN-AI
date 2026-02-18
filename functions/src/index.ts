import { onRequest } from "firebase-functions/v2/https";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
// import { VertexAI } from "@google-cloud/vertexai"; //outdated
import { GoogleGenAI } from "@google/genai";

//create the router/web framework
const app = new Hono();
//any origin webiste can access the cloud service
app.use("/*", cors({ origin: "*" }));


// // Old Setup Vertex AI (Outside the route handler for performance)
// const vertexAI = new VertexAI({ project: "locked-in-ai-487607", location: "us-central1" });
// const model = vertexAI.getGenerativeModel({ model: "gemini-3-flash" })

//const modelId = 'gemini-2.5-flash-lite';

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

        // C. Construct Prompt 
        const prompt = `
      You are a productivity guardian.
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
                    parts: [{ text: sys_prompt }] //we use parts as its a Multimodal model
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
        //gos through the return and gets the text
        const text = response.text;

        // return the output in
        return c.json({ ai_verdict: text });

    } catch (err: any) {
        console.error(err);
        return c.json({ error: "AI Failed: " + (err.message || err.toString()) }, 500);
    }
});

















// creates a cloud function called api
// All responses come through here and then are routed to specific routes
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