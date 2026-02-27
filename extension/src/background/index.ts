import { analyzeUrl } from '../services/llm';
import { getSession, endSession } from '../services/storage';

// this is the brain of the extension — runs silently, no ui
// watches every tab and decides if it should be blocked

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    // only care when the page has fully loaded and has a real url
    if (changeInfo.status !== "complete" || !tab.url) return;

    // skip internal browser pages like chrome:// or about:blank
    if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) return;

    // read what the user set up — are they in a session? what's their goal?
    const state = await getSession();

    // if they're not locked in, do nothing
    if (!state.isLockedIn) return;

    // ask the backend: is this url a distraction for this goal?
    const result = await analyzeUrl(tab.url, tab.title || "", state.currentGoal);



    //ERROR HANDLING

    if (result.reason === "Session expired. Please log in again.") {
        chrome.notifications.create("session-expired", {
            type: "basic",
            iconUrl: "icon128.png",
            title: "Session Expired",
            message: "Please open the extension and sign in again."
        });
        return;
    }

    if (result.reason === "RATE_LIMITED") {

        //show a chrome notification
        chrome.notifications.create("rate-limit", {
            type: "basic",
            iconUrl: "icon128.png",
            title: "Daily Limit Reached",
            message: "Your session has ended. Blocking is paused until tomorrow"
        })

        console.log("Rate limit reached! Ending session and updating UI state and sending notification...");

        //end the session and flag as rate limited
        await endSession(true);
        return;
    }

    

    // if the ai says block it, redirect to our blocked page
    if (!result.allowed) {
        console.log(`blocking ${tab.url} — ${result.reason}`);
        chrome.tabs.update(tabId, {
            url: chrome.runtime.getURL(`blocked.html?reason=${encodeURIComponent(result.reason)}&goal=${encodeURIComponent(state.currentGoal)}`)
        });
    }
});