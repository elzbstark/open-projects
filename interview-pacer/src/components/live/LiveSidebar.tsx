import { useState, useEffect, useRef, useCallback } from 'react';
import type { Session } from '../../types';
import { useTimer } from '../../hooks/useTimer';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { TotalProgressBar } from './TotalProgressBar';
import { SectionCard } from './SectionCard';
import { Controls } from './Controls';

interface LiveSidebarProps {
  session: Session;
  onExit: () => void;
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

  const [collapsedActive, setCollapsedActive] = useState(false);
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
    setCollapsedActive((c) => !c);
  }, []);

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
      <div className="flex items-center px-4 py-2 border-b border-gray-700">
        <button
          onClick={onExit}
          className="text-gray-400 hover:text-white text-sm mr-3 transition-colors"
        >
          ← Back
        </button>
        <span className="text-xs text-gray-500">
          Space: pause | →: next | ←: prev | Esc: collapse
        </span>
      </div>

      {/* Total progress */}
      <TotalProgressBar
        companyName={session.companyName}
        templateName={session.templateName}
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
              collapsed={i === timer.activeSectionIndex ? collapsedActive : true}
              onToggleCollapse={() => {
                if (i === timer.activeSectionIndex) {
                  setCollapsedActive((c) => !c);
                }
              }}
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
