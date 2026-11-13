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
      sec('ps30-clarify',    'Clarify: scope + game plan',                              1),
      sec('ps30-motivation', 'Goal: one sentence, "X wins if Y, so I optimize for Z"',  1),
      sec('ps30-audience',   'Audience: 2-3 segments → pick → one-line persona',        4),
      sec('ps30-problem',    'Problem: 2-3 pains → name the bottleneck',                4),
      sec('ps30-solutions',  'Solutions: diverge → prioritize',                         5),
      sec('ps30-v1',         'V1: restate the bottleneck, then demo the build',        10),
      sec('ps30-close',      'Close: metric + guardrail + risk + monetization',         4),
    ],
  },
  {
    id: 'vision-25',
    name: 'Vision 25min',
    totalMinutes: 25,
    isDefault: true,
    sections: [
      sec('vis25-clarify',   'Clarify',                                        1),
      sec('vis25-users',     'Users',                                          3),
      sec('vis25-assets',    'Company Strengths / Assets',                     3),
      sec('vis25-statement', 'Vision Statement',                               2),
      sec('vis25-whyus',     'Why Us — differentiation',                       5),
      sec('vis25-pillars',   'Pillars — with users embedded',                  5),
      sec('vis25-metrics',   'Success Metrics',                                2),
      sec('vis25-risks',     'Risks',                                          2),
      sec('vis25-start',     'How We Get Started',                             1),
      sec('vis25-summary',   'Summary',                                        1),
    ],
  },
  {
    id: 'strategy-25',
    name: 'Strategy 25min',
    totalMinutes: 25,
    isDefault: true,
    sections: [
      sec('strat25-clarify',    'Clarify',                                                1),
      sec('strat25-hypothesis', 'Hypothesis',                                             4),
      sec('strat25-why',        'Why — mission/users/size, how we make money',             5),
      sec('strat25-whyus',      'Why Us — market/assets',                                 6),
      sec('strat25-cost',       'At What Cost — cost to build and run, risk, opportunity cost, timing, feasibility', 6),
      sec('strat25-rec',        'Recommendation + what would change my mind',             3),
    ],
  },
  {
    id: 'stakeholder-25',
    name: 'Stakeholder 25min',
    totalMinutes: 25,
    isDefault: true,
    sections: [
      sec('sh25-clarify',  'Clarify — what shift, who it touches, by when',             1),
      sec('sh25-map',      'Map — who decides, who does the work, who can block',       4),
      sec('sh25-losegain', 'Lose + Gain — for each group; name the biggest loser',      3),
      sec('sh25-problem',  'Shared Problem — in their words, not yours',                3),
      sec('sh25-pilot',    'Prove Small — one team or partner first',                   4),
      sec('sh25-cheap',    'Make It Cheap — do the migration work for them',            3),
      sec('sh25-sequence', 'Sequence — ally first, then the hardest group',             3),
      sec('sh25-lock',     'Lock It — shared metric + decision record + escalation',    2),
      sec('sh25-risks',    'Risks',                                                     2),
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

// Stuck-hints shown on the active section, keyed by template section id so
// sessions created before a hint existed still get it.
export const SECTION_HINTS: Record<string, string> = {
  'ps30-audience': 'If stuck, split on one axis (e.g. frequency vs trust), pick one, name the person',
  'strat25-hypothesis': 'Commit in one sentence. Under push: same pick, same reason',
  'sd30-api': 'If money moves: idempotency, partial failure, reconciliation',
};

// "How to get on track" script, shown on demand when 2+ sections behind. Keyed by
// the template section id you'd skip to, so it only appears in templates that have it.
export const GET_ON_TRACK: Record<string, string[]> = {
  'ps30-v1': [
    'Say: "Give me a second to gather my thoughts."',
    'Pause. Breathe. Look at the clock.',
    'Ask: "Should we continue with this section, or skip to the MVP?"',
  ],
};
