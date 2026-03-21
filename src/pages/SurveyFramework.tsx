import { useState } from 'react';
import { CDJ_STAGES } from '@/types/voc';

interface SurveyDef {
  id: string;
  stage: string;
  type: 'CES' | 'ORS' | 'CSAT' | 'NPS';
  trigger: string;
  question: string;
  scale: 'yes-no' | '0-10';
  drivers: string[];
}

const SURVEYS: SurveyDef[] = [
  { id: 'CES-001', stage: 'Consideration / Evaluation', type: 'CES', trigger: '2h after first demo or sales touchpoint', question: 'The demo and/or account rep made it easy to evaluate whether Uber for Business is the right solution for our organization.', scale: 'yes-no', drivers: ['Signing Up', 'Cost Management', 'Expense Integrations', 'Customer Support'] },
  { id: 'CES-002', stage: 'Consideration / Evaluation', type: 'CES', trigger: '24h after pilot completion or final demo', question: 'It was easy to complete our pilot and evaluation of Uber for Business with our internal stakeholders.', scale: 'yes-no', drivers: ['Uber for Business Dashboard(s)', 'Expense Integrations', 'Cost Management', 'Commitment to Safety', 'Customer Support'] },
  { id: 'ORS-001', stage: 'Consideration / Evaluation', type: 'ORS', trigger: '72h after pilot completion', question: 'Does Uber for Business consistently deliver a dependable evaluation and onboarding commitment experience to you?', scale: 'yes-no', drivers: ['Uber for Business Dashboard(s)', 'Expense Integrations', 'Cost Management', 'Commitment to Safety', 'Customer Support'] },
  { id: 'CES-003', stage: 'Purchase', type: 'CES', trigger: '2h after contract execution', question: 'It was easy to finalize our contract and billing setup with Uber for Business.', scale: 'yes-no', drivers: ['Billing and Invoicing', 'Signing Up', 'Cost Management', 'Customer Support'] },
  { id: 'CES-004', stage: 'Onboarding', type: 'CES', trigger: '3 days after first admin login', question: 'It was easy to set up and configure Uber for Business for our organization.', scale: 'yes-no', drivers: ['Signing Up', 'Uber for Business Dashboard(s)', 'Expense Integrations', 'Customer Support', 'Billing and Invoicing'] },
  { id: 'CSAT-001', stage: 'Onboarding', type: 'CSAT', trigger: '14 days after full onboarding completion', question: 'How satisfied are you with your onboarding and implementation experience with Uber for Business?', scale: '0-10', drivers: ['Signing Up', 'Uber for Business Dashboard(s)', 'Expense Integrations', 'Customer Support'] },
  { id: 'CES-005', stage: 'Adoption / Product Use', type: 'CES', trigger: '30 days post-program launch', question: 'It was easy for our employees to adopt and use Uber for Business within our organization\'s travel and expense policy.', scale: 'yes-no', drivers: ['Ride/Order Reliability', 'Ride/Order Quality', 'Commitment to Safety', 'Uber for Business Dashboard(s)', 'Cost Management'] },
  { id: 'CSAT-002', stage: 'Adoption / Product Use', type: 'CSAT', trigger: '48h after billing cycle closes — ongoing', question: 'How satisfied are you with your billing and invoicing experience with Uber for Business?', scale: '0-10', drivers: ['Billing and Invoicing', 'Cost Management', 'Expense Integrations', 'Customer Support'] },
  { id: 'ORS-002', stage: 'Adoption / Product Use', type: 'ORS', trigger: '90 days post-program launch', question: 'Has Uber for Business delivered a dependable platform experience to your employees up to this point?', scale: 'yes-no', drivers: ['Ride/Order Reliability', 'Ride/Order Quality', 'Uber for Business Dashboard(s)', 'Cost Management', 'Commitment to Safety'] },
  { id: 'ORS-003', stage: 'Value / Expansion', type: 'ORS', trigger: 'Quarterly — aligned to QBR cadence', question: 'Does Uber for Business consistently deliver a dependable reporting and spend visibility experience to your organization?', scale: 'yes-no', drivers: ['Uber for Business Dashboard(s)', 'Billing and Invoicing', 'Expense Integrations', 'Cost Management', 'Customer Support'] },
  { id: 'NPS-001', stage: 'Value / Expansion', type: 'NPS', trigger: '6 months after onboarding — semi-annual', question: 'How likely are you to recommend Uber for Business to a colleague or someone in your network?', scale: '0-10', drivers: ['Cost Management', 'Uber for Business Dashboard(s)', 'Billing and Invoicing', 'Expense Integrations', 'Customer Support', 'Sustainable Solutions'] },
  { id: 'CES-006', stage: 'Value / Expansion', type: 'CES', trigger: '5 days after expansion milestone', question: 'It was easy to expand Uber for Business to additional teams, regions, or use cases within our organization.', scale: 'yes-no', drivers: ['Uber for Business Dashboard(s)', 'Ride/Order Reliability', 'Customer Support', 'Cost Management', 'Expense Integrations'] },
  { id: 'CSAT-003', stage: 'Expansion / Renewal', type: 'CSAT', trigger: 'Semi-annual — offset 3 months from NPS-001', question: 'How satisfied are you with Uber for Business as a long-term travel and expense solution for your organization?', scale: '0-10', drivers: ['Cost Management', 'Ride/Order Reliability', 'Ride/Order Quality', 'Uber for Business Dashboard(s)', 'Commitment to Safety', 'Sustainable Solutions'] },
];

const TYPE_COLORS: Record<string, string> = {
  CES: '#7B4F9E', ORS: '#2A9D8F', CSAT: '#2D6A9F', NPS: '#F4A261',
};

export default function SurveyFramework() {
  const [selectedStage, setSelectedStage] = useState('All');

  const filtered = selectedStage === 'All' ? SURVEYS : SURVEYS.filter(s => s.stage === selectedStage);

  return (
    <div className="min-h-screen bg-white">
      {/* CDJ Filter */}
      <div className="bg-uber-black w-full px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="font-mono text-[10px] text-uber-ink-3 uppercase tracking-wider mb-2">CDJ Stage</div>
          <div className="flex flex-wrap gap-2">
            {['All', ...CDJ_STAGES].map((stage, i) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`rounded-pill px-4 py-1.5 font-body text-xs transition-colors ${
                  selectedStage === stage ? 'bg-uber-green text-white' : 'bg-uber-ink-2 text-uber-ink-3'
                }`}
              >
                {i > 0 && <span className="text-uber-ink-3 mr-2">›</span>}
                {stage}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(survey => (
            <SurveyCard key={survey.id} survey={survey} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SurveyCard({ survey }: { survey: SurveyDef }) {
  const color = TYPE_COLORS[survey.type];
  return (
    <div className="card-uber p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="rounded-pill px-2 py-0.5 text-[10px] font-mono text-white" style={{ backgroundColor: color }}>{survey.id}</span>
        <span className="font-mono text-[10px] text-uber-ink-3">{survey.type}</span>
      </div>
      <p className="font-body text-[11px] text-uber-ink-3 italic">{survey.trigger}</p>
      <p className="font-display text-sm font-semibold text-uber-black leading-relaxed">"{survey.question}"</p>

      {survey.scale === 'yes-no' ? (
        <div className="flex gap-2">
          <span className="rounded-pill px-3 py-1 text-xs font-mono bg-uber-green-light text-uber-green-dark">Yes</span>
          <span className="rounded-pill px-3 py-1 text-xs font-mono bg-uber-red-light text-uber-red">No</span>
          <span className="rounded-pill px-3 py-1 text-xs font-mono bg-uber-gray-card text-uber-ink-3">Unsure</span>
        </div>
      ) : (
        <div className="flex gap-1">
          {Array.from({ length: 11 }, (_, i) => {
            let bg = '#FEF3E8'; let text = '#F4A261';
            if (i <= 3) { bg = '#FEECEE'; text = '#E63946'; }
            else if (i >= 7) { bg = '#E8F9F0'; text = '#028A47'; }
            return (
              <div key={i} className="w-7 h-7 flex items-center justify-center rounded-md font-mono text-[10px] font-medium" style={{ backgroundColor: bg, color: text }}>
                {i}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {survey.drivers.map(d => (
          <span key={d} className="rounded-pill px-2 py-0.5 text-[10px] font-mono bg-uber-blue-light text-uber-blue">{d}</span>
        ))}
      </div>
    </div>
  );
}
