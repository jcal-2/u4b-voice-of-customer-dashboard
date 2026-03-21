import { useEffect, useRef, useState } from 'react';

interface BreakdownRow {
  label: string;
  dotColor: string;
  value: string;
  valueColor?: string;
  count?: number;
  bold?: boolean;
}

interface GaugeCardProps {
  value: number;
  min: number;
  max: number;
  displayValue: string;
  fillColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  target?: { value: number; label: string };
  zones?: { end: number; color: string }[];
  breakdownRows: BreakdownRow[];
}

export default function GaugeCard({
  value,
  min,
  max,
  displayValue,
  fillColor,
  accentColor,
  title,
  subtitle,
  target,
  zones,
  breakdownRows,
}: GaugeCardProps) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const mounted = useRef(false);

  const range = max - min;
  const pct = Math.max(0, Math.min(1, (value - min) / range));

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const start = performance.now();
    const dur = 800;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimatedPct(pct * ease);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [pct]);

  const w = 200;
  const h = 110;
  const cx = w / 2;
  const cy = h;
  const r = 80;
  const strokeW = 14;

  const arcPath = (startAngle: number, endAngle: number) => {
    const s = (startAngle * Math.PI) / 180;
    const e = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(Math.PI + s);
    const y1 = cy + r * Math.sin(Math.PI + s);
    const x2 = cx + r * Math.cos(Math.PI + e);
    const y2 = cy + r * Math.sin(Math.PI + e);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const targetPct = target ? (target.value - min) / range : null;
  const targetAngle = targetPct !== null ? targetPct * 180 : null;

  const actualFillColor = zones
    ? (() => {
        const valPct = pct * 100;
        for (const z of zones) {
          if (valPct <= z.end) return z.color;
        }
        return zones[zones.length - 1]?.color || fillColor;
      })()
    : fillColor;

  // Scale label positions: just below arc ends, outside
  const scaleLabelY = h + 18;

  return (
    <div
      className="bg-white rounded-2xl border border-[#EBEBEB] p-5 relative overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:border-[#D0D0D0]"
      style={{ minHeight: 280 }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: accentColor }} />

      {/* Gauge */}
      <div className="flex justify-center mt-3 mb-2">
        <svg width={w} height={h + 24} viewBox={`0 0 ${w} ${h + 24}`}>
          {/* Track */}
          {zones ? (
            zones.map((zone, i) => {
              const prevEnd = i === 0 ? 0 : zones[i - 1].end;
              const startA = (prevEnd / 100) * 180;
              const endA = (zone.end / 100) * 180;
              return (
                <path
                  key={i}
                  d={arcPath(startA, endA)}
                  fill="none"
                  stroke={zone.color}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  opacity={0.2}
                />
              );
            })
          ) : (
            <path
              d={arcPath(0, 180)}
              fill="none"
              stroke="#F6F6F6"
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          )}

          {/* Fill */}
          {animatedPct > 0.005 && (
            <path
              d={arcPath(0, animatedPct * 180)}
              fill="none"
              stroke={actualFillColor}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          )}

          {/* Target tick (no text label) */}
          {targetAngle !== null && (() => {
            const a = Math.PI + (targetAngle * Math.PI) / 180;
            const tx = cx + r * Math.cos(a);
            const ty = cy + r * Math.sin(a);
            const outerR = r + 10;
            const tx2 = cx + outerR * Math.cos(a);
            const ty2 = cy + outerR * Math.sin(a);
            return (
              <line x1={tx} y1={ty} x2={tx2} y2={ty2} stroke="#AAAAAA" strokeWidth={2} />
            );
          })()}

          {/* Hero value */}
          <text
            x={cx}
            y={cy - 18}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#000000"
            fontSize={56}
            fontFamily="Syne, sans-serif"
            fontWeight={800}
            letterSpacing="-0.04em"
          >
            {displayValue}
          </text>

          {/* Scale labels — below arc ends */}
          <text x={cx - r} y={scaleLabelY} fill="#AAAAAA" fontSize={10} fontFamily="DM Mono, monospace" textAnchor="middle">
            {min === -100 ? '−100' : min}
          </text>
          <text x={cx + r} y={scaleLabelY} fill="#AAAAAA" fontSize={10} fontFamily="DM Mono, monospace" textAnchor="middle">
            {min === -100 ? '+100' : max === 100 ? '100%' : String(max)}
          </text>
        </svg>
      </div>

      {/* Title & subtitle */}
      <div className="text-center mb-3">
        <div className="font-body text-[13px] font-semibold text-[#000000]">{title}</div>
        <div className="font-body text-[11px] text-[#AAAAAA]">{subtitle}</div>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-0">
        {breakdownRows.map((row, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 py-1.5 ${i > 0 ? 'border-t border-[#EBEBEB]' : ''}`}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.dotColor }} />
            <span
              className="flex-1"
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: row.bold ? 14 : 13,
                fontWeight: row.bold ? 700 : 400,
                color: row.bold ? (row.valueColor || '#000000') : '#717171',
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: row.bold ? 14 : 13,
                fontWeight: row.bold ? 700 : 400,
                color: row.bold ? (row.valueColor || '#000000') : (row.valueColor || '#717171'),
              }}
            >
              {row.value}
              {row.count !== undefined && (
                <span style={{ color: '#AAAAAA' }}> · {row.count}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
