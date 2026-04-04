import { useState } from 'react';
import type { Template, Session } from '../../types';
import { useAppState } from '../../context';
import { saveTemplates, saveSessions } from '../../store';
import { TemplateList } from './TemplateList';
import { TemplateEditor } from './TemplateEditor';
import { SessionList } from './SessionList';
import { SessionEditor } from './SessionEditor';

interface PrepLayoutProps {
  onLaunchSession: (session: Session) => void;
}

export function PrepLayout({ onLaunchSession }: PrepLayoutProps) {
  const { templates, setTemplates, sessions, setSessions } = useAppState();

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;

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

  function handleMarkDone(id: string) {
    const newSessions = sessions.map((s) =>
      s.id === id ? { ...s, completedAt: new Date().toISOString() } : s
    );
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
                selectedId={null}
                onSelect={(id) => {
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
                sessions={sessions.filter((s) => !s.completedAt)}
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
                onMarkDone={handleMarkDone}
              />
            </div>

            {/* Completed sessions — visually separated as history */}
            {sessions.some((s) => s.completedAt) && (
              <div className="pt-4 border-t border-gray-700/50">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Completed</h2>
                <div className="space-y-1">
                  {[...sessions.filter((s) => s.completedAt)].sort(
                    (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
                  ).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-3 py-2 rounded border border-transparent hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-sm text-gray-500 truncate block">{s.companyName}: {s.name}</span>
                        <span className="text-xs text-gray-600">
                          {[s.templateName, s.sessionType === 'improv' ? 'Improv' : null].filter(Boolean).join(' · ')}
                          {' · '}
                          {new Date(s.completedAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="text-gray-600 hover:text-red-400 text-xs px-1 transition-colors shrink-0 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Session editor */}
          <div>
            <SessionEditor
              session={showNewSession ? null : selectedSession}
              template={null}
              onSave={handleSaveSession}
              onCreate={handleCreateSession}
              templates={templates}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

