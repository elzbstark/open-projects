import type { Template } from './types';

function sec(id: string, name: string, minutes: number) {
  return { id, name, durationSeconds: minutes * 60 };
}

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'behavioral-30',
    name: 'Behavioral 30min',
    totalMinutes: 30,
    isDefault: true,
    sections: [
      sec('b30-intro',     'Intro',        2),
      sec('b30-story1',    'Story 1',       5),
      sec('b30-story2',    'Story 2',       5),
      sec('b30-followup',  'Follow-up',     4),
      sec('b30-why',       'Why Company',   3),
      sec('b30-questions', 'Questions',     5),
      sec('b30-buffer',    'Buffer',        2),
    ],
  },
  {
    id: 'case-study-45',
    name: 'Case Study 45min',
    totalMinutes: 45,
    isDefault: true,
    sections: [
      sec('cs45-clarify',  'Clarify',        3),
      sec('cs45-structure','Structure',      5),
      sec('cs45-analysis', 'Analysis',      10),
      sec('cs45-rec',      'Recommendation', 5),
      sec('cs45-deepdive', 'Deep Dive',      8),
      sec('cs45-questions','Questions',      5),
      sec('cs45-buffer',   'Buffer',         4),
    ],
  },
  {
    id: 'product-sense-45',
    name: 'Product Sense 45min',
    totalMinutes: 45,
    isDefault: true,
    sections: [
      sec('ps45-clarify',     'Clarify',        3),
      sec('ps45-users',       'Users',          5),
      sec('ps45-painpoints',  'Pain Points',    6),
      sec('ps45-solutions',   'Solutions',      8),
      sec('ps45-vision',      'Product Vision', 4),
      sec('ps45-prioritize',  'Prioritize',     7),
      sec('ps45-evaluate',    'Evaluate',       4),
      sec('ps45-questions',   'Questions',      5),
      sec('ps45-buffer',      'Buffer',         3),
    ],
  },
  {
    id: 'system-design-45',
    name: 'System Design 45min',
    totalMinutes: 45,
    isDefault: true,
    sections: [
      sec('sd45-requirements',  'Requirements',   5),
      sec('sd45-entities',      'Core Entities',  3),
      sec('sd45-api',           'API Design',     5),
      sec('sd45-highlevel',     'High-Level',    15),
      sec('sd45-deepdive',      'Deep Dives',    10),
      sec('sd45-wrapup',        'Wrap Up',        4),
      sec('sd45-buffer',        'Buffer',         3),
    ],
  },
];
