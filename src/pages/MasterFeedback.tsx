import { useState, useMemo } from 'react';
import { useVocData } from '@/context/VocDataContext';
import LoadingScreen from '@/components/LoadingScreen';
import { CDJ_STAGES, SOURCE_DISPLAY_MAP } from '@/types/voc';
import { countPipeField, sortedEntries, getThemeColor, SOURCE_BADGE_COLORS, ACTION_TAG_COLORS, SENTIMENT_COLORS } from '@/lib/voc-utils';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { VocSignal } from '@/types/voc';

const DISPLAY_SOURCES = [
  'All Sources', 'CSAT Survey', 'ORS Survey', 'NPS Survey', 'CES Survey',
  'SFDC Account Notes', 'Slack Customer Channel', 'Internal Feature Log',
  'In-App Feedback', 'Direct Feedback', 'Website Chat Transcript',
];

export default function MasterFeedback() {
  const { data, loading, error } = useVocData();
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [selectedSources, setSelectedSources] = useState<string[]>(['All Sources']);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(25);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = data;
    if (selectedStage !== 'All Stages') {
      result = result.filter(s => s.cdj_stage === selectedStage);
    }
    if (!selectedSources.includes('All Sources')) {
      const csvSources = selectedSources.map(ds => SOURCE_DISPLAY_MAP[ds] || ds);
      result = result.filter(s => csvSources.includes(s.feedback_source));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.verbatim_text.toLowerCase().includes(q));
    }
    return result;
  }, [data, selectedStage, selectedSources, search]);

  const toggleSource = (src: string) => {
    if (src === 'All Sources') {
      setSelectedSources(['All Sources']);
    } else {
      let next = selectedSources.filter(s => s !== 'All Sources');
      if (next.includes(src)) {
        next = next.filter(s => s !== src);
        if (next.length === 0) next = ['All Sources'];
      } else {
        next.push(src);
      }
      setSelectedSources(next);
    }
    setVisibleCount(25);
  };

  if (loading || error) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[hsl(0,0%,96%)]">
      {/* CDJ Stage Filter */}
      <div className="bg-uber-black w-full px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="font-mono text-[10px] text-uber-ink-3 uppercase tracking-wider mb-2">CDJ Stage</div>
          <div className="flex flex-wrap gap-2">
            {['All Stages', ...CDJ_STAGES].map((stage, i) => (
              <button
                key={stage}
                onClick={() => { setSelectedStage(stage); setVisibleCount(25); }}
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

      {/* Source Filter */}
      <div className="bg-uber-gray-card w-full px-6 py-3 border-b border-uber-gray-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[10px] text-uber-ink-3 uppercase tracking-wider">Feedback Source</div>
            <span className="font-mono text-[11px] text-uber-green">Showing {filtered.length} signals</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DISPLAY_SOURCES.map(src => {
              const isActive = selectedSources.includes(src);
              return (
                <button
                  key={src}
                  onClick={() => toggleSource(src)}
                  className={`rounded-pill px-3 py-1.5 font-body text-xs transition-colors border ${
                    isActive ? 'bg-uber-green text-white border-uber-green' : 'bg-white text-uber-black border-uber-gray-border'
                  }`}
                >
                  {src}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Feedback List */}
          <div className="lg:col-span-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-uber-ink-4" size={16} />
              <input
                type="text"
                placeholder="Search verbatim..."
                value={search}
                onChange={e => { setSearch(e.target.value); setVisibleCount(25); }}
                className="w-full pl-10 pr-4 py-2.5 border border-uber-gray-border rounded-lg font-body text-sm text-uber-ink-2 bg-white focus:outline-none focus:border-uber-green"
              />
            </div>
            <div className="font-mono text-[11px] text-uber-ink-3">
              Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} records
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="font-body text-uber-ink-3 mb-4">No signals match the current filters</p>
                <button onClick={() => { setSelectedStage('All Stages'); setSelectedSources(['All Sources']); setSearch(''); }} className="bg-uber-black text-white font-body text-sm px-4 py-2 rounded-lg">
                  Clear filters
                </button>
              </div>
            )}

            {filtered.slice(0, visibleCount).map(signal => (
              <FeedbackCard
                key={signal.signal_id}
                signal={signal}
                expanded={expandedId === signal.signal_id}
                onToggle={() => setExpandedId(expandedId === signal.signal_id ? null : signal.signal_id)}
              />
            ))}

            {visibleCount < filtered.length && (
              <button
                onClick={() => setVisibleCount(v => v + 25)}
                className="w-full py-3 bg-uber-gray-card text-uber-black font-body text-sm rounded-lg hover:bg-uber-gray-border transition-colors"
              >
                Load more
              </button>
            )}
          </div>

          {/* Right: Insights Panel */}
          <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start space-y-6">
            <InsightsPanel data={filtered} stageLabel={selectedStage} sourceLabel={selectedSources.join(', ')} onSelectSignal={(id) => setExpandedId(id)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackCard({ signal, expanded, onToggle }: { signal: VocSignal; expanded: boolean; onToggle: () => void }) {
  const sentColor = SENTIMENT_COLORS[signal.sentiment] || '#AAA';
  const srcColors = SOURCE_BADGE_COLORS[signal.feedback_source] || { bg: '#F6F6F6', text: '#717171' };
  const actionColors = ACTION_TAG_COLORS[signal.action_tag] || { bg: '#F6F6F6', text: '#AAA' };

  return (
    <div className="bg-white rounded-xl border-2 border-[hsl(0,0%,85%)] p-4 shadow-[0_1px_3px_hsl(0,0%,0%,0.06)]" style={{ borderLeftWidth: 4, borderLeftColor: sentColor }}>
      <div className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="rounded-pill px-2 py-0.5 text-[10px] font-mono font-medium" style={{ backgroundColor: srcColors.bg, color: srcColors.text }}>{signal.feedback_source}</span>
          <span className="rounded-pill px-2 py-0.5 text-[10px] font-mono font-medium bg-uber-gray-card text-uber-ink-2">{signal.cdj_stage}</span>
          <span className="rounded-pill px-2 py-0.5 text-[10px] font-mono font-medium" style={{ backgroundColor: sentColor + '20', color: sentColor }}>{signal.sentiment}</span>
          <span className="font-mono text-[11px] text-uber-ink-2 ml-auto">{signal.captured_at}</span>
          {expanded ? <ChevronDown size={14} className="text-uber-ink-3" /> : <ChevronRight size={14} className="text-uber-ink-3" />}
        </div>
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="font-body text-[13px] font-bold text-uber-black">{signal.customer_name}</span>
          <span className="font-body text-xs text-uber-ink-2">· {signal.account_name} · {signal.sales_segment} · {signal.mega_region}</span>
        </div>
        <div className="mt-1.5 relative pl-4">
          <span className="absolute left-0 top-0 font-display text-2xl text-uber-green leading-none select-none">"</span>
          <p className="font-body text-xs text-uber-ink-3 italic leading-relaxed">
            {signal.verbatim_text}<span className="font-display text-lg text-uber-green leading-none select-none ml-0.5 inline">"</span>
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">

          {signal.survey_id && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] bg-uber-gray-card px-2 py-0.5 rounded">{signal.survey_id}</span>
              {signal.survey_scale_type && <span className="font-mono text-[10px] text-uber-ink-3">{signal.survey_scale_type}</span>}
              {signal.ces_score && <ScoreBadge type="CES" value={signal.ces_score} />}
              {signal.ors_score && <ScoreBadge type="ORS" value={signal.ors_score} />}
              {signal.csat_score !== null && <ScoreBadge type="CSAT" value={signal.csat_score} />}
              {signal.nps_score !== null && <ScoreBadge type="NPS" value={signal.nps_score} />}
            </div>
          )}

          {signal.key_drivers_selected.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {signal.key_drivers_selected.map(d => (
                <span key={d} className="rounded-pill px-2 py-0.5 text-[10px] font-mono bg-uber-blue-light text-uber-blue">{d}</span>
              ))}
            </div>
          )}

          {signal.conditional_follow_up_response && (
            <div className="bg-uber-red-light text-uber-red rounded-lg p-2.5 font-body text-xs">
              {signal.conditional_follow_up_response}
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {signal.sentiment_themes.map(t => {
              const tc = getThemeColor(t);
              return <span key={t} className="rounded-pill px-2 py-0.5 text-[10px] font-mono" style={{ backgroundColor: tc.bg, color: tc.text }}>{t}</span>;
            })}
          </div>

          {signal.action_tag && signal.action_tag !== 'None' && (
            <span className="rounded-pill px-2 py-0.5 text-[10px] font-mono" style={{ backgroundColor: actionColors.bg, color: actionColors.text }}>{signal.action_tag}</span>
          )}

          {signal.active_u4b_drivers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {signal.active_u4b_drivers.map(d => (
                <span key={d} className="rounded-md px-2 py-0.5 text-[10px] font-mono bg-uber-gray-card text-uber-ink-3">{d}</span>
              ))}
            </div>
          )}

          <div className="font-mono text-[10px] text-uber-ink-4">
            {signal.role} · {signal.bu_segment} · {signal.product_division} · {signal.acquisition_type} · {signal.tenure_years !== null ? `${signal.tenure_years} yrs` : '—'}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ type, value }: { type: string; value: string | number }) {
  let bg = '#E8F9F0'; let text = '#028A47';
  if (type === 'CES' || type === 'ORS') {
    if (value === 'No') { bg = '#FEECEE'; text = '#E63946'; }
    else if (value === 'Unsure') { bg = '#F6F6F6'; text = '#717171'; }
  } else {
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    if (n < 5) { bg = '#FEECEE'; text = '#E63946'; }
    else if (n < 7) { bg = '#FEF3E8'; text = '#F4A261'; }
  }
  return (
    <span className="rounded-pill px-2 py-0.5 text-[10px] font-mono font-medium" style={{ backgroundColor: bg, color: text }}>
      {type}: {value}
    </span>
  );
}

function InsightsPanel({ data, stageLabel, sourceLabel, onSelectSignal }: { data: VocSignal[]; stageLabel: string; sourceLabel: string; onSelectSignal: (id: string) => void }) {
  const themes = useMemo(() => sortedEntries(countPipeField(data, 'sentiment_themes')), [data]);
  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(s => {
      if (s.action_tag && s.action_tag !== 'None') counts[s.action_tag] = (counts[s.action_tag] || 0) + 1;
    });
    return counts;
  }, [data]);
  const urgentSignals = useMemo(() =>
    data.filter(s => s.action_tag === 'Escalation' || s.action_tag === 'Churn Risk')
      .sort((a, b) => b.captured_at.localeCompare(a.captured_at))
      .slice(0, 5),
    [data]
  );

  return (
    <div className="bg-uber-gray-card rounded-uber p-5 space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-uber-black">Sentiment Themes</h3>
        <p className="font-mono text-[11px] text-uber-ink-3">{stageLabel} · {sourceLabel}</p>
        <div className="mt-3 space-y-1.5">
          {themes.slice(0, 10).map(([theme, count]) => {
            const tc = getThemeColor(theme);
            const maxC = themes[0]?.[1] || 1;
            return (
              <div key={theme} className="flex items-center gap-2 border-b border-uber-gray-border pb-1.5">
                <span className="font-body text-xs text-uber-ink-2 flex-1 truncate">{theme}</span>
                <div className="w-12 h-1.5 bg-uber-gray-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.round(100 * count / maxC)}%`, backgroundColor: tc.text }} />
                </div>
                <span className="font-mono text-[11px] text-uber-black w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-uber-black">Action Items</h3>
        <p className="font-body text-[11px] text-uber-ink-3">Filtered signals requiring follow-up</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { tag: 'Escalation', color: '#E63946' },
            { tag: 'Churn Risk', color: '#F4A261' },
            { tag: 'Go-to-Gemba', color: '#7B4F9E' },
            { tag: 'Expansion Opportunity', color: '#06C167' },
            { tag: 'Product Feature', color: '#2D6A9F' },
            { tag: 'ICP Research', color: '#2A9D8F' },
          ].map(({ tag, color }) => (
            <div key={tag} className="bg-white rounded-xl border border-uber-gray-border p-2.5 text-center">
              <div className="font-display text-xl font-bold" style={{ color }}>{actionCounts[tag] || 0}</div>
              <div className="font-body text-[11px] text-uber-ink-3">{tag}</div>
            </div>
          ))}
        </div>
      </div>

      {urgentSignals.length > 0 && (
        <div className="space-y-2">
          {urgentSignals.map(s => (
            <div
              key={s.signal_id}
              className="bg-white rounded-lg p-2.5 cursor-pointer border-l-[3px] border-uber-red"
              onClick={() => onSelectSignal(s.signal_id)}
            >
              <div className="font-body text-xs font-bold text-uber-black">{s.account_name}</div>
              <div className="font-body text-[11px] text-uber-ink-3">{s.cdj_stage} · {s.verbatim_text.slice(0, 80)}... · {s.captured_at}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
