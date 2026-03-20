import type { PaceStatus } from '../../types';

interface SectionTimerBarProps {
  elapsed: number;
  budget: number;
  paceStatus: PaceStatus;
}

const barColors: Record<PaceStatus, string> = {
  'on-pace': '#22c55e',
  'warning': '#eab308',
  'over-time': '#ef4444',
  'move-on': '#ef4444',
};

export function SectionTimerBar({ elapsed, budget, paceStatus }: SectionTimerBarProps) {
  const progress = Math.min(1, elapsed / budget);

  return (
    <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-linear"
        style={{
          width: `${progress * 100}%`,
          backgroundColor: barColors[paceStatus],
        }}
      />
    </div>
  );
}
