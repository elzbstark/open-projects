import { useState } from 'react';
import type { Template, Session } from '../../types';
import { useAppState } from '../../context';
import { saveTemplates, saveSessions } from '../../store';
import { TemplateList } from './TemplateList';
import { TemplateEditor } from './TemplateEditor';
import { SessionList } from './SessionList';
import { SessionEditor } from './SessionEditor';
import { formatTime } from '../shared/TimeDisplay';

interface PrepLayoutProps {
  onLaunchSession: (session: Session) => void;
}

export function PrepLayout({ onLaunchSession }: PrepLayoutProps) {
  const { templates, setTemplates, sessions, setSessions } = useAppState();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewingTemplateId, setPreviewingTemplateId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;
  const previewingTemplate = templates.find((t) => t.id === previewingTemplateId) || null;

  function handleSaveTemplate(updated: Template) {
    const newTemplates = templates.map((t) => (t.id === updated.id ? updated : t));
    if (!templates.find((t) => t.id === updated.id)) {
      newTemplates.push(updated);
    }
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
    setEditingTemplate(null);
  }

  function handleDeleteTemplate(id: string) {
    const newTemplates = templates.filter((t) => t.id !== id);
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
    if (selectedTemplateId === id) setSelectedTemplateId(null);
  }

  function handleNewTemplate() {
    const newTemplate: Template = {
      id: crypto.randomUUID(),
      name: 'New Template',
      totalMinutes: 30,
      sections: [
        { id: crypto.randomUUID(), name: 'Section 1', durationSeconds: 300 },
      ],
    };
    setEditingTemplate(newTemplate);
  }

  function handleCreateSession(templateId: string, companyName: string, name: string, sessionType: 'delivery' | 'improv' = 'delivery') {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const newSession: Session = {
      id: crypto.randomUUID(),
      templateId,
      templateName: template.name,
      companyName,
      name,
      sessionType,
      sections: template.sections.map((sec) => ({
        id: crypto.randomUUID(),
        templateSectionId: sec.id,
        name: sec.name,
        durationSeconds: sec.durationSeconds,
        content: '',
        notes: '',
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newSessions = [...sessions, newSession];
    setSessions(newSessions);
    saveSessions(newSessions);
    setSelectedSessionId(newSession.id);
    setShowNewSession(false);
  }

  function handleSaveSession(updated: Session) {
    const newSessions = sessions.map((s) => (s.id === updated.id ? updated : s));
    setSessions(newSessions);
    saveSessions(newSessions);
  }

  function handleDeleteSession(id: string) {
    const newSessions = sessions.filter((s) => s.id !== id);
    setSessions(newSessions);
    saveSessions(newSessions);
    if (selectedSessionId === id) setSelectedSessionId(null);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Interview Pacer</h1>
          <p className="text-sm text-gray-400 mt-1">
            Prepare your sessions, then launch Live Mode during interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Templates + Sessions list */}
          <div className="space-y-8">
            {/* Templates */}
            {editingTemplate ? (
              <TemplateEditor
                template={editingTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => setEditingTemplate(null)}
              />
            ) : (
              <TemplateList
                templates={templates}
                selectedId={selectedTemplateId}
                onSelect={(id) => {
                  setSelectedTemplateId(id);
                  setPreviewingTemplateId(id);
                  setSelectedSessionId(null);
                  setShowNewSession(false);
                  const t = templates.find((t) => t.id === id);
                  if (t && !t.isDefault) setEditingTemplate(t);
                }}
                onNew={handleNewTemplate}
                onDelete={handleDeleteTemplate}
              />
            )}

            {/* Sessions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Sessions</h2>
                <button
                  onClick={() => {
                    setShowNewSession(true);
                    setSelectedSessionId(null);
                  }}
                  className="px-3 py-1 text-sm bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
                >
                  + New Session
                </button>
              </div>
              <SessionList
                sessions={sessions}
                selectedId={selectedSessionId}
                onSelect={(id) => {
                  setSelectedSessionId(id);
                  setShowNewSession(false);
                }}
                onLaunch={(id) => {
                  const s = sessions.find((s) => s.id === id);
                  if (s) onLaunchSession(s);
                }}
                onDelete={handleDeleteSession}
              />
            </div>
          </div>

          {/* Right column: Session editor or template preview */}
          <div>
            {!showNewSession && !selectedSession && previewingTemplate ? (
              <TemplatePreview
                template={previewingTemplate}
                onEdit={!previewingTemplate.isDefault ? () => setEditingTemplate(previewingTemplate) : undefined}
              />
            ) : (
              <SessionEditor
                session={showNewSession ? null : selectedSession}
                template={selectedTemplate}
                onSave={handleSaveSession}
                onCreate={handleCreateSession}
                templates={templates}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ template, onEdit }: { template: Template; onEdit?: () => void }) {
  const totalDuration = template.sections.reduce((s, sec) => s + sec.durationSeconds, 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{template.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {template.sections.length} sections · {formatTime(totalDuration)} total
          </p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Edit
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {template.sections.map((sec, i) => (
          <div key={sec.id} className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded border border-gray-700">
            <span className="text-sm text-gray-300">
              <span className="text-gray-500 mr-2">{i + 1}.</span>
              {sec.name}
            </span>
            <span className="text-xs text-gray-500 font-mono">{formatTime(sec.durationSeconds)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
