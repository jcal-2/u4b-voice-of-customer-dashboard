import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Papa from 'papaparse';
import { VocSignal } from '@/types/voc';
import csvUrl from '@/data/voc_signals.csv?url';

interface VocDataContextType {
  data: VocSignal[];
  loading: boolean;
  error: string | null;
}

const VocDataContext = createContext<VocDataContextType>({
  data: [],
  loading: true,
  error: null,
});

export const useVocData = () => useContext(VocDataContext);

function splitPipe(val: string | undefined | null): string[] {
  if (!val || val.trim() === '') return [];
  return val.split(' | ').filter(Boolean);
}

function parseNumeric(val: string | undefined | null): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseNullableText(val: string | undefined | null): string | null {
  if (!val || val.trim() === '') return null;
  return val;
}

function parseRow(row: Record<string, string>): VocSignal {
  return {
    signal_id: row.signal_id || '',
    golden_record_id: row.golden_record_id || '',
    contact_id: row.contact_id || '',
    customer_name: row.customer_name || '',
    account_name: row.account_name || '',
    role: row.role || '',
    bu_segment: row.bu_segment || '',
    sales_segment: row.sales_segment || '',
    role_archetype: row.role_archetype || '',
    mega_region: row.mega_region || '',
    acquisition_type: row.acquisition_type || '',
    product_division: row.product_division || '',
    contract_start: row.contract_start || '',
    tenure_years: parseNumeric(row.tenure_years),
    cdj_stage: row.cdj_stage || '',
    feedback_source: row.feedback_source || '',
    source_type: row.source_type || '',
    captured_at: row.captured_at || '',
    verbatim_text: row.verbatim_text || '',
    sentiment: row.sentiment || '',
    sentiment_themes: splitPipe(row.sentiment_themes),
    action_tag: row.action_tag || '',
    active_u4b_drivers: splitPipe(row.active_u4b_drivers),
    survey_id: parseNullableText(row.survey_id),
    survey_scale_type: parseNullableText(row.survey_scale_type),
    ces_score: parseNullableText(row.ces_score),
    ors_score: parseNullableText(row.ors_score),
    csat_score: parseNumeric(row.csat_score),
    nps_score: parseNumeric(row.nps_score),
    key_drivers_selected: splitPipe(row.key_drivers_selected),
    conditional_follow_up_response: parseNullableText(row.conditional_follow_up_response),
  };
}

export function VocDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<VocSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(csvUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Data file not found');
        return res.text();
      })
      .then((text) => {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        const parsed = (result.data as Record<string, string>[]).map(parseRow);
        setData(parsed);
        setLoading(false);
      })
      .catch(() => {
        setError('Data file not found. Please add voc_signals.csv to src/data/ and restart.');
        setLoading(false);
      });
  }, []);

  return (
    <VocDataContext.Provider value={{ data, loading, error }}>
      {children}
    </VocDataContext.Provider>
  );
}
