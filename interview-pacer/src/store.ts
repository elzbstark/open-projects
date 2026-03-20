import { DEFAULT_TEMPLATES } from './constants';
import type { Template, Session } from './types';

const TEMPLATES_KEY = 'interview-pacer-templates';
const SESSIONS_KEY = 'interview-pacer-sessions';

export function loadTemplates(): Template[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (stored) {
      const custom = JSON.parse(stored) as Template[];
      const ids = new Set(custom.map((t) => t.id));
      return [...DEFAULT_TEMPLATES.filter((t) => !ids.has(t.id)), ...custom];
    }
  } catch {}
  return [...DEFAULT_TEMPLATES];
}

export function saveTemplates(templates: Template[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function loadSessions(): Session[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {}
  return [];
}

export function saveSessions(sessions: Session[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}
