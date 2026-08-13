import { useMemo } from 'react';
import { Users, MapPin, Phone, TrendingDown } from 'lucide-react';
import type { Client } from '@/lib/supabase';
import { formatILS } from '@/lib/supabase';

interface Props {
  clients: Client[];
  selectedClientId: string;
  onSelect: (id: string) => void;
}

export function ClientSelector({ clients, selectedClientId, onSelect }: Props) {
  const selected = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Users className="w-5 h-5 text-sky-600" />
        <h2 className="font-bold text-slate-800">اختيار العميل</h2>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          {/* قائمة اختيار العميل */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-2">العميل</label>
            <select
              value={selectedClientId}
              onChange={(e) => onSelect(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition font-medium"
            >
              <option value="">— اختر العميل —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* تفاصيل العميل المحدد */}
          {selected ? (
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
              <InfoTile
                icon={<MapPin className="w-4 h-4" />}
                label="المدينة"
                value={selected.city || '—'}
              />
              <InfoTile
                icon={<Phone className="w-4 h-4" />}
                label="الهاتف"
                value={selected.phone || '—'}
              />
              <InfoTile
                icon={<TrendingDown className="w-4 h-4" />}
                label="إجمالي الدين"
                value={formatILS(selected.outstanding_balance)}
                highlight="red"
              />
            </div>
          ) : (
            <div className="md:col-span-2 flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl p-4">
              اختر عميلاً لعرض التفاصيل
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoTile({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: 'red' | 'amber' | 'green';
}) {
  const color =
    highlight === 'red'
      ? 'text-red-600 bg-red-50 border-red-100'
      : highlight === 'amber'
      ? 'text-amber-600 bg-amber-50 border-amber-100'
      : highlight === 'green'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
      : 'text-slate-700 bg-slate-50 border-slate-100';

  return (
    <div className={`rounded-xl border px-3.5 py-3 ${color}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1 font-medium">
        {icon}
        {label}
      </div>
      <div className="font-bold text-sm truncate">{value}</div>
    </div>
  );
}
