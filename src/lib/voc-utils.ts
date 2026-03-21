import { VocSignal } from '@/types/voc';

export function calcNps(signals: VocSignal[]) {
  const scored = signals.filter((s) => s.nps_score !== null);
  if (scored.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0, pPct: 0, paPct: 0, dPct: 0 };
  const promoters = scored.filter((s) => s.nps_score! >= 9).length;
  const passives = scored.filter((s) => s.nps_score! >= 7 && s.nps_score! < 9).length;
  const detractors = scored.filter((s) => s.nps_score! <= 6).length;
  const n = scored.length;
  return {
    score: Math.round(100 * (promoters / n - detractors / n)),
    promoters, passives, detractors, total: n,
    pPct: Math.round(100 * promoters / n),
    paPct: Math.round(100 * passives / n),
    dPct: Math.round(100 * detractors / n),
  };
}

export function calcCsat(signals: VocSignal[]) {
  const scored = signals.filter((s) => s.csat_score !== null);
  if (scored.length === 0) return { avg: 0, score: 0, promoters: 0, passives: 0, detractors: 0, total: 0, pPct: 0, paPct: 0, dPct: 0 };
  const sum = scored.reduce((a, s) => a + s.csat_score!, 0);
  const avg = sum / scored.length;
  const promoters = scored.filter((s) => s.csat_score! >= 9).length;
  const passives = scored.filter((s) => s.csat_score! >= 7 && s.csat_score! < 9).length;
  const detractors = scored.filter((s) => s.csat_score! <= 6).length;
  const n = scored.length;
  return {
    avg: Math.round(avg * 100) / 100,
    score: Math.round(100 * (promoters / n - detractors / n)),
    promoters, passives, detractors, total: n,
    pPct: Math.round(100 * promoters / n),
    paPct: Math.round(100 * passives / n),
    dPct: Math.round(100 * detractors / n),
  };
}

export function calcCes(signals: VocSignal[]) {
  const scored = signals.filter((s) => s.ces_score !== null);
  if (scored.length === 0) return { yesPct: 0, noPct: 0, unsurePct: 0, total: 0 };
  const yes = scored.filter((s) => s.ces_score === 'Yes').length;
  const no = scored.filter((s) => s.ces_score === 'No').length;
  const unsure = scored.filter((s) => s.ces_score === 'Unsure').length;
  const n = scored.length;
  return {
    yesPct: Math.round(100 * yes / n),
    noPct: Math.round(100 * no / n),
    unsurePct: Math.round(100 * unsure / n),
    total: n,
  };
}

export function calcOrs(signals: VocSignal[]) {
  const scored = signals.filter((s) => s.ors_score !== null);
  if (scored.length === 0) return { yesPct: 0, noPct: 0, unsurePct: 0, total: 0 };
  const yes = scored.filter((s) => s.ors_score === 'Yes').length;
  const no = scored.filter((s) => s.ors_score === 'No').length;
  const unsure = scored.filter((s) => s.ors_score === 'Unsure').length;
  const n = scored.length;
  return {
    yesPct: Math.round(100 * yes / n),
    noPct: Math.round(100 * no / n),
    unsurePct: Math.round(100 * unsure / n),
    total: n,
  };
}

export function countByField(signals: VocSignal[], field: keyof VocSignal): Record<string, number> {
  const counts: Record<string, number> = {};
  signals.forEach((s) => {
    const val = s[field];
    if (val && typeof val === 'string' && val.trim()) {
      counts[val] = (counts[val] || 0) + 1;
    }
  });
  return counts;
}

export function countPipeField(signals: VocSignal[], field: 'sentiment_themes' | 'active_u4b_drivers' | 'key_drivers_selected'): Record<string, number> {
  const counts: Record<string, number> = {};
  signals.forEach((s) => {
    const arr = s[field];
    if (Array.isArray(arr)) {
      arr.forEach((v) => {
        if (v.trim()) counts[v.trim()] = (counts[v.trim()] || 0) + 1;
      });
    }
  });
  return counts;
}

export function sortedEntries(obj: Record<string, number>, dir: 'desc' | 'asc' = 'desc'): [string, number][] {
  return Object.entries(obj).sort((a, b) => dir === 'desc' ? b[1] - a[1] : a[1] - b[1]);
}

export const SENTIMENT_THEME_COLORS: Record<string, { bg: string; text: string }> = {
  'Invoicing & Support Friction': { bg: '#FEECEE', text: '#E63946' },
  'Adoption Barrier': { bg: '#FEECEE', text: '#E63946' },
  'Service Reliability': { bg: '#FEECEE', text: '#E63946' },
  'Poor Fit / Churn Signal': { bg: '#FEECEE', text: '#E63946' },
  'Dashboard Visibility': { bg: '#FEECEE', text: '#E63946' },
  'Integration Friction': { bg: '#FEECEE', text: '#E63946' },
  'Cost Savings Win': { bg: '#E8F9F0', text: '#028A47' },
  'Expansion Opportunity': { bg: '#E8F9F0', text: '#028A47' },
  'Proactive Onboarding': { bg: '#E8F9F0', text: '#028A47' },
  'Perceived Value for Price': { bg: '#FEF3E8', text: '#F4A261' },
  'Feature Request for Product Roadmap': { bg: '#FEF3E8', text: '#F4A261' },
  'Low Account Signal': { bg: '#F6F6F6', text: '#717171' },
  'Early Lifecycle Investment': { bg: '#F6F6F6', text: '#717171' },
  'Relationship Quality': { bg: '#F6F6F6', text: '#717171' },
};

export function getThemeColor(theme: string) {
  return SENTIMENT_THEME_COLORS[theme] || { bg: '#F6F6F6', text: '#717171' };
}

export const SOURCE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  'CES Survey': { bg: '#EBF3FB', text: '#2D6A9F' },
  'ORS Survey': { bg: '#EBF3FB', text: '#2D6A9F' },
  'CSAT Survey': { bg: '#EBF3FB', text: '#2D6A9F' },
  'NPS Survey': { bg: '#EBF3FB', text: '#2D6A9F' },
  'CRM Account Notes': { bg: '#F3EEF9', text: '#7B4F9E' },
  'CS Channel Conversation': { bg: '#E6F5F4', text: '#2A9D8F' },
  'Support Ticket': { bg: '#FEECEE', text: '#E63946' },
  'Product Feedback Log': { bg: '#FEF3E8', text: '#F4A261' },
  'In-App Feedback': { bg: '#F6F6F6', text: '#717171' },
  'Website Chat Transcript': { bg: '#EBF3FB', text: '#2D6A9F' },
};

export const ACTION_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'Escalation': { bg: '#FEECEE', text: '#E63946' },
  'Churn Risk': { bg: '#FEF3E8', text: '#F4A261' },
  'Go-to-Gemba': { bg: '#F3EEF9', text: '#7B4F9E' },
  'Expansion Opportunity': { bg: '#E8F9F0', text: '#028A47' },
  'Product Feature': { bg: '#EBF3FB', text: '#2D6A9F' },
  'ICP Research': { bg: '#E6F5F4', text: '#2A9D8F' },
  'Financial Analysis': { bg: '#FEF3E8', text: '#F4A261' },
  'None': { bg: '#F6F6F6', text: '#AAAAAA' },
};

export const SENTIMENT_COLORS: Record<string, string> = {
  'Positive': '#06C167',
  'Negative': '#E63946',
  'Neutral': '#AAAAAA',
  'Mixed': '#F4A261',
};
