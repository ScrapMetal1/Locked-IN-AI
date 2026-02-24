// read the reason and goal from the url params passed by the background script
const params = new URLSearchParams(window.location.search);
const reason = params.get('reason');
const goal = params.get('goal');

if (reason) document.getElementById('reason').textContent = reason;
if (goal) document.getElementById('goal').textContent = goal;

// close the tab when the button is clicked
document.getElementById('close-btn').addEventListener('click', () => {
    chrome.tabs.getCurrent(tab => chrome.tabs.remove(tab.id));
});
