import { SECTION_HINTS } from '../../constants';

export function SectionHint({ templateSectionId }: { templateSectionId: string }) {
  const hint = SECTION_HINTS[templateSectionId];
  if (!hint) return null;
  return (
    <div className="border-l-2 border-amber-500/70 bg-amber-950/20 px-3 py-2 text-sm text-amber-200/90">
      <span className="text-xs uppercase tracking-wider text-amber-400/80 mr-2">Hint</span>
      {hint}
    </div>
  );
}
