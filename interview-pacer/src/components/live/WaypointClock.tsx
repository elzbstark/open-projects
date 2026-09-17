import type { SessionSection, PaceStatus } from '../../types';
import { formatTime } from '../shared/TimeDisplay';

interface WaypointClockProps {
  sections: SessionSection[];
  activeIndex: number;
  elapsed: number;
  totalElapsed: number;
  totalBudget: number;
  paceStatus: PaceStatus;
  targetIndex: number;
  isSeverelyBehind: boolean;
}

const countdownColors: Record<PaceStatus, string> = {
  'on-pace': 'text-green-400',
  'warning': 'text-yellow-400',
  'over-time': 'text-red-400',
  'move-on': 'text-red-300',
};

export function WaypointClock({
  sections,
  activeIndex,
  elapsed,
  totalElapsed,
  totalBudget,
  paceStatus,
  targetIndex,
  isSeverelyBehind,
}: WaypointClockProps) {
  const activeSection = sections[activeIndex];
  const targetSection = sections[targetIndex];
  const totalRemaining = totalBudget - totalElapsed;
  // Cap the section countdown at whatever's actually left in the full interview budget,
  // so skipping to a section with a bigger allotment than remains can't show more time
  // than you actually have.
  const sectionRemaining = Math.min(activeSection.durationSeconds - elapsed, totalRemaining);
  const effectivePaceStatus: PaceStatus = totalRemaining <= 0 ? 'move-on' : paceStatus;
  const diff = activeIndex - targetIndex;

  const banner =
    diff < 0
      ? {
          className: 'bg-red-950/40 border-red-800 text-red-300 animate-subtle-pulse',
          text: `Behind — should be ${targetIndex - activeIndex} section${targetIndex - activeIndex > 1 ? 's' : ''} ahead`,
          checks: ['Take a pause', 'Ensure you have a structure'],
        }
      : diff > 0
      ? {
          className: 'bg-green-950/30 border-green-800 text-green-300',
          text: 'Ahead of pace',
          checks: null,
        }
      : {
          className: 'bg-gray-800/50 border-gray-700 text-gray-500',
          text: 'On pace',
          checks: null,
        };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div
        className={`mx-8 mt-6 px-4 py-2 text-center rounded-lg border transition-colors duration-1000 ${banner.className}`}
      >
        <p className="text-xs font-bold uppercase tracking-widest">{banner.text}</p>
        {banner.checks && (
          <p className="mt-1 text-[11px] font-semibold normal-case tracking-normal opacity-90">
            {banner.checks.join('   ·   ')}
          </p>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1 px-8">
        <p className="text-xs text-gray-500 uppercase tracking-widest">
          {isSeverelyBehind ? 'Time left in interview' : 'Time in section'}
        </p>

        <div
          className={`font-mono font-bold tabular-nums leading-none transition-colors duration-1000 ${countdownColors[effectivePaceStatus]}`}
          style={{ fontSize: 'clamp(64px, 9vw, 140px)' }}
        >
          {formatTime(isSeverelyBehind ? totalRemaining : sectionRemaining)}
        </div>

        <span className="text-xs text-gray-500 uppercase tracking-widest mt-4">You should be on</span>
        <p className="text-2xl md:text-3xl font-extrabold text-blue-300 text-center max-w-md">
          {targetSection.name}
        </p>

        {!isSeverelyBehind && (
          <p className="text-xs text-gray-600 mt-3">
            {totalRemaining <= 0 ? 'Past the full interview budget' : `${formatTime(totalRemaining)} left in the interview`}
          </p>
        )}
      </div>
    </div>
  );
}
