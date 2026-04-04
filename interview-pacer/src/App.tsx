import { useState, useEffect } from 'react';
import type { Session, SessionSection, AppMode } from './types';
import { AppContext } from './context';
import { loadTemplates, loadSessions, saveTemplates, saveSessions } from './store';
import { PrepLayout } from './components/prep/PrepLayout';
import { LiveSidebar } from './components/live/LiveSidebar';
import { ImprovLive } from './components/live/ImprovLive';

export default function App() {
  const [mode, setMode] = useState<AppMode>('prep');
  const [templates, setTemplatesState] = useState(() => loadTemplates());
  const [sessions, setSessionsState] = useState(() => loadSessions());
  const [liveSession, setLiveSession] = useState<Session | null>(null);

  function setTemplates(t: typeof templates) { setTemplatesState(t); saveTemplates(t); }
  function setSessions(s: typeof sessions) { setSessionsState(s); saveSessions(s); }
  function handleLaunchSession(session: Session) {
    // Set startedAt on first launch — this is what transitions Ready → Active
    if (!session.startedAt) {
      const updated = { ...session, startedAt: new Date().toISOString() };
      const newSessions = sessions.map((s) => (s.id === updated.id ? updated : s));
      setSessionsState(newSessions);
      saveSessions(newSessions);
      setLiveSession(updated);
    } else {
      setLiveSession(session);
    }
    setMode('live');
  }

  function handleExitLive(updatedSections?: SessionSection[], completedAt?: string) {
    if (updatedSections && liveSession) {
      const updatedSession = {
        ...liveSession,
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
        ...(completedAt ? { completedAt } : {}),
      };
      const newSessions = sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
      setSessionsState(newSessions);
      saveSessions(newSessions);
    }
    setLiveSession(null);
    setMode('prep');
  }

  useEffect(() => {
    function onFocus() {
      setTemplatesState(loadTemplates());
      setSessionsState(loadSessions());
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <AppContext.Provider value={{ templates, setTemplates, sessions, setSessions }}>
      {mode === 'live' && liveSession ? (
        (liveSession.sessionType ?? 'delivery') === 'improv' ? (
          <ImprovLive session={liveSession} onExit={handleExitLive} />
        ) : (
          <LiveSidebar session={liveSession} onExit={(completedAt) => handleExitLive(undefined, completedAt)} />
        )
      ) : (
        <PrepLayout onLaunchSession={handleLaunchSession} />
      )}
    </AppContext.Provider>
  );
}
