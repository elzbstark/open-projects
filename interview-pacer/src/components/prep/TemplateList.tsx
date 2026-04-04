import { useState } from 'react';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          <div key={t.id}>
            <div
              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
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
              <div className="flex items-center gap-1">
                {!t.isDefault && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(t.id); }}
                    className="text-xs text-gray-500 hover:text-blue-400 px-1 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {!t.isDefault && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                    className="text-gray-500 hover:text-red-400 text-xs px-1 transition-colors"
                  >
                    ✕
                  </button>
                )}
                <span className={`text-xs text-gray-500 transition-transform duration-150 inline-block ${expandedId === t.id ? 'rotate-90' : ''}`}>
                  ›
                </span>
              </div>
            </div>

            {expandedId === t.id && (
              <div className="ml-3 mb-1 space-y-0.5">
                {t.sections.map((sec, i) => (
                  <div key={sec.id} className="flex justify-between px-2 py-1 text-xs text-gray-400 bg-gray-800/50 rounded">
                    <span>
                      <span className="text-gray-600 mr-1.5">{i + 1}.</span>
                      {sec.name}
                    </span>
                    <span className="font-mono text-gray-500">{formatTime(sec.durationSeconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
