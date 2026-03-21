import { useState } from 'react';

/* ─── Data ─── */

const ALL_DRIVERS = [
  'Ride/Order Reliability', 'Ride/Order Quality', 'Signing Up',
  'Billing and Invoicing', 'Uber for Business Dashboard(s)',
  'Expense Integrations', 'Sustainable Solutions', 'Customer Support',
  'Cost Management', 'Commitment to Safety',
];

const CDJ_STAGES = [
  'Consideration / Evaluation',
  'Purchase',
  'Onboarding',
  'Adoption / Product Use',
  'Value / Expansion',
  'Expansion / Renewal',
];

interface QuestionBlock {
  label: string;           // e.g. "Q1 — PRIMARY"
  text: string;
  scale?: string;          // e.g. "Yes / No / Unsure" or "0–10"
}

interface CondBranch {
  label: string;           // e.g. "If YES →"
  text: string;
  options: { text: string; core: boolean }[];
}

interface SurveyDef {
  id: string;
  cdj: string;
  metric: 'CES' | 'ORS' | 'CSAT' | 'NPS';
  trigger: string;
  updated?: boolean;
  questions: QuestionBlock[];
  branches?: CondBranch[];
  ranking?: { label: string; text: string; options: { text: string; core: boolean }[] };
  scoreLow?: { label: string; text: string; options: { text: string; core: boolean }[] };
  openEnded: { label: string; text: string };
}

const STAGE_META: Record<string, { timing: string; risk: string; riskColor: string; riskBg: string; drivers: string[] }> = {
  'Consideration / Evaluation': {
    timing: 'Pre-sale · 2h–72h post-touchpoint',
    risk: 'Medium', riskColor: '#b8860b', riskBg: '#fdf3e4',
    drivers: ['Signing Up', 'Cost Management', 'Expense Integrations', 'Customer Support', 'Uber for Business Dashboard(s)', 'Commitment to Safety'],
  },
  'Purchase': {
    timing: 'Contract execution · 2h post-signature',
    risk: 'Low', riskColor: '#1a6b3c', riskBg: '#e8f9f0',
    drivers: ['Billing and Invoicing', 'Signing Up', 'Cost Management', 'Customer Support'],
  },
  'Onboarding': {
    timing: 'First 14 days · setup & config',
    risk: 'High', riskColor: '#c0392b', riskBg: '#fdeaea',
    drivers: ['Signing Up', 'Uber for Business Dashboard(s)', 'Expense Integrations', 'Customer Support', 'Billing and Invoicing'],
  },
  'Adoption / Product Use': {
    timing: '30–90 days · active usage period',
    risk: 'High', riskColor: '#c0392b', riskBg: '#fdeaea',
    drivers: ['Ride/Order Reliability', 'Ride/Order Quality', 'Commitment to Safety', 'Uber for Business Dashboard(s)', 'Cost Management', 'Billing and Invoicing', 'Expense Integrations', 'Customer Support'],
  },
  'Value / Expansion': {
    timing: '6+ months · QBR cadence · expansion milestones',
    risk: 'Medium', riskColor: '#b8860b', riskBg: '#fdf3e4',
    drivers: ['Cost Management', 'Uber for Business Dashboard(s)', 'Billing and Invoicing', 'Expense Integrations', 'Customer Support', 'Sustainable Solutions', 'Ride/Order Reliability'],
  },
  'Expansion / Renewal': {
    timing: 'Semi-annual · offset from NPS',
    risk: 'Critical', riskColor: '#fff', riskBg: '#c0392b',
    drivers: ['Cost Management', 'Ride/Order Reliability', 'Ride/Order Quality', 'Uber for Business Dashboard(s)', 'Commitment to Safety', 'Sustainable Solutions'],
  },
};

const SURVEYS: SurveyDef[] = [
  /* ─── Consideration / Evaluation ─── */
  {
    id: 'CES-001', cdj: 'Consideration / Evaluation', metric: 'CES',
    trigger: '2h after first demo or sales touchpoint',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'The demo and/or account rep made it easy to evaluate whether Uber for Business is the right solution for our organization.', scale: 'Yes / No / Unsure' },
    ],
    branches: [
      { label: 'If YES →', text: 'What made evaluation easy? Select all that apply.', options: [
        { text: 'Clear pricing structure', core: false },
        { text: 'Signing Up process was simple', core: true },
        { text: 'Cost Management tools were demonstrated', core: true },
        { text: 'Expense Integrations were shown', core: true },
        { text: 'Customer Support was responsive', core: true },
        { text: 'Competitive comparison was helpful', core: false },
      ]},
      { label: 'If NO →', text: 'What made evaluation difficult? Select all that apply.', options: [
        { text: 'Pricing was unclear', core: false },
        { text: 'Signing Up had friction', core: true },
        { text: 'Cost Management capabilities were unclear', core: true },
        { text: 'Integration requirements not addressed', core: true },
        { text: 'Response time too slow', core: true },
      ]},
    ],
    openEnded: { label: 'OPEN-ENDED', text: 'Is there anything else you\'d like to share about your evaluation experience?' },
  },
  {
    id: 'CES-002', cdj: 'Consideration / Evaluation', metric: 'CES',
    updated: true,
    trigger: '24h after pilot completion or final demo',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'It was easy to complete our pilot and evaluation of Uber for Business with our internal stakeholders.', scale: 'Yes / No / Unsure' },
    ],
    branches: [
      { label: 'If YES →', text: 'Which aspects worked well during the pilot?', options: [
        { text: 'Uber for Business Dashboard(s) were intuitive', core: true },
        { text: 'Expense Integrations worked smoothly', core: true },
        { text: 'Cost Management was transparent', core: true },
        { text: 'Safety features met requirements', core: true },
        { text: 'Customer Support was proactive', core: true },
        { text: 'Internal stakeholder buy-in was easy', core: false },
      ]},
      { label: 'If NO →', text: 'What challenges did you encounter?', options: [
        { text: 'Dashboard(s) were confusing', core: true },
        { text: 'Integration setup was complex', core: true },
        { text: 'Cost visibility was limited', core: true },
        { text: 'Safety documentation was insufficient', core: true },
        { text: 'Support was hard to reach', core: true },
      ]},
    ],
    openEnded: { label: 'OPEN-ENDED', text: 'What would have made the pilot process smoother?' },
  },
  {
    id: 'ORS-001', cdj: 'Consideration / Evaluation', metric: 'ORS',
    trigger: '72h after pilot completion',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'Does Uber for Business consistently deliver a dependable evaluation and onboarding commitment experience to you?', scale: 'Yes / No / Unsure' },
    ],
    branches: [
      { label: 'If YES →', text: 'Which elements felt most reliable?', options: [
        { text: 'Uber for Business Dashboard(s) uptime', core: true },
        { text: 'Expense Integrations connectivity', core: true },
        { text: 'Cost Management accuracy', core: true },
        { text: 'Commitment to Safety standards', core: true },
        { text: 'Customer Support follow-through', core: true },
      ]},
      { label: 'If NO →', text: 'Where did reliability fall short?', options: [
        { text: 'Dashboard(s) had errors or downtime', core: true },
        { text: 'Integration data was inconsistent', core: true },
        { text: 'Cost reports were delayed', core: true },
        { text: 'Safety commitments were vague', core: true },
        { text: 'Support response was inconsistent', core: true },
      ]},
    ],
    openEnded: { label: 'OPEN-ENDED', text: 'Please describe any reliability concerns from your evaluation period.' },
  },
  /* ─── Purchase ─── */
  {
    id: 'CES-003', cdj: 'Purchase', metric: 'CES',
    trigger: '2h after contract execution',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'It was easy to finalize our contract and billing setup with Uber for Business.', scale: 'Yes / No / Unsure' },
    ],
    branches: [
      { label: 'If YES →', text: 'What went smoothly?', options: [
        { text: 'Billing and Invoicing setup was clear', core: true },
        { text: 'Signing Up was straightforward', core: true },
        { text: 'Cost Management terms were transparent', core: true },
        { text: 'Customer Support guided the process', core: true },
        { text: 'Contract terms were fair', core: false },
      ]},
      { label: 'If NO →', text: 'What caused friction?', options: [
        { text: 'Billing setup was confusing', core: true },
        { text: 'Account creation had issues', core: true },
        { text: 'Pricing structure was unclear', core: true },
        { text: 'Support was unavailable', core: true },
        { text: 'Legal review took too long', core: false },
      ]},
    ],
    openEnded: { label: 'OPEN-ENDED', text: 'Any feedback on the contracting and billing setup process?' },
  },
  /* ─── Onboarding ─── */
  {
    id: 'CES-004', cdj: 'Onboarding', metric: 'CES',
    trigger: '3 days after first admin login',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'It was easy to set up and configure Uber for Business for our organization.', scale: 'Yes / No / Unsure' },
    ],
    branches: [
      { label: 'If YES →', text: 'What was easiest to configure?', options: [
        { text: 'Signing Up employees', core: true },
        { text: 'Uber for Business Dashboard(s) navigation', core: true },
        { text: 'Expense Integrations setup', core: true },
        { text: 'Customer Support onboarding calls', core: true },
        { text: 'Billing and Invoicing configuration', core: true },
        { text: 'Policy creation', core: false },
      ]},
      { label: 'If NO →', text: 'Where did you get stuck?', options: [
        { text: 'Employee enrollment was difficult', core: true },
        { text: 'Dashboard(s) were hard to navigate', core: true },
        { text: 'Integration setup failed', core: true },
        { text: 'No onboarding support available', core: true },
        { text: 'Billing config was confusing', core: true },
      ]},
    ],
    openEnded: { label: 'OPEN-ENDED', text: 'What would improve the initial setup experience?' },
  },
  {
    id: 'CSAT-001', cdj: 'Onboarding', metric: 'CSAT',
    updated: true,
    trigger: '14 days after full onboarding completion',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'How satisfied are you with your onboarding and implementation experience with Uber for Business?', scale: '0–10 (Very dissatisfied → Very satisfied)' },
    ],
    ranking: {
      label: 'Q2 — DRIVER RANKING',
      text: 'Rank the following by importance to your onboarding experience:',
      options: [
        { text: 'Signing Up', core: true },
        { text: 'Uber for Business Dashboard(s)', core: true },
        { text: 'Expense Integrations', core: true },
        { text: 'Customer Support', core: true },
        { text: 'Documentation quality', core: false },
      ],
    },
    scoreLow: {
      label: 'If SCORE ≤ 6 →',
      text: 'What would most improve your onboarding satisfaction?',
      options: [
        { text: 'Better onboarding documentation', core: false },
        { text: 'Dedicated implementation manager', core: false },
        { text: 'Faster Dashboard(s) setup', core: true },
        { text: 'Simpler Expense Integration', core: true },
        { text: 'More responsive Support', core: true },
      ],
    },
    openEnded: { label: 'OPEN-ENDED', text: 'Please share any details about your onboarding experience — what worked and what didn\'t.' },
  },
  /* ─── Adoption / Product Use ─── */
  {
    id: 'CES-005', cdj: 'Adoption / Product Use', metric: 'CES',
    trigger: '30 days post-program launch',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'It was easy for our employees to adopt and use Uber for Business within our organization\u2019s travel and expense policy.', scale: 'Yes / No / Unsure' },
    ],
    branches: [
      { label: 'If YES →', text: 'What drove adoption success?', options: [
        { text: 'Ride/Order Reliability was strong', core: true },
        { text: 'Ride/Order Quality met expectations', core: true },
        { text: 'Commitment to Safety was clear', core: true },
        { text: 'Dashboard(s) made management easy', core: true },
        { text: 'Cost Management was transparent', core: true },
        { text: 'Employees found it intuitive', core: false },
      ]},
      { label: 'If NO →', text: 'What blocked adoption?', options: [
        { text: 'Rides/Orders were unreliable', core: true },
        { text: 'Quality issues with rides/orders', core: true },
        { text: 'Safety concerns from employees', core: true },
        { text: 'Dashboard(s) were hard to use', core: true },
        { text: 'Cost visibility was poor', core: true },
      ]},
    ],
    openEnded: { label: 'OPEN-ENDED', text: 'What would help drive higher employee adoption?' },
  },
  {
    id: 'CSAT-002', cdj: 'Adoption / Product Use', metric: 'CSAT',
    trigger: '48h after billing cycle closes — ongoing',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'How satisfied are you with your billing and invoicing experience with Uber for Business?', scale: '0–10 (Very dissatisfied → Very satisfied)' },
    ],
    ranking: {
      label: 'Q2 — DRIVER RANKING',
      text: 'Rank the following by impact on your billing satisfaction:',
      options: [
        { text: 'Billing and Invoicing clarity', core: true },
        { text: 'Cost Management accuracy', core: true },
        { text: 'Expense Integrations reliability', core: true },
        { text: 'Customer Support for billing issues', core: true },
        { text: 'Invoice delivery timeliness', core: false },
      ],
    },
    scoreLow: {
      label: 'If SCORE ≤ 6 →',
      text: 'What billing aspect needs the most improvement?',
      options: [
        { text: 'Invoice accuracy', core: true },
        { text: 'Cost breakdown detail', core: true },
        { text: 'Integration with our expense system', core: true },
        { text: 'Dispute resolution speed', core: true },
        { text: 'Payment method flexibility', core: false },
      ],
    },
    openEnded: { label: 'OPEN-ENDED', text: 'Please describe any billing or invoicing issues in detail.' },
  },
  {
    id: 'ORS-002', cdj: 'Adoption / Product Use', metric: 'ORS',
    trigger: '90 days post-program launch',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'Has Uber for Business delivered a dependable platform experience to your employees up to this point?', scale: 'Yes / No / Unsure' },
    ],
    branches: [
      { label: 'If YES →', text: 'Which reliability factors stood out?', options: [
        { text: 'Ride/Order Reliability', core: true },
        { text: 'Ride/Order Quality consistency', core: true },
        { text: 'Dashboard(s) uptime', core: true },
        { text: 'Cost Management data accuracy', core: true },
        { text: 'Commitment to Safety performance', core: true },
      ]},
      { label: 'If NO →', text: 'Where has reliability been an issue?', options: [
        { text: 'Frequent ride/order failures', core: true },
        { text: 'Inconsistent ride/order quality', core: true },
        { text: 'Dashboard outages or lag', core: true },
        { text: 'Cost data discrepancies', core: true },
        { text: 'Safety incident handling', core: true },
      ]},
    ],
    openEnded: { label: 'OPEN-ENDED', text: 'Please share specifics about any platform reliability concerns.' },
  },
  /* ─── Value / Expansion ─── */
  {
    id: 'ORS-003', cdj: 'Value / Expansion', metric: 'ORS',
    trigger: 'Quarterly — aligned to QBR cadence',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'Does Uber for Business consistently deliver a dependable reporting and spend visibility experience to your organization?', scale: 'Yes / No / Unsure' },
    ],
    branches: [
      { label: 'If YES →', text: 'Which reporting capabilities are most valuable?', options: [
        { text: 'Uber for Business Dashboard(s) reporting', core: true },
        { text: 'Billing and Invoicing transparency', core: true },
        { text: 'Expense Integrations data flow', core: true },
        { text: 'Cost Management analytics', core: true },
        { text: 'Customer Support for data requests', core: true },
      ]},
      { label: 'If NO →', text: 'Where is reporting falling short?', options: [
        { text: 'Dashboard(s) lack needed reports', core: true },
        { text: 'Invoice data is incomplete', core: true },
        { text: 'Integration data is delayed', core: true },
        { text: 'Cost visibility is insufficient', core: true },
        { text: 'Support can\'t provide custom reports', core: true },
      ]},
    ],
    openEnded: { label: 'OPEN-ENDED', text: 'What reporting or visibility improvements would add the most value?' },
  },
  {
    id: 'NPS-001', cdj: 'Value / Expansion', metric: 'NPS',
    updated: true,
    trigger: '6 months after onboarding — semi-annual',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'How likely are you to recommend Uber for Business to a colleague or someone in your network?', scale: '0–10 (Not at all → Extremely likely)' },
    ],
    ranking: {
      label: 'Q2 — DRIVER RANKING',
      text: 'Rank the following by their influence on your recommendation:',
      options: [
        { text: 'Cost Management', core: true },
        { text: 'Uber for Business Dashboard(s)', core: true },
        { text: 'Billing and Invoicing', core: true },
        { text: 'Expense Integrations', core: true },
        { text: 'Customer Support', core: true },
        { text: 'Sustainable Solutions', core: true },
      ],
    },
    scoreLow: {
      label: 'If SCORE ≤ 6 →',
      text: 'What is the primary reason for your score?',
      options: [
        { text: 'Cost Management limitations', core: true },
        { text: 'Dashboard functionality gaps', core: true },
        { text: 'Billing issues', core: true },
        { text: 'Integration problems', core: true },
        { text: 'Support responsiveness', core: true },
        { text: 'Better alternatives exist', core: false },
      ],
    },
    openEnded: { label: 'OPEN-ENDED', text: 'What is the single most important thing we could do to improve your experience?' },
  },
  {
    id: 'CES-006', cdj: 'Value / Expansion', metric: 'CES',
    trigger: '5 days after expansion milestone',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'It was easy to expand Uber for Business to additional teams, regions, or use cases within our organization.', scale: 'Yes / No / Unsure' },
    ],
    branches: [
      { label: 'If YES →', text: 'What made expansion easy?', options: [
        { text: 'Dashboard(s) supported multi-team setup', core: true },
        { text: 'Ride/Order Reliability in new regions', core: true },
        { text: 'Customer Support facilitated expansion', core: true },
        { text: 'Cost Management scaled well', core: true },
        { text: 'Expense Integrations adapted', core: true },
      ]},
      { label: 'If NO →', text: 'What created friction?', options: [
        { text: 'Dashboard(s) lacked multi-entity support', core: true },
        { text: 'Service unreliable in new regions', core: true },
        { text: 'No dedicated expansion support', core: true },
        { text: 'Cost structure didn\'t scale', core: true },
        { text: 'Integration required rework', core: true },
      ]},
    ],
    openEnded: { label: 'OPEN-ENDED', text: 'What would make expanding Uber for Business within your organization easier?' },
  },
  /* ─── Expansion / Renewal ─── */
  {
    id: 'CSAT-003', cdj: 'Expansion / Renewal', metric: 'CSAT',
    trigger: 'Semi-annual — offset 3 months from NPS-001',
    questions: [
      { label: 'Q1 — PRIMARY', text: 'How satisfied are you with Uber for Business as a long-term travel and expense solution for your organization?', scale: '0–10 (Very dissatisfied → Very satisfied)' },
    ],
    ranking: {
      label: 'Q2 — DRIVER RANKING',
      text: 'Rank the following by importance to your long-term satisfaction:',
      options: [
        { text: 'Cost Management', core: true },
        { text: 'Ride/Order Reliability', core: true },
        { text: 'Ride/Order Quality', core: true },
        { text: 'Uber for Business Dashboard(s)', core: true },
        { text: 'Commitment to Safety', core: true },
        { text: 'Sustainable Solutions', core: true },
      ],
    },
    scoreLow: {
      label: 'If SCORE ≤ 6 →',
      text: 'What would most impact your renewal decision?',
      options: [
        { text: 'Better cost visibility', core: true },
        { text: 'Improved ride/order reliability', core: true },
        { text: 'Enhanced dashboard reporting', core: true },
        { text: 'Stronger safety commitments', core: true },
        { text: 'More competitive pricing', core: false },
        { text: 'Sustainability reporting', core: true },
      ],
    },
    openEnded: { label: 'OPEN-ENDED', text: 'As you consider renewal, what feedback would you like to share with our team?' },
  },
];

const METRIC_COLORS: Record<string, { bg: string; text: string; sq: string }> = {
  CES:  { bg: '#f3eef9', text: '#7b4f9e', sq: '#7b4f9e' },
  ORS:  { bg: '#e6f5f4', text: '#2a9d8f', sq: '#2a9d8f' },
  CSAT: { bg: '#ebf3fb', text: '#2d6a9f', sq: '#2d6a9f' },
  NPS:  { bg: '#fef3e8', text: '#f4a261', sq: '#f4a261' },
};

/* ─── Sub-components ─── */

function OptionList({ options }: { options: { text: string; core: boolean }[] }) {
  return (
    <ul className="list-none p-0">
      {options.map((o, i) => (
        <li
          key={i}
          className="relative text-[11px] leading-[1.4] py-[2px] pl-[14px]"
          style={{ color: o.core ? 'var(--sf-text)' : 'var(--sf-text2)', fontWeight: o.core ? 500 : 400 }}
        >
          <span className="absolute left-0 text-[9px]" style={{ color: o.core ? '#0d4f8a' : 'var(--sf-text3)' }}>
            {o.core ? '★' : '□'}
          </span>
          {o.text}
        </li>
      ))}
    </ul>
  );
}

function SurveyCard({ survey }: { survey: SurveyDef }) {
  const mc = METRIC_COLORS[survey.metric];
  return (
    <div
      className="rounded-xl p-[14px_16px]"
      style={{
        background: 'var(--sf-white)',
        border: survey.updated ? '1.5px solid #f5c44e' : '1px solid var(--sf-border)',
      }}
    >
      {/* ID + badge */}
      <div className="flex items-center gap-1.5 mb-[5px]">
        <span
          className="inline-block text-[10px] font-semibold py-[2px] px-[10px] rounded-full tracking-[0.03em]"
          style={{ background: mc.bg, color: mc.text }}
        >
          {survey.metric}
        </span>
        <span className="font-mono text-[10px]" style={{ color: 'var(--sf-text3)' }}>{survey.id}</span>
        {survey.updated && (
          <span
            className="inline-block text-[9px] font-semibold py-[1px] px-[7px] rounded-full ml-[6px]"
            style={{ background: '#fdf3e4', color: '#7a4a0a', border: '0.5px solid #f5c44e' }}
          >
            Updated
          </span>
        )}
      </div>

      {/* Trigger */}
      <div className="text-[10px] italic mb-[10px] leading-[1.5]" style={{ color: 'var(--sf-text3)' }}>
        {survey.trigger}
      </div>

      {/* Questions */}
      {survey.questions.map((q, i) => (
        <div key={i} className="mb-[8px]">
          <div className="text-[9px] font-semibold uppercase tracking-[0.07em] mb-[3px]" style={{ color: 'var(--sf-text3)' }}>
            {q.label}
          </div>
          <div className="text-[12px] font-medium leading-[1.5] mb-[2px]" style={{ color: 'var(--sf-text)' }}>
            {q.text}
          </div>
          {q.scale && (
            <div className="text-[11px]" style={{ color: 'var(--sf-text2)' }}>
              Scale: {q.scale}
            </div>
          )}
        </div>
      ))}

      <div className="h-[0.5px] my-[7px]" style={{ background: 'var(--sf-border)' }} />

      {/* Conditional branches */}
      {survey.branches?.map((b, i) => (
        <div key={i} className="rounded-md p-[6px_9px] my-[4px]" style={{ background: 'var(--sf-bg)' }}>
          <div className="text-[9px] font-semibold mb-[3px] leading-[1.4]" style={{ color: 'var(--sf-text3)' }}>
            {b.label} {b.text}
          </div>
          <OptionList options={b.options} />
        </div>
      ))}

      {/* Ranking */}
      {survey.ranking && (
        <>
          <div className="h-[0.5px] my-[7px]" style={{ background: 'var(--sf-border)' }} />
          <div className="rounded-md p-[6px_9px] my-[4px]" style={{ background: 'var(--sf-bg)' }}>
            <div className="text-[9px] font-semibold mb-[3px] leading-[1.4]" style={{ color: 'var(--sf-text3)' }}>
              {survey.ranking.label} — {survey.ranking.text}
            </div>
            <OptionList options={survey.ranking.options} />
          </div>
        </>
      )}

      {/* Score low conditional */}
      {survey.scoreLow && (
        <div className="rounded-md p-[6px_9px] my-[4px]" style={{ background: 'var(--sf-bg)' }}>
          <div className="text-[9px] font-semibold mb-[3px] leading-[1.4]" style={{ color: 'var(--sf-text3)' }}>
            {survey.scoreLow.label} {survey.scoreLow.text}
          </div>
          <OptionList options={survey.scoreLow.options} />
        </div>
      )}

      {/* Open-ended */}
      <div className="rounded-md p-[6px_9px] mt-[6px]" style={{ background: 'var(--sf-bg)' }}>
        <div className="text-[9px] font-semibold uppercase tracking-[0.06em] mb-[2px]" style={{ color: 'var(--sf-text3)' }}>
          {survey.openEnded.label}
        </div>
        <div className="text-[11px] italic leading-[1.5]" style={{ color: 'var(--sf-text2)' }}>
          {survey.openEnded.text}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function SurveyFramework() {
  const [activeStage, setActiveStage] = useState<string>('All');

  const stageLabels = CDJ_STAGES;
  const visibleStages = activeStage === 'All' ? stageLabels : [activeStage];

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        '--sf-bg': '#f7f6f2',
        '--sf-bg2': '#eeecea',
        '--sf-bg3': '#e5e3de',
        '--sf-white': '#fff',
        '--sf-text': '#1c1b18',
        '--sf-text2': '#5c5b56',
        '--sf-text3': '#9c9a94',
        '--sf-border': '#d8d6d0',
        background: 'var(--sf-bg)',
        color: 'var(--sf-text)',
      } as React.CSSProperties}
    >
      {/* ── Header ── */}
      <header className="flex items-end justify-between flex-wrap gap-3" style={{ background: '#000', padding: '24px 36px 20px' }}>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-[6px]" style={{ color: '#555' }}>
            Uber for Business · VoC Program
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em]" style={{ color: '#fff' }}>
            U4B Survey Framework
            <br />
            <span style={{ color: '#06c167' }}>B2B CX Strategy & Insights</span>
          </div>
        </div>
        <div className="flex gap-5 items-end">
          {[{ val: '13', lbl: 'Surveys' }, { val: '6', lbl: 'CDJ Stages' }, { val: '10', lbl: 'Core Drivers' }].map(s => (
            <div key={s.lbl}>
              <div className="text-[20px] font-semibold" style={{ color: '#fff' }}>{s.val}</div>
              <div className="text-[9px] uppercase tracking-[0.08em] mt-[1px]" style={{ color: '#555' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </header>

      {/* ── CDJ Bar ── */}
      <div style={{ background: '#0F4C81', padding: '14px 36px 16px' }}>
        <div className="text-[9px] font-bold uppercase tracking-[0.12em] mb-[10px]" style={{ color: 'rgba(255,255,255,.6)' }}>
          CDJ Stage — select to navigate
        </div>
        <div className="flex items-stretch gap-1">
          {/* All button */}
          <button
            onClick={() => setActiveStage('All')}
            className="text-[11px] font-medium rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center flex-shrink-0 px-[18px] py-[10px] whitespace-nowrap"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              background: activeStage === 'All' ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.12)',
              color: '#fff',
              border: activeStage === 'All' ? '2px solid #fff' : '2px solid transparent',
              lineHeight: '1.35',
            }}
          >
            All
          </button>

          {stageLabels.map((stage, i) => (
            <div key={stage} className="flex items-stretch gap-1" style={{ flex: 1, minWidth: 0 }}>
              <span className="self-center px-[2px] text-[14px] flex-shrink-0" style={{ color: 'rgba(255,255,255,.35)' }}>›</span>
              <button
                onClick={() => setActiveStage(stage)}
                className="text-[11px] font-medium rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center text-center w-full py-[10px] px-[14px]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  background: activeStage === stage ? '#1f7d47' : '#1A6B3C',
                  color: '#fff',
                  border: activeStage === stage ? '2px solid #fff' : '2px solid transparent',
                  lineHeight: '1.35',
                }}
              >
                {stage}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Driver Bar ── */}
      <div className="flex items-center gap-2 flex-wrap" style={{ background: '#0a3d6b', padding: '10px 36px' }}>
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] mr-1 whitespace-nowrap" style={{ color: 'rgba(255,255,255,.5)' }}>
          U4B Core Drivers:
        </span>
        {ALL_DRIVERS.map(d => (
          <span
            key={d}
            className="text-[10px] py-[2px] px-2 rounded-full"
            style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', border: '0.5px solid rgba(255,255,255,.2)' }}
          >
            {d}
          </span>
        ))}
      </div>

      {/* ── Legend Row ── */}
      <div className="flex gap-[18px] flex-wrap items-center" style={{ background: 'var(--sf-bg2)', borderBottom: '1px solid var(--sf-border)', padding: '9px 36px' }}>
        {Object.entries(METRIC_COLORS).map(([m, c]) => (
          <span key={m} className="flex items-center gap-[5px] text-[11px]" style={{ color: 'var(--sf-text2)' }}>
            <span className="w-[10px] h-[10px] rounded-[2px] flex-shrink-0" style={{ background: c.sq }} />
            {m} — {m === 'CES' ? 'effort / friction' : m === 'ORS' ? 'operational reliability' : m === 'CSAT' ? 'satisfaction' : 'relationship / brand trust'}
          </span>
        ))}
        <span className="flex items-center gap-[5px] text-[11px]" style={{ color: 'var(--sf-text2)' }}>
          <span className="text-[9px]" style={{ color: '#0d4f8a' }}>★</span> U4B core driver
        </span>
        <span className="flex items-center gap-[5px] text-[11px]" style={{ color: 'var(--sf-text2)' }}>
          <span className="text-[9px]" style={{ color: 'var(--sf-text3)' }}>□</span> Contextual option
        </span>
        <span className="flex items-center gap-[5px] text-[11px] font-semibold" style={{ color: '#7a4a0a' }}>
          <span className="w-[10px] h-[10px] rounded-[2px] flex-shrink-0" style={{ background: '#f5c44e' }} />
          Updated
        </span>
      </div>

      {/* ── Stage Panels ── */}
      {visibleStages.map(stage => {
        const meta = STAGE_META[stage];
        const stageSurveys = SURVEYS.filter(s => s.cdj === stage);
        return (
          <div key={stage} style={{ padding: '20px 36px 48px' }}>
            {/* Stage meta bar */}
            <div
              className="rounded-lg flex items-center gap-3 flex-wrap mb-[14px]"
              style={{ background: 'var(--sf-white)', border: '1px solid var(--sf-border)', padding: '9px 14px' }}
            >
              <span className="text-[11px]" style={{ color: 'var(--sf-text2)' }}>
                <span className="text-[10px] uppercase tracking-[0.04em] font-medium mr-[5px]" style={{ color: 'var(--sf-text3)' }}>Stage:</span>
                {stage}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--sf-text2)' }}>
                <span className="text-[10px] uppercase tracking-[0.04em] font-medium mr-[5px]" style={{ color: 'var(--sf-text3)' }}>Timing:</span>
                {meta.timing}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--sf-text2)' }}>
                <span className="text-[10px] uppercase tracking-[0.04em] font-medium mr-[5px]" style={{ color: 'var(--sf-text3)' }}>Surveys:</span>
                {stageSurveys.length}
              </span>
              <span
                className="text-[10px] font-semibold py-[2px] px-[9px] rounded-full"
                style={{ background: meta.riskBg, color: meta.riskColor }}
              >
                {meta.risk}
              </span>
            </div>

            {/* Active drivers */}
            <div className="flex flex-wrap gap-1 items-center mb-[14px]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] mr-1" style={{ color: 'var(--sf-text3)' }}>
                Active Drivers:
              </span>
              {meta.drivers.map(d => (
                <span
                  key={d}
                  className="text-[10px] py-[2px] px-[9px] rounded-full"
                  style={{ border: '0.5px solid #B5D4F4', background: '#e8f2fc', color: '#0d4f8a' }}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Survey grid */}
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}
            >
              {stageSurveys.map(s => <SurveyCard key={s.id} survey={s} />)}
            </div>
          </div>
        );
      })}

      {/* ── Footer ── */}
      <footer
        className="flex justify-between items-center flex-wrap gap-2 mt-3"
        style={{ background: '#000', padding: '16px 36px' }}
      >
        <span className="text-[10px]" style={{ color: '#444' }}>
          U4B Survey Framework · B2B CX Strategy & Insights · v3 (13 surveys)
        </span>
        <span className="font-mono text-[9px] tracking-[0.06em]" style={{ color: '#333' }}>
          CDJ × SURVEY FRAMEWORK × DRIVER MAPPING
        </span>
      </footer>
    </div>
  );
}
