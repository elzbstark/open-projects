import { useState, useRef, useCallback, useEffect } from 'react';
import type { TimerState, PaceStatus, SessionSection } from '../types';

function getPaceStatus(elapsed: number, budget: number): PaceStatus {
  const ratio = elapsed / budget;
  if (ratio > 1.1) return 'move-on';
  if (ratio > 1.0) return 'over-time';
  if (ratio > 0.75) return 'warning';
  return 'on-pace';
}

const initialTimerState: TimerState = {
  isRunning: false,
  activeSectionIndex: 0,
  sectionElapsed: [],
  totalElapsed: 0,
  startedAt: null,
  sectionStartedAt: null,
};

export function useTimer(sections: SessionSection[]) {
  const [timer, setTimer] = useState<TimerState>({
    ...initialTimerState,
    sectionElapsed: sections.map(() => 0),
  });
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Reset when sections change
  useEffect(() => {
    setTimer({
      ...initialTimerState,
      sectionElapsed: sections.map(() => 0),
    });
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [sections.length]);

  const tick = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    setTimer((prev) => {
      if (!prev.isRunning) return prev;
      const newElapsed = [...prev.sectionElapsed];
      newElapsed[prev.activeSectionIndex] =
        (newElapsed[prev.activeSectionIndex] || 0) + delta;
      return {
        ...prev,
        sectionElapsed: newElapsed,
        totalElapsed: prev.totalElapsed + delta,
      };
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    lastTickRef.current = performance.now();
    setTimer((prev) => ({
      ...prev,
      isRunning: true,
      startedAt: prev.startedAt ?? Date.now(),
      sectionStartedAt: prev.sectionStartedAt ?? Date.now(),
    }));
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    setTimer((prev) => ({ ...prev, isRunning: false }));
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const togglePause = useCallback(() => {
    setTimer((prev) => {
      if (prev.isRunning) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        return { ...prev, isRunning: false };
      } else {
        lastTickRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
        return {
          ...prev,
          isRunning: true,
          startedAt: prev.startedAt ?? Date.now(),
          sectionStartedAt: prev.sectionStartedAt ?? Date.now(),
        };
      }
    });
  }, [tick]);

  const nextSection = useCallback(() => {
    setTimer((prev) => {
      const next = Math.min(prev.activeSectionIndex + 1, sections.length - 1);
      if (next === prev.activeSectionIndex) return prev;
      return {
        ...prev,
        activeSectionIndex: next,
        sectionStartedAt: Date.now(),
      };
    });
  }, [sections.length]);

  const prevSection = useCallback(() => {
    setTimer((prev) => {
      const next = Math.max(prev.activeSectionIndex - 1, 0);
      if (next === prev.activeSectionIndex) return prev;
      return {
        ...prev,
        activeSectionIndex: next,
        sectionStartedAt: Date.now(),
      };
    });
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setTimer({
      ...initialTimerState,
      sectionElapsed: sections.map(() => 0),
    });
  }, [sections.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Derived state
  const activePaceStatus = sections.length > 0
    ? getPaceStatus(
        timer.sectionElapsed[timer.activeSectionIndex] || 0,
        sections[timer.activeSectionIndex]?.durationSeconds || 1
      )
    : 'on-pace' as PaceStatus;

  const totalBudget = sections.reduce((s, sec) => s + sec.durationSeconds, 0);
  const totalRemaining = Math.max(0, totalBudget - timer.totalElapsed);

  return {
    timer,
    activePaceStatus,
    totalBudget,
    totalRemaining,
    getPaceStatus: (index: number) =>
      getPaceStatus(
        timer.sectionElapsed[index] || 0,
        sections[index]?.durationSeconds || 1
      ),
    start,
    pause,
    togglePause,
    nextSection,
    prevSection,
    reset,
  };
}
