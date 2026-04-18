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

    // Run inside the app tab: read state and, if the timer is running,
    // advance elapsed and bump updatedAt based on wall-clock time.
    // This keeps the sidepanel alive even when Chrome throttles or freezes
    // the app tab's own setInterval.
    const results = await chrome.scripting.executeScript({
      target: { tabId: appTab.id },
      func: () => {
        const raw = localStorage.getItem('interview-pacer-live-state');
        if (!raw) return null;
        try {
          const state = JSON.parse(raw);
          if (state?.isRunning) {
            const gapSec = (Date.now() - state.updatedAt) / 1000;
            if (gapSec > 0.5) {
              state.sectionElapsed = state.sectionElapsed.map((e, i) =>
                i === state.activeSectionIndex ? e + gapSec : e
              );
              state.totalElapsed = (state.totalElapsed || 0) + gapSec;
              state.updatedAt = Date.now();
              localStorage.setItem('interview-pacer-live-state', JSON.stringify(state));
            }
          }
          return state;
        } catch {
          return null;
        }
      },
    });

    return results?.[0]?.result ?? null;
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
