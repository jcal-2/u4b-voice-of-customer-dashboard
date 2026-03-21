import { useMemo } from 'react';
import { useVocData } from '@/context/VocDataContext';
import LoadingScreen from '@/components/LoadingScreen';
import { calcNps, calcCsat, calcCes, calcOrs, countByField, countPipeField, sortedEntries, getThemeColor, SENTIMENT_COLORS, ACTION_TAG_COLORS } from '@/lib/voc-utils';
import GaugeCard from '@/components/GaugeCard';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function VocSynthesis() {
  const { data, loading, error } = useVocData();

  const stats = useMemo(() => {
    if (!data.length) return null;
    const nps = calcNps(data);
    const csat = calcCsat(data);
    const ces = calcCes(data);
    const ors = calcOrs(data);
    const sentimentCounts = countByField(data, 'sentiment');
    const total = data.length;
    const sentimentData = ['Positive', 'Negative', 'Neutral', 'Mixed'].map(s => ({
      name: s, count: sentimentCounts[s] || 0, pct: Math.round(100 * (sentimentCounts[s] || 0) / total),
    }));
    const posRate = (sentimentCounts['Positive'] || 0) / total * 100;
    const negRate = (sentimentCounts['Negative'] || 0) / total * 100;
    const netSentiment = Math.round(posRate - negRate);
    const frictionCount = (sentimentCounts['Negative'] || 0) + (sentimentCounts['Mixed'] || 0);

    const keyDrivers = countPipeField(
      data.filter(s => s.nps_score !== null || s.csat_score !== null),
      'key_drivers_selected'
    );
    const sourceCounts = countByField(data, 'feedback_source');
    const negBySource: Record<string, number> = {};
    const sourceTotal: Record<string, number> = {};
    data.forEach(s => {
      sourceTotal[s.feedback_source] = (sourceTotal[s.feedback_source] || 0) + 1;
      if (s.sentiment === 'Negative') {
        negBySource[s.feedback_source] = (negBySource[s.feedback_source] || 0) + 1;
      }
    });
    const negRateBySource = Object.entries(sourceTotal).map(([src, tot]) => ({
      name: src, rate: Math.round(100 * (negBySource[src] || 0) / tot), count: negBySource[src] || 0,
    })).sort((a, b) => b.rate - a.rate);

    const actionCounts = countByField(data, 'action_tag');
    const themes = countPipeField(data, 'sentiment_themes');

    // H1 vs H2
    const h1 = data.filter(s => s.captured_at < '2025-07-01');
    const h2 = data.filter(s => s.captured_at >= '2025-07-01');
    const h1Nps = calcNps(h1);
    const h2Nps = calcNps(h2);
    const h1Csat = calcCsat(h1);
    const h2Csat = calcCsat(h2);
    const h1Neg = h1.length ? Math.round(100 * h1.filter(s => s.sentiment === 'Negative' || s.sentiment === 'Mixed').length / h1.length) : 0;
    const h2Neg = h2.length ? Math.round(100 * h2.filter(s => s.sentiment === 'Negative' || s.sentiment === 'Mixed').length / h2.length) : 0;
    const h1Pos = h1.length ? Math.round(100 * h1.filter(s => s.sentiment === 'Positive').length / h1.length) : 0;
    const h2Pos = h2.length ? Math.round(100 * h2.filter(s => s.sentiment === 'Positive').length / h2.length) : 0;

    // CDJ negativity
    const cdjStages = ["Consideration / Evaluation", "Purchase", "Onboarding", "Adoption / Product Use", "Value / Expansion", "Expansion / Renewal"];
    const cdjData = cdjStages.map(stage => {
      const stageSignals = data.filter(s => s.cdj_stage === stage);
      const vol = stageSignals.length;
      const negMixed = stageSignals.filter(s => s.sentiment === 'Negative' || s.sentiment === 'Mixed');
      const negPct = vol ? Math.round(100 * negMixed.length / vol) : 0;
      const posCount = stageSignals.filter(s => s.sentiment === 'Positive').length;
      const neuCount = stageSignals.filter(s => s.sentiment === 'Neutral').length;
      const negCount = stageSignals.filter(s => s.sentiment === 'Negative').length;
      const mixCount = stageSignals.filter(s => s.sentiment === 'Mixed').length;
      const themes = countPipeField(negMixed, 'sentiment_themes');
      const topPain = sortedEntries(themes)[0]?.[0] || '—';
      let risk = 'Low';
      if (negPct >= 48) risk = 'Critical';
      else if (negPct >= 40) risk = 'High';
      else if (negPct >= 30) risk = 'Medium';
      return { stage, vol, negPct, topPain, risk, posCount, neuCount, negCount, mixCount };
    });

    return { nps, csat, ces, ors, sentimentData, netSentiment, frictionCount, frictionPct: Math.round(100 * frictionCount / total), keyDrivers, sourceCounts, negRateBySource, actionCounts, themes, h1Nps, h2Nps, h1Csat, h2Csat, h1Neg, h2Neg, h1Pos, h2Pos, h1Vol: h1.length, h2Vol: h2.length, cdjData, total };
  }, [data]);

  if (loading || error) return <LoadingScreen />;
  if (!stats) return null;

  const uniqueAccounts = new Set(data.map(d => d.account_name)).size;
  const uniqueSources = new Set(data.map(d => d.feedback_source)).size;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="bg-uber-black w-full px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-[28px] font-bold text-white">Voice of Customer — Uber for Business</h1>
            <p className="font-mono text-xs text-uber-ink-3 mt-1">
              {stats.total.toLocaleString()} signals · {uniqueAccounts} accounts · {uniqueSources} sources · Jul 2024 – Mar 2026
            </p>
          </div>
          <span className="pill pill-active text-[10px] font-mono">LIVE DATA</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Scorecard Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <GaugeCard
            value={stats.nps.score}
            min={-100}
            max={100}
            displayValue={`${stats.nps.score > 0 ? '+' : ''}${stats.nps.score}`}
            fillColor="#06C167"
            accentColor="#06C167"
            title="Net Promoter Score"
            subtitle="Below average — industry avg +32"
            target={{ value: 32, label: "Target +32" }}
            breakdownRows={[
              { label: 'Promoters (9–10)', dotColor: '#06C167', valueColor: '#06C167', value: `${stats.nps.pPct}%`, count: stats.nps.promoters },
              { label: 'Passives (7–8)', dotColor: '#AAAAAA', valueColor: '#AAAAAA', value: `${stats.nps.paPct}%`, count: stats.nps.passives },
              { label: 'Detractors (0–6)', dotColor: '#E63946', valueColor: '#E63946', value: `${stats.nps.dPct}%`, count: stats.nps.detractors },
            ]}
          />
          <GaugeCard
            value={stats.csat.avg}
            min={0}
            max={10}
            displayValue={stats.csat.avg.toFixed(1)}
            fillColor="#2D6A9F"
            accentColor="#2D6A9F"
            title="CSAT Average Score"
            subtitle={`Out of 10 · ${stats.csat.total} responses`}
            target={{ value: 7.5, label: "Target 7.5" }}
            breakdownRows={[
              { label: 'Promoters (9–10)', dotColor: '#2D6A9F', valueColor: '#2D6A9F', value: `${stats.csat.pPct}%`, count: stats.csat.promoters },
              { label: 'Passives (7–8)', dotColor: '#AAAAAA', valueColor: '#AAAAAA', value: `${stats.csat.paPct}%`, count: stats.csat.passives },
              { label: 'Detractors (0–6)', dotColor: '#E63946', valueColor: '#E63946', value: `${stats.csat.dPct}%`, count: stats.csat.detractors },
              { label: 'CSAT NPS-style:', dotColor: stats.csat.score >= 0 ? '#06C167' : '#E63946', value: `${stats.csat.score > 0 ? '+' : ''}${stats.csat.score}`, bold: true, valueColor: stats.csat.score >= 0 ? '#06C167' : '#E63946' },
            ]}
          />
          <GaugeCard
            value={stats.ces.yesPct}
            min={0}
            max={100}
            displayValue={`${stats.ces.yesPct}%`}
            fillColor="#7B4F9E"
            accentColor="#7B4F9E"
            title="CES — Effort Score"
            subtitle={`% saying 'Easy' · ${stats.ces.total} surveys`}
            zones={[
              { end: 40, color: '#E63946' },
              { end: 60, color: '#F4A261' },
              { end: 100, color: '#06C167' },
            ]}
            breakdownRows={[
              { label: 'Yes ✓', dotColor: '#06C167', valueColor: '#06C167', value: `${stats.ces.yesPct}%` },
              { label: 'No ✗', dotColor: '#E63946', valueColor: '#E63946', value: `${stats.ces.noPct}%` },
              { label: 'Unsure ?', dotColor: '#AAAAAA', valueColor: '#AAAAAA', value: `${stats.ces.unsurePct}%` },
            ]}
          />
          <GaugeCard
            value={stats.ors.yesPct}
            min={0}
            max={100}
            displayValue={`${stats.ors.yesPct}%`}
            fillColor="#2A9D8F"
            accentColor="#2A9D8F"
            title="ORS — Reliability Score"
            subtitle={`% saying 'Dependable' · ${stats.ors.total} surveys`}
            zones={[
              { end: 40, color: '#E63946' },
              { end: 60, color: '#F4A261' },
              { end: 100, color: '#06C167' },
            ]}
            breakdownRows={[
              { label: 'Yes ✓', dotColor: '#2A9D8F', valueColor: '#2A9D8F', value: `${stats.ors.yesPct}%` },
              { label: 'No ✗', dotColor: '#E63946', valueColor: '#E63946', value: `${stats.ors.noPct}%` },
              { label: 'Unsure ?', dotColor: '#AAAAAA', valueColor: '#AAAAAA', value: `${stats.ors.unsurePct}%` },
            ]}
          />
        </div>

        {/* Sentiment + Key Drivers */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 card-uber p-6">
            <h3 className="font-display text-base font-bold text-uber-black mb-4">Sentiment Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.sentimentData} layout="vertical" margin={{ left: 10, right: 40 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#333' }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#EBEBEB] rounded-lg px-3 py-2 shadow-sm" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#333' }}>
                      <strong>{d.name}</strong>: {d.count} ({d.pct}%)
                    </div>
                  );
                }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.sentimentData.map((entry) => (
                    <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || '#AAA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="font-body text-xs text-uber-ink-3 mt-2">
              Net Sentiment: {stats.netSentiment > 0 ? '+' : ''}{stats.netSentiment}pp · Combined friction signals: {stats.frictionCount} ({stats.frictionPct}%)
            </p>
          </div>
          <div className="lg:col-span-2 card-uber p-6">
            <h3 className="font-display text-base font-bold text-uber-black mb-4">Top Key Drivers</h3>
            <div className="space-y-2">
              {sortedEntries(stats.keyDrivers).slice(0, 8).map(([driver, count], i) => {
                const totalDrivers = sortedEntries(stats.keyDrivers).reduce((s, [, c]) => s + c, 0);
                const pct = Math.round(100 * count / totalDrivers);
                return (
                  <div key={driver} className="flex items-center gap-2 group relative">
                    <span className="font-mono text-xs text-uber-ink-4 w-5">{i + 1}</span>
                    <span className="font-body text-xs text-uber-ink-2 flex-1 truncate">{driver}</span>
                    <div className="w-16 h-2 bg-uber-gray-border rounded-full overflow-hidden">
                      <div className="h-full bg-uber-blue rounded-full" style={{ width: `${Math.round(100 * count / sortedEntries(stats.keyDrivers)[0][1])}%` }} />
                    </div>
                    <span className="font-mono text-xs text-uber-black w-8 text-right">{count}</span>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border border-[#EBEBEB] rounded-lg px-2 py-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#333' }}>
                      {driver}: {pct}% of total
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Volume, Neg Rate, Action Tags */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-uber p-6">
            <h3 className="font-display text-base font-bold text-uber-black mb-4">Volume by Source</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sortedEntries(stats.sourceCounts).map(([n, c]) => ({ name: n, count: c }))} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontFamily: 'DM Sans', fontSize: 10, fill: '#333' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#06C167" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-uber p-6">
            <h3 className="font-display text-base font-bold text-uber-black mb-4">Negative Signal Rate</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.negRateBySource} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontFamily: 'DM Sans', fontSize: 10, fill: '#333' }} />
                <Tooltip />
                <Bar dataKey="rate" fill="#E63946" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-uber p-6">
            <h3 className="font-display text-base font-bold text-uber-black mb-4">Action Items</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { tag: 'Escalation', bg: '#FEECEE', color: '#E63946' },
                { tag: 'Churn Risk', bg: '#FEF3E8', color: '#F4A261' },
                { tag: 'Go-to-Gemba', bg: '#F3EEF9', color: '#7B4F9E' },
                { tag: 'Expansion Opportunity', bg: '#E8F9F0', color: '#06C167' },
                { tag: 'Product Feature', bg: '#EBF3FB', color: '#2D6A9F' },
                { tag: 'ICP Research', bg: '#E6F5F4', color: '#2A9D8F' },
              ].map(({ tag, bg, color }) => (
                <div key={tag} className="rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
                  <div className="font-display text-2xl font-bold" style={{ color }}>{stats.actionCounts[tag] || 0}</div>
                  <div className="font-body text-[11px] text-uber-ink-3 mt-1">{tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trend Comparison */}
        <div className="bg-uber-black rounded-uber p-6 text-white">
          <h3 className="font-display text-lg font-bold mb-1">H1 vs H2 Trend Comparison</h3>
          <p className="font-mono text-[11px] text-uber-ink-3 mb-5">Split at Jul 1 2025 · H1: {stats.h1Vol} signals · H2: {stats.h2Vol} signals</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#333]">
                    <th className="text-left font-mono text-[10px] text-uber-ink-3 uppercase tracking-wider pb-2">Metric</th>
                    <th className="text-right font-mono text-[10px] text-uber-ink-3 uppercase tracking-wider pb-2">H1</th>
                    <th className="text-right font-mono text-[10px] text-uber-ink-3 uppercase tracking-wider pb-2">H2</th>
                    <th className="text-right font-mono text-[10px] text-uber-ink-3 uppercase tracking-wider pb-2">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {/* NPS */}
                  <TrendRow label="NPS" h1={stats.h1Nps.score} h2={stats.h2Nps.score} format="int" main />
                  <TrendRow label="↳ Promoters (9–10)" h1={stats.h1Nps.pPct} h2={stats.h2Nps.pPct} format="pct" sub />
                  <TrendRow label="↳ Passives (7–8)" h1={stats.h1Nps.paPct} h2={stats.h2Nps.paPct} format="pct" sub />
                  <TrendRow label="↳ Detractors (0–6)" h1={stats.h1Nps.dPct} h2={stats.h2Nps.dPct} format="pct" sub invert />
                  {/* CSAT */}
                  <TrendRow label="CSAT Avg" h1={stats.h1Csat.avg} h2={stats.h2Csat.avg} format="avg" main />
                  <TrendRow label="CSAT Score (NPS-style)" h1={stats.h1Csat.score} h2={stats.h2Csat.score} format="int" main />
                  <TrendRow label="↳ Promoters (9–10)" h1={stats.h1Csat.pPct} h2={stats.h2Csat.pPct} format="pct" sub />
                  <TrendRow label="↳ Passives (7–8)" h1={stats.h1Csat.paPct} h2={stats.h2Csat.paPct} format="pct" sub />
                  <TrendRow label="↳ Detractors (0–6)" h1={stats.h1Csat.dPct} h2={stats.h2Csat.dPct} format="pct" sub invert />
                  {/* Sentiment & Volume */}
                  <TrendRow label="Neg % (Neg + Mixed)" h1={stats.h1Neg} h2={stats.h2Neg} format="pct" main invert />
                  <TrendRow label="Pos %" h1={stats.h1Pos} h2={stats.h2Pos} format="pct" main />
                  <TrendRow label="Volume" h1={stats.h1Vol} h2={stats.h2Vol} format="int" main />
                </tbody>
              </table>
            </div>
            <div className="space-y-4 font-body text-[13px] leading-[1.7]">
              <p><span className="text-uber-green font-semibold">What improved: </span><span className="text-gray-400">
                {stats.h2Pos > stats.h1Pos ? `Positive sentiment rose from ${stats.h1Pos}% to ${stats.h2Pos}%. ` : ''}
                {stats.h2Nps.score > stats.h1Nps.score ? `NPS improved from ${stats.h1Nps.score > 0 ? '+' : ''}${stats.h1Nps.score} to ${stats.h2Nps.score > 0 ? '+' : ''}${stats.h2Nps.score}. ` : ''}
                {stats.h2Vol > stats.h1Vol ? `Feedback volume increased, indicating broader program coverage.` : ''}
              </span></p>
              <p><span className="text-uber-red font-semibold">What got worse: </span><span className="text-gray-400">
                {stats.h2Neg >= stats.h1Neg ? `Negative signal rate ${stats.h2Neg > stats.h1Neg ? `rose from ${stats.h1Neg}% to ${stats.h2Neg}%` : `held steady at ${stats.h2Neg}%`}. ` : ''}
                {stats.h2Csat.avg < stats.h1Csat.avg ? `CSAT average dipped from ${stats.h1Csat.avg.toFixed(1)} to ${stats.h2Csat.avg.toFixed(1)}. ` : ''}
                Billing and invoicing friction remains a persistent theme across both halves.
              </span></p>
              <p><span className="text-uber-blue font-semibold">What's new in H2: </span><span className="text-gray-400">
                {stats.h2Vol > stats.h1Vol ? `Signal volume grew by ${stats.h2Vol - stats.h1Vol} records. ` : ''}
                Expansion opportunity signals increased, suggesting mature accounts are finding more use cases.
              </span></p>
            </div>
          </div>
        </div>

        {/* CDJ Stage Table */}
        <div className="card-uber p-6">
          <h3 className="font-display text-base font-bold text-uber-black mb-4">Negativity by CDJ Stage</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-uber-gray-card">
                <th className="text-left font-mono text-[11px] text-uber-ink-3 uppercase tracking-wider py-2 px-3">Stage</th>
                <th className="text-right font-mono text-[11px] text-uber-ink-3 uppercase tracking-wider py-2 px-3">Volume</th>
                <th className="text-right font-mono text-[11px] text-uber-ink-3 uppercase tracking-wider py-2 px-3">Neg %</th>
                <th className="text-left font-mono text-[11px] text-uber-ink-3 uppercase tracking-wider py-2 px-3">Sentiment</th>
                <th className="text-left font-mono text-[11px] text-uber-ink-3 uppercase tracking-wider py-2 px-3">Primary Pain</th>
                <th className="text-center font-mono text-[11px] text-uber-ink-3 uppercase tracking-wider py-2 px-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {stats.cdjData.map((row) => (
                <tr key={row.stage} className="border-b border-uber-gray-border">
                  <td className="font-body text-[13px] text-uber-black py-3 px-3">{row.stage}</td>
                  <td className="font-mono text-[13px] text-uber-ink-2 text-right py-3 px-3">{row.vol}</td>
                  <td className="font-mono text-[13px] text-uber-ink-2 text-right py-3 px-3">{row.negPct}%</td>
                  <td className="py-3 px-3">
                    <div className="w-full h-2 rounded overflow-hidden flex">
                      {row.vol > 0 && (
                        <>
                          <div className="h-full" style={{ width: `${(row.posCount / row.vol) * 100}%`, backgroundColor: '#06C167' }} />
                          <div className="h-full" style={{ width: `${(row.neuCount / row.vol) * 100}%`, backgroundColor: '#AAAAAA' }} />
                          <div className="h-full" style={{ width: `${(row.negCount / row.vol) * 100}%`, backgroundColor: '#E63946' }} />
                          <div className="h-full" style={{ width: `${(row.mixCount / row.vol) * 100}%`, backgroundColor: '#F4A261' }} />
                        </>
                      )}
                    </div>
                  </td>
                  <td className="font-body text-xs text-uber-ink-3 py-3 px-3">{row.topPain}</td>
                  <td className="text-center py-3 px-3">
                    <RiskBadge risk={row.risk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function TrendRow({ label, h1, h2, format, invert = false, main = false, sub = false }: { label: string; h1: number; h2: number; format: 'int' | 'avg' | 'pct'; invert?: boolean; main?: boolean; sub?: boolean }) {
  const delta = h2 - h1;
  const improving = invert ? delta < 0 : delta > 0;

  const fmt = (v: number) => {
    if (format === 'avg') return v.toFixed(1);
    if (format === 'pct') return Math.round(v) + '%';
    return String(Math.round(v));
  };
  const fmtDelta = (d: number) => {
    const sign = d > 0 ? '+' : '';
    if (format === 'avg') return sign + d.toFixed(1);
    if (format === 'pct') return sign + Math.round(d) + 'pp';
    return sign + Math.round(d);
  };

  const deltaColor = Math.round(delta * 100) === 0 ? '#717171' : improving ? '#06C167' : '#E63946';

  return (
    <tr className={main ? 'border-t border-[#333]' : ''}>
      <td className={`py-2 ${sub ? 'pl-4 font-mono text-[11px] text-uber-ink-3' : 'font-body text-xs text-white'}`}>{label}</td>
      <td className={`text-right py-2 font-mono ${sub ? 'text-[11px] text-uber-ink-3' : 'text-xs text-gray-100'}`}>{fmt(h1)}</td>
      <td className={`text-right py-2 font-mono ${sub ? 'text-[11px] text-uber-ink-3' : 'text-xs text-gray-100'}`}>{fmt(h2)}</td>
      <td className="text-right py-2 font-mono text-xs font-semibold" style={{ color: deltaColor }}>
        {fmtDelta(delta)}
      </td>
    </tr>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    Critical: { bg: '#E63946', text: '#FFFFFF' },
    High: { bg: '#FEECEE', text: '#E63946' },
    Medium: { bg: '#FEF3E8', text: '#F4A261' },
    Low: { bg: '#E8F9F0', text: '#028A47' },
  };
  const s = styles[risk] || styles.Low;
  return (
    <span className="rounded-pill px-2 py-0.5 font-mono text-[10px] font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
      {risk}
    </span>
  );
}
