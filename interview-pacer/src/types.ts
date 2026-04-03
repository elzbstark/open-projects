export interface TemplateSection {
  id: string;
  name: string;
  durationSeconds: number;
}

export interface Template {
  id: string;
  name: string;
  totalMinutes: number;
  sections: TemplateSection[];
  isDefault?: boolean;
}

export interface SessionSection {
  id: string;
  templateSectionId: string;
  name: string;
  durationSeconds: number;
  content: string; // markdown content
  notes?: string;  // improv live notes; empty string for delivery
}

export interface Session {
  id: string;
  templateId: string;
  templateName: string;
  companyName: string;
  name: string;
  sections: SessionSection[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  sessionType?: 'delivery' | 'improv';
}

export type PaceStatus = 'on-pace' | 'warning' | 'over-time' | 'move-on';

export interface SectionTimerState {
  sectionIndex: number;
  elapsedSeconds: number;
  paceStatus: PaceStatus;
}

export interface TimerState {
  isRunning: boolean;
  activeSectionIndex: number;
  sectionElapsed: number[]; // elapsed seconds per section
  totalElapsed: number;
  startedAt: number | null; // timestamp
  sectionStartedAt: number | null;
}

export type AppMode = 'prep' | 'live';
