import { useState, useRef, useCallback, useEffect } from 'react';
import type { TimerState, PaceStatus, SessionSection } from '../types';

function getPaceStatus(elapsed: number, budget: number): PaceStatus {
  const ratio = elapsed / budget;
  if (ratio > 1.1) return 'move-on';
  if (ratio > 1.0) return 'over-time';
  if (ratio > 0.75) return 'warning';
  return 'on-pace';
}

const TICK_MS = 250;

export function useTimer(sections: SessionSection[]) {
  // Accumulated elapsed seconds per section, snapshotted at each pause/section-advance.
  // The active section's live elapsed = accumulated[i] + (Date.now() - runStartRef) / 1000.
  const accumulatedRef = useRef<number[]>(sections.map(() => 0));
  // Wall-clock ms when the current run started (null when paused).
  const runStartRef = useRef<number | null>(null);
  // Ref mirror of activeSectionIndex — avoids stale closures in tick.
  const activeIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    activeSectionIndex: 0,
    sectionElapsed: sections.map(() => 0),
    totalElapsed: 0,
    startedAt: null,
    sectionStartedAt: null,
  });

  // Compute current elapsed for every section based on wall-clock time.
  // Accurate even when the tab has been hidden and setInterval was throttled.
  function computeElapsed(): number[] {
    const elapsed = [...accumulatedRef.current];
    if (runStartRef.current !== null) {
      const idx = activeIndexRef.current;
      elapsed[idx] = (accumulatedRef.current[idx] || 0) + (Date.now() - runStartRef.current) / 1000;
    }
    return elapsed;
  }

  const tick = useCallback(() => {
    const sectionElapsed = computeElapsed();
    const totalElapsed = sectionElapsed.reduce((a, b) => a + b, 0);
    setTimer((prev) => ({ ...prev, sectionElapsed, totalElapsed }));
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [tick]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset when sections change
  useEffect(() => {
    stopInterval();
    accumulatedRef.current = sections.map(() => 0);
    runStartRef.current = null;
    activeIndexRef.current = 0;
    setTimer({
      isRunning: false,
      activeSectionIndex: 0,
      sectionElapsed: sections.map(() => 0),
      totalElapsed: 0,
      startedAt: null,
      sectionStartedAt: null,
    });
  }, [sections.length]);

  const start = useCallback(() => {
    const now = Date.now();
    runStartRef.current = now;
    startInterval();
    setTimer((prev) => ({
      ...prev,
      isRunning: true,
      startedAt: prev.startedAt ?? now,
      sectionStartedAt: prev.sectionStartedAt ?? now,
    }));
  }, [startInterval]);

  const pause = useCallback(() => {
    // Snapshot elapsed before stopping
    accumulatedRef.current = computeElapsed();
    runStartRef.current = null;
    stopInterval();
    const sectionElapsed = [...accumulatedRef.current];
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      sectionElapsed,
      totalElapsed: sectionElapsed.reduce((a, b) => a + b, 0),
    }));
  }, [stopInterval]);

  const togglePause = useCallback(() => {
    setTimer((prev) => {
      if (prev.isRunning) {
        accumulatedRef.current = computeElapsed();
        runStartRef.current = null;
        stopInterval();
        const sectionElapsed = [...accumulatedRef.current];
        return {
          ...prev,
          isRunning: false,
          sectionElapsed,
          totalElapsed: sectionElapsed.reduce((a, b) => a + b, 0),
        };
      } else {
        const now = Date.now();
        runStartRef.current = now;
        startInterval();
        return {
          ...prev,
          isRunning: true,
          startedAt: prev.startedAt ?? now,
          sectionStartedAt: now,
        };
      }
    });
  }, [startInterval, stopInterval]);

  const nextSection = useCallback(() => {
    setTimer((prev) => {
      const next = Math.min(prev.activeSectionIndex + 1, sections.length - 1);
      if (next === prev.activeSectionIndex) return prev;
      // Snapshot current section's elapsed before advancing
      accumulatedRef.current = computeElapsed();
      if (prev.isRunning) runStartRef.current = Date.now();
      activeIndexRef.current = next;
      return {
        ...prev,
        activeSectionIndex: next,
        sectionElapsed: [...accumulatedRef.current],
        sectionStartedAt: Date.now(),
      };
    });
  }, [sections.length]);

  const prevSection = useCallback(() => {
    setTimer((prev) => {
      const next = Math.max(prev.activeSectionIndex - 1, 0);
      if (next === prev.activeSectionIndex) return prev;
      accumulatedRef.current = computeElapsed();
      if (prev.isRunning) runStartRef.current = Date.now();
      activeIndexRef.current = next;
      return {
        ...prev,
        activeSectionIndex: next,
        sectionElapsed: [...accumulatedRef.current],
        sectionStartedAt: Date.now(),
      };
    });
  }, []);

  const reset = useCallback(() => {
    stopInterval();
    accumulatedRef.current = sections.map(() => 0);
    runStartRef.current = null;
    activeIndexRef.current = 0;
    setTimer({
      isRunning: false,
      activeSectionIndex: 0,
      sectionElapsed: sections.map(() => 0),
      totalElapsed: 0,
      startedAt: null,
      sectionStartedAt: null,
    });
  }, [sections.length, stopInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopInterval();
  }, [stopInterval]);

  const totalBudget = sections.reduce((s, sec) => s + sec.durationSeconds, 0);
  const totalRemaining = Math.max(0, totalBudget - timer.totalElapsed);

  return {
    timer,
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
