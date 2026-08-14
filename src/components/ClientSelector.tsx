import React, { useState, useMemo } from 'react';
import { Users, MapPin, Phone, TrendingDown, Search, X, Check } from 'lucide-react';
import type { Client } from '@/lib/supabase';
import { formatILS } from '@/lib/supabase';

interface Props {
  clients: Client[];
  selectedClientId: string;
  onSelect: (id: string) => void;
}

export function ClientSelector({ clients, selectedClientId, onSelect }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  // العميل المحدد حالياً
  const selected = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  // فلترة قائمة العملاء بناءً على البحث (الاسم، الكود، المدينة، أو الهاتف)
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const term = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term) ||
        c.city?.toLowerCase().includes(term) ||
        c.phone?.includes(term)
    );
  }, [clients, searchTerm]);

  // تحديد شارة الدين/الرصيد للعميل
  const getBalanceBadge = (balance: number) => {
    if (balance > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
          ⚠️ عليه دين ({formatILS(balance)})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
        🟢 لا يوجد ديون
      </span>
    );
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-600" />
          <h2 className="font-bold text-slate-800">اختيار العميل للطلب</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          النتائج: {filteredClients.length}
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 🔍 القسم الأيمن: حقل البحث وبطاقات العملاء */}
          <div className="lg:col-span-2 space-y-3">
            {/* 1. حقل البحث السريع */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث باسم العميل، الكود، المدينة، أو الهاتف..."
                className="w-full pr-10 pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-2.5 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 2. قائمة بطاقات العملاء */}
            <div className="max-h-[340px] overflow-y-auto space-y-2.5 pl-1">
              {filteredClients.length > 0 ? (
                filteredClients.map((c) => {
                  const isSelected = c.id === selectedClientId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelect(c.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-50/80 border-sky-500 ring-1 ring-sky-500 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-xs">{c.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">({c.code})</span>
                          {getBalanceBadge(c.outstanding_balance || 0)}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          📞 {c.phone || 'بدون هاتف'} {c.city && `• 📍 ${c.city}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>محدد</span>
                          </>
                        ) : (
                          'اختيار'
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  لم يتم العثور على عميل يطابق "{searchTerm}"
                </div>
              )}
            </div>
          </div>

          {/* 👁️ القسم الأيسر: لوحة المعاينة الجانبية لتفاصيل العميل المختار */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-xs mb-3 pb-2 border-b border-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                معاينة العميل المحدد
              </h3>

              {selected ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-800 text-sm">{selected.name}</h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">الكود: {selected.code}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <InfoTile
                      icon={<MapPin className="w-4 h-4" />}
                      label="المدينة / العنوان"
                      value={selected.city || 'غير محدد'}
                    />
                    <InfoTile
                      icon={<Phone className="w-4 h-4" />}
                      label="رقم الهاتف"
                      value={selected.phone || 'غير مسجل'}
                    />
                    <InfoTile
                      icon={<TrendingDown className="w-4 h-4" />}
                      label="إجمالي الدين المستحق"
                      value={formatILS(selected.outstanding_balance)}
                      highlight={selected.outstanding_balance > 0 ? 'red' : 'green'}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center text-center p-4 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                  <Users className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">لم يتم اختيار عميل</p>
                  <p className="text-[10px] text-slate-400 mt-1">اختر عميلاً من القائمة لعرض بياناته هنا</p>
                </div>
              )}
            </div>
          </div>

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
      : 'text-slate-700 bg-white border-slate-200';

  return (
    <div className={`rounded-xl border px-3.5 py-2.5 ${color}`}>
      <div className="flex items-center gap-1.5 text-[11px] opacity-80 mb-0.5 font-medium">
        {icon}
        {label}
      </div>
      <div className="font-bold text-xs truncate">{value}</div>
    </div>
  );
}
