import { useState } from 'react';

interface Survey {
  id: string;
  cdj: string;
  metric: 'CES' | 'ORS' | 'CSAT' | 'NPS';
  trigger: string;
  question: string;
  scaleType: 'ynu' | '0-10';
  scaleLabels?: [string, string];
  drivers: string[];
}

const SURVEYS: Survey[] = [
  { id: 'CES-001', cdj: 'Consideration / Evaluation', metric: 'CES', trigger: '2h after first demo or sales touchpoint', question: 'The demo and/or account rep made it easy to evaluate whether Uber for Business is the right solution for our organization.', scaleType: 'ynu', drivers: ['Signing Up', 'Cost Management', 'Expense Integrations', 'Customer Support'] },
  { id: 'CES-002', cdj: 'Consideration / Evaluation', metric: 'CES', trigger: '24h after pilot completion or final demo', question: 'It was easy to complete our pilot and evaluation of Uber for Business with our internal stakeholders.', scaleType: 'ynu', drivers: ['Uber for Business Dashboard(s)', 'Expense Integrations', 'Cost Management', 'Commitment to Safety', 'Customer Support'] },
  { id: 'ORS-001', cdj: 'Consideration / Evaluation', metric: 'ORS', trigger: '72h after pilot completion', question: 'Does Uber for Business consistently deliver a dependable evaluation and onboarding commitment experience to you?', scaleType: 'ynu', drivers: ['Uber for Business Dashboard(s)', 'Expense Integrations', 'Cost Management', 'Commitment to Safety', 'Customer Support'] },
  { id: 'CES-003', cdj: 'Purchase', metric: 'CES', trigger: '2h after contract execution', question: 'It was easy to finalize our contract and billing setup with Uber for Business.', scaleType: 'ynu', drivers: ['Billing and Invoicing', 'Signing Up', 'Cost Management', 'Customer Support'] },
  { id: 'CES-004', cdj: 'Onboarding', metric: 'CES', trigger: '3 days after first admin login', question: 'It was easy to set up and configure Uber for Business for our organization.', scaleType: 'ynu', drivers: ['Signing Up', 'Uber for Business Dashboard(s)', 'Expense Integrations', 'Customer Support', 'Billing and Invoicing'] },
  { id: 'CSAT-001', cdj: 'Onboarding', metric: 'CSAT', trigger: '14 days after full onboarding completion', question: 'How satisfied are you with your onboarding and implementation experience with Uber for Business?', scaleType: '0-10', scaleLabels: ['Very dissatisfied', 'Very satisfied'], drivers: ['Signing Up', 'Uber for Business Dashboard(s)', 'Expense Integrations', 'Customer Support'] },
  { id: 'CES-005', cdj: 'Adoption / Product Use', metric: 'CES', trigger: '30 days post-program launch', question: 'It was easy for our employees to adopt and use Uber for Business within our organization\u2019s travel and expense policy.', scaleType: 'ynu', drivers: ['Ride/Order Reliability', 'Ride/Order Quality', 'Commitment to Safety', 'Uber for Business Dashboard(s)', 'Cost Management'] },
  { id: 'CSAT-002', cdj: 'Adoption / Product Use', metric: 'CSAT', trigger: '48h after billing cycle closes \u2014 ongoing', question: 'How satisfied are you with your billing and invoicing experience with Uber for Business?', scaleType: '0-10', scaleLabels: ['Very dissatisfied', 'Very satisfied'], drivers: ['Billing and Invoicing', 'Cost Management', 'Expense Integrations', 'Customer Support'] },
  { id: 'ORS-002', cdj: 'Adoption / Product Use', metric: 'ORS', trigger: '90 days post-program launch', question: 'Has Uber for Business delivered a dependable platform experience to your employees up to this point?', scaleType: 'ynu', drivers: ['Ride/Order Reliability', 'Ride/Order Quality', 'Uber for Business Dashboard(s)', 'Cost Management', 'Commitment to Safety'] },
  { id: 'ORS-003', cdj: 'Value / Expansion', metric: 'ORS', trigger: 'Quarterly \u2014 aligned to QBR cadence', question: 'Does Uber for Business consistently deliver a dependable reporting and spend visibility experience to your organization?', scaleType: 'ynu', drivers: ['Uber for Business Dashboard(s)', 'Billing and Invoicing', 'Expense Integrations', 'Cost Management', 'Customer Support'] },
  { id: 'NPS-001', cdj: 'Value / Expansion', metric: 'NPS', trigger: '6 months after onboarding \u2014 semi-annual', question: 'How likely are you to recommend Uber for Business to a colleague or someone in your network?', scaleType: '0-10', scaleLabels: ['Not at all', 'Extremely likely'], drivers: ['Cost Management', 'Uber for Business Dashboard(s)', 'Billing and Invoicing', 'Expense Integrations', 'Customer Support', 'Sustainable Solutions'] },
  { id: 'CES-006', cdj: 'Value / Expansion', metric: 'CES', trigger: '5 days after expansion milestone', question: 'It was easy to expand Uber for Business to additional teams, regions, or use cases within our organization.', scaleType: 'ynu', drivers: ['Uber for Business Dashboard(s)', 'Ride/Order Reliability', 'Customer Support', 'Cost Management', 'Expense Integrations'] },
  { id: 'CSAT-003', cdj: 'Expansion / Renewal', metric: 'CSAT', trigger: 'Semi-annual \u2014 offset 3 months from NPS-001', question: 'How satisfied are you with Uber for Business as a long-term travel and expense solution for your organization?', scaleType: '0-10', scaleLabels: ['Very dissatisfied', 'Very satisfied'], drivers: ['Cost Management', 'Ride/Order Reliability', 'Ride/Order Quality', 'Uber for Business Dashboard(s)', 'Commitment to Safety', 'Sustainable Solutions'] },
];

const CDJ_STAGES = ['All', 'Consideration / Evaluation', 'Purchase', 'Onboarding', 'Adoption / Product Use', 'Value / Expansion', 'Expansion / Renewal'];

const METRIC_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  CES: { bg: '#F3EEF9', text: '#7B4F9E', accent: '#7B4F9E' },
  ORS: { bg: '#E6F5F4', text: '#2A9D8F', accent: '#2A9D8F' },
  CSAT: { bg: '#EBF3FB', text: '#2D6A9F', accent: '#2D6A9F' },
  NPS: { bg: '#FEF3E8', text: '#F4A261', accent: '#F4A261' },
};

function ScaleDisplay({ survey }: { survey: Survey }) {
  if (survey.scaleType === 'ynu') {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: '#E8F9F0', color: '#028A47', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500 }}>Yes</span>
        <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: '#FEECEE', color: '#E63946', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500 }}>No</span>
        <span className="rounded-full px-4 py-1.5" style={{ backgroundColor: '#F6F6F6', color: '#717171', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500 }}>Unsure</span>
      </div>
    );
  }

  const boxes = Array.from({ length: 11 }, (_, i) => {
    let bg: string, text: string;
    if (i <= 3) { bg = '#FEECEE'; text = '#E63946'; }
    else if (i <= 6) { bg = '#FEF3E8'; text = '#F4A261'; }
    else { bg = '#E8F9F0'; text = '#028A47'; }
    return { i, bg, text };
  });

  return (
    <div>
      <div className="flex items-center gap-1">
        {boxes.map(({ i, bg, text }) => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: bg, color: text, fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 600 }}
          >
            {i}
          </div>
        ))}
      </div>
      {survey.scaleLabels && (
        <div className="flex justify-between mt-1.5">
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#AAAAAA' }}>{survey.scaleLabels[0]}</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#AAAAAA' }}>{survey.scaleLabels[1]}</span>
        </div>
      )}
    </div>
  );
}

function SurveyCard({ survey }: { survey: Survey }) {
  const mc = METRIC_COLORS[survey.metric];
  return (
    <div className="bg-white border border-[#EBEBEB] rounded-2xl relative overflow-hidden transition-all duration-200 hover:border-[#D0D0D0] hover:scale-[1.005]">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: mc.accent }} />
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: mc.bg, color: mc.text, fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 600 }}>
              {survey.id}
            </span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#AAAAAA', textTransform: 'uppercase' }}>
              {survey.metric}
            </span>
          </div>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#AAAAAA' }}>
            {survey.cdj}
          </span>
        </div>
        <div className="mt-2" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#AAAAAA', fontStyle: 'italic' }}>
          {survey.trigger}
        </div>
        <div className="mt-2.5" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#000', fontWeight: 600, lineHeight: 1.5 }}>
          &ldquo;{survey.question}&rdquo;
        </div>
        <div className="my-3 h-px bg-[#F6F6F6]" />
        <div>
          <div className="mb-1.5" style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SCALE</div>
          <ScaleDisplay survey={survey} />
        </div>
        <div className="my-3 h-px bg-[#F6F6F6]" />
        <div>
          <div className="mb-1.5" style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>KEY DRIVERS</div>
          <div className="flex flex-wrap gap-1.5">
            {survey.drivers.map(d => (
              <span key={d} className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: '#EBF3FB', color: '#2D6A9F', fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500 }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SurveyFramework() {
  const [activeStage, setActiveStage] = useState('All');
  const filtered = activeStage === 'All' ? SURVEYS : SURVEYS.filter(s => s.cdj === activeStage);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#000] w-full px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2" style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#717171', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CDJ STAGE</div>
          <div className="flex items-center gap-1 flex-wrap">
            {CDJ_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1">
                {i > 0 && <span style={{ color: '#555', fontSize: 10, fontFamily: 'DM Mono, monospace' }}>&rsaquo;</span>}
                <button
                  onClick={() => setActiveStage(stage)}
                  className="rounded-full px-3 py-1 transition-all duration-150 active:scale-95"
                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, backgroundColor: activeStage === stage ? '#06C167' : '#333', color: activeStage === stage ? '#FFF' : '#717171' }}
                >
                  {stage}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#717171' }}>
          <span>13 surveys total</span><span>&middot;</span><span>6 CDJ stages</span><span>&middot;</span><span>4 metric types</span><span>&middot;</span><span>10 core drivers</span>
        </div>
        <div className="flex items-center gap-3" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#717171' }}>
          {(['CES', 'ORS', 'CSAT', 'NPS'] as const).map(m => (
            <span key={m} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: METRIC_COLORS[m].accent }} />
              {m}
            </span>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => <SurveyCard key={s.id} survey={s} />)}
        </div>
      </div>
    </div>
  );
}
