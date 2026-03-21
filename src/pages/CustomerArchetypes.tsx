import { useState, useMemo } from 'react';
import { useVocData } from '@/context/VocDataContext';
import LoadingScreen from '@/components/LoadingScreen';
import { SENTIMENT_COLORS, ACTION_TAG_COLORS, countByField } from '@/lib/voc-utils';
import { X } from 'lucide-react';
import type { VocSignal } from '@/types/voc';

const BU_OPTIONS = ['All', 'Mobility', 'Delivery', 'Freight'];
const SALES_OPTIONS = ['All', 'Strategic', 'Enterprise', 'Mid-Market', 'SMB'];
const REGION_OPTIONS = ['All', 'US&C', 'EMEA', 'APAC', 'LATAM'];
const TENURE_OPTIONS = ['All', '4+ Years', '3+ Years', '≤2 Years', '≤1 Year', '≤6 Months'];
const ACQ_OPTIONS = ['All', 'Sales', 'Self-Serve'];

function tenureBucket(years: number | null): string {
  if (years === null) return '≤6 Months';
  if (years >= 4) return '4+ Years';
  if (years >= 3) return '3+ Years';
  if (years >= 1) return '≤2 Years';
  if (years >= 0.5) return '≤1 Year';
  return '≤6 Months';
}

interface AccountProfile {
  account_name: string;
  customer_name: string;
  role: string;
  bu_segment: string;
  sales_segment: string;
  mega_region: string;
  acquisition_type: string;
  product_division: string;
  contract_start: string;
  tenure_years: number | null;
  signals: VocSignal[];
  sentimentCounts: Record<string, number>;
}

export default function CustomerArchetypes() {
  const { data, loading, error } = useVocData();
  const [bu, setBu] = useState('All');
  const [sales, setSales] = useState('All');
  const [region, setRegion] = useState('All');
  const [tenure, setTenure] = useState('All');
  const [acq, setAcq] = useState('All');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const accounts = useMemo(() => {
    const map = new Map<string, AccountProfile>();
    data.forEach(s => {
      if (!map.has(s.account_name)) {
        map.set(s.account_name, {
          account_name: s.account_name,
          customer_name: s.customer_name,
          role: s.role,
          bu_segment: s.bu_segment,
          sales_segment: s.sales_segment,
          mega_region: s.mega_region,
          acquisition_type: s.acquisition_type,
          product_division: s.product_division,
          contract_start: s.contract_start,
          tenure_years: s.tenure_years,
          signals: [],
          sentimentCounts: {},
        });
      }
      const acc = map.get(s.account_name)!;
      acc.signals.push(s);
      acc.sentimentCounts[s.sentiment] = (acc.sentimentCounts[s.sentiment] || 0) + 1;
    });
    return Array.from(map.values());
  }, [data]);

  const filtered = useMemo(() => {
    return accounts.filter(a => {
      if (bu !== 'All' && a.bu_segment !== bu) return false;
      if (sales !== 'All' && a.sales_segment !== sales) return false;
      if (region !== 'All' && a.mega_region !== region) return false;
      if (acq !== 'All' && a.acquisition_type !== acq) return false;
      if (tenure !== 'All' && tenureBucket(a.tenure_years) !== tenure) return false;
      return true;
    });
  }, [accounts, bu, sales, region, tenure, acq]);

  const selected = selectedAccount ? accounts.find(a => a.account_name === selectedAccount) : null;

  if (loading || error) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-white">
      {/* Filter Bar */}
      <div className="bg-white w-full px-6 py-4 border-b border-uber-gray-border">
        <div className="max-w-7xl mx-auto space-y-3">
          <FilterRow label="BU Segment" options={BU_OPTIONS} value={bu} onChange={setBu} />
          <FilterRow label="Sales Segment" options={SALES_OPTIONS} value={sales} onChange={setSales} />
          <FilterRow label="Mega Region" options={REGION_OPTIONS} value={region} onChange={setRegion} />
          <FilterRow label="Tenure" options={TENURE_OPTIONS} value={tenure} onChange={setTenure} />
          <FilterRow label="Acquisition" options={ACQ_OPTIONS} value={acq} onChange={setAcq} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(account => (
            <AccountCard key={account.account_name} account={account} onClick={() => setSelectedAccount(account.account_name)} />
          ))}
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <AccountDrawer account={selected} onClose={() => setSelectedAccount(null)} />
      )}
    </div>
  );
}

function FilterRow({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="font-mono text-[10px] text-uber-ink-3 uppercase tracking-wider w-24">{label}</span>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-pill px-3 py-1 font-body text-xs transition-colors ${
            value === opt ? 'bg-uber-green text-white' : 'bg-uber-gray-card text-uber-black'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function AccountCard({ account, onClick }: { account: AccountProfile; onClick: () => void }) {
  const buColors: Record<string, string> = { Mobility: '#06C167', Delivery: '#2D6A9F', Freight: '#F4A261' };
  const total = account.signals.length;
  return (
    <div className="bg-white rounded-uber border border-uber-gray-border p-4 cursor-pointer hover:border-uber-green transition-colors" onClick={onClick}>
      <div className="h-1 w-full rounded-t-uber -mt-4 -mx-4 mb-3" style={{ backgroundColor: buColors[account.bu_segment] || '#AAA', width: 'calc(100% + 2rem)' }} />
      <h3 className="font-display text-[15px] font-bold text-uber-black">{account.customer_name}</h3>
      <p className="font-body text-xs text-uber-ink-3">{account.account_name}</p>
      <p className="font-body text-xs text-uber-ink-2 italic">{account.role}</p>
      <div className="flex gap-1 mt-2 flex-wrap">
        <span className="rounded-pill px-2 py-0.5 text-[10px] font-mono bg-uber-gray-card text-uber-ink-2">{account.sales_segment}</span>
        <span className="rounded-pill px-2 py-0.5 text-[10px] font-mono bg-uber-gray-card text-uber-ink-2">{account.mega_region}</span>
        <span className="rounded-pill px-2 py-0.5 text-[10px] font-mono bg-uber-gray-card text-uber-ink-2">{account.acquisition_type}</span>
      </div>
      <div className="flex gap-1 mt-1.5">
        <span className="rounded-md px-2 py-0.5 text-[10px] font-mono bg-uber-gray-card text-uber-ink-3">{account.product_division}</span>
        <span className="rounded-md px-2 py-0.5 text-[10px] font-mono bg-uber-gray-card text-uber-ink-3">{account.bu_segment}</span>
      </div>
      <p className="font-mono text-[11px] text-uber-ink-4 mt-2">{account.contract_start} · {account.tenure_years !== null ? `${account.tenure_years} yrs` : '—'}</p>
      <p className="font-body text-xs text-uber-ink-3 mt-1">{total} feedback signals</p>
      <div className="w-full h-1 rounded-full overflow-hidden flex mt-1.5">
        {['Positive', 'Mixed', 'Neutral', 'Negative'].map(s => {
          const count = account.sentimentCounts[s] || 0;
          if (!count) return null;
          return <div key={s} className="h-full" style={{ width: `${100 * count / total}%`, backgroundColor: SENTIMENT_COLORS[s] }} />;
        })}
      </div>
    </div>
  );
}

function AccountDrawer({ account, onClose }: { account: AccountProfile; onClose: () => void }) {
  const hasChurnRisk = account.signals.some(s => s.action_tag === 'Churn Risk');
  const hasEscalation = account.signals.some(s => s.action_tag === 'Escalation');
  const actionCounts = countByField(account.signals, 'action_tag' as keyof VocSignal);
  const lastFive = [...account.signals].sort((a, b) => b.captured_at.localeCompare(a.captured_at)).slice(0, 5);
  const total = account.signals.length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md shadow-xl overflow-y-auto p-6 space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-uber-ink-3 hover:text-uber-black">
          <X size={20} />
        </button>

        {(hasChurnRisk || hasEscalation) && (
          <div className="bg-uber-red-light text-uber-red rounded-lg p-3 font-body text-sm">
            ⚠ {hasChurnRisk ? 'Churn Risk signals detected' : 'Escalation flagged for this account'}
          </div>
        )}

        <h2 className="font-display text-lg font-bold text-uber-black">{account.customer_name}</h2>
        <p className="font-body text-sm text-uber-ink-3">{account.account_name} · {account.role}</p>
        <div className="flex gap-1 flex-wrap">
          {[account.sales_segment, account.mega_region, account.acquisition_type, account.bu_segment, account.product_division].map(v => (
            <span key={v} className="rounded-pill px-2 py-0.5 text-[10px] font-mono bg-uber-gray-card text-uber-ink-2">{v}</span>
          ))}
        </div>
        <p className="font-mono text-[11px] text-uber-ink-4">{account.contract_start} · {account.tenure_years !== null ? `${account.tenure_years} yrs` : '—'}</p>

        {/* Sentiment Bar */}
        <div>
          <p className="font-body text-xs text-uber-ink-3 mb-1">Sentiment ({total} signals)</p>
          <div className="w-full h-2 rounded-full overflow-hidden flex">
            {['Positive', 'Mixed', 'Neutral', 'Negative'].map(s => {
              const count = account.sentimentCounts[s] || 0;
              if (!count) return null;
              return <div key={s} className="h-full" style={{ width: `${100 * count / total}%`, backgroundColor: SENTIMENT_COLORS[s] }} />;
            })}
          </div>
          <div className="flex gap-3 mt-1">
            {['Positive', 'Negative', 'Mixed', 'Neutral'].map(s => (
              <span key={s} className="font-mono text-[10px] text-uber-ink-3">{s}: {account.sentimentCounts[s] || 0}</span>
            ))}
          </div>
        </div>

        {/* Action Tags */}
        <div>
          <p className="font-body text-xs text-uber-ink-3 mb-1">Action Tags</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(actionCounts).filter(([t]) => t !== 'None').map(([tag, count]) => {
              const c = ACTION_TAG_COLORS[tag] || { bg: '#F6F6F6', text: '#AAA' };
              return <span key={tag} className="rounded-pill px-2 py-0.5 text-[10px] font-mono" style={{ backgroundColor: c.bg, color: c.text }}>{tag}: {count}</span>;
            })}
          </div>
        </div>

        {/* Last 5 Signals */}
        <div>
          <p className="font-body text-xs text-uber-ink-3 mb-2">Recent Signals</p>
          <div className="space-y-2">
            {lastFive.map(s => {
              const sc = SOURCE_BADGE_COLORS_LOCAL[s.feedback_source] || { bg: '#F6F6F6', text: '#717171' };
              return (
                <div key={s.signal_id} className="border-b border-uber-gray-border pb-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="rounded-pill px-2 py-0.5 text-[9px] font-mono" style={{ backgroundColor: sc.bg, color: sc.text }}>{s.feedback_source}</span>
                    <span className="font-mono text-[10px] text-uber-ink-4">{s.captured_at}</span>
                  </div>
                  <p className="font-body text-xs text-uber-ink-2">{s.verbatim_text.slice(0, 80)}...</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const SOURCE_BADGE_COLORS_LOCAL: Record<string, { bg: string; text: string }> = {
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
