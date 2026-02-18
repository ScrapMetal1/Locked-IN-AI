async function testBackend() {
    const url = 'https://us-central1-locked-in-ai-487607.cloudfunctions.net/api/analyze';

    const body = {
        url: "https://www.google.com/search?q=arsenal+score&sca_esv=6a3dc1d72e9664c9&biw=772&bih=824&sxsrf=ANbL-n5_M4FrJsNT2HJWiO0wjFfj3WnQuQ%3A1771385876300&ei=FDSVac2FEpqUseMP3dOhsA0&ved=0ahUKEwjN36rPjuKSAxUaSmwGHd1pCNYQ4dUDCBM&uact=5&oq=arsenal+score&gs_lp=Egxnd3Mtd2l6LXNlcnAiDWFyc2VuYWwgc2NvcmUyCxAAGIAEGJECGIoFMgQQABgDMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgARIwxpQtQVYnBpwAXgBkAEAmAG2AaABww2qAQQwLjExuAEDyAEA-AEBmAIMoALqDagCC8ICBhCzARiFBMICFxAAGIAEGJECGLQCGOcGGIoFGOoC2AEBwgIQEAAYAxi0AhjqAhiPAdgBAcICEBAuGAMYtAIY6gIYjwHYAQHCAhEQLhiABBiRAhixAxiDARiKBcICChAuGIAEGEMYigXCAgoQABiABBhDGIoFwgIQEAAYgAQYsQMYQxiDARiKBcICCxAuGIAEGJECGIoFwgIIEAAYgAQYsQPCAgsQABiABBixAxiDAZgDBOIDBRIBMSBA8QWRTB1H4YFbNboGBAgBGAeSBwQxLjExoAfLV7IHBDAuMTG4B-YNwgcFMC45LjPIBx2ACAA&sclient=gws-wiz-serp&safe=active&ssui=on",
        title: "arsenal score - Google Search",
        userGoal: "I need to study for my maths exam. I really do rip"
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