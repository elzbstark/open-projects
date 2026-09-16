import type { SessionSection, PaceStatus } from '../../types';
import { formatTime } from '../shared/TimeDisplay';

interface WaypointClockProps {
  sections: SessionSection[];
  activeIndex: number;
  elapsed: number;
  totalElapsed: number;
  totalBudget: number;
  paceStatus: PaceStatus;
}

const countdownColors: Record<PaceStatus, string> = {
  'on-pace': 'text-green-400',
  'warning': 'text-yellow-400',
  'over-time': 'text-red-400',
  'move-on': 'text-red-300',
};

// Where a perfectly-paced run would be right now, based on elapsed time alone —
// independent of which section she's actually navigated to.
function getTargetIndex(sections: SessionSection[], totalElapsed: number): number {
  let cumulative = 0;
  for (let i = 0; i < sections.length; i++) {
    cumulative += sections[i].durationSeconds;
    if (totalElapsed < cumulative) return i;
  }
  return sections.length - 1;
}

export function WaypointClock({
  sections,
  activeIndex,
  elapsed,
  totalElapsed,
  totalBudget,
  paceStatus,
}: WaypointClockProps) {
  const targetIndex = getTargetIndex(sections, totalElapsed);
  const activeSection = sections[activeIndex];
  const targetSection = sections[targetIndex];
  const sectionRemaining = activeSection.durationSeconds - elapsed;
  const totalRemaining = totalBudget - totalElapsed;
  const diff = activeIndex - targetIndex;

  const banner =
    diff < 0
      ? {
          className: 'bg-red-950/40 border-red-800 text-red-300 animate-subtle-pulse',
          text: `Behind — should be ${targetIndex - activeIndex} section${targetIndex - activeIndex > 1 ? 's' : ''} ahead`,
        }
      : diff > 0
      ? {
          className: 'bg-green-950/30 border-green-800 text-green-300',
          text: 'Ahead of pace',
        }
      : {
          className: 'bg-gray-800/50 border-gray-700 text-gray-500',
          text: 'On pace',
        };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div
        className={`mx-8 mt-6 px-4 py-2 text-center text-xs font-bold uppercase tracking-widest rounded-lg border transition-colors duration-1000 ${banner.className}`}
      >
        {banner.text}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1 px-8">
        <p className="text-xs text-gray-500 uppercase tracking-widest">Time in section</p>

        <div
          className={`font-mono font-bold tabular-nums leading-none transition-colors duration-1000 ${countdownColors[paceStatus]}`}
          style={{ fontSize: 'clamp(64px, 9vw, 140px)' }}
        >
          {formatTime(sectionRemaining)}
        </div>

        <span className="text-xs text-gray-500 uppercase tracking-widest mt-4">You should be on</span>
        <p className="text-2xl md:text-3xl font-extrabold text-blue-300 text-center max-w-md">
          {targetSection.name}
        </p>

        <p className="text-xs text-gray-600 mt-3">
          {totalRemaining <= 0 ? 'Past the full interview budget' : `${formatTime(totalRemaining)} left in the interview`}
        </p>
      </div>
    </div>
  );
}
