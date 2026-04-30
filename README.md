# Locked In — AI

**Locked In — AI** is a Deep Work Logger and Focus Helper, it uses AI to  intelligently analyse your browsing distractions given your current goals. If your goal is studying for a maths test you can watch a youtube video on quadratics but it will block unrelated gaming videos. So you can still use youtube without getting distracted. Or any other open website like Google where you are vulnerable to being side-tracked. 

## Install from Chrome Web store
[LINK](https://chromewebstore.google.com/detail/locked-in-ai/dhdhiepkcofachocmmnmeddekgfmgjil)


## Manual Installation

1. **Download the Extension:** Go to the [Releases](https://github.com/ScrapMetal1/Locked-IN-AI/releases/tag/V1.1) page and download the `lockedin.crx` file.

2. **Enable Developer Mode:** Open Google Chrome and navigate to `chrome://extensions/`. In the **top-right** corner, toggle the **Developer mode** switch to **ON**.

<img width="235" height="156" alt="image" src="https://github.com/user-attachments/assets/c705efd1-0de7-4b28-8b2b-eec5ccc58532" />

3.  **Drag and drop the .crx file:** Drag and drop the .crx file into the extensions page. 

<img width="958" height="351" alt="pV8wr8krk9" src="https://github.com/user-attachments/assets/a1dc8165-873b-4678-8376-1b712b80f66b" />


4.  **Pin for Easy Access:** Click the puzzle piece icon in your Chrome toolbar and pin **Locked In — AI** for quick access. 





## [Deep Work Logger](lockedin.eliascorp.org)

Sign into [lockedin.eliascorp.org](lockedin.eliascorp.org) with the same google account you used for the extension so you can log your deepwork. You can also create todos and the they will show up as options on the extension. You can quickly select a task to start a focus session. 

Also theres a leaderboard. Come compete against me!

<img width="986" height="886" alt="image" src="https://github.com/user-attachments/assets/96b2b1c0-a76d-44e9-b0ed-5b53f0fc8b98" />


## Optimisation Side Quest

### Caching and predefined blocklists (Chrome Storage API)

**What was improved:** Reduced database reads, network latency, and API costs.

**How it works:** Instead of querying the remote database (Firebase) on every tab navigation, the extension caches the `userState`, `blocklist`, and `allowlist` locally using `chrome.storage.local`.  If you visit the same URL while working on the same goal, the extension will retrieve the "ALLOW" or "BLOCK" verdict from your browser's local storage instead of hitting the backend.

**Results:** Tab analysis times dropped from ~300ms API call to `<10ms` (local read). No need to access backed. More than 10x faster since there is no API call needed to Gemini or latency from talking to a server. Saves device battery life, reduces memory spikes, and prevents hitting AI rate limits for users and me :D


## License & Legal
**Copyright (c) 2026 EliasCorp. All Rights Reserved.**
