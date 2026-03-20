import type { SessionSection, PaceStatus } from '../../types';
import { SectionTimerBar } from './SectionTimerBar';
import { MoveOnNudge } from './MoveOnNudge';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { formatTime } from '../shared/TimeDisplay';

interface SectionCardProps {
  section: SessionSection;
  index: number;
  activeIndex: number;
  elapsed: number;
  paceStatus: PaceStatus;
  nextSectionName?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const bgTints: Record<PaceStatus, string> = {
  'on-pace': 'border-green-800/30 bg-green-950/20',
  'warning': 'border-yellow-800/30 bg-yellow-950/20',
  'over-time': 'border-red-800/30 bg-red-950/20',
  'move-on': 'border-red-700/40 bg-red-950/30',
};

const completedStyle = 'border-gray-700/50 bg-gray-800/30 opacity-60';
const upcomingStyle = 'border-gray-700/30 bg-gray-800/20 opacity-50';

export function SectionCard({
  section,
  index,
  activeIndex,
  elapsed,
  paceStatus,
  nextSectionName,
  collapsed,
  onToggleCollapse,
}: SectionCardProps) {
  const isActive = index === activeIndex;
  const isCompleted = index < activeIndex;

  let cardClass = '';
  if (isActive) {
    cardClass = bgTints[paceStatus];
  } else if (isCompleted) {
    cardClass = completedStyle;
  } else {
    cardClass = upcomingStyle;
  }

  const showMoveOn = isActive && paceStatus === 'move-on' && nextSectionName;

  return (
    <div
      className={`border rounded-lg transition-all duration-1000 ease-in-out ${cardClass} ${
        isActive && paceStatus === 'move-on' ? 'animate-subtle-pulse' : ''
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggleCollapse}
        className="w-full px-3 py-2 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {isCompleted && <span className="text-green-400 text-xs">✓</span>}
          <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
            {section.name}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            ({formatTime(section.durationSeconds)})
          </span>
        </div>
        {isActive && (
          <span className="text-sm font-mono text-gray-300">
            {formatTime(elapsed)} / {formatTime(section.durationSeconds)}
          </span>
        )}
      </button>

      {/* Timer bar for active section */}
      {isActive && (
        <div className="px-3 pb-1">
          <SectionTimerBar
            elapsed={elapsed}
            budget={section.durationSeconds}
            paceStatus={paceStatus}
          />
        </div>
      )}

      {/* Content - expanded when active and not manually collapsed */}
      {isActive && !collapsed && section.content && (
        <div className="px-3 pb-3 pt-1">
          <MarkdownRenderer content={section.content} large />
        </div>
      )}

      {/* Move on nudge */}
      {showMoveOn && <MoveOnNudge nextSectionName={nextSectionName} visible />}
    </div>
  );
}
