import React, { useState, useMemo } from 'react';
import { Users, MapPin, Phone, TrendingDown, Search, X, Check, Building2, UserCheck } from 'lucide-react';
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

  // فلترة قائمة العملاء
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

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-600" />
          <h2 className="font-bold text-slate-800">اختيار العميل للطلب</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          إجمالي العملاء: {clients.length}
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* 🔍 1. القسم الأيمن: قائمة اختيار والبحث عن العميل (أصغر - 2/5 من المساحة) */}
          <div className="lg:col-span-2 space-y-3 border-l lg:pl-6 border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">قائمة العملاء</label>
              <span className="text-[11px] text-slate-400">النتائج: {filteredClients.length}</span>
            </div>

            {/* حقل البحث السريع */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم، الكود، أو الهاتف..."
                className="w-full pr-9 pl-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* قائمة بطاقات العملاء المختصرة */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pl-1">
              {filteredClients.length > 0 ? (
                filteredClients.map((c) => {
                  const isSelected = c.id === selectedClientId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelect(c.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-50/90 border-sky-500 ring-1 ring-sky-500 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-800 text-xs">{c.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">({c.code})</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          📞 {c.phone || 'بدون هاتف'}
                        </p>
                      </div>

                      <div
                        className={`p-1.5 rounded-lg text-xs font-bold transition ${
                          isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  لا توجد نتائج مطابقة
                </div>
              )}
            </div>
          </div>

          {/* 👁️ 2. القسم الأيسر الرئيسي: لوحة المعاينة الكبيرة والموسعة (أكبر - 3/5 من المساحة) */}
          <div className="lg:col-span-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-sky-600" />
                  تفاصيل ومعاينة العميل المحدد
                </h3>
                {selected && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                    محدد حالياً ✓
                  </span>
                )}
              </div>

              {selected ? (
                <div className="space-y-4 animate-fade-in">
                  {/* بطاقة العميل الرئيسية بارزة ومكبرة */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-sky-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                        {selected.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{selected.name}</h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">كود العميل: {selected.code}</p>
                      </div>
                    </div>
                  </div>

                  {/* الشبكة الكبيرة لعرض كافة بيانات ومعلومات العميل */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoTileLarge
                      icon={<MapPin className="w-4 h-4 text-sky-600" />}
                      label="المدينة / العنوان"
                      value={selected.city || 'غير محدد'}
                    />
                    <InfoTileLarge
                      icon={<Phone className="w-4 h-4 text-sky-600" />}
                      label="رقم الهاتف"
                      value={selected.phone || 'غير مسجل'}
                    />
                    <div className="sm:col-span-2">
                      <InfoTileLarge
                        icon={<TrendingDown className="w-5 h-5" />}
                        label="إجمالي الرصيد المستحق (الدين)"
                        value={formatILS(selected.outstanding_balance)}
                        highlight={selected.outstanding_balance > 0 ? 'red' : 'green'}
                        isLarge
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                  <Users className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-600">لم يتم اختيار أي عميل بعد</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    اختر عميلاً من القائمة الجانبية على اليمين لعرض تفاصيله الكاملة وحسابه هنا.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// مكون العرض المحدث بحجم أكبر للمعاينة
function InfoTileLarge({
  icon,
  label,
  value,
  highlight,
  isLarge = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: 'red' | 'amber' | 'green';
  isLarge?: boolean;
}) {
  const color =
    highlight === 'red'
      ? 'text-red-700 bg-red-50/80 border-red-200'
      : highlight === 'amber'
      ? 'text-amber-700 bg-amber-50/80 border-amber-200'
      : highlight === 'green'
      ? 'text-emerald-700 bg-emerald-50/80 border-emerald-200'
      : 'text-slate-800 bg-white border-slate-200';

  return (
    <div className={`rounded-xl border p-3.5 shadow-sm transition ${color}`}>
      <div className="flex items-center gap-2 text-xs opacity-75 mb-1 font-semibold">
        {icon}
        {label}
      </div>
      <div className={`font-bold ${isLarge ? 'text-lg text-red-600' : 'text-sm'} truncate`}>
        {value}
      </div>
    </div>
  );
}
