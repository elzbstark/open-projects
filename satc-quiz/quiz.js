// ── Quiz state ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: "mood",
    text: "How are you feeling right now?",
    options: [
      { value: "cozy",        label: "Cozy & nostalgic",      emoji: "🕯️" },
      { value: "sad",         label: "Sad or processing",      emoji: "🌧️" },
      { value: "laugh",       label: "I need a laugh",         emoji: "😂" },
      { value: "celebratory", label: "Celebratory",            emoji: "🥂" },
      { value: "restless",    label: "Restless, want drama",   emoji: "🔥" },
    ],
  },
  {
    key: "character",
    text: "Which character do you most want to see?",
    options: [
      { value: "carrie",    label: "Carrie",    emoji: "👠" },
      { value: "charlotte", label: "Charlotte", emoji: "🌸" },
      { value: "miranda",   label: "Miranda",   emoji: "⚖️" },
      { value: "samantha",  label: "Samantha",  emoji: "💋" },
      { value: "ensemble",  label: "All of them", emoji: "✨" },
    ],
  },
  {
    key: "vibe",
    text: "Pick a vibe.",
    options: [
      { value: "glamorous", label: "Glamorous NYC night out", emoji: "🌃" },
      { value: "real_talk", label: "Real talk over cosmos",   emoji: "🍸" },
      { value: "fashion",   label: "Iconic fashion moment",  emoji: "👒" },
      { value: "messy",     label: "Messy feelings",         emoji: "💔" },
      { value: "comedy",    label: "Comedy chaos",           emoji: "🎭" },
    ],
  },
];

const CHAR_LABELS = {
  carrie: "Carrie", charlotte: "Charlotte", miranda: "Miranda",
  samantha: "Samantha", ensemble: "the whole group",
};

const VIBE_LABELS = {
  glamorous: "Glamorous NYC", real_talk: "Real Talk", fashion: "Fashion Moment",
  messy: "Messy Feelings", comedy: "Comedy Chaos",
};

const MOOD_LABELS = {
  cozy: "Cozy & nostalgic", sad: "Sad or processing", laugh: "Need a laugh",
  celebratory: "Celebratory", restless: "Restless & dramatic",
};

let answers = {};
let currentQ = 0;
let excludedIds = new Set();

// ── History (localStorage) ────────────────────────────────────────────────────
const HISTORY_KEY = "satc_history";
const HISTORY_LIMIT = 10;

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function addToHistory(ids) {
  const h = getHistory();
  ids.forEach(id => h.push({ id, ts: Date.now() }));
  const trimmed = h.slice(-HISTORY_LIMIT * 2);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  clearWatched();
  showToast("History & watched list cleared — fresh start!");
}

function recentlyRecommended() {
  const h = getHistory();
  return new Set(h.slice(-HISTORY_LIMIT).map(x => x.id));
}

// ── Watched (localStorage, expires after 30 days) ───────────────────────────
const WATCHED_KEY = "satc_watched";
const WATCHED_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

function getRawWatched() {
  try { return JSON.parse(localStorage.getItem(WATCHED_KEY) || "{}"); }
  catch { return {}; }
}

function getWatched() {
  const raw = getRawWatched();
  const now = Date.now();
  const active = new Set();
  let changed = false;
  for (const [id, ts] of Object.entries(raw)) {
    if (now - ts < WATCHED_TTL) {
      active.add(id);
    } else {
      delete raw[id];
      changed = true;
    }
  }
  if (changed) localStorage.setItem(WATCHED_KEY, JSON.stringify(raw));
  return active;
}

function toggleWatched(id) {
  const raw = getRawWatched();
  if (raw[id]) {
    delete raw[id];
  } else {
    raw[id] = Date.now();
  }
  localStorage.setItem(WATCHED_KEY, JSON.stringify(raw));
  return !!raw[id];
}

function clearWatched() {
  localStorage.removeItem(WATCHED_KEY);
}

// ── Scoring ───────────────────────────────────────────────────────────────────
function scoreEpisode(ep, mood, character, vibe) {
  const recent = recentlyRecommended();
  const watched = getWatched();

  // watched episodes are fully excluded
  if (watched.has(ep.id)) return -2;

  // vibe 40%, character 35%, mood 25%
  const vibeMatch  = ep.vibes.includes(vibe)  ? 1.0 : 0.0;
  const moodMatch  = ep.moods.includes(mood)  ? 1.0 : 0.0;

  let charMatch;
  if (character === "ensemble") {
    charMatch = 0.5; // neutral — don't penalise, don't boost
  } else {
    charMatch = ep.chars.includes(character) ? 1.0 : 0.0;
  }

  let score = (vibeMatch * 0.40) + (charMatch * 0.35) + (moodMatch * 0.25);

  // small IMDb bonus (max ~0.08) so higher-rated eps win ties
  score += (ep.rating - 7.0) * 0.04;

  // history penalty
  if (recent.has(ep.id)) score *= 0.3;

  // manual exclusion (Pick Different)
  if (excludedIds.has(ep.id)) score = -1;

  return score;
}

function getTopEpisodes(mood, character, vibe, n = 2) {
  const scored = EPISODES.map(ep => ({
    ep,
    score: scoreEpisode(ep, mood, character, vibe),
  }));
  scored.sort((a, b) => b.score - a.score || b.ep.rating - a.ep.rating);
  return scored.slice(0, n).map(x => x.ep);
}

// ── Outfit ────────────────────────────────────────────────────────────────────
function getOutfit(ep, character) {
  if (!ep.outfit) return "";
  const char = ep.outfit[character] ? character : (ep.outfit.carrie ? "carrie" : Object.keys(ep.outfit)[0]);
  const desc = ep.outfit[char] || "";
  if (!desc) return "";
  return `<em>${CHAR_LABELS[char]}</em>: ${desc}`;
}

// ── Explanation ───────────────────────────────────────────────────────────────
function buildExplanation(ep, mood, character, vibe) {
  const parts = [];
  if (ep.vibes.includes(vibe))
    parts.push(`matches your <em>${VIBE_LABELS[vibe]}</em> vibe`);
  if (character !== "ensemble" && ep.chars.includes(character))
    parts.push(`big <em>${CHAR_LABELS[character]}</em> episode`);
  if (ep.moods.includes(mood))
    parts.push(`fits "<em>${MOOD_LABELS[mood]}</em>"`);
  if (parts.length === 0)
    parts.push(`top-rated episode (${ep.rating} on IMDb)`);
  return parts.join(" &middot; ");
}

// ── Screens ───────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ── Landing ───────────────────────────────────────────────────────────────────
function startQuiz() {
  answers = {};
  currentQ = 0;
  excludedIds = new Set();
  renderQuestion();
  showScreen("screen-quiz");
}

// ── Question rendering ────────────────────────────────────────────────────────
const Q_NUM = ["01", "02", "03"];

function renderQuestion() {
  const q = QUESTIONS[currentQ];
  const num = Q_NUM[currentQ] || String(currentQ + 1).padStart(2, "0");

  document.getElementById("q-text").textContent = q.text;
  document.getElementById("q-progress").textContent = `${num} / 03`;
  document.getElementById("q-numeral").textContent = num;
  const labelNum = document.getElementById("q-label-num");
  if (labelNum) labelNum.textContent = num;

  // progress bar
  const pct = ((currentQ) / QUESTIONS.length) * 100;
  document.getElementById("progress-bar-fill").style.width = pct + "%";

  const container = document.getElementById("q-options");
  container.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    const optNum = String(i + 1).padStart(2, "0");
    btn.innerHTML = `<span class="opt-num">${optNum}</span><span class="opt-label">${opt.label}</span><span class="opt-arrow" aria-hidden="true">&rarr;</span>`;
    btn.addEventListener("click", (e) => selectAnswer(opt.value, e.currentTarget));
    container.appendChild(btn);
  });
}

function selectAnswer(value, btnEl) {
  const q = QUESTIONS[currentQ];
  answers[q.key] = value;

  // highlight selected
  document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
  btnEl.classList.add("selected");

  // short pause then advance
  setTimeout(() => {
    currentQ++;
    if (currentQ < QUESTIONS.length) {
      renderQuestion();
    } else {
      showResults();
    }
  }, 280);
}

// ── Results ───────────────────────────────────────────────────────────────────
function showResults() {
  const { mood, character, vibe } = answers;
  const picks = getTopEpisodes(mood, character, vibe, 2);

  addToHistory(picks.map(p => p.id));

  const container = document.getElementById("results-cards");
  container.innerHTML = "";

  const watched = getWatched();

  picks.forEach((ep, i) => {
    const card = document.createElement("div");
    card.className = "episode-card";
    card.dataset.epId = ep.id;
    const pickNum = String(i + 1).padStart(2, "0");
    const epNum = String(ep.e).padStart(2, "0");
    const isWatched = watched.has(ep.id);
    card.innerHTML = `
      <div class="card-num">${pickNum}</div>
      <div class="card-header">
        <span class="season-badge">Season ${ep.s} &middot; Episode ${epNum}</span>
        <span class="rating">IMDB ${ep.rating} / 10</span>
      </div>
      <h3 class="ep-title">${ep.title}</h3>
      <p class="ep-desc">${ep.desc}</p>
      <p class="ep-why">${buildExplanation(ep, mood, character, vibe)}</p>
      ${vibe === "fashion" && ep.outfit ? `<p class="ep-outfit">${getOutfit(ep, character)}</p>` : ""}
      <button class="btn-seen ${isWatched ? "is-watched" : ""}" data-ep-id="${ep.id}">
        <span class="seen-check">&#10003;</span>
        <span class="seen-label">${isWatched ? "Watched" : "Seen It"}</span>
      </button>
    `;
    container.appendChild(card);
  });

  // wire up seen-it buttons
  container.querySelectorAll(".btn-seen").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.epId;
      const nowWatched = toggleWatched(id);
      btn.classList.toggle("is-watched", nowWatched);
      btn.querySelector(".seen-label").textContent = nowWatched ? "Watched" : "Seen It";
      showToast(nowWatched ? "Marked as watched — won't recommend again" : "Removed from watched list");
    });
  });

  document.getElementById("progress-bar-fill").style.width = "100%";
  showScreen("screen-results");
}

function pickDifferent() {
  // exclude current picks and re-score
  document.querySelectorAll(".episode-card").forEach(card => {
    if (card.dataset.epId) excludedIds.add(card.dataset.epId);
  });
  showResults();
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-start").addEventListener("click", startQuiz);
  document.getElementById("btn-again").addEventListener("click", startQuiz);
  document.getElementById("btn-different").addEventListener("click", pickDifferent);
  document.getElementById("btn-clear-history").addEventListener("click", clearHistory);
});
