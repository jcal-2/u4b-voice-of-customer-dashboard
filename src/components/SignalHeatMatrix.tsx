import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { VocSignal } from '@/types/voc';

const POSITIVE_THEMES = ['Cost Savings Win', 'Expansion Opportunity', 'Proactive Onboarding'];

const CDJ_STAGES = [
  'Consideration / Evaluation',
  'Purchase',
  'Onboarding',
  'Adoption / Product Use',
  'Value / Expansion',
  'Expansion / Renewal',
];

const CDJ_SHORT: Record<string, string> = {
  'Consideration / Evaluation': 'CONSID.',
  'Purchase': 'PURCHASE',
  'Onboarding': 'ONBOARD',
  'Adoption / Product Use': 'ADOPT',
  'Value / Expansion': 'VALUE',
  'Expansion / Renewal': 'RENEWAL',
};

const IMPLICATIONS: Record<string, string> = {
  'Dashboard Visibility': 'Blocking expansion & renewal',
  'Invoicing & Support Friction': 'Cited in 3 renewal refusals',
  'Adoption Barrier': '40% activation plateau',
  'Poor Fit / Churn Signal': '5 accounts at churn risk',
  'Integration Friction': 'Onboarding drop-off driver',
  'Service Reliability': 'APAC + secondary markets',
  'Proactive Onboarding': 'Top retention differentiator',
  'Cost Savings Win': '18–23% T&E reduction cited',
  'Expansion Opportunity': '152 expansion signals',
  'Perceived Value for Price': 'ROI visibility gap',
  'Feature Request for Product Roadmap': 'Raised 3+ quarters running',
  'Relationship Quality': 'Key churn buffer',
  'Low Account Signal': 'Monitor — thin data',
  'Early Lifecycle Investment': 'LATAM new accounts',
};

interface HeatRow {
  theme: string;
  total: number;
  cells: Record<string, number>;
  trendPct: number;
  trendDir: '↑' | '↓' | '→';
  priority: 'ACT NOW' | 'WATCH' | 'STABLE';
  isPositive: boolean;
}

function getHeatCellStyle(count: number, isPositive: boolean) {
  if (count === 0) return { bg: '#F6F6F6', text: '#CCCCCC' };
  if (isPositive) {
    if (count <= 5) return { bg: '#E8F9F0', text: '#028A47' };
    if (count <= 15) return { bg: 'rgba(6,193,103,0.5)', text: '#015C2B' };
    return { bg: '#06C167', text: '#FFFFFF' };
  }
  if (count <= 5) return { bg: '#FEF3E8', text: '#C47A20' };
  if (count <= 15) return { bg: '#F4A261', text: '#7A3D00' };
  if (count <= 30) return { bg: 'rgba(230,57,70,0.6)', text: '#FFFFFF' };
  return { bg: '#E63946', text: '#FFFFFF' };
}

const TEAM_THEMES: Record<string, string[]> = {
  'Product': ['Dashboard Visibility', 'Adoption Barrier', 'Proactive Onboarding', 'Feature Request for Product Roadmap'],
  'CS / Support': ['Invoicing & Support Friction', 'Adoption Barrier', 'Integration Friction', 'Poor Fit / Churn Signal', 'Relationship Quality'],
  'Marketing': ['Cost Savings Win', 'Proactive Onboarding', 'Dashboard Visibility', 'Poor Fit / Churn Signal', 'Perceived Value for Price'],
};

export default function SignalHeatMatrix({ data, dimFilter }: { data: VocSignal[]; dimFilter?: string }) {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const rows = useMemo(() => {
    // Collect all themes
    const allThemes = new Set<string>();
    data.forEach(s => {
      if (Array.isArray(s.sentiment_themes)) {
        s.sentiment_themes.forEach(t => { if (t.trim()) allThemes.add(t.trim()); });
      }
    });

    const h1 = data.filter(s => {
      const parts = s.captured_at.split('/');
      const d = new Date(+parts[2], +parts[0] - 1, +parts[1]);
      return d < new Date(2025, 6, 1);
    });
    const h2 = data.filter(s => {
      const parts = s.captured_at.split('/');
      const d = new Date(+parts[2], +parts[0] - 1, +parts[1]);
      return d >= new Date(2025, 6, 1);
    });

    const countThemeInSet = (set: VocSignal[], theme: string) =>
      set.filter(s => Array.isArray(s.sentiment_themes) && s.sentiment_themes.includes(theme)).length;

    const result: HeatRow[] = [];

    allThemes.forEach(theme => {
      const isPositive = POSITIVE_THEMES.includes(theme);
      const cells: Record<string, number> = {};
      let total = 0;

      CDJ_STAGES.forEach(stage => {
        const count = data.filter(s =>
          s.cdj_stage === stage &&
          Array.isArray(s.sentiment_themes) &&
          s.sentiment_themes.includes(theme)
        ).length;
        cells[stage] = count;
        total += count;
      });

      const h1Count = countThemeInSet(h1, theme);
      const h2Count = countThemeInSet(h2, theme);
      const trendPct = h1Count === 0 ? (h2Count > 0 ? 100 : 0) : Math.round(((h2Count - h1Count) / h1Count) * 100);
      const trendDir: '↑' | '↓' | '→' = trendPct > 25 ? '↑' : trendPct < -25 ? '↓' : '→';

      const renewalCount = cells['Expansion / Renewal'] || 0;

      let priority: 'ACT NOW' | 'WATCH' | 'STABLE';
      if (!isPositive && (total > 100 || trendDir === '↑' || renewalCount > 15)) {
        priority = 'ACT NOW';
      } else if (!isPositive && (total >= 50 || (trendDir === '→' && total > 40))) {
        priority = 'WATCH';
      } else {
        priority = 'STABLE';
      }

      result.push({ theme, total, cells, trendPct, trendDir, priority, isPositive });
    });

    // Sort: ACT NOW first, then WATCH, then STABLE; within each by total desc
    const order = { 'ACT NOW': 0, 'WATCH': 1, 'STABLE': 2 };
    result.sort((a, b) => order[a.priority] - order[b.priority] || b.total - a.total);

    return result;
  }, [data]);

  const priorityStyles = {
    'ACT NOW': { bg: '#FEECEE', text: '#E63946', border: '#E63946' },
    'WATCH': { bg: '#FEF3E8', text: '#F4A261', border: '#F4A261' },
    'STABLE': { bg: '#E8F9F0', text: '#028A47', border: 'transparent' },
  };

  const getTrendColor = (row: HeatRow) => {
    if (row.trendDir === '→') return '#AAAAAA';
    if (row.isPositive) return row.trendDir === '↑' ? '#06C167' : '#E63946';
    return row.trendDir === '↑' ? '#E63946' : '#06C167';
  };

  const handleCellClick = (theme: string, stage: string) => {
    navigate(`/feedback?stage=${encodeURIComponent(stage)}&theme=${encodeURIComponent(theme)}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6 w-full overflow-x-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#000' }}>
            Signal Heat Matrix
          </h3>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#AAAAAA', marginTop: 4 }}>
            Theme intensity by CDJ stage · H1→H2 trend · computed from all {data.length.toLocaleString()} signals
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 mt-1" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#717171' }}>
          <span>🔴 Act Now</span>
          <span>🟡 Watch</span>
          <span>🟢 Stable</span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 relative">
        <table className="w-full border-collapse" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th className="text-left py-2 px-2 w-[72px]" style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#AAAAAA' }}></th>
              <th className="text-left py-2 px-2" style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#AAAAAA', textTransform: 'uppercase' }}>THEME</th>
              <th className="text-center py-2 px-2 w-[52px]" style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#AAAAAA' }}>TOTAL</th>
              {CDJ_STAGES.map(s => (
                <th key={s} className="text-center py-2 px-1 w-[52px]" style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#AAAAAA' }}>
                  {CDJ_SHORT[s]}
                </th>
              ))}
              <th className="text-center py-2 px-2 w-[60px]" style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#AAAAAA' }}>TREND</th>
              <th className="text-left py-2 px-2" style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#AAAAAA' }}>IMPLICATION</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const ps = priorityStyles[row.priority];
              const trendColor = getTrendColor(row);
              return (
                <tr
                  key={row.theme}
                  className="group transition-colors duration-150 hover:bg-[#FAFAFA]"
                  style={{ borderLeft: row.priority !== 'STABLE' ? `3px solid ${ps.border}` : '3px solid transparent' }}
                >
                  {/* Priority badge */}
                  <td className="py-2 px-2">
                    <span
                      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5"
                      style={{
                        fontFamily: 'DM Mono, monospace',
                        fontSize: 9,
                        fontWeight: 600,
                        backgroundColor: ps.bg,
                        color: ps.text,
                      }}
                    >
                      {row.priority}
                    </span>
                  </td>

                  {/* Theme name */}
                  <td className="py-2 px-2" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#000' }}>
                    {row.theme}
                  </td>

                  {/* Total */}
                  <td className="py-2 px-2 text-center" style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, color: '#000' }}>
                    {row.total}
                  </td>

                  {/* CDJ stage heat cells */}
                  {CDJ_STAGES.map(stage => {
                    const count = row.cells[stage] || 0;
                    const style = getHeatCellStyle(count, row.isPositive);
                    return (
                      <td key={stage} className="py-2 px-1 text-center">
                        <div
                          className="inline-flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 6,
                            backgroundColor: style.bg,
                            fontFamily: 'DM Mono, monospace',
                            fontSize: 11,
                            color: style.text,
                          }}
                          onClick={() => count > 0 && handleCellClick(row.theme, stage)}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                              text: `${count} signals · ${row.theme} · ${stage}`,
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      </td>
                    );
                  })}

                  {/* Trend */}
                  <td className="py-2 px-2 text-center">
                    <div style={{ color: trendColor, fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 600, lineHeight: 1 }}>
                      {row.trendDir}
                    </div>
                    <div style={{ color: trendColor, fontFamily: 'DM Mono, monospace', fontSize: 10, lineHeight: 1.2 }}>
                      {row.trendPct > 0 ? '+' : ''}{row.trendPct}%
                    </div>
                  </td>

                  {/* Implication */}
                  <td className="py-2 px-2" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#717171', maxWidth: 180 }}>
                    <span className="truncate block">{IMPLICATIONS[row.theme] || '—'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div
              className="bg-white border border-[#EBEBEB] rounded-lg px-2 py-1.5 shadow-sm"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#333', whiteSpace: 'nowrap' }}
            >
              {tooltip.text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
