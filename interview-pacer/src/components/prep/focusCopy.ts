// Labels for the two session types ('delivery' and 'improv' in stored data).

export type Focus = 'delivery' | 'improv';

export const FOCUS_COPY: Record<Focus, { label: string; blurb: string }> = {
  delivery: {
    label: 'Timer',
    blurb: 'Big clock. Your prep shows as short cues in a narrow sidebar.',
  },
  improv: {
    label: 'Notes',
    blurb: 'Your outline sits center stage, with a box to type as you talk.',
  },
};
