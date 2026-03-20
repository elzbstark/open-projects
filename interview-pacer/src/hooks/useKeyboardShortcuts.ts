import { useEffect } from 'react';

interface ShortcutHandlers {
  onTogglePause: () => void;
  onNextSection: () => void;
  onPrevSection: () => void;
  onEscape: () => void;
  enabled: boolean;
}

export function useKeyboardShortcuts({
  onTogglePause,
  onNextSection,
  onPrevSection,
  onEscape,
  enabled,
}: ShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs/textareas
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onTogglePause();
          break;
        case 'ArrowRight':
        case 'Tab':
          if (!e.shiftKey) {
            e.preventDefault();
            onNextSection();
          } else {
            e.preventDefault();
            onPrevSection();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevSection();
          break;
        case 'Escape':
          e.preventDefault();
          onEscape();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onTogglePause, onNextSection, onPrevSection, onEscape]);
}
