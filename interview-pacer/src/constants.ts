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
      sec('b30-buffer',    'Buffer',        6),
    ],
  },
  {
    id: 'analytical-metrics-45',
    name: 'Analytical / Metrics 45min',
    totalMinutes: 45,
    isDefault: true,
    sections: [
      sec('at45-gameplan',   'Assumptions + Game Plan — scope, platform, geo',        3),
      sec('at45-rationale',  'Product Rationale — context, market, mission',          5),
      sec('at45-framework',  'Metric Framework — ecosystem → value props → actions', 15),
      sec('at45-goals',      'Goal-Setting — score on influence × NSM impact',        8),
      sec('at45-tradeoffs',  'Tradeoff Evaluation — pros/cons, decide, what changes', 8),
      sec('at45-questions',  'Questions',                                              5),
      sec('at45-buffer',     'Buffer',                                                 1),
    ],
  },
  {
    id: 'analytical-rca-30',
    name: 'Analytical / RCA 30min',
    totalMinutes: 30,
    isDefault: true,
    sections: [
      sec('rca30-triage',   'Triage — timeframe, velocity, geo, segment, platform',   3),
      sec('rca30-buckets',  'Three Buckets — team → company → external',             15),
      sec('rca30-strategic','Strategic Read — interpret root cause + re-eval NSM',    6),
      sec('rca30-questions','Questions',                                               4),
      sec('rca30-buffer',   'Buffer',                                                  2),
    ],
  },
  {
    id: 'decision-making-45',
    name: 'Decision-Making 45min',
    totalMinutes: 45,
    isDefault: true,
    sections: [
      sec('dm45-clarify',   'Clarify — company, timeline, specifics',                    3),
      sec('dm45-motivation','Motivation — goal + users affected + success metric',       5),
      sec('dm45-options',   'Name Options — enumerate explicitly',                       3),
      sec('dm45-hypothesis','Hypothesis + Assumptions',                                  5),
      sec('dm45-disprove',  'Disprove — user, team, company impact + effort + opp cost',15),
      sec('dm45-validate',  'Validate — tests/iteration or what changes my mind',        8),
      sec('dm45-questions', 'Questions',                                                  5),
      sec('dm45-buffer',    'Buffer',                                                     1),
    ],
  },
  {
    id: 'product-sense-45',
    name: 'Product Sense 45min',
    totalMinutes: 45,
    isDefault: true,
    sections: [
      sec('ps45-clarify',     'Clarify — scope + game plan',               2),
      sec('ps45-motivation',  'Motivation — why it matters + mission',     3),
      sec('ps45-audience',    'Audience — segment → prioritize → persona', 9),
      sec('ps45-problem',     'Problem — user journey → name the bottleneck', 9),
      sec('ps45-solutions',   'Solutions — diverge → prioritize → V1',     9),
      sec('ps45-close',       'Close — metric + guardrail + risk',          2),
      sec('ps45-questions',   'Questions',                                  5),
      sec('ps45-buffer',      'Buffer',                                     6),
    ],
  },
  {
    id: 'system-design-45',
    name: 'System Design 45min',
    totalMinutes: 45,
    isDefault: true,
    sections: [
      sec('sd45-requirements',  'Requirements — success metrics → functional → NFRs',    5),
      sec('sd45-entities',      'Core Entities — 3-6 nouns + state machines',            3),
      sec('sd45-api',           'API Design — contract + protocol choice',               3),
      sec('sd45-highlevel',     'High-Level — end-to-end skeleton, component by component', 15),
      sec('sd45-deepdive',      'Deep Dives — proactive bottlenecks + interviewer-steered', 10),
      sec('sd45-wrapup',        'Wrap Up — summarize tradeoffs + open questions',         4),
      sec('sd45-buffer',        'Buffer',                                                 5),
    ],
  },
];
