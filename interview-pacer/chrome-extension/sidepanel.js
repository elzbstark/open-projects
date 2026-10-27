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
const elBanner     = document.getElementById('pace-banner');
const elBannerText = document.getElementById('banner-text');
const elBannerChecks = document.getElementById('banner-checks');
const btnOnTrack   = document.getElementById('btn-ontrack');
const elOnTrackSteps = document.getElementById('ontrack-steps');
const elTargetName = document.getElementById('target-name');
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

// Same as useTimer.getTargetIndex in the app: where a perfectly-paced run would be
// right now, from total elapsed alone.
function getTargetIndex(sections, totalElapsed) {
  let cumulative = 0;
  for (let i = 0; i < sections.length; i++) {
    cumulative += sections[i].durationSeconds;
    if (totalElapsed < cumulative) return i;
  }
  return sections.length - 1;
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
  const totalElapsed  = sectionElapsed.reduce((a, b) => a + b, 0);
  const totalRemaining = Math.max(0, totalBudget - totalElapsed);
  // Once the whole interview's budget is gone, a freshly started section still
  // looks locally on-pace, so force move-on (same rule as the app).
  const paceStatus    = totalElapsed >= totalBudget ? 'move-on' : getPaceStatus(activeElapsed, activeBudget);
  const targetIndex   = getTargetIndex(sections, totalElapsed);
  const sectionsBehind = targetIndex - activeSectionIndex;
  // More than a section behind with under half the interview left: the section's own
  // allotment is no longer real, so show the interview's time left instead.
  const isSeverelyBehind = sectionsBehind > 1 && totalRemaining < totalBudget / 2;

  elLabel.textContent = [companyName, templateName].filter(Boolean).join(' — ');
  elSectName.textContent = activeSection?.name || '';
  elTargetName.textContent = sections[targetIndex]?.name || '';

  // Count down, capped at what's left in the interview, so a section never
  // promises more time than you actually have.
  if (isSeverelyBehind) {
    elElapsed.textContent = formatTime(totalRemaining);
    elBudget.textContent  = 'left in interview · skip ahead';
  } else {
    elElapsed.textContent = formatTime(Math.min(activeBudget - activeElapsed, totalRemaining));
    elBudget.textContent  = 'left in section';
  }
  elElapsed.classList.toggle('severe', isSeverelyBehind);

  renderBanner(sections, activeSectionIndex, targetIndex, sectionsBehind);

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

  renderSectionList(sections, sectionElapsed, activeSectionIndex, paceStatus);

  lastIsRunning = isRunning;
  btnPlayPause.textContent = isRunning ? '⏸' : '▶';
}

// Toggled by the "How to get on track" button; survives the once-a-second re-render.
let showOnTrack = false;
btnOnTrack.addEventListener('click', () => { showOnTrack = !showOnTrack; });

function renderBanner(sections, activeIndex, targetIndex, sectionsBehind) {
  if (sectionsBehind > 0) {
    elBanner.className = 'pace-banner behind';
    elBannerText.textContent = `Behind: should be ${sectionsBehind} section${sectionsBehind > 1 ? 's' : ''} ahead`;
    elBannerChecks.textContent = 'Take a pause · Ensure you have a structure';
  } else if (sectionsBehind < 0) {
    elBanner.className = 'pace-banner ahead';
    elBannerText.textContent = 'Ahead of pace';
    elBannerChecks.textContent = '';
  } else {
    elBanner.className = 'pace-banner';
    elBannerText.textContent = 'On pace';
    elBannerChecks.textContent = '';
  }

  // Recovery script comes from the app (GET_ON_TRACK), attached to the section you'd
  // skip to. Offered only when 2+ sections behind and that section is still ahead.
  const skipToIndex = sections.findIndex((s) => s.onTrack);
  const steps = sectionsBehind >= 2 && skipToIndex > activeIndex ? sections[skipToIndex].onTrack : null;
  btnOnTrack.classList.toggle('hidden', !steps);
  if (!steps) showOnTrack = false;
  btnOnTrack.textContent = showOnTrack ? 'Hide' : 'How to get on track';
  elOnTrackSteps.classList.toggle('hidden', !(steps && showOnTrack));
  elOnTrackSteps.innerHTML = '';
  (steps || []).forEach((step) => {
    const li = document.createElement('li');
    li.textContent = step;
    elOnTrackSteps.appendChild(li);
  });
}

// Track which sections are expanded in the extension panel
const expandedSections = new Set();

// Keep last-known render args so expand/collapse can re-render without a new state push
let lastSections = [];
let lastSectionElapsed = [];
let lastActiveIndex = 0;
let lastPaceStatus = 'on-pace';

function renderSectionList(sections, sectionElapsed, activeIndex, activePaceStatus) {
  lastSections = sections;
  lastSectionElapsed = sectionElapsed;
  lastActiveIndex = activeIndex;
  lastPaceStatus = activePaceStatus;

  elSectionList.innerHTML = '';
  sections.forEach((sec, i) => {
    const elapsed = sectionElapsed[i] || 0;
    const status  = i < activeIndex ? 'completed' : i === activeIndex ? 'active' : 'upcoming';
    const pStatus = i === activeIndex ? activePaceStatus : getPaceStatus(elapsed, sec.durationSeconds);
    const isExpanded = expandedSections.has(i);

    // Wrapper includes row + optional content
    const wrapper = document.createElement('div');
    wrapper.className = 'section-wrapper';

    const row = document.createElement('div');
    row.className = `section-row ${status}${isExpanded ? ' expanded' : ''}`;

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

    // Chevron — always shown if section has content
    if (sec.content) {
      const chevron = document.createElement('span');
      chevron.className = `section-chevron${isExpanded ? ' open' : ''}`;
      chevron.textContent = '›';
      row.appendChild(chevron);
    }

    // Click row to toggle expand (only if there's content)
    if (sec.content) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        if (expandedSections.has(i)) {
          expandedSections.delete(i);
        } else {
          expandedSections.add(i);
        }
        renderSectionList(lastSections, lastSectionElapsed, lastActiveIndex, lastPaceStatus);
      });
    }

    wrapper.appendChild(row);

    // Expanded content
    if (sec.content && isExpanded) {
      const contentEl = document.createElement('div');
      contentEl.className = 'section-content';
      contentEl.textContent = sec.content;
      wrapper.appendChild(contentEl);
    }

    elSectionList.appendChild(wrapper);
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
