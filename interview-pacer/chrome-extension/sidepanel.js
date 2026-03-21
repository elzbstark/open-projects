// Interview Pacer — Side Panel HUD
// Connects to background via persistent port — keeps service worker alive.

const STALE_MS = 5000;

const elNoSession  = document.getElementById('no-session');
const elHud        = document.getElementById('hud');
const elLabel      = document.getElementById('session-label');
const elSectName   = document.getElementById('current-section-name');
const elElapsed    = document.getElementById('section-elapsed');
const elBudget     = document.getElementById('section-budget');
const elPaceBar    = document.getElementById('pace-bar');
const elPaceBadge  = document.getElementById('pace-badge');
const elTotalBar   = document.getElementById('total-bar');
const elTotalTimer = document.getElementById('total-timer');
const elSectionList = document.getElementById('section-list');
const btnPrev      = document.getElementById('btn-prev');
const btnPlayPause = document.getElementById('btn-playpause');
const btnNext      = document.getElementById('btn-next');

// ── Port connection (keeps background service worker alive) ──────────────────

let port = null;

function connect() {
  port = chrome.runtime.connect({ name: 'sidepanel' });

  port.onMessage.addListener((msg) => {
    if (msg.type === 'STATE') render(msg.state);
  });

  port.onDisconnect.addListener(() => {
    // Service worker was terminated — reconnect to revive it
    port = null;
    setTimeout(connect, 200);
  });
}

connect();

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const abs = Math.abs(Math.round(seconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
}

function getPaceStatus(elapsed, budget) {
  const ratio = elapsed / budget;
  if (ratio > 1.1) return 'move-on';
  if (ratio > 1.0) return 'over-time';
  if (ratio > 0.75) return 'warning';
  return 'on-pace';
}

function paceLabel(status) {
  return { 'on-pace': 'On Pace', warning: 'Warning', 'over-time': 'Over Time', 'move-on': 'Move On' }[status] || status;
}

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

// ── Render ───────────────────────────────────────────────────────────────────

let lastIsRunning = true;

function render(state) {
  if (!state || Date.now() - state.updatedAt > STALE_MS) {
    showNoSession();
    return;
  }

  elNoSession.classList.add('hidden');
  elHud.classList.remove('hidden');

  const { companyName, templateName, activeSectionIndex, isRunning,
          sectionElapsed, sections, totalBudget } = state;

  const activeElapsed = sectionElapsed[activeSectionIndex] || 0;
  const activeBudget  = sections[activeSectionIndex]?.durationSeconds || 1;
  const activeSection = sections[activeSectionIndex];
  const paceStatus    = getPaceStatus(activeElapsed, activeBudget);
  const totalElapsed  = sectionElapsed.reduce((a, b) => a + b, 0);

  elLabel.textContent = [companyName, templateName].filter(Boolean).join(' — ');
  elSectName.textContent = activeSection?.name || '';
  elElapsed.textContent  = formatTime(activeElapsed);
  elBudget.textContent   = formatTime(activeBudget);

  const paceRatio = clamp(activeElapsed / activeBudget, 0, 1.5);
  elPaceBar.style.width = `${clamp(paceRatio * 100, 0, 100)}%`;
  elPaceBar.className = 'progress-bar pace';

  elPaceBadge.textContent = paceLabel(paceStatus);
  elPaceBadge.className = `pace-badge ${paceStatus}`;

  elHud.className = `hud ${paceStatus}`;

  const totalRatio = clamp(totalElapsed / (totalBudget || 1), 0, 1);
  elTotalBar.style.width = `${totalRatio * 100}%`;
  elTotalBar.style.background = totalRatio > 0.9 ? 'var(--red)' : 'var(--green)';
  elTotalTimer.textContent = `${formatTime(totalElapsed)} / ${formatTime(totalBudget)}`;

  renderSectionList(sections, sectionElapsed, activeSectionIndex);

  lastIsRunning = isRunning;
  btnPlayPause.textContent = isRunning ? '⏸' : '▶';
}

function renderSectionList(sections, sectionElapsed, activeIndex) {
  elSectionList.innerHTML = '';
  sections.forEach((sec, i) => {
    const elapsed = sectionElapsed[i] || 0;
    const status  = i < activeIndex ? 'completed' : i === activeIndex ? 'active' : 'upcoming';
    const pStatus = getPaceStatus(elapsed, sec.durationSeconds);

    const row = document.createElement('div');
    row.className = `section-row ${status}`;

    const check = document.createElement('span');
    check.className = 'section-check';
    check.textContent = status === 'completed' ? '✓' : status === 'active' ? '▶' : '';

    const name = document.createElement('span');
    name.className = 'section-name';
    name.textContent = sec.name;

    row.appendChild(check);
    row.appendChild(name);

    if (status !== 'upcoming') {
      const elapsedEl = document.createElement('span');
      elapsedEl.className = 'section-elapsed';
      elapsedEl.textContent = formatTime(elapsed);
      if (status === 'active') {
        elapsedEl.style.color = {
          'on-pace': 'var(--green)', warning: 'var(--yellow)',
          'over-time': 'var(--red)', 'move-on': 'var(--urgent)',
        }[pStatus] || 'var(--muted)';
      }
      row.appendChild(elapsedEl);
    }

    elSectionList.appendChild(row);
  });
}

function showNoSession() {
  elNoSession.classList.remove('hidden');
  elHud.classList.add('hidden');
}

// ── Controls ─────────────────────────────────────────────────────────────────

function sendCommand(command) {
  if (port) port.postMessage({ type: 'SEND_COMMAND', command });
}

btnPrev.addEventListener('click', () => sendCommand('prev'));
btnNext.addEventListener('click', () => sendCommand('next'));
btnPlayPause.addEventListener('click', () => sendCommand(lastIsRunning ? 'pause' : 'resume'));
