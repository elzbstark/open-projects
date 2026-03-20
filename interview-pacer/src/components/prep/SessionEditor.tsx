import { useState, useRef } from 'react';
import type { Session, Template } from '../../types';
import { parseMarkdownSections, mapToTemplateSections } from './ContentParser';

interface SessionEditorProps {
  session: Session | null;
  template: Template | null;
  onSave: (session: Session) => void;
  onCreate: (templateId: string, companyName: string, name: string, sessionType: 'delivery' | 'improv') => void;
  templates: Template[];
}

export function SessionEditor({ session, onSave, onCreate, templates }: SessionEditorProps) {
  const [companyName, setCompanyName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [sessionType, setSessionType] = useState<'delivery' | 'improv'>('delivery');
  const [bulkContent, setBulkContent] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create new session mode
  if (!session) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">New Session</h2>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">Session Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSessionType('delivery')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                sessionType === 'delivery'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
              }`}
            >
              Delivery (scripted)
            </button>
            <button
              onClick={() => setSessionType('improv')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                sessionType === 'improv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
              }`}
            >
              Improv (outline only)
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {sessionType === 'delivery'
              ? 'Pre-written answers — practice pacing and delivery in sidebar.'
              : 'Outline or questions only — generate answers live in full-screen mode.'}
          </p>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Company</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Affirm"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Session Name</label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="e.g., Round 1 Behavioral"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => {
            if (companyName.trim() && sessionName.trim() && selectedTemplateId) {
              onCreate(selectedTemplateId, companyName.trim(), sessionName.trim(), sessionType);
              setCompanyName('');
              setSessionName('');
              setSessionType('delivery');
            }
          }}
          disabled={!companyName.trim() || !sessionName.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded text-sm transition-colors"
        >
          Create Session
        </button>
      </div>
    );
  }

  const isImprov = session.sessionType === 'improv';

  // Edit existing session
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {session.companyName} — {session.name}
        </h2>
        <div className="flex items-center gap-2">
          {isImprov && (
            <span className="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded-full border border-purple-800/50">
              Improv
            </span>
          )}
          <span className="text-xs text-gray-500">{session.templateName}</span>
        </div>
      </div>

      {/* Bulk paste / file load toggle */}
      <div>
        <button
          onClick={() => setShowBulkPaste(!showBulkPaste)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showBulkPaste ? '▼ Hide bulk paste' : '▶ Bulk paste markdown'}
        </button>

        {showBulkPaste && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".md,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    setBulkContent((evt.target?.result as string) || '');
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Load file (.md, .txt)
              </button>
              <span className="text-xs text-gray-500">or paste below</span>
            </div>
            <textarea
              value={bulkContent}
              onChange={(e) => setBulkContent(e.target.value)}
              placeholder="Paste markdown here. Use ## headings to auto-split into sections."
              className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm font-mono focus:outline-none focus:border-blue-500 resize-y"
            />
            <button
              onClick={() => {
                if (!bulkContent.trim()) return;
                const parsed = parseMarkdownSections(bulkContent);
                const mapped = mapToTemplateSections(parsed, session.sections.length);
                const updatedSections = session.sections.map((sec, i) => ({
                  ...sec,
                  content: mapped[i] || sec.content,
                }));
                onSave({ ...session, sections: updatedSections, updatedAt: new Date().toISOString() });
                setBulkContent('');
                setShowBulkPaste(false);
              }}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              Apply to sections
            </button>
          </div>
        )}
      </div>

      {/* Per-section content editors */}
      <div className="space-y-4">
        {session.sections.map((section, i) => (
          <div key={section.id} className="space-y-1">
            <label className="text-xs text-gray-400 flex items-center gap-2">
              <span className="font-medium text-gray-300">{section.name}</span>
              <span>({Math.round(section.durationSeconds / 60)}m)</span>
            </label>
            <textarea
              value={section.content}
              onChange={(e) => {
                const updatedSections = [...session.sections];
                updatedSections[i] = { ...updatedSections[i], content: e.target.value };
                onSave({
                  ...session,
                  sections: updatedSections,
                  updatedAt: new Date().toISOString(),
                });
              }}
              placeholder={isImprov ? `Outline / questions for ${section.name}...` : `Content for ${section.name}...`}
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm font-mono focus:outline-none focus:border-blue-500 resize-y"
            />
            {/* Improv: show saved session notes for review/cleanup */}
            {isImprov && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes from session</label>
                <textarea
                  value={section.notes || ''}
                  onChange={(e) => {
                    const updatedSections = [...session.sections];
                    updatedSections[i] = { ...updatedSections[i], notes: e.target.value };
                    onSave({
                      ...session,
                      sections: updatedSections,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  placeholder="No notes from session yet"
                  className="w-full h-20 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded text-gray-400 text-sm font-mono focus:outline-none focus:border-blue-500/50 resize-y"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
