import type { Session } from '../../types';

interface SessionListProps {
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLaunch: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkDone: (id: string) => void;
}

export function SessionList({ sessions, selectedId, onSelect, onLaunch, onDelete, onMarkDone }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No sessions yet. Select a template and create one.
      </div>
    );
  }

  // Active (has startedAt) sorted by startedAt desc, then Ready (no startedAt) by createdAt desc
  const active = [...sessions.filter((s) => s.startedAt)].sort(
    (a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime()
  );
  const ready = [...sessions.filter((s) => !s.startedAt)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const sorted = [...active, ...ready];

  return (
    <div className="space-y-1">
      {sorted.map((s) => {
        const isActive = !!s.startedAt;
        const subtitle = [s.templateName, s.sessionType === 'improv' ? 'Improv' : null]
          .filter(Boolean)
          .join(' · ');

        return (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
              selectedId === s.id
                ? 'bg-blue-900/40 border border-blue-700/50'
                : 'hover:bg-gray-800 border border-transparent'
            }`}
          >
            <div className="min-w-0">
              <span className="text-sm text-white truncate block">{s.companyName}: {s.name}</span>
              <span className="text-xs text-gray-500">{subtitle}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {isActive ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkDone(s.id); }}
                  className="px-2 py-1 text-xs border border-green-800 text-green-500 hover:bg-green-900/30 rounded transition-colors"
                >
                  ✓ Done
                </button>
              ) : (
                <span className="text-xs px-1.5 py-0.5 text-gray-500 bg-gray-800 rounded">Ready</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onLaunch(s.id); }}
                className="px-2 py-1 text-xs bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
              >
                ▶ Start
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                className="text-gray-500 hover:text-red-400 text-xs px-1 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
