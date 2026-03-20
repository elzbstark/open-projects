// Interview Pacer — Background Service Worker
// Polls the app tab's localStorage every second and writes state to chrome.storage.session

// APP_URL is defined in config.js, which is loaded before background.js
// Since MV3 service workers use importScripts for classic scripts:
importScripts('config.js');

let pollingInterval = null;

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Start polling when the extension loads
startPolling();

function startPolling() {
  if (pollingInterval) return;
  pollingInterval = setInterval(pollAppTab, 1000);
}

async function pollAppTab() {
  try {
    // Find a tab running the app
    const tabs = await chrome.tabs.query({});
    const appTab = tabs.find((t) => t.url && t.url.includes(APP_URL));

    if (!appTab || !appTab.id) {
      await chrome.storage.session.set({ liveState: null });
      return;
    }

    // Read localStorage from the app tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: appTab.id },
      func: () => {
        return localStorage.getItem('interview-pacer-live-state');
      },
    });

    const raw = results?.[0]?.result;
    if (!raw) {
      await chrome.storage.session.set({ liveState: null });
      return;
    }

    const state = JSON.parse(raw);
    await chrome.storage.session.set({ liveState: state });
  } catch (err) {
    // Tab may be in a restricted context — ignore silently
    await chrome.storage.session.set({ liveState: null });
  }
}

// Write a command to the app tab's localStorage
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SEND_COMMAND') {
    sendCommandToApp(message.command).then(() => sendResponse({ ok: true }));
    return true; // keep channel open for async response
  }
});

async function sendCommandToApp(command) {
  const tabs = await chrome.tabs.query({});
  const appTab = tabs.find((t) => t.url && t.url.includes(APP_URL));
  if (!appTab || !appTab.id) return;

  await chrome.scripting.executeScript({
    target: { tabId: appTab.id },
    func: (cmd) => {
      localStorage.setItem(
        'interview-pacer-command',
        JSON.stringify({ command: cmd, issuedAt: Date.now() })
      );
    },
    args: [command],
  });
}
