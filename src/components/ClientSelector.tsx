import { useMemo } from 'react';
import { Users, AlertTriangle, CheckCircle2, MapPin, Phone, Wallet, TrendingDown } from 'lucide-react';
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

  const remaining = selected ? selected.credit_limit - selected.outstanding_balance : 0;
  const blocked = selected ? remaining <= 0 : false;
  const usagePct = selected
    ? Math.min(100, Math.round((selected.outstanding_balance / selected.credit_limit) * 100))
    : 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Users className="w-5 h-5 text-sky-600" />
        <h2 className="font-bold text-slate-800">اختيار العميل</h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">العميل</label>
            <select
              value={selectedClientId}
              onChange={(e) => onSelect(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            >
              <option value="">— اختر العميل —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                {blocked ? (
                  <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                    <AlertTriangle className="w-4 h-4" /> الرصيد المتاح مستنفد
                  </span>
                ) : remaining < selected.credit_limit * 0.2 ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
                    <AlertTriangle className="w-4 h-4" /> رصيد منخفض
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> رصيد متاح
                  </span>
                )}
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>المستخدم: {formatILS(selected.outstanding_balance)}</span>
                  <span>الحد: {formatILS(selected.credit_limit)}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePct >= 100
                        ? 'bg-red-500'
                        : usagePct >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
              اختر عميلاً لعرض تفاصيل الرصيد
            </div>
          )}
        </div>

        {selected && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
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
            <InfoTile
              icon={<Wallet className="w-4 h-4" />}
              label="الرصيد المتبقي"
              value={formatILS(remaining)}
              highlight={blocked ? 'red' : remaining < selected.credit_limit * 0.2 ? 'amber' : 'green'}
            />
          </div>
        )}
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
    <div className={`rounded-xl border px-3 py-2.5 ${color}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
        {icon}
        {label}
      </div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  );
}
