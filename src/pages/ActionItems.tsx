import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVocData } from '@/context/VocDataContext';
import LoadingScreen from '@/components/LoadingScreen';
import SignalHeatMatrix from '@/components/SignalHeatMatrix';

const IMPACT_STYLES: Record<string, { bg: string; text: string }> = {
  'Churn Risk': { bg: '#FEECEE', text: '#E63946' },
  'Revenue': { bg: '#E8F9F0', text: '#028A47' },
  'Efficiency': { bg: '#EBF3FB', text: '#2D6A9F' },
  'Brand': { bg: '#F3EEF9', text: '#7B4F9E' },
};

interface ActionCard {
  title: string;
  body: string;
  borderColor: string;
  theme: string;
  impact: string;
  team: string;
  priority: string;
}

const PRODUCT_CARDS: ActionCard[] = [
  { title: 'Department-level spend reporting', body: '164 mentions · 6 sources · directly linked to expansion refusals and renewal delays. Raised in 2+ consecutive QBRs with no delivery. Now a trust issue.', borderColor: '#E63946', theme: 'Dashboard Visibility', impact: 'Churn Risk', team: 'Product', priority: 'P0 — IMMEDIATE' },
  { title: 'Group-level spending policy controls', body: '148 mentions · employees bypassing U4B due to restrictive limits. Current all-or-nothing model not meeting enterprise segmentation needs.', borderColor: '#E63946', theme: 'Adoption Barrier', impact: 'Revenue', team: 'Product', priority: 'P0 — IMMEDIATE' },
  { title: 'Bulk employee upload (CSV)', body: 'Recurring feature request · high onboarding friction for orgs 200+. Estimated deflection of 30+ onboarding support tickets per quarter.', borderColor: '#F4A261', theme: 'Proactive Onboarding', impact: 'Efficiency', team: 'Product', priority: 'P1 — THIS QUARTER' },
  { title: 'YoY spend comparison in dashboard', body: 'Critical for renewal business cases. Multiple accounts cited inability to demonstrate ROI as renewal risk. Blocks Finance from self-serving the argument.', borderColor: '#F4A261', theme: 'Dashboard Visibility', impact: 'Revenue', team: 'Product', priority: 'P1 — THIS QUARTER' },
  { title: 'API access for BI/custom reporting', body: '82 mentions across Enterprise and Strategic segments. Risk: larger accounts will build workarounds that reduce platform stickiness over time.', borderColor: '#EBEBEB', theme: 'Feature Request for Product Roadmap', impact: 'Revenue', team: 'Product', priority: 'P2 — WATCH' },
];

const CS_CARDS: ActionCard[] = [
  { title: 'Billing dispute escalation protocol', body: '3 accounts approaching renewal with unresolved billing disputes. SLA: disputes resolved within 5 business days. Assign AM ownership per dispute.', borderColor: '#E63946', theme: 'Invoicing & Support Friction', impact: 'Churn Risk', team: 'CS / Support', priority: 'P0 — IMMEDIATE' },
  { title: 'Proactive outreach: Low-adoption accounts', body: 'Any account below 50% activation at 60 days triggers an outbound CS call. 148 Adoption Barrier mentions — most go unreported until survey fires.', borderColor: '#E63946', theme: 'Adoption Barrier', impact: 'Churn Risk', team: 'CS / Support', priority: 'P0 — IMMEDIATE' },
  { title: 'Onboarding knowledge base expansion', body: 'Support tickets in Onboarding cite missing guides for HRIS integration, policy setup, and billing config. 3 articles could deflect ~25% of tickets.', borderColor: '#F4A261', theme: 'Integration Friction', impact: 'Efficiency', team: 'CS / Support', priority: 'P1 — THIS QUARTER' },
  { title: 'Churn prevention: 5 flagged accounts', body: 'AfriCert Logistics (15), Independent Owner-Op (11), Howard University (8), Delivery Hero DACH (7), Target Logistics (6). Assign senior CSM for 90-day stabilization plan per account.', borderColor: '#E63946', theme: 'Poor Fit / Churn Signal', impact: 'Churn Risk', team: 'CS / Support', priority: 'P0 — IMMEDIATE' },
  { title: 'QBR data package standardization', body: 'Accounts with structured QBR data packages show higher NPS and stronger renewal intent. Standardize template across all Strategic and Enterprise accounts by Q3 2026.', borderColor: '#F4A261', theme: 'Relationship Quality', impact: 'Revenue', team: 'CS / Support', priority: 'P1 — THIS QUARTER' },
];

const MARKETING_CARDS: ActionCard[] = [
  { title: 'Amplify: Cost savings proof points', body: '141 positive Cost Savings Win mentions with specific figures: 18–23% T&E reduction, 120 hrs/year saved on reconciliation. Build 2 case studies — one Enterprise, one Mid-Market.', borderColor: '#06C167', theme: 'Cost Savings Win', impact: 'Brand', team: 'Marketing', priority: 'P0 — IMMEDIATE' },
  { title: 'Amplify: Proactive onboarding narrative', body: '225 mentions as a differentiator. Use in competitive positioning against Rydoo and Concur — cited reason accounts chose and stayed with U4B.', borderColor: '#06C167', theme: 'Proactive Onboarding', impact: 'Brand', team: 'Marketing', priority: 'P0 — IMMEDIATE' },
  { title: 'Address: Dashboard objection pre-sale', body: 'Dashboard limitations surfacing during renewal evaluations and competitive contexts. Set accurate expectations at deal stage — prevents post-sale disappointment.', borderColor: '#F4A261', theme: 'Dashboard Visibility', impact: 'Brand', team: 'Marketing', priority: 'P1 — THIS QUARTER' },
  { title: 'ICP refinement: SMB Self-Serve', body: '132 Poor Fit signals concentrated in SMB Self-Serve accounts. May be converting at high rates but churning before value is realized, negating CAC.', borderColor: '#F4A261', theme: 'Poor Fit / Churn Signal', impact: 'Revenue', team: 'Marketing', priority: 'P1 — THIS QUARTER' },
  { title: 'ESG / Sustainability messaging for EMEA', body: '62 Sustainable Solutions driver citations — mostly from EMEA Enterprise accounts. Create an ESG-specific value proposition for European procurement audiences.', borderColor: '#EBEBEB', theme: 'Perceived Value for Price', impact: 'Revenue', team: 'Marketing', priority: 'P2 — WATCH' },
];

const ALL_CARDS = [...PRODUCT_CARDS, ...CS_CARDS, ...MARKETING_CARDS];

const TEAMS = ['All Teams', 'Product', 'CS / Support', 'Marketing'];

function ActionCardComponent({ card, onThemeClick }: { card: ActionCard; onThemeClick: (theme: string) => void }) {
  const imp = IMPACT_STYLES[card.impact] || { bg: '#F6F6F6', text: '#717171' };
  return (
    <div
      className="bg-white border border-[#EBEBEB] rounded-[10px] p-3.5 mb-2.5 transition-all duration-200 hover:scale-[1.01] hover:border-[#D0D0D0] active:scale-[0.98]"
      style={{ borderLeft: `3px solid ${card.borderColor}` }}
    >
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#000', marginBottom: 6 }}>
        {card.title}
      </div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#717171', lineHeight: 1.6, marginBottom: 10 }}>
        {card.body}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onThemeClick(card.theme)}
          className="rounded-full px-2 py-0.5 transition-colors hover:opacity-80 active:scale-95"
          style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, backgroundColor: '#F6F6F6', color: '#333' }}
        >
          {card.theme}
        </button>
        <span
          className="rounded-full px-2 py-0.5"
          style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, backgroundColor: imp.bg, color: imp.text }}
        >
          {card.impact}
        </span>
      </div>
    </div>
  );
}

function TeamColumn({ title, color, headerBg, cards, onThemeClick }: {
  title: string; color: string; headerBg: string; cards: ActionCard[]; onThemeClick: (t: string) => void;
}) {
  const priorities = [...new Set(cards.map(c => c.priority))];
  return (
    <div className="flex flex-col">
      <div className="rounded-t-[10px] px-3 py-3" style={{ backgroundColor: headerBg }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color }}>◈ {title}</span>
      </div>
      <div className="bg-white rounded-b-[10px] border border-t-0 border-[#EBEBEB] p-3 flex-1">
        {priorities.map(p => (
          <div key={p}>
            <div className="mt-3 first:mt-0 mb-2.5" style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {p}
            </div>
            {cards.filter(c => c.priority === p).map((card, i) => (
              <ActionCardComponent key={i} card={card} onThemeClick={onThemeClick} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActionItems() {
  const { data, loading, error } = useVocData();
  const navigate = useNavigate();
  const [activeTeam, setActiveTeam] = useState('All Teams');

  if (loading || error) return <LoadingScreen />;

  const onThemeClick = (theme: string) => {
    navigate(`/feedback?theme=${encodeURIComponent(theme)}`);
  };

  const filteredProduct = activeTeam === 'All Teams' || activeTeam === 'Product' ? PRODUCT_CARDS : [];
  const filteredCS = activeTeam === 'All Teams' || activeTeam === 'CS / Support' ? CS_CARDS : [];
  const filteredMarketing = activeTeam === 'All Teams' || activeTeam === 'Marketing' ? MARKETING_CARDS : [];

  // Count priorities for header pills
  const actNow = ALL_CARDS.filter(c => c.borderColor === '#E63946' || c.borderColor === '#06C167').length;
  const watch = ALL_CARDS.filter(c => c.borderColor === '#F4A261').length;
  const stable = ALL_CARDS.filter(c => c.borderColor === '#EBEBEB').length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#000] w-full px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700, color: '#FFF' }}>Action Items</h1>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#717171', marginTop: 4 }}>
              Signal Heat Matrix · Team Priorities · Jul 2024 → Mar 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2 py-1" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, backgroundColor: '#FEECEE', color: '#E63946' }}>🔴 {actNow} Act Now</span>
            <span className="rounded-full px-2 py-1" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, backgroundColor: '#FEF3E8', color: '#F4A261' }}>🟡 {watch} Watch</span>
            <span className="rounded-full px-2 py-1" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, backgroundColor: '#E8F9F0', color: '#028A47' }}>🟢 {stable} Stable</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Section 1: Signal Heat Matrix */}
        <SignalHeatMatrix data={data} dimFilter={activeTeam !== 'All Teams' ? activeTeam : undefined} />

        {/* Section 2: Team Action Items */}
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#000', marginBottom: 4 }}>
            Team Action Items
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#AAAAAA', marginBottom: 20 }}>
            Evidence-based recommendations by team · Jul 2024 → Mar 2026
          </p>

          {/* Team filter */}
          <div className="flex items-center gap-2 mb-5">
            {TEAMS.map(team => (
              <button
                key={team}
                onClick={() => setActiveTeam(team)}
                className="rounded-full px-3.5 py-1.5 transition-all duration-150 active:scale-95"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  backgroundColor: activeTeam === team ? '#000' : '#F6F6F6',
                  color: activeTeam === team ? '#FFF' : '#000',
                }}
              >
                {team}
              </button>
            ))}
          </div>

          {/* 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filteredProduct.length > 0 && (
              <TeamColumn title="Product Team" color="#2D6A9F" headerBg="#EBF3FB" cards={filteredProduct} onThemeClick={onThemeClick} />
            )}
            {filteredCS.length > 0 && (
              <TeamColumn title="CS / Support Team" color="#2A9D8F" headerBg="#E6F5F4" cards={filteredCS} onThemeClick={onThemeClick} />
            )}
            {filteredMarketing.length > 0 && (
              <TeamColumn title="Marketing Team" color="#7B4F9E" headerBg="#F3EEF9" cards={filteredMarketing} onThemeClick={onThemeClick} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
