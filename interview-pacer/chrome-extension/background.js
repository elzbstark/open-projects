// Interview Pacer — Background Service Worker
// Port-based keepalive: open ports keep the service worker alive so setInterval works.

importScripts('config.js');

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Track connected side panel ports
const ports = new Set();
let pollInterval = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return;
  ports.add(port);

  port.onDisconnect.addListener(() => {
    ports.delete(port);
    if (ports.size === 0) stopPolling();
  });

  // Handle commands from the side panel
  port.onMessage.addListener((msg) => {
    if (msg.type === 'SEND_COMMAND') sendCommandToApp(msg.command);
  });

  startPolling();
});

function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(async () => {
    if (ports.size === 0) { stopPolling(); return; }
    const state = await readAppState();
    for (const port of ports) {
      try { port.postMessage({ type: 'STATE', state }); } catch { /* port closed */ }
    }
  }, 1000);
}

function stopPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
}

async function readAppState() {
  try {
    const tabs = await chrome.tabs.query({});
    const appTab = tabs.find((t) => t.url && t.url.includes(APP_URL));
    if (!appTab?.id) return null;

    const results = await chrome.scripting.executeScript({
      target: { tabId: appTab.id },
      func: () => localStorage.getItem('interview-pacer-live-state'),
    });

    const raw = results?.[0]?.result;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function sendCommandToApp(command) {
  try {
    const tabs = await chrome.tabs.query({});
    const appTab = tabs.find((t) => t.url && t.url.includes(APP_URL));
    if (!appTab?.id) return;

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
  } catch { /* tab may have closed */ }
}
