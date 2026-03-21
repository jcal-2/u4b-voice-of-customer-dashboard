import { useMemo, useState } from 'react';
import { useVocData } from '@/context/VocDataContext';
import LoadingScreen from '@/components/LoadingScreen';
import { calcNps, calcCsat, calcCes, calcOrs, countByField, countPipeField, sortedEntries, getThemeColor, SENTIMENT_COLORS, ACTION_TAG_COLORS } from '@/lib/voc-utils';
import GaugeCard from '@/components/GaugeCard';

import { PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

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

    // Source health
    const posBySource: Record<string, number> = {};
    data.forEach(s => {
      if (s.sentiment === 'Positive') posBySource[s.feedback_source] = (posBySource[s.feedback_source] || 0) + 1;
    });
    const STRUCTURED_SOURCES = ['CES Survey', 'ORS Survey', 'CSAT Survey', 'NPS Survey'];
    const sourceHealth = Object.entries(sourceTotal)
      .map(([src, tot]) => ({
        name: src, total: tot,
        posPct: Math.round(100 * (posBySource[src] || 0) / tot),
        negPct: Math.round(100 * (negBySource[src] || 0) / tot),
        structured: STRUCTURED_SOURCES.includes(src),
      }))
      .sort((a, b) => b.total - a.total);

    // Monthly signal volume
    const monthlyCounts: Record<string, number> = {};
    data.forEach(s => { const m = s.captured_at.slice(0, 7); monthlyCounts[m] = (monthlyCounts[m] || 0) + 1; });
    const monthlyData = Object.entries(monthlyCounts).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
    const peakMonth = monthlyData.reduce((max, m) => m.count > max.count ? m : max, monthlyData[0]);

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

    // Theme trend H1 vs H2
    const POSITIVE_THEMES = ['Cost Savings Win', 'Expansion Opportunity', 'Proactive Onboarding'];
    const h1Themes = countPipeField(h1, 'sentiment_themes');
    const h2Themes = countPipeField(h2, 'sentiment_themes');
    const allThemeNames = Array.from(new Set([...Object.keys(h1Themes), ...Object.keys(h2Themes)]));
    const themeTrends = allThemeNames.map(name => {
      const h1c = h1Themes[name] || 0;
      const h2c = h2Themes[name] || 0;
      const total = h1c + h2c;
      const pctChange = h1c === 0 ? (h2c > 0 ? 100 : 0) : Math.round(((h2c - h1c) / h1c) * 100);
      const isPositive = POSITIVE_THEMES.includes(name);
      let trendLabel: string;
      let trendBg: string;
      let trendText: string;
      if (pctChange > 25) {
        if (isPositive) { trendLabel = '↑ Positive'; trendBg = '#E8F9F0'; trendText = '#028A47'; }
        else { trendLabel = '↑ Growing'; trendBg = '#FEECEE'; trendText = '#E63946'; }
      } else if (pctChange < -25) {
        if (isPositive) { trendLabel = '↓ Declining'; trendBg = '#FEECEE'; trendText = '#E63946'; }
        else { trendLabel = '↓ Improving'; trendBg = '#E8F9F0'; trendText = '#028A47'; }
      } else {
        trendLabel = '→ Stable'; trendBg = '#F6F6F6'; trendText = '#717171';
      }
      return { name, h1c, h2c, total, pctChange, trendLabel, trendBg, trendText };
    }).sort((a, b) => b.h2c - a.h2c);

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

    return { nps, csat, ces, ors, sentimentData, netSentiment, frictionCount, frictionPct: Math.round(100 * frictionCount / total), keyDrivers, sourceCounts, negRateBySource, actionCounts, themes, h1Nps, h2Nps, h1Csat, h2Csat, h1Neg, h2Neg, h1Pos, h2Pos, h1Vol: h1.length, h2Vol: h2.length, cdjData, total, themeTrends, sourceHealth, monthlyData, peakMonth };
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

        {/* ROW 1 — Sentiment Donut + Key Drivers (60/40) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Sentiment Distribution — Donut */}
          <div className="lg:col-span-3 bg-white border border-[#EBEBEB] rounded-2xl p-5">
            <h3 className="font-display text-base font-bold text-uber-black mb-4">Sentiment Distribution</h3>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative" style={{ width: 200, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.sentimentData}
                      dataKey="count"
                      innerRadius={65}
                      outerRadius={95}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      animationDuration={600}
                      animationEasing="ease-out"
                    >
                      {stats.sentimentData.map((entry) => (
                        <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || '#AAA'} />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#EBEBEB] rounded-lg px-3 py-2" style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#333' }}>
                          <strong>{d.name}</strong>: {d.count} ({d.pct}%)
                        </div>
                      );
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display text-[24px] font-extrabold text-uber-black">{stats.total.toLocaleString()}</span>
                  <span className="font-body text-[11px] text-uber-ink-3">signals</span>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-2.5 flex-1">
                {stats.sentimentData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[2px] flex-shrink-0" style={{ backgroundColor: SENTIMENT_COLORS[d.name] }} />
                    <span className="font-body text-[13px] text-uber-ink-2 flex-1">{d.name}</span>
                    <span className="font-mono text-[13px] text-uber-black font-semibold">{d.count}</span>
                    <span className="font-mono text-[13px]" style={{ color: SENTIMENT_COLORS[d.name] }}>{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Stat pills */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="rounded-full px-3 py-1 font-mono text-[11px]" style={{ backgroundColor: '#E8F9F0', color: '#028A47' }}>
                Net Sentiment {stats.netSentiment > 0 ? '+' : ''}{stats.netSentiment}pp
              </span>
              <span className="rounded-full px-3 py-1 font-mono text-[11px]" style={{ backgroundColor: '#FEECEE', color: '#E63946' }}>
                {stats.frictionPct}% friction signals
              </span>
            </div>
          </div>

          {/* Key Drivers — Lollipop style */}
          <div className="lg:col-span-2 bg-white border border-[#EBEBEB] rounded-2xl p-5">
            <h3 className="font-display text-base font-bold text-uber-black">Key Drivers Cited</h3>
            <p className="font-mono text-[10px] text-uber-ink-3 mb-4">NPS + CSAT responses only</p>
            <div className="space-y-2">
              {(() => {
                const sorted = sortedEntries(stats.keyDrivers);
                const maxCount = sorted[0]?.[1] || 1;
                return sorted.slice(0, 8).map(([driver, count], i) => (
                  <div key={driver} className="flex items-center gap-2 group hover:bg-[#F6F6F6] rounded-lg px-1 py-0.5 transition-colors">
                    <span className="font-mono text-[11px] text-uber-ink-3 w-4 text-right">{i + 1}</span>
                    <span className="font-body text-[12px] text-uber-ink-2 flex-1 truncate">{driver}</span>
                    <div className="w-20 flex items-center">
                      <div className="h-px bg-[#EBEBEB] flex-1" />
                      <div
                        className="rounded-full bg-[#2D6A9F] flex-shrink-0 transition-transform group-hover:scale-125"
                        style={{ width: 8 + Math.round(12 * (count / maxCount)), height: 8 + Math.round(12 * (count / maxCount)) }}
                      />
                    </div>
                    <span className="font-mono text-[12px] text-uber-black font-bold w-8 text-right">{count}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* ROW 2 — Source Health + Signal Velocity + Action Urgency (40/30/30) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          {/* Source Health Overview */}
          <div className="lg:col-span-4 bg-white border border-[#EBEBEB] rounded-2xl p-5">
            <h3 className="font-display text-base font-bold text-uber-black">Source Health Overview</h3>
            <p className="font-mono text-[10px] text-uber-ink-3 mb-3">Volume · Negative rate · per source</p>
            {(() => {
              const structured = stats.sourceHealth.filter(s => s.structured);
              const unstructured = stats.sourceHealth.filter(s => !s.structured);
              const renderRow = (s: typeof stats.sourceHealth[0]) => (
                <div key={s.name} className="flex items-center gap-2 py-1.5">
                  <span className="font-body text-[12px] text-uber-black flex-1 truncate">{s.name}</span>
                  <span className="font-mono text-[10px] bg-[#F6F6F6] text-uber-ink-2 rounded-full px-2 py-0.5">{s.total}</span>
                  <div className="w-20 h-1.5 rounded-full overflow-hidden flex bg-[#F6F6F6]">
                    <div className="h-full" style={{ width: `${s.posPct}%`, backgroundColor: '#06C167' }} />
                    <div className="h-full" style={{ width: `${s.negPct}%`, backgroundColor: '#E63946' }} />
                  </div>
                  <span className="font-mono text-[10px] w-8 text-right" style={{ color: s.negPct > 50 ? '#E63946' : s.negPct >= 30 ? '#F4A261' : '#028A47' }}>
                    {s.negPct}%
                  </span>
                </div>
              );
              return (
                <div>
                  <div className="font-mono text-[9px] text-uber-ink-3 uppercase tracking-[0.08em] mb-1">Structured</div>
                  {structured.map(renderRow)}
                  <div className="h-px bg-[#EBEBEB] my-2" />
                  <div className="font-mono text-[9px] text-uber-ink-3 uppercase tracking-[0.08em] mb-1">Unstructured</div>
                  {unstructured.map(renderRow)}
                </div>
              );
            })()}
          </div>

          {/* Monthly KPI Trends */}
          <MonthlyKpiTrends data={data} />

          {/* Action Urgency Panel */}
          <ActionUrgencyPanel actionCounts={stats.actionCounts} />
        </div>
        {/* Trend Comparison */}
        <div className="bg-uber-black rounded-t-[16px] p-6 text-white">
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

        {/* Theme Trend + Narrative Row */}
        <ThemeTrendSection themeTrends={stats.themeTrends} />

        {/* CDJ Stage Table — Transposed: stages as columns */}
        <div className="card-uber p-6 overflow-x-auto">
          <h3 className="font-display text-base font-bold text-uber-black mb-4">Negativity by CDJ Stage</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-uber-gray-card">
                <th className="text-left font-mono text-[11px] text-uber-ink-3 uppercase tracking-wider py-2 px-3">Metric</th>
                {stats.cdjData.map((row) => (
                  <th key={row.stage} className="text-center font-mono text-[10px] text-uber-ink-3 uppercase tracking-wider py-2 px-2 min-w-[120px]">{row.stage}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-uber-gray-border">
                <td className="font-body text-[13px] text-uber-black py-3 px-3">Volume</td>
                {stats.cdjData.map((row) => (
                  <td key={row.stage} className="font-mono text-[13px] text-uber-ink-2 text-center py-3 px-2">{row.vol}</td>
                ))}
              </tr>
              <tr className="border-b border-uber-gray-border">
                <td className="font-body text-[13px] text-uber-black py-3 px-3">Neg %</td>
                {stats.cdjData.map((row) => (
                  <td key={row.stage} className="font-mono text-[13px] text-uber-ink-2 text-center py-3 px-2">{row.negPct}%</td>
                ))}
              </tr>
              <tr className="border-b border-uber-gray-border">
                <td className="font-body text-[13px] text-uber-black py-3 px-3">Sentiment</td>
                {stats.cdjData.map((row) => (
                  <td key={row.stage} className="py-3 px-2">
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
                ))}
              </tr>
              <tr className="border-b border-uber-gray-border">
                <td className="font-body text-[13px] text-uber-black py-3 px-3">Primary Pain</td>
                {stats.cdjData.map((row) => (
                  <td key={row.stage} className="font-body text-xs text-uber-ink-3 text-center py-3 px-2">{row.topPain}</td>
                ))}
              </tr>
              <tr>
                <td className="font-body text-[13px] text-uber-black py-3 px-3">Risk</td>
                {stats.cdjData.map((row) => (
                  <td key={row.stage} className="text-center py-3 px-2">
                    <RiskBadge risk={row.risk} />
                  </td>
                ))}
              </tr>
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

function ThemeTrendSection({ themeTrends }: { themeTrends: { name: string; h1c: number; h2c: number; total: number; pctChange: number; trendLabel: string; trendBg: string; trendText: string }[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? themeTrends : themeTrends.slice(0, 10);

  return (
    <div className="-mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Theme Trend H1 vs H2 */}
      <div className="bg-white rounded-[16px] border border-[#EBEBEB] p-5">
        <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#000' }}>Theme Trend: H1 vs H2</h4>
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, marginTop: 4 }}>
          THEME · H1 COUNT → H2 COUNT · TREND
        </p>
        <div>
          {visible.map((t, i) => (
            <div key={t.name} className="flex items-center gap-3" style={{ padding: '8px 0', borderBottom: i < visible.length - 1 ? '1px solid #F6F6F6' : 'none' }}>
              <span className="flex-1 truncate" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#333' }}>{t.name}</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#AAAAAA', minWidth: 48, textAlign: 'right' }}>H1: {t.h1c}</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#000', fontWeight: 600, minWidth: 48, textAlign: 'right' }}>H2: {t.h2c}</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700, backgroundColor: t.trendBg, color: t.trendText, borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap' }}>{t.trendLabel}</span>
            </div>
          ))}
        </div>
        {themeTrends.length > 10 && (
          <button onClick={() => setShowAll(!showAll)} className="mt-3 text-[13px] font-medium" style={{ fontFamily: 'DM Sans, sans-serif', color: '#06C167', background: 'none', border: 'none', cursor: 'pointer' }}>
            {showAll ? 'Show less' : 'Show all'}
          </button>
        )}
      </div>

      {/* Right: Trend Narrative */}
      <div className="bg-white rounded-[16px] border border-[#EBEBEB] p-5">
        <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#000', marginBottom: 16 }}>Trend Narrative</h4>
        <div className="space-y-4">
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#333', lineHeight: 1.7 }}>
            <span style={{ color: '#000', fontWeight: 700 }}>What improved: </span>
            NPS jumped 16 points from H1 to H2, the single most important signal in the dataset. Cost Savings Win mentions grew, suggesting the value proposition is becoming more tangible for accounts past the 12-month mark. Expansion Opportunity signals also rose — indicating that successfully deployed accounts are becoming advocates for program growth.
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#333', lineHeight: 1.7 }}>
            <span style={{ color: '#E63946', fontWeight: 700 }}>What got worse: </span>
            Dashboard Visibility mentions grew 19% H1→H2, Invoicing &amp; Support Friction grew 16%, and Poor Fit / Churn Signals grew 40%. These are the three themes that most directly threaten revenue — and all three are accelerating. The NPS improvement may be masking structural churn risk building underneath.
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#333', lineHeight: 1.7 }}>
            <span style={{ color: '#2D6A9F', fontWeight: 700 }}>What's new in H2: </span>
            The ≤6 Month accounts (Perplexity AI, AfriCert Logistics, Mercado Libre, ByteDance, Delivery Hero) are generating early churn signals — a pattern consistent with Self-Serve SMB onboarding without dedicated CS support.
          </p>
          <div style={{ backgroundColor: '#FEF3E8', borderRadius: 10, padding: '14px 16px', marginTop: 16 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#7a4500', lineHeight: 1.7 }}>
              <span style={{ color: '#F4A261', fontWeight: 700 }}>Bottom line: </span>
              The trajectory is improving on relationship metrics but deteriorating on operational metrics. If Dashboard Visibility, Billing Friction, and Adoption Barriers are not addressed in the next two quarters, the NPS gain will stall or reverse — particularly as Mid-Market and SMB accounts approach renewal in H2 2026.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlyKpiTrends({ data }: { data: import('@/types/voc').VocSignal[] }) {
  const { months, metrics } = useMemo(() => {
    const byMonth: Record<string, import('@/types/voc').VocSignal[]> = {};
    data.forEach(s => {
      const m = s.captured_at.slice(0, 7);
      (byMonth[m] ||= []).push(s);
    });
    const sortedMonths = Object.keys(byMonth).sort();
    const fmt = (ym: string) => {
      const [y, m] = ym.split('-');
      const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${names[parseInt(m) - 1]} '${y.slice(2)}`;
    };

    const npsData: { month: string; value: number | null }[] = [];
    const csatData: { month: string; value: number | null }[] = [];
    const cesData: { month: string; value: number | null }[] = [];
    const orsData: { month: string; value: number | null }[] = [];
    let npsTotal = 0, csatTotal = 0, cesTotal = 0, orsTotal = 0;

    sortedMonths.forEach(ym => {
      const sigs = byMonth[ym];
      const label = fmt(ym);

      // NPS
      const npsSigs = sigs.filter(s => s.nps_score !== null);
      npsTotal += npsSigs.length;
      if (npsSigs.length >= 3) {
        const p = npsSigs.filter(s => s.nps_score! >= 9).length;
        const d = npsSigs.filter(s => s.nps_score! <= 6).length;
        npsData.push({ month: label, value: Math.round(100 * (p / npsSigs.length - d / npsSigs.length)) });
      } else { npsData.push({ month: label, value: null }); }

      // CSAT
      const csatSigs = sigs.filter(s => s.csat_score !== null);
      csatTotal += csatSigs.length;
      if (csatSigs.length >= 3) {
        const avg = csatSigs.reduce((a, s) => a + s.csat_score!, 0) / csatSigs.length;
        csatData.push({ month: label, value: Math.round(avg * 10) / 10 });
      } else { csatData.push({ month: label, value: null }); }

      // CES
      const cesSigs = sigs.filter(s => s.ces_score !== null);
      cesTotal += cesSigs.length;
      if (cesSigs.length >= 3) {
        const yes = cesSigs.filter(s => s.ces_score === 'Yes').length;
        cesData.push({ month: label, value: Math.round(100 * yes / cesSigs.length) });
      } else { cesData.push({ month: label, value: null }); }

      // ORS
      const orsSigs = sigs.filter(s => s.ors_score !== null);
      orsTotal += orsSigs.length;
      if (orsSigs.length >= 3) {
        const yes = orsSigs.filter(s => s.ors_score === 'Yes').length;
        orsData.push({ month: label, value: Math.round(100 * yes / orsSigs.length) });
      } else { orsData.push({ month: label, value: null }); }
    });

    const last = (arr: { value: number | null }[]) => {
      for (let i = arr.length - 1; i >= 0; i--) if (arr[i].value !== null) return arr[i].value;
      return null;
    };
    const secondLast = (arr: { value: number | null }[]) => {
      let found = 0;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].value !== null) { found++; if (found === 2) return arr[i].value; }
      }
      return null;
    };

    return {
      months: sortedMonths.map(fmt),
      metrics: [
        { name: 'NPS Score', color: '#F4A261', data: npsData, current: last(npsData), prev: secondLast(npsData), total: npsTotal, target: 'TGT: +32', fmt: (v: number) => (v > 0 ? '+' : '') + v },
        { name: 'CSAT Average', color: '#2D6A9F', data: csatData, current: last(csatData), prev: secondLast(csatData), total: csatTotal, target: 'TGT: 7.5', fmt: (v: number) => v.toFixed(1) },
        { name: 'CES Yes%', color: '#7B4F9E', data: cesData, current: last(cesData), prev: secondLast(cesData), total: cesTotal, target: 'TGT: 70%', fmt: (v: number) => v + '%' },
        { name: 'ORS Yes%', color: '#2A9D8F', data: orsData, current: last(orsData), prev: secondLast(orsData), total: orsTotal, target: 'TGT: 70%', fmt: (v: number) => v + '%' },
      ],
    };
  }, [data]);

  return (
    <div className="lg:col-span-3 bg-white border border-[#EBEBEB] rounded-2xl p-5">
      <h3 className="font-display text-base font-bold text-uber-black">Monthly KPI Trends</h3>
      <p className="font-mono text-[10px] text-uber-ink-3 mb-3">Survey scores over time · Jul 2024 – Mar 2026</p>

      <div className="divide-y divide-[#F6F6F6]">
        {metrics.map(m => {
          const delta = m.current !== null && m.prev !== null ? Math.round((m.current - m.prev) * 10) / 10 : null;
          return (
            <div key={m.name} className="flex items-center gap-2 py-2.5">
              {/* Left */}
              <div className="w-[100px] flex-shrink-0">
                <div className="font-body text-[12px] font-semibold text-uber-black">{m.name}</div>
                <div className="font-display text-[20px] font-bold" style={{ color: m.color }}>
                  {m.current !== null ? m.fmt(m.current) : '—'}
                </div>
                {delta !== null && (
                  <div className="font-mono text-[10px]" style={{ color: delta >= 0 ? '#06C167' : '#E63946' }}>
                    {delta >= 0 ? '▲' : '▼'} {delta > 0 ? '+' : ''}{delta}
                  </div>
                )}
              </div>

              {/* Sparkline */}
              <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height={48}>
                  <LineChart data={m.data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0] || payload[0].value === undefined) return null;
                        const d = payload[0].payload;
                        if (d.value === null) return null;
                        return (
                          <span className="font-mono text-[11px]" style={{ color: m.color }}>
                            {d.month}: {m.fmt(d.value)}
                          </span>
                        );
                      }}
                      wrapperStyle={{ outline: 'none', background: 'transparent', border: 'none', boxShadow: 'none' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={m.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: m.color, stroke: m.color }}
                      connectNulls={false}
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Right */}
              <div className="w-[60px] flex-shrink-0 text-right">
                <div className="font-mono text-[10px] text-uber-ink-3">n={m.total}</div>
                <div className="font-mono text-[9px] text-uber-ink-3">{m.target}</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[9px] text-uber-ink-3 italic mt-2">
        Months with &lt; 3 responses excluded from trendline
      </p>
    </div>
  );
}

function ActionUrgencyPanel({ actionCounts }: { actionCounts: Record<string, number> }) {
  const navigate = useNavigate();
  const escalations = actionCounts['Escalation'] || 0;
  const churnRisk = actionCounts['Churn Risk'] || 0;
  const secondary = [
    { tag: 'Go-to-Gemba', color: '#7B4F9E', count: actionCounts['Go-to-Gemba'] || 0 },
    { tag: 'Expansion Opp', color: '#06C167', count: actionCounts['Expansion Opportunity'] || 0 },
    { tag: 'Product Feature', color: '#2D6A9F', count: actionCounts['Product Feature'] || 0 },
    { tag: 'ICP Research', color: '#2A9D8F', count: actionCounts['ICP Research'] || 0 },
  ];

  return (
    <div className="lg:col-span-3 bg-white border border-[#EBEBEB] rounded-2xl p-5">
      <h3 className="font-display text-base font-bold text-uber-black">Action Required</h3>
      <p className="font-mono text-[10px] text-uber-ink-3 mb-3">Signals needing follow-up</p>

      {/* Critical box */}
      <div className="font-mono text-[9px] text-[#E63946] uppercase tracking-[0.1em] mb-1.5">⚠ Immediate Attention</div>
      <div className="bg-[#FEECEE] rounded-[10px] p-3 flex items-center">
        <div className="flex-1 text-center">
          <div className="font-display text-[32px] font-extrabold" style={{ color: '#E63946' }}>{escalations}</div>
          <div className="font-body text-[11px]" style={{ color: '#E63946' }}>Escalations</div>
        </div>
        <div className="w-px h-10 bg-[#E63946]/20" />
        <div className="flex-1 text-center">
          <div className="font-display text-[32px] font-extrabold" style={{ color: '#F4A261' }}>{churnRisk}</div>
          <div className="font-body text-[11px]" style={{ color: '#F4A261' }}>Churn Risk</div>
        </div>
      </div>

      <div className="h-px bg-[#EBEBEB] my-3" />

      {/* Secondary 2×2 */}
      <div className="grid grid-cols-2 gap-2">
        {secondary.map(s => (
          <div key={s.tag} className="bg-[#F6F6F6] rounded-[10px] p-3 text-center">
            <div className="font-display text-[22px] font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="font-body text-[10px] text-uber-ink-3">{s.tag}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/actions')}
        className="mt-3 font-body text-[12px] text-[#06C167] hover:underline active:scale-95 transition-all"
      >
        View all action items →
      </button>
    </div>
  );
}
