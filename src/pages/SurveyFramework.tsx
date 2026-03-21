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
  label: string;
  text: string;
  scale?: string;
}

interface CondBranch {
  label: string;
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

const STAGE_META: Record<string, { timing: string; risk: string; riskLevel: 'critical' | 'high' | 'medium' | 'low'; drivers: string[] }> = {
  'Consideration / Evaluation': {
    timing: 'Pre-sale · 2h–72h post-touchpoint',
    risk: 'Medium', riskLevel: 'medium',
    drivers: ['Signing Up', 'Cost Management', 'Expense Integrations', 'Customer Support', 'Uber for Business Dashboard(s)', 'Commitment to Safety'],
  },
  'Purchase': {
    timing: 'Contract execution · 2h post-signature',
    risk: 'Low', riskLevel: 'low',
    drivers: ['Billing and Invoicing', 'Signing Up', 'Cost Management', 'Customer Support'],
  },
  'Onboarding': {
    timing: 'First 14 days · setup & config',
    risk: 'High', riskLevel: 'high',
    drivers: ['Signing Up', 'Uber for Business Dashboard(s)', 'Expense Integrations', 'Customer Support', 'Billing and Invoicing'],
  },
  'Adoption / Product Use': {
    timing: '30–90 days · active usage period',
    risk: 'High', riskLevel: 'high',
    drivers: ['Ride/Order Reliability', 'Ride/Order Quality', 'Commitment to Safety', 'Uber for Business Dashboard(s)', 'Cost Management', 'Billing and Invoicing', 'Expense Integrations', 'Customer Support'],
  },
  'Value / Expansion': {
    timing: '6+ months · QBR cadence · expansion milestones',
    risk: 'Medium', riskLevel: 'medium',
    drivers: ['Cost Management', 'Uber for Business Dashboard(s)', 'Billing and Invoicing', 'Expense Integrations', 'Customer Support', 'Sustainable Solutions', 'Ride/Order Reliability'],
  },
  'Expansion / Renewal': {
    timing: 'Semi-annual · offset from NPS',
    risk: 'Critical', riskLevel: 'critical',
    drivers: ['Cost Management', 'Ride/Order Reliability', 'Ride/Order Quality', 'Uber for Business Dashboard(s)', 'Commitment to Safety', 'Sustainable Solutions'],
  },
};

const RISK_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: '#E63946', text: '#FFFFFF' },
  high: { bg: '#FEECEE', text: '#E63946' },
  medium: { bg: '#FEF3E8', text: '#F4A261' },
  low: { bg: '#E8F9F0', text: '#028A47' },
};

const METRIC_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  CES:  { bg: '#F3EEF9', text: '#7B4F9E', accent: '#7B4F9E' },
  ORS:  { bg: '#E6F5F4', text: '#2A9D8F', accent: '#2A9D8F' },
  CSAT: { bg: '#EBF3FB', text: '#2D6A9F', accent: '#2D6A9F' },
  NPS:  { bg: '#FEF3E8', text: '#F4A261', accent: '#F4A261' },
};

const SURVEYS: SurveyDef[] = [
  { id: 'CES-001', cdj: 'Consideration / Evaluation', metric: 'CES', trigger: '2h after first demo or sales touchpoint', questions: [{ label: 'Q1 — PRIMARY', text: 'The demo and/or account rep made it easy to evaluate whether Uber for Business is the right solution for our organization.', scale: 'Yes / No / Unsure' }], branches: [{ label: 'If YES →', text: 'What made evaluation easy? Select all that apply.', options: [{ text: 'Clear pricing structure', core: false }, { text: 'Signing Up process was simple', core: true }, { text: 'Cost Management tools were demonstrated', core: true }, { text: 'Expense Integrations were shown', core: true }, { text: 'Customer Support was responsive', core: true }, { text: 'Competitive comparison was helpful', core: false }] }, { label: 'If NO →', text: 'What made evaluation difficult? Select all that apply.', options: [{ text: 'Pricing was unclear', core: false }, { text: 'Signing Up had friction', core: true }, { text: 'Cost Management capabilities were unclear', core: true }, { text: 'Integration requirements not addressed', core: true }, { text: 'Response time too slow', core: true }] }], openEnded: { label: 'OPEN-ENDED', text: 'Is there anything else you\'d like to share about your evaluation experience?' } },
  { id: 'CES-002', cdj: 'Consideration / Evaluation', metric: 'CES', updated: true, trigger: '24h after pilot completion or final demo', questions: [{ label: 'Q1 — PRIMARY', text: 'It was easy to complete our pilot and evaluation of Uber for Business with our internal stakeholders.', scale: 'Yes / No / Unsure' }], branches: [{ label: 'If YES →', text: 'Which aspects worked well during the pilot?', options: [{ text: 'Uber for Business Dashboard(s) were intuitive', core: true }, { text: 'Expense Integrations worked smoothly', core: true }, { text: 'Cost Management was transparent', core: true }, { text: 'Safety features met requirements', core: true }, { text: 'Customer Support was proactive', core: true }, { text: 'Internal stakeholder buy-in was easy', core: false }] }, { label: 'If NO →', text: 'What challenges did you encounter?', options: [{ text: 'Dashboard(s) were confusing', core: true }, { text: 'Integration setup was complex', core: true }, { text: 'Cost visibility was limited', core: true }, { text: 'Safety documentation was insufficient', core: true }, { text: 'Support was hard to reach', core: true }] }], openEnded: { label: 'OPEN-ENDED', text: 'What would have made the pilot process smoother?' } },
  { id: 'ORS-001', cdj: 'Consideration / Evaluation', metric: 'ORS', trigger: '72h after pilot completion', questions: [{ label: 'Q1 — PRIMARY', text: 'Does Uber for Business consistently deliver a dependable evaluation and onboarding commitment experience to you?', scale: 'Yes / No / Unsure' }], branches: [{ label: 'If YES →', text: 'Which elements felt most reliable?', options: [{ text: 'Uber for Business Dashboard(s) uptime', core: true }, { text: 'Expense Integrations connectivity', core: true }, { text: 'Cost Management accuracy', core: true }, { text: 'Commitment to Safety standards', core: true }, { text: 'Customer Support follow-through', core: true }] }, { label: 'If NO →', text: 'Where did reliability fall short?', options: [{ text: 'Dashboard(s) had errors or downtime', core: true }, { text: 'Integration data was inconsistent', core: true }, { text: 'Cost reports were delayed', core: true }, { text: 'Safety commitments were vague', core: true }, { text: 'Support response was inconsistent', core: true }] }], openEnded: { label: 'OPEN-ENDED', text: 'Please describe any reliability concerns from your evaluation period.' } },
  { id: 'CES-003', cdj: 'Purchase', metric: 'CES', trigger: '2h after contract execution', questions: [{ label: 'Q1 — PRIMARY', text: 'It was easy to finalize our contract and billing setup with Uber for Business.', scale: 'Yes / No / Unsure' }], branches: [{ label: 'If YES →', text: 'What went smoothly?', options: [{ text: 'Billing and Invoicing setup was clear', core: true }, { text: 'Signing Up was straightforward', core: true }, { text: 'Cost Management terms were transparent', core: true }, { text: 'Customer Support guided the process', core: true }, { text: 'Contract terms were fair', core: false }] }, { label: 'If NO →', text: 'What caused friction?', options: [{ text: 'Billing setup was confusing', core: true }, { text: 'Account creation had issues', core: true }, { text: 'Pricing structure was unclear', core: true }, { text: 'Support was unavailable', core: true }, { text: 'Legal review took too long', core: false }] }], openEnded: { label: 'OPEN-ENDED', text: 'Any feedback on the contracting and billing setup process?' } },
  { id: 'CES-004', cdj: 'Onboarding', metric: 'CES', trigger: '3 days after first admin login', questions: [{ label: 'Q1 — PRIMARY', text: 'It was easy to set up and configure Uber for Business for our organization.', scale: 'Yes / No / Unsure' }], branches: [{ label: 'If YES →', text: 'What was easiest to configure?', options: [{ text: 'Signing Up employees', core: true }, { text: 'Uber for Business Dashboard(s) navigation', core: true }, { text: 'Expense Integrations setup', core: true }, { text: 'Customer Support onboarding calls', core: true }, { text: 'Billing and Invoicing configuration', core: true }, { text: 'Policy creation', core: false }] }, { label: 'If NO →', text: 'Where did you get stuck?', options: [{ text: 'Employee enrollment was difficult', core: true }, { text: 'Dashboard(s) were hard to navigate', core: true }, { text: 'Integration setup failed', core: true }, { text: 'No onboarding support available', core: true }, { text: 'Billing config was confusing', core: true }] }], openEnded: { label: 'OPEN-ENDED', text: 'What would improve the initial setup experience?' } },
  { id: 'CSAT-001', cdj: 'Onboarding', metric: 'CSAT', updated: true, trigger: '14 days after full onboarding completion', questions: [{ label: 'Q1 — PRIMARY', text: 'How satisfied are you with your onboarding and implementation experience with Uber for Business?', scale: '0–10 (Very dissatisfied → Very satisfied)' }], ranking: { label: 'Q2 — DRIVER RANKING', text: 'Rank the following by importance to your onboarding experience:', options: [{ text: 'Signing Up', core: true }, { text: 'Uber for Business Dashboard(s)', core: true }, { text: 'Expense Integrations', core: true }, { text: 'Customer Support', core: true }, { text: 'Documentation quality', core: false }] }, scoreLow: { label: 'If SCORE ≤ 6 →', text: 'What would most improve your onboarding satisfaction?', options: [{ text: 'Better onboarding documentation', core: false }, { text: 'Dedicated implementation manager', core: false }, { text: 'Faster Dashboard(s) setup', core: true }, { text: 'Simpler Expense Integration', core: true }, { text: 'More responsive Support', core: true }] }, openEnded: { label: 'OPEN-ENDED', text: 'Please share any details about your onboarding experience — what worked and what didn\'t.' } },
  { id: 'CES-005', cdj: 'Adoption / Product Use', metric: 'CES', trigger: '30 days post-program launch', questions: [{ label: 'Q1 — PRIMARY', text: 'It was easy for our employees to adopt and use Uber for Business within our organization\u2019s travel and expense policy.', scale: 'Yes / No / Unsure' }], branches: [{ label: 'If YES →', text: 'What drove adoption success?', options: [{ text: 'Ride/Order Reliability was strong', core: true }, { text: 'Ride/Order Quality met expectations', core: true }, { text: 'Commitment to Safety was clear', core: true }, { text: 'Dashboard(s) made management easy', core: true }, { text: 'Cost Management was transparent', core: true }, { text: 'Employees found it intuitive', core: false }] }, { label: 'If NO →', text: 'What blocked adoption?', options: [{ text: 'Rides/Orders were unreliable', core: true }, { text: 'Quality issues with rides/orders', core: true }, { text: 'Safety concerns from employees', core: true }, { text: 'Dashboard(s) were hard to use', core: true }, { text: 'Cost visibility was poor', core: true }] }], openEnded: { label: 'OPEN-ENDED', text: 'What would help drive higher employee adoption?' } },
  { id: 'CSAT-002', cdj: 'Adoption / Product Use', metric: 'CSAT', trigger: '48h after billing cycle closes — ongoing', questions: [{ label: 'Q1 — PRIMARY', text: 'How satisfied are you with your billing and invoicing experience with Uber for Business?', scale: '0–10 (Very dissatisfied → Very satisfied)' }], ranking: { label: 'Q2 — DRIVER RANKING', text: 'Rank the following by impact on your billing satisfaction:', options: [{ text: 'Billing and Invoicing clarity', core: true }, { text: 'Cost Management accuracy', core: true }, { text: 'Expense Integrations reliability', core: true }, { text: 'Customer Support for billing issues', core: true }, { text: 'Invoice delivery timeliness', core: false }] }, scoreLow: { label: 'If SCORE ≤ 6 →', text: 'What billing aspect needs the most improvement?', options: [{ text: 'Invoice accuracy', core: true }, { text: 'Cost breakdown detail', core: true }, { text: 'Integration with our expense system', core: true }, { text: 'Dispute resolution speed', core: true }, { text: 'Payment method flexibility', core: false }] }, openEnded: { label: 'OPEN-ENDED', text: 'Please describe any billing or invoicing issues in detail.' } },
  { id: 'ORS-002', cdj: 'Adoption / Product Use', metric: 'ORS', trigger: '90 days post-program launch', questions: [{ label: 'Q1 — PRIMARY', text: 'Has Uber for Business delivered a dependable platform experience to your employees up to this point?', scale: 'Yes / No / Unsure' }], branches: [{ label: 'If YES →', text: 'Which reliability factors stood out?', options: [{ text: 'Ride/Order Reliability', core: true }, { text: 'Ride/Order Quality consistency', core: true }, { text: 'Dashboard(s) uptime', core: true }, { text: 'Cost Management data accuracy', core: true }, { text: 'Commitment to Safety performance', core: true }] }, { label: 'If NO →', text: 'Where has reliability been an issue?', options: [{ text: 'Frequent ride/order failures', core: true }, { text: 'Inconsistent ride/order quality', core: true }, { text: 'Dashboard outages or lag', core: true }, { text: 'Cost data discrepancies', core: true }, { text: 'Safety incident handling', core: true }] }], openEnded: { label: 'OPEN-ENDED', text: 'Please share specifics about any platform reliability concerns.' } },
  { id: 'ORS-003', cdj: 'Value / Expansion', metric: 'ORS', trigger: 'Quarterly — aligned to QBR cadence', questions: [{ label: 'Q1 — PRIMARY', text: 'Does Uber for Business consistently deliver a dependable reporting and spend visibility experience to your organization?', scale: 'Yes / No / Unsure' }], branches: [{ label: 'If YES →', text: 'Which reporting capabilities are most valuable?', options: [{ text: 'Uber for Business Dashboard(s) reporting', core: true }, { text: 'Billing and Invoicing transparency', core: true }, { text: 'Expense Integrations data flow', core: true }, { text: 'Cost Management analytics', core: true }, { text: 'Customer Support for data requests', core: true }] }, { label: 'If NO →', text: 'Where is reporting falling short?', options: [{ text: 'Dashboard(s) lack needed reports', core: true }, { text: 'Invoice data is incomplete', core: true }, { text: 'Integration data is delayed', core: true }, { text: 'Cost visibility is insufficient', core: true }, { text: 'Support can\'t provide custom reports', core: true }] }], openEnded: { label: 'OPEN-ENDED', text: 'What reporting or visibility improvements would add the most value?' } },
  { id: 'NPS-001', cdj: 'Value / Expansion', metric: 'NPS', updated: true, trigger: '6 months after onboarding — semi-annual', questions: [{ label: 'Q1 — PRIMARY', text: 'How likely are you to recommend Uber for Business to a colleague or someone in your network?', scale: '0–10 (Not at all → Extremely likely)' }], ranking: { label: 'Q2 — DRIVER RANKING', text: 'Rank the following by their influence on your recommendation:', options: [{ text: 'Cost Management', core: true }, { text: 'Uber for Business Dashboard(s)', core: true }, { text: 'Billing and Invoicing', core: true }, { text: 'Expense Integrations', core: true }, { text: 'Customer Support', core: true }, { text: 'Sustainable Solutions', core: true }] }, scoreLow: { label: 'If SCORE ≤ 6 →', text: 'What is the primary reason for your score?', options: [{ text: 'Cost Management limitations', core: true }, { text: 'Dashboard functionality gaps', core: true }, { text: 'Billing issues', core: true }, { text: 'Integration problems', core: true }, { text: 'Support responsiveness', core: true }, { text: 'Better alternatives exist', core: false }] }, openEnded: { label: 'OPEN-ENDED', text: 'What is the single most important thing we could do to improve your experience?' } },
  { id: 'CES-006', cdj: 'Value / Expansion', metric: 'CES', trigger: '5 days after expansion milestone', questions: [{ label: 'Q1 — PRIMARY', text: 'It was easy to expand Uber for Business to additional teams, regions, or use cases within our organization.', scale: 'Yes / No / Unsure' }], branches: [{ label: 'If YES →', text: 'What made expansion easy?', options: [{ text: 'Dashboard(s) supported multi-team setup', core: true }, { text: 'Ride/Order Reliability in new regions', core: true }, { text: 'Customer Support facilitated expansion', core: true }, { text: 'Cost Management scaled well', core: true }, { text: 'Expense Integrations adapted', core: true }] }, { label: 'If NO →', text: 'What created friction?', options: [{ text: 'Dashboard(s) lacked multi-entity support', core: true }, { text: 'Service unreliable in new regions', core: true }, { text: 'No dedicated expansion support', core: true }, { text: 'Cost structure didn\'t scale', core: true }, { text: 'Integration required rework', core: true }] }], openEnded: { label: 'OPEN-ENDED', text: 'What would make expanding Uber for Business within your organization easier?' } },
  { id: 'CSAT-003', cdj: 'Expansion / Renewal', metric: 'CSAT', trigger: 'Semi-annual — offset 3 months from NPS-001', questions: [{ label: 'Q1 — PRIMARY', text: 'How satisfied are you with Uber for Business as a long-term travel and expense solution for your organization?', scale: '0–10 (Very dissatisfied → Very satisfied)' }], ranking: { label: 'Q2 — DRIVER RANKING', text: 'Rank the following by importance to your long-term satisfaction:', options: [{ text: 'Cost Management', core: true }, { text: 'Ride/Order Reliability', core: true }, { text: 'Ride/Order Quality', core: true }, { text: 'Uber for Business Dashboard(s)', core: true }, { text: 'Commitment to Safety', core: true }, { text: 'Sustainable Solutions', core: true }] }, scoreLow: { label: 'If SCORE ≤ 6 →', text: 'What would most impact your renewal decision?', options: [{ text: 'Better cost visibility', core: true }, { text: 'Improved ride/order reliability', core: true }, { text: 'Enhanced dashboard reporting', core: true }, { text: 'Stronger safety commitments', core: true }, { text: 'More competitive pricing', core: false }, { text: 'Sustainability reporting', core: true }] }, openEnded: { label: 'OPEN-ENDED', text: 'As you consider renewal, what feedback would you like to share with our team?' } },
];

/* ─── Sub-components ─── */

function OptionList({ options }: { options: { text: string; core: boolean }[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {options.map((item, i) => (
        <li
          key={i}
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {item.core ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '2px 0' }}>
              <span style={{ color: '#2D6A9F', fontSize: 10, flexShrink: 0, marginTop: 1 }}>★</span>
              <span className="text-[11px] leading-[1.4] font-medium text-uber-black">{item.text}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '2px 0' }}>
              <span style={{ color: '#AAAAAA', fontSize: 9, flexShrink: 0, marginTop: 2 }}>□</span>
              <span className="text-[11px] leading-[1.4] text-uber-ink-3">{item.text}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function SurveyCard({ survey }: { survey: SurveyDef }) {
  const mc = METRIC_COLORS[survey.metric];
  return (
    <div
      data-survey-card
      className={`survey-card bg-white rounded-2xl relative overflow-hidden transition-all duration-200 hover:border-[#D0D0D0] hover:scale-[1.005] active:scale-[0.98] ${
        survey.updated ? 'border-[1.5px] border-[#06C167]' : 'border border-[#EBEBEB]'
      }`}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: mc.accent }} />

      <div className="px-4 pt-5 pb-4">
        {/* ID + badge */}
        <div className="flex items-center gap-1.5 mb-[5px]">
          <span
            className="inline-block text-[10px] font-semibold py-[2px] px-[10px] rounded-full tracking-[0.03em] font-mono"
            style={{ background: mc.bg, color: mc.text }}
          >
            {survey.metric}
          </span>
          <span className="font-mono text-[10px] text-uber-ink-3">{survey.id}</span>
          {survey.updated && (
            <span className="inline-block text-[9px] font-semibold py-[1px] px-[7px] rounded-full ml-1.5 bg-[#E8F9F0] text-[#028A47] border border-[#06C167]/30">
              Updated
            </span>
          )}
        </div>

        {/* Trigger */}
        <div className="text-[10px] italic mb-2.5 leading-[1.5] text-uber-ink-3 font-body">
          {survey.trigger}
        </div>

        {/* Questions */}
        {survey.questions.map((q, i) => (
          <div key={i} className="mb-2">
            <div className="text-[9px] font-semibold uppercase tracking-[0.07em] mb-[3px] text-uber-ink-3 font-mono">
              {q.label}
            </div>
            <div className="text-[12px] font-medium leading-[1.5] mb-[2px] text-uber-black font-body">
              {q.text}
            </div>
            {q.scale && (
              <div className="text-[11px] text-uber-ink-3 font-mono">
                Scale: {q.scale}
              </div>
            )}
          </div>
        ))}

        <div className="h-px my-[7px] bg-[#F6F6F6]" />

        {/* Conditional branches */}
        {survey.branches?.map((b, i) => (
          <div key={i} className="rounded-lg p-[6px_9px] my-1 bg-[#F6F6F6]">
            <div className="text-[9px] font-semibold mb-[3px] leading-[1.4] text-uber-ink-3 font-mono">
              {b.label} {b.text}
            </div>
            <OptionList options={b.options} />
          </div>
        ))}

        {/* Ranking */}
        {survey.ranking && (
          <>
            <div className="h-px my-[7px] bg-[#F6F6F6]" />
            <div className="rounded-lg p-[6px_9px] my-1 bg-[#F6F6F6]">
              <div className="text-[9px] font-semibold mb-[3px] leading-[1.4] text-uber-ink-3 font-mono">
                {survey.ranking.label} — {survey.ranking.text}
              </div>
              <OptionList options={survey.ranking.options} />
            </div>
          </>
        )}

        {/* Score low conditional */}
        {survey.scoreLow && (
          <div className="rounded-lg p-[6px_9px] my-1 bg-[#F6F6F6]">
            <div className="text-[9px] font-semibold mb-[3px] leading-[1.4] text-uber-ink-3 font-mono">
              {survey.scoreLow.label} {survey.scoreLow.text}
            </div>
            <OptionList options={survey.scoreLow.options} />
          </div>
        )}

        {/* Open-ended */}
        <div className="rounded-lg p-[6px_9px] mt-1.5 bg-[#F6F6F6]">
          <div className="text-[9px] font-semibold uppercase tracking-[0.06em] mb-[2px] text-uber-ink-3 font-mono">
            {survey.openEnded.label}
          </div>
          <div className="text-[11px] italic leading-[1.5] text-uber-ink-3 font-body">
            {survey.openEnded.text}
          </div>
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
    <div className="min-h-screen bg-white">
      {/* ── Header Banner (black, matches VoC Synthesis) ── */}
      <div className="bg-uber-black w-full px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-[28px] font-bold text-white">U4B Survey Framework</h1>
            <p className="font-mono text-xs text-uber-ink-3 mt-1">
              13 surveys · 6 CDJ stages · 4 metric types · 10 core drivers
            </p>
          </div>
          <div className="flex gap-5 items-end">
            {[{ val: '13', lbl: 'Surveys' }, { val: '6', lbl: 'CDJ Stages' }, { val: '10', lbl: 'Core Drivers' }].map(s => (
              <div key={s.lbl}>
                <div className="text-[20px] font-semibold text-white font-body">{s.val}</div>
                <div className="text-[9px] uppercase tracking-[0.08em] mt-[1px] text-uber-ink-3 font-mono">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CDJ Stage Navigation Bar ── */}
      <div className="bg-uber-black border-t border-[#222] w-full px-6 pb-4 pt-2">
        <div className="max-w-7xl mx-auto">
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] mb-2.5 text-uber-ink-3 font-mono">
            CDJ Stage — select to navigate
          </div>
          <div className="flex items-stretch gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveStage('All')}
              className="text-[11px] font-medium rounded-full cursor-pointer transition-all duration-150 active:scale-95 flex-shrink-0 px-4 py-2 whitespace-nowrap font-body"
              style={{
                background: activeStage === 'All' ? '#06C167' : '#333',
                color: activeStage === 'All' ? '#fff' : '#717171',
              }}
            >
              All
            </button>
            {stageLabels.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1.5">
                <span className="text-[10px] text-uber-ink-3 font-mono">›</span>
                <button
                  onClick={() => setActiveStage(stage)}
                  className="text-[11px] font-medium rounded-full cursor-pointer transition-all duration-150 active:scale-95 px-3 py-2 font-body"
                  style={{
                    background: activeStage === stage ? '#06C167' : '#333',
                    color: activeStage === stage ? '#fff' : '#717171',
                  }}
                >
                  {stage}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* ── Legend Row ── */}
      <div className="bg-[#F6F6F6] border-b border-[#EBEBEB] w-full px-6 py-2">
        <div className="max-w-7xl mx-auto flex gap-4 flex-wrap items-center">
          {Object.entries(METRIC_COLORS).map(([m, c]) => (
            <span key={m} className="flex items-center gap-1.5 text-[11px] text-uber-ink-3 font-body">
              <span className="w-2.5 h-2.5 rounded-[2px] flex-shrink-0" style={{ background: c.accent }} />
              {m} — {m === 'CES' ? 'effort / friction' : m === 'ORS' ? 'operational reliability' : m === 'CSAT' ? 'satisfaction' : 'relationship / brand trust'}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[11px] text-uber-ink-3 font-body">
            <span className="text-[9px] text-[#06C167]">★</span> U4B core driver
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-uber-ink-3 font-body">
            <span className="text-[9px] text-uber-ink-3">□</span> Contextual option
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#028A47] font-body">
            <span className="w-2.5 h-2.5 rounded-[2px] flex-shrink-0 bg-[#06C167]" />
            Updated
          </span>
        </div>
      </div>

      {/* ── Stage Panels ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-10">
        {visibleStages.map(stage => {
          const meta = STAGE_META[stage];
          const rs = RISK_STYLES[meta.riskLevel];
          const stageSurveys = SURVEYS.filter(s => s.cdj === stage);
          return (
            <div key={stage}>
              {/* Stage meta bar */}
              <div className="bg-white border border-[#EBEBEB] rounded-2xl flex items-center gap-3 flex-wrap mb-3 px-4 py-2.5">
                <span className="text-[11px] text-uber-ink-2 font-body">
                  <span className="text-[10px] uppercase tracking-[0.04em] font-medium mr-1 text-uber-ink-3 font-mono">Stage:</span>
                  {stage}
                </span>
                <span className="text-[11px] text-uber-ink-2 font-body">
                  <span className="text-[10px] uppercase tracking-[0.04em] font-medium mr-1 text-uber-ink-3 font-mono">Timing:</span>
                  {meta.timing}
                </span>
                <span className="text-[11px] text-uber-ink-2 font-body">
                  <span className="text-[10px] uppercase tracking-[0.04em] font-medium mr-1 text-uber-ink-3 font-mono">Surveys:</span>
                  {stageSurveys.length}
                </span>
                <span
                  className="text-[10px] font-semibold py-[2px] px-2.5 rounded-full font-mono"
                  style={{ background: rs.bg, color: rs.text }}
                >
                  {meta.risk}
                </span>
              </div>

              {/* Active drivers */}
              <div className="flex flex-wrap gap-1 items-center mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] mr-1 text-uber-ink-3 font-mono">
                  Active Drivers:
                </span>
                {meta.drivers.map(d => (
                  <span
                    key={d}
                    className="text-[10px] py-[2px] px-2 rounded-full font-mono bg-[#E8F9F0] text-[#028A47] border border-[#06C167]/20"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Survey grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {stageSurveys.map(s => <SurveyCard key={s.id} survey={s} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-uber-black flex justify-between items-center flex-wrap gap-2 mt-3 px-6 py-4">
        <span className="text-[10px] text-uber-ink-3 font-body">
          U4B Survey Framework · B2B CX Strategy & Insights · v3 (13 surveys)
        </span>
        <span className="font-mono text-[9px] tracking-[0.06em] text-[#333]">
          CDJ × SURVEY FRAMEWORK × DRIVER MAPPING
        </span>
      </footer>
    </div>
  );
}
