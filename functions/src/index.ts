import { onRequest } from "firebase-functions/v2/https";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use("/*", cors({ origin: "*" }));


// specific responses: logic
// c is the context
app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "BACKEND IS RUNNING. LETS GO!",
  });
});

























// creates a cloud function called api
// all responses come through here and then are routed to specific routes

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