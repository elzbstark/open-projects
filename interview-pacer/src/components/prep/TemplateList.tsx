import type { Template } from '../../types';
import { formatTime } from '../shared/TimeDisplay';

interface TemplateListProps {
  templates: Template[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function TemplateList({ templates, selectedId, onSelect, onNew, onDelete }: TemplateListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">Templates</h2>
        <button
          onClick={onNew}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          + New
        </button>
      </div>
      <div className="space-y-1">
        {templates.map((t) => (
          <div
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
              selectedId === t.id
                ? 'bg-blue-900/40 border border-blue-700/50'
                : 'hover:bg-gray-800 border border-transparent'
            }`}
          >
            <div>
              <span className="text-sm text-white">{t.name}</span>
              <span className="text-xs text-gray-500 ml-2">
                {t.sections.length} sections · {formatTime(t.sections.reduce((s, sec) => s + sec.durationSeconds, 0))}
              </span>
            </div>
            {!t.isDefault && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(t.id);
                }}
                className="text-gray-500 hover:text-red-400 text-xs px-1 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
