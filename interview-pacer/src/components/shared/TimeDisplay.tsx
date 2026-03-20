interface TimeDisplayProps {
  seconds: number;
  className?: string;
}

export function TimeDisplay({ seconds, className = '' }: TimeDisplayProps) {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.floor(Math.abs(seconds) % 60);
  const sign = seconds < 0 ? '-' : '';
  return (
    <span className={className}>
      {sign}{mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.floor(Math.abs(seconds) % 60);
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
}
