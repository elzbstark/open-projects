// Mini wireframes of the two live layouts, so the Focus choice shows where prep text ends up.

import type { Focus } from './focusCopy';

export function FocusPreview({ focus, active }: { focus: Focus; active: boolean }) {
  const line = active ? 'bg-blue-300/70' : 'bg-gray-500';
  const frame = `w-full h-20 rounded border ${active ? 'border-blue-400/60 bg-gray-900' : 'border-gray-700 bg-gray-900/60'}`;

  if (focus === 'delivery') {
    return (
      <div className={`${frame} flex p-1.5 gap-1.5`} aria-hidden>
        {/* Sidebar: section list, active one expanded with cue lines */}
        <div className="w-[34%] flex flex-col gap-1">
          <div className="rounded-sm border border-gray-600 p-1 space-y-0.5">
            <div className={`h-1 w-3/4 rounded ${line}`} />
            <div className="h-0.5 w-full rounded bg-gray-600" />
            <div className="h-0.5 w-2/3 rounded bg-gray-600" />
          </div>
          <div className="h-2.5 rounded-sm bg-gray-700" />
          <div className="h-2.5 rounded-sm bg-gray-700" />
        </div>
        {/* Clock panel */}
        <div className="flex-1 flex items-center justify-center">
          <div className={`h-14 w-14 rounded-full border-4 ${active ? 'border-blue-400/70' : 'border-gray-600'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${frame} flex flex-col p-1.5`} aria-hidden>
      {/* Centered column: section title, dimmed outline, notes box */}
      <div className="flex-1 w-3/4 mx-auto flex flex-col gap-1">
        <div className={`h-1.5 w-1/2 rounded ${line}`} />
        <div className="h-0.5 w-full rounded bg-gray-600" />
        <div className="h-0.5 w-5/6 rounded bg-gray-600" />
        <div className={`flex-1 rounded-sm border ${active ? 'border-blue-400/60' : 'border-gray-600'}`} />
      </div>
      {/* Section chips */}
      <div className="flex gap-1 justify-center pt-1">
        <div className={`h-1.5 w-4 rounded-full ${line}`} />
        <div className="h-1.5 w-4 rounded-full bg-gray-700" />
        <div className="h-1.5 w-4 rounded-full bg-gray-700" />
      </div>
    </div>
  );
}
