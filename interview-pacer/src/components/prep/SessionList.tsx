import type { Session } from '../../types';

interface SessionListProps {
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLaunch: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SessionList({ sessions, selectedId, onSelect, onLaunch, onDelete }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No sessions yet. Select a template and create one.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sessions.map((s) => (
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
            <span className="text-sm text-white truncate block">{s.companyName} — {s.name}</span>
            <span className="text-xs text-gray-500">{s.templateName}</span>
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLaunch(s.id);
              }}
              className="px-2 py-1 text-xs bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
            >
              ▶ Live
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
              className="text-gray-500 hover:text-red-400 text-xs px-1 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
