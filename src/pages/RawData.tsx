import { useState, useMemo } from 'react';
import { useVocData } from '@/context/VocDataContext';
import LoadingScreen from '@/components/LoadingScreen';
import { SENTIMENT_COLORS, SOURCE_BADGE_COLORS, ACTION_TAG_COLORS, getThemeColor } from '@/lib/voc-utils';
import { Search, ChevronDown, ChevronRight, Download } from 'lucide-react';
import type { VocSignal } from '@/types/voc';

const COLUMNS = [
  { key: 'signal_id', label: 'Signal ID' },
  { key: 'captured_at', label: 'Date' },
  { key: 'account_name', label: 'Account' },
  { key: 'sales_segment', label: 'Segment' },
  { key: 'mega_region', label: 'Region' },
  { key: 'cdj_stage', label: 'CDJ Stage' },
  { key: 'feedback_source', label: 'Source' },
  { key: 'sentiment', label: 'Sentiment' },
  { key: 'verbatim_text', label: 'Verbatim' },
  { key: 'action_tag', label: 'Action' },
  { key: 'ces_score', label: 'CES' },
  { key: 'ors_score', label: 'ORS' },
  { key: 'csat_score', label: 'CSAT' },
  { key: 'nps_score', label: 'NPS' },
] as const;

export default function RawData() {
  const { data, loading, error } = useVocData();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('captured_at');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const perPage = 25;

  const filtered = useMemo(() => {
    let result = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.verbatim_text.toLowerCase().includes(q) || s.account_name.toLowerCase().includes(q));
    }
    Object.entries(filters).forEach(([key, val]) => {
      if (val) result = result.filter(s => (s as any)[key] === val);
    });
    result = [...result].sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'number') return bv - av;
      return String(av).localeCompare(String(bv));
    });
    return result;
  }, [data, search, filters, sortBy]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const surveyCount = data.filter(s => s.survey_id).length;
  const nonSurveyCount = data.length - surveyCount;

  const setFilter = (key: string, val: string) => {
    setFilters(f => ({ ...f, [key]: val || '' }));
    setPage(1);
  };

  const exportCsv = () => {
    const headers = COLUMNS.map(c => c.label).join(',');
    const rows = filtered.map(s => COLUMNS.map(c => {
      const val = (s as any)[c.key];
      if (val === null || val === undefined) return '';
      const str = String(Array.isArray(val) ? val.join(' | ') : val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'voc_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || error) return <LoadingScreen />;

  const uniqueVals = (key: keyof VocSignal) => [...new Set(data.map(s => String(s[key])).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-white">
      {/* Stats Bar */}
      <div className="bg-uber-gray-card w-full px-6 py-3 border-b border-uber-gray-border">
        <div className="max-w-full mx-auto flex items-center gap-6 font-mono text-xs text-uber-ink-2 flex-wrap">
          <span>Total: {data.length.toLocaleString()}</span>
          <span>Filtered: {filtered.length.toLocaleString()}</span>
          <span>Date range: Jul 2024 – Mar 2026</span>
          <span>Survey: {surveyCount}</span>
          <span>Non-survey: {nonSurveyCount}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white w-full px-6 py-3 border-b border-uber-gray-border">
        <div className="max-w-full mx-auto flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-uber-ink-4" size={14} />
            <input
              type="text"
              placeholder="Search verbatim or account..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-uber-gray-border rounded-lg font-body text-xs bg-white focus:outline-none focus:border-uber-green"
            />
          </div>
          {['cdj_stage', 'feedback_source', 'sentiment', 'sales_segment', 'mega_region', 'action_tag', 'bu_segment'].map(key => (
            <select
              key={key}
              value={filters[key] || ''}
              onChange={e => setFilter(key, e.target.value)}
              className="bg-uber-gray-card text-uber-ink-2 font-body text-xs px-3 py-2 rounded-lg border-none focus:outline-none"
            >
              <option value="">{key.replace(/_/g, ' ')}</option>
              {uniqueVals(key as keyof VocSignal).map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          ))}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-uber-gray-card text-uber-ink-2 font-body text-xs px-3 py-2 rounded-lg border-none"
          >
            <option value="captured_at">Sort: Date</option>
            <option value="sentiment">Sort: Sentiment</option>
            <option value="sales_segment">Sort: Segment</option>
            <option value="tenure_years">Sort: Tenure</option>
          </select>
          <button onClick={exportCsv} className="bg-uber-black text-white font-body text-xs px-4 py-2 rounded-lg flex items-center gap-1.5">
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="bg-uber-gray-card">
              {COLUMNS.map(col => (
                <th key={col.key} className="text-left font-mono text-[11px] text-uber-ink-3 uppercase tracking-wider py-2 px-3">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(signal => {
              const sentColor = SENTIMENT_COLORS[signal.sentiment] || 'transparent';
              const isChurnRisk = signal.action_tag === 'Churn Risk';
              const isExpanded = expandedId === signal.signal_id;
              return (
                <React.Fragment key={signal.signal_id}>
                  <tr
                    className={`border-b border-uber-gray-border cursor-pointer hover:bg-gray-50 transition-colors ${isChurnRisk ? 'bg-uber-amber-light' : ''}`}
                    style={{ borderLeftWidth: 3, borderLeftColor: sentColor }}
                    onClick={() => setExpandedId(isExpanded ? null : signal.signal_id)}
                  >
                    <td className="font-mono text-[11px] text-uber-ink-2 py-2 px-3">{signal.signal_id}</td>
                    <td className="font-mono text-[11px] text-uber-ink-2 py-2 px-3">{signal.captured_at}</td>
                    <td className="font-body text-xs text-uber-ink-2 py-2 px-3">{signal.account_name}</td>
                    <td className="font-body text-xs text-uber-ink-3 py-2 px-3">{signal.sales_segment}</td>
                    <td className="font-body text-xs text-uber-ink-3 py-2 px-3">{signal.mega_region}</td>
                    <td className="font-body text-xs text-uber-ink-3 py-2 px-3 max-w-[120px] truncate">{signal.cdj_stage}</td>
                    <td className="py-2 px-3">
                      <span className="rounded-pill px-2 py-0.5 text-[9px] font-mono" style={{ backgroundColor: (SOURCE_BADGE_COLORS[signal.feedback_source] || { bg: '#F6F6F6' }).bg, color: (SOURCE_BADGE_COLORS[signal.feedback_source] || { text: '#717171' }).text }}>
                        {signal.feedback_source}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="rounded-pill px-2 py-0.5 text-[9px] font-mono" style={{ backgroundColor: sentColor + '20', color: sentColor }}>{signal.sentiment}</span>
                    </td>
                    <td className="font-body text-xs text-uber-ink-2 py-2 px-3 max-w-[200px] truncate italic">{signal.verbatim_text.slice(0, 80)}</td>
                    <td className="py-2 px-3">
                      {signal.action_tag !== 'None' && (
                        <span className="rounded-pill px-2 py-0.5 text-[9px] font-mono" style={{ backgroundColor: (ACTION_TAG_COLORS[signal.action_tag] || { bg: '#F6F6F6' }).bg, color: (ACTION_TAG_COLORS[signal.action_tag] || { text: '#AAA' }).text }}>
                          {signal.action_tag}
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-[11px] text-uber-ink-2 py-2 px-3">{signal.ces_score || '—'}</td>
                    <td className="font-mono text-[11px] text-uber-ink-2 py-2 px-3">{signal.ors_score || '—'}</td>
                    <td className="font-mono text-[11px] text-uber-ink-2 py-2 px-3">{signal.csat_score !== null ? signal.csat_score : '—'}</td>
                    <td className="font-mono text-[11px] text-uber-ink-2 py-2 px-3">{signal.nps_score !== null ? signal.nps_score : '—'}</td>
                  </tr>
                  {isExpanded && <ExpandedRow signal={signal} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 py-6">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-uber-gray-card text-uber-black font-body text-xs px-4 py-2 rounded-lg disabled:opacity-40"
        >
          Prev
        </button>
        <span className="font-mono text-xs">
          Page <span className="text-uber-green font-semibold">{page}</span> of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="bg-uber-gray-card text-uber-black font-body text-xs px-4 py-2 rounded-lg disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

import React from 'react';

function ExpandedRow({ signal }: { signal: VocSignal }) {
  return (
    <tr>
      <td colSpan={14} className="bg-uber-gray-card p-4">
        <div className="space-y-3">
          <p className="font-body text-[13px] text-uber-ink-2 italic leading-relaxed">{signal.verbatim_text}</p>

          {signal.sentiment_themes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {signal.sentiment_themes.map(t => {
                const tc = getThemeColor(t);
                return <span key={t} className="rounded-pill px-2 py-0.5 text-[10px] font-mono" style={{ backgroundColor: tc.bg, color: tc.text }}>{t}</span>;
              })}
            </div>
          )}

          {signal.active_u4b_drivers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {signal.active_u4b_drivers.map(d => (
                <span key={d} className="rounded-md px-2 py-0.5 text-[10px] font-mono bg-uber-gray-card text-uber-ink-3 border border-uber-gray-border">{d}</span>
              ))}
            </div>
          )}

          {signal.survey_id && (
            <div className="flex items-center gap-2 flex-wrap font-mono text-[10px]">
              <span className="bg-white px-2 py-0.5 rounded text-uber-ink-3">{signal.survey_id}</span>
              {signal.ces_score && <span>CES: {signal.ces_score}</span>}
              {signal.ors_score && <span>ORS: {signal.ors_score}</span>}
              {signal.csat_score !== null && <span>CSAT: {signal.csat_score}</span>}
              {signal.nps_score !== null && <span>NPS: {signal.nps_score}</span>}
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
        </div>
      </td>
    </tr>
  );
}
