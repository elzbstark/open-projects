import { useState, useEffect, useRef, useCallback } from 'react';
import type { Session, SessionSection, PaceStatus } from '../../types';
import { useTimer } from '../../hooks/useTimer';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { TotalProgressBar } from './TotalProgressBar';
import { SectionTimerBar } from './SectionTimerBar';
import { Controls } from './Controls';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { formatTime } from '../shared/TimeDisplay';

interface ImprovLiveProps {
  session: Session;
  onExit: (updatedSections?: SessionSection[]) => void;
}

export function ImprovLive({ session, onExit }: ImprovLiveProps) {
  const {
    timer,
    totalBudget,
    getPaceStatus,
    togglePause,
    nextSection,
    prevSection,
    reset,
  } = useTimer(session.sections);

  const [sectionNotes, setSectionNotes] = useState<string[]>(
    session.sections.map((s) => s.notes || '')
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-focus notes textarea when active section changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [timer.activeSectionIndex]);

  const handleExit = useCallback(() => {
    const updatedSections = session.sections.map((s, i) => ({
      ...s,
      notes: sectionNotes[i] || '',
    }));
    onExit(updatedSections);
  }, [session.sections, sectionNotes, onExit]);

  useKeyboardShortcuts({
    onTogglePause: togglePause,
    onNextSection: nextSection,
    onPrevSection: prevSection,
    onEscape: handleExit,
    enabled: true,
  });

  const activeSection = session.sections[timer.activeSectionIndex];
  const paceStatus = getPaceStatus(timer.activeSectionIndex);
  const elapsed = timer.sectionElapsed[timer.activeSectionIndex] || 0;

  function navigateTo(targetIndex: number) {
    const diff = targetIndex - timer.activeSectionIndex;
    if (diff > 0) {
      for (let j = 0; j < diff; j++) nextSection();
    } else if (diff < 0) {
      for (let j = 0; j < -diff; j++) prevSection();
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 text-gray-200 font-sans">
      {/* Header: back button + keyboard hint */}
      <div className="flex items-center px-4 py-2 border-b border-gray-700">
        <button
          onClick={handleExit}
          className="text-gray-400 hover:text-white text-sm mr-4 transition-colors"
        >
          ← Back
        </button>
        <span className="text-xs text-gray-600">
          Space: pause | →: next | ←: prev | Esc: exit
        </span>
      </div>

      {/* Total progress */}
      <TotalProgressBar
        companyName={session.companyName}
        templateName={session.templateName}
        totalElapsed={timer.totalElapsed}
        totalBudget={totalBudget}
      />

      {/* Main content — centered, max readable width */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          {/* Active section header + timer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                {activeSection.name}
              </h2>
              <span className={`text-sm font-mono ${paceStatusColor(paceStatus)}`}>
                {formatTime(elapsed)} / {formatTime(activeSection.durationSeconds)}
                {paceStatus !== 'on-pace' && (
                  <span className="ml-2 text-xs opacity-75">
                    {paceStatus === 'warning' ? 'wrapping up' : paceStatus === 'over-time' ? 'over time' : 'move on'}
                  </span>
                )}
              </span>
            </div>
            <SectionTimerBar
              elapsed={elapsed}
              budget={activeSection.durationSeconds}
              paceStatus={paceStatus}
            />
          </div>

          {/* Outline (dimmed) */}
          {activeSection.content && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Outline</p>
              <div className="opacity-60">
                <MarkdownRenderer content={activeSection.content} />
              </div>
            </div>
          )}

          {/* Notes textarea */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Notes</p>
            <textarea
              ref={textareaRef}
              value={sectionNotes[timer.activeSectionIndex] || ''}
              onChange={(e) => {
                const newNotes = [...sectionNotes];
                newNotes[timer.activeSectionIndex] = e.target.value;
                setSectionNotes(newNotes);
              }}
              placeholder="Type your answer here..."
              className="w-full min-h-[160px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-base leading-7 focus:outline-none focus:border-blue-500 resize-y"
            />
          </div>
        </div>
      </div>

      {/* Footer: section chips + controls */}
      <div className="border-t border-gray-700">
        {/* Section navigation chips */}
        <div className="flex items-center gap-2 px-6 py-2 overflow-x-auto">
          {session.sections.map((sec, i) => (
            <button
              key={sec.id}
              onClick={() => navigateTo(i)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                i === timer.activeSectionIndex
                  ? 'bg-blue-600 text-white'
                  : i < timer.activeSectionIndex
                  ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
              }`}
            >
              {i < timer.activeSectionIndex ? '✓ ' : ''}{sec.name}
            </button>
          ))}
        </div>

        <Controls
          isRunning={timer.isRunning}
          onTogglePause={togglePause}
          onNextSection={nextSection}
          onReset={reset}
          isLastSection={timer.activeSectionIndex === session.sections.length - 1}
        />
      </div>
    </div>
  );
}

function paceStatusColor(status: PaceStatus): string {
  switch (status) {
    case 'on-pace': return 'text-green-400';
    case 'warning': return 'text-yellow-400';
    case 'over-time': return 'text-red-400';
    case 'move-on': return 'text-red-300';
  }
}
