interface ControlsProps {
  isRunning: boolean;
  onTogglePause: () => void;
  onNextSection: () => void;
  onReset: () => void;
  isLastSection: boolean;
}

export function Controls({
  isRunning,
  onTogglePause,
  onNextSection,
  onReset,
  isLastSection,
}: ControlsProps) {
  return (
    <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
      <div className="flex gap-2">
        <button
          onClick={onTogglePause}
          className="px-4 py-1.5 rounded text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>
      {!isLastSection && (
        <button
          onClick={onNextSection}
          className="px-4 py-1.5 rounded text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          Next ▶
        </button>
      )}
    </div>
  );
}
