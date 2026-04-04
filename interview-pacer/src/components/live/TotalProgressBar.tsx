import { formatTime } from '../shared/TimeDisplay';

interface TotalProgressBarProps {
  companyName: string;
  sessionName: string;
  totalElapsed: number;
  totalBudget: number;
}

export function TotalProgressBar({
  companyName,
  sessionName,
  totalElapsed,
  totalBudget,
}: TotalProgressBarProps) {
  const remaining = Math.max(0, totalBudget - totalElapsed);
  const progress = Math.min(1, totalElapsed / totalBudget);

  return (
    <div className="px-4 py-3 border-b border-gray-700">
      <div className="flex justify-between items-baseline mb-2">
        <span className="font-semibold text-white text-sm">
          {companyName}: {sessionName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progress * 100}%`,
              backgroundColor:
                progress > 1 ? '#ef4444' : progress > 0.75 ? '#eab308' : '#22c55e',
            }}
          />
        </div>
        <span className="text-sm font-mono text-gray-300 w-14 text-right">
          {formatTime(remaining)}
        </span>
      </div>
    </div>
  );
}
