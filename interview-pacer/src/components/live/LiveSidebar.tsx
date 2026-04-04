import { useState, useEffect, useRef, useCallback } from 'react';
import type { Session } from '../../types';
import { useTimer } from '../../hooks/useTimer';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { TotalProgressBar } from './TotalProgressBar';
import { SectionCard } from './SectionCard';
import { Controls } from './Controls';

interface LiveSidebarProps {
  session: Session;
  onExit: (completedAt?: string) => void;
}

export function LiveSidebar({ session, onExit }: LiveSidebarProps) {
  const {
    timer,
    totalBudget,
    getPaceStatus,
    togglePause,
    nextSection,
    prevSection,
    reset,
  } = useTimer(session.sections);

  // Track which sections are manually collapsed; active section starts expanded
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    () => new Set(Array.from({ length: session.sections.length }, (_, i) => i).filter(i => i !== 0))
  );

  // Auto-expand the newly active section when advancing
  useEffect(() => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.delete(timer.activeSectionIndex);
      return next;
    });
  }, [timer.activeSectionIndex]);

  const toggleCollapse = (i: number) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Write live state to localStorage for Chrome extension to read
  useEffect(() => {
    const payload = {
      sessionId: session.id,
      companyName: session.companyName,
      templateName: session.templateName,
      activeSectionIndex: timer.activeSectionIndex,
      isRunning: timer.isRunning,
      sectionElapsed: timer.sectionElapsed,
      sections: session.sections.map((s) => ({
        name: s.name,
        durationSeconds: s.durationSeconds,
      })),
      totalBudget,
      updatedAt: Date.now(),
    };
    localStorage.setItem('interview-pacer-live-state', JSON.stringify(payload));
  }, [timer, session, totalBudget]);

  // Poll for commands from Chrome extension
  useEffect(() => {
    const interval = setInterval(() => {
      const raw = localStorage.getItem('interview-pacer-command');
      if (!raw) return;
      localStorage.removeItem('interview-pacer-command');
      try {
        const { command } = JSON.parse(raw) as { command: string; issuedAt: number };
        if (command === 'pause' || command === 'resume') togglePause();
        else if (command === 'next') nextSection();
        else if (command === 'prev') prevSection();
      } catch {
        // ignore malformed commands
      }
    }, 500);
    return () => clearInterval(interval);
  }, [togglePause, nextSection, prevSection]);

  // Clear localStorage on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('interview-pacer-live-state');
      localStorage.removeItem('interview-pacer-command');
    };
  }, []);

  // Auto-scroll to active section
  useEffect(() => {
    const el = sectionRefs.current[timer.activeSectionIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [timer.activeSectionIndex]);

  const handleEscape = useCallback(() => {
    toggleCollapse(timer.activeSectionIndex);
  }, [timer.activeSectionIndex]);

  useKeyboardShortcuts({
    onTogglePause: togglePause,
    onNextSection: nextSection,
    onPrevSection: prevSection,
    onEscape: handleEscape,
    enabled: true,
  });

  return (
    <div className="w-[400px] h-screen flex flex-col bg-gray-900 text-gray-200 font-sans">
      {/* Header bar with back button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onExit()}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Back
          </button>
          <span className="text-xs text-gray-500">
            Space: pause | →: next | ←: prev | Esc: collapse
          </span>
        </div>
        <button
          onClick={() => onExit(new Date().toISOString())}
          className="px-3 py-1 text-xs border border-green-700 text-green-400 hover:bg-green-900/30 rounded transition-colors shrink-0"
        >
          ✓ Done
        </button>
      </div>

      {/* Total progress */}
      <TotalProgressBar
        companyName={session.companyName}
        sessionName={session.name}
        totalElapsed={timer.totalElapsed}
        totalBudget={totalBudget}
      />

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {session.sections.map((section, i) => (
          <div key={section.id} ref={(el) => { sectionRefs.current[i] = el; }}>
            <SectionCard
              section={section}
              index={i}
              activeIndex={timer.activeSectionIndex}
              elapsed={timer.sectionElapsed[i] || 0}
              paceStatus={getPaceStatus(i)}
              nextSectionName={session.sections[i + 1]?.name}
              collapsed={collapsedSections.has(i)}
              onToggleCollapse={() => toggleCollapse(i)}
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      <Controls
        isRunning={timer.isRunning}
        onTogglePause={togglePause}
        onNextSection={nextSection}
        onReset={reset}
        isLastSection={timer.activeSectionIndex === session.sections.length - 1}
      />
    </div>
  );
}
