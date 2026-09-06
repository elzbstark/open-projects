import type { Template } from './types';

function sec(id: string, name: string, minutes: number) {
  return { id, name, durationSeconds: minutes * 60 };
}

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'behavioral-30',
    name: 'Behavioral 30min',
    totalMinutes: 31,
    isDefault: true,
    sections: [
      sec('b30-intro',       'Intro',        3),
      sec('b30-why-role',    'Why Role',     2),
      sec('b30-why-company', 'Why Company',  2),
      sec('b30-story1',      'Story 1',      6),
      sec('b30-story2',      'Story 2',      6),
      sec('b30-story3',      'Story 3',      6),
      sec('b30-story4',      'Story 4',      6),
    ],
  },
  {
    id: 'analytical-metrics-30',
    name: 'Analytical / Metrics 30min',
    totalMinutes: 30,
    isDefault: true,
    sections: [
      sec('am30-gameplan',  'Assumptions + Game Plan — scope, platform, geo',        3),
      sec('am30-rationale', 'Product Rationale — context, market, mission',          5),
      sec('am30-framework', 'Metric Framework — ecosystem → value props → actions', 10),
      sec('am30-nsm',       'NSM + Drawbacks',                                        7),
      sec('am30-goals',     'Team Focus / Goals',                                     5),
    ],
  },
  {
    id: 'analytical-rca-30',
    name: 'Analytical / RCA 25min',
    totalMinutes: 25,
    isDefault: true,
    sections: [
      sec('rca30-clarify',   'Clarify',              2),
      sec('rca30-why',       'Why It Matters',       2),
      sec('rca30-announce',  'Framework Announce',   2),
      sec('rca30-segment',   'Segment',              3),
      sec('rca30-deepdive',  'Framework Deep Dive', 10),
      sec('rca30-hypothesis','Hypothesis',           2),
      sec('rca30-nextsteps', 'Next Steps',           4),
    ],
  },
  {
    id: 'decision-making-30',
    name: 'Decision-Making 30min',
    totalMinutes: 30,
    isDefault: true,
    sections: [
      sec('dm30-clarify',    'Clarify — company, timeline, specifics',                    2),
      sec('dm30-motivation', 'Motivation — goal + users affected + success metric',       4),
      sec('dm30-options',    'Name Options — enumerate explicitly',                       2),
      sec('dm30-hypothesis', 'Hypothesis + Assumptions',                                  4),
      sec('dm30-disprove',   'Disprove — user, team, company impact + effort + opp cost',12),
      sec('dm30-validate',   'Validate — tests/iteration or what changes my mind',        6),
    ],
  },
  {
    id: 'product-sense-30',
    name: 'Product Sense 30min',
    totalMinutes: 30,
    isDefault: true,
    sections: [
      sec('ps30-clarify',    'Clarify — scope + game plan',                  1),
      sec('ps30-motivation', 'Motivation — why it matters + mission',        3),
      sec('ps30-audience',   'Audience — segment → prioritize → persona',    5),
      sec('ps30-problem',    'Problem — user journey → name the bottleneck', 6),
      sec('ps30-solutions',  'Solutions — diverge → prioritize',             5),
      sec('ps30-v1',         'V1 — define the build',                        7),
      sec('ps30-close',      'Close — metric + guardrail + risk',            2),
    ],
  },
  {
    id: 'system-design-30',
    name: 'System Design 30min',
    totalMinutes: 30,
    isDefault: true,
    sections: [
      sec('sd30-requirements', 'Requirements — success metrics → functional → NFRs',        2),
      sec('sd30-entities',     'Core Entities — 3-6 nouns + state machines',                6),
      sec('sd30-api',          'API Design — contract + protocol choice',                   5),
      sec('sd30-highlevel',    'High-Level — end-to-end skeleton, component by component',  7),
      sec('sd30-deepdive',     'Deep Dives — proactive bottlenecks + interviewer-steered',  7),
      sec('sd30-wrapup',       'Wrap Up — summarize tradeoffs + open questions',            3),
    ],
  },
];
