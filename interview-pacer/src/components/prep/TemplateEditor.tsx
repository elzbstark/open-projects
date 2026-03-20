import { useState } from 'react';
import type { Template, TemplateSection } from '../../types';

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template.name);
  const [sections, setSections] = useState<TemplateSection[]>(template.sections);

  function addSection() {
    setSections([
      ...sections,
      { id: crypto.randomUUID(), name: 'New Section', durationSeconds: 300 },
    ]);
  }

  function updateSection(index: number, field: 'name' | 'durationSeconds', value: string | number) {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSections(updated);
  }

  function handleSave() {
    const totalMinutes = Math.ceil(sections.reduce((s, sec) => s + sec.durationSeconds, 0) / 60);
    onSave({ ...template, name, sections, totalMinutes });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Edit Template</h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name"
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
      />

      <div className="space-y-2">
        {sections.map((section, i) => (
          <div key={section.id} className="flex items-center gap-2 group">
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveSection(i, -1)}
                className="text-gray-500 hover:text-white text-xs leading-none"
              >
                ▲
              </button>
              <button
                onClick={() => moveSection(i, 1)}
                className="text-gray-500 hover:text-white text-xs leading-none"
              >
                ▼
              </button>
            </div>
            <input
              type="text"
              value={section.name}
              onChange={(e) => updateSection(i, 'name', e.target.value)}
              className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={Math.round(section.durationSeconds / 60)}
                onChange={(e) =>
                  updateSection(i, 'durationSeconds', Math.max(1, parseInt(e.target.value) || 1) * 60)
                }
                className="w-14 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white text-center focus:outline-none focus:border-blue-500"
                min={1}
              />
              <span className="text-xs text-gray-500">min</span>
            </div>
            <button
              onClick={() => removeSection(i)}
              className="text-gray-500 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addSection}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        + Add section
      </button>

      <div className="text-xs text-gray-500">
        Total: {Math.ceil(sections.reduce((s, sec) => s + sec.durationSeconds, 0) / 60)} minutes
      </div>
    </div>
  );
}
