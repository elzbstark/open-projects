import { createContext, useContext } from 'react';
import type { Template, Session } from './types';

export interface AppState {
  templates: Template[];
  setTemplates: (t: Template[]) => void;
  sessions: Session[];
  setSessions: (s: Session[]) => void;
}

export const AppContext = createContext<AppState>({
  templates: [],
  setTemplates: () => {},
  sessions: [],
  setSessions: () => {},
});

export function useAppState() {
  return useContext(AppContext);
}
