interface MoveOnNudgeProps {
  nextSectionName: string;
  visible: boolean;
}

export function MoveOnNudge({ nextSectionName, visible }: MoveOnNudgeProps) {
  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs animate-pulse">
      <span className="text-red-400 font-mono font-bold">&gt;&gt;&gt;</span>
      <span className="text-red-300">
        Move on to <strong>{nextSectionName}</strong>
      </span>
    </div>
  );
}
