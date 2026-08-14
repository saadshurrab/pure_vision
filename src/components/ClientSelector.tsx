import React, { useState, useMemo } from 'react';
import { 
  Users, 
  MapPin, 
  Phone, 
  TrendingDown, 
  Search, 
  X, 
  ShoppingCart, 
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import type { Client } from '@/lib/supabase';
import { formatILS } from '@/lib/supabase';

interface Props {
  clients: Client[];
  selectedClientId: string;
  onSelect: (id: string) => void;
  onCreateOrder?: (clientId: string) => void; // دالة عند الضغط على إنشاء طلب جديد
}

export function ClientSelector({ clients, selectedClientId, onSelect, onCreateOrder }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  // العميل المحدد حالياً
  const selected = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  // فلترة العملاء
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
    <div className="w-full space-y-4" dir="rtl">
      
      {/* 🔍 1. شريط البحث العلوي المميز والممتد */}
      <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-1.5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم العميل، الكود، المدينة، أو الهاتف..."
            className="w-full pr-11 pl-10 py-3 bg-slate-50/50 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. جسم الواجهة: مقسم لقسمين (قائمة العملاء يميناً + بطاقة المعاينة يساراً) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* 📜 القسم الأيمن: قائمة بطاقات العملاء المختصرة */}
        <div className="lg:col-span-6 space-y-2.5 max-h-[520px] overflow-y-auto pr-0.5 pl-1">
          {filteredClients.length > 0 ? (
            filteredClients.map((c) => {
              const isSelected = c.id === selectedClientId;
              const hasDebt = (c.outstanding_balance || 0) > 0;
              const firstChar = c.name?.trim().charAt(0) || 'ع';

              return (
                <div
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-white border-sky-500 ring-2 ring-sky-500/30 shadow-md translate-x-[-2px]'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* الشعار والحالة جهة اليمين */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* مربع الحرف الأول للعميل */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 transition ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {firstChar}
                    </div>

                    {/* بيانات الاسم والهاتف والمدينة */}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                          {c.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({c.code})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        {c.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {c.phone}
                          </span>
                        )}
                        {c.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {c.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* شارة الدين / الرصيد جهة اليسار */}
                  <div className="shrink-0 text-left">
                    {hasDebt ? (
                      <div className="flex flex-col items-end gap-0.5 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl text-rose-700">
                        <span className="text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          عليه دين
                        </span>
                        <span className="text-[11px] font-mono font-extrabold">
                          {formatILS(c.outstanding_balance)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-xl text-emerald-700 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        لا يوجد ديون
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              لم يتم العثور على أي عميل ينطبق عليه البحث
            </div>
          )}
        </div>

        {/* 👁️ القسم الأيسر: بطاقة المعاينة المركزية */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm sticky top-4">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <Users className="w-4 h-4 text-sky-600" />
            <h3>معاينة العميل المحدد</h3>
          </div>

          {selected ? (
            <div className="space-y-4 animate-fade-in text-center">
              {/* دائرة اسم العميل الكبيرة */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-sky-600 text-white font-black text-xl flex items-center justify-center shadow-md mb-2">
                  {selected.name?.trim().charAt(0) || 'ع'}
                </div>
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                  {selected.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  كود العميل: {selected.code}
                </p>
              </div>

              {/* شبكة تفاصيل العميل */}
              <div className="space-y-2 text-right pt-2">
                {/* 1. الهاتف */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-sky-600" />
                    رقم الهاتف
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 font-mono">
                    {selected.phone || 'غير مسجل'}
                  </span>
                </div>

                {/* 2. الموقع */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    الموقع / المدينة
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-800">
                    {selected.city || 'غير محدد'}
                  </span>
                </div>

                {/* 3. الطلبات السابقة (اختياري) */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    الطلبات السابقة
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-800">
                    —
                  </span>
                </div>

                {/* 4. الرصيد / الديون */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    selected.outstanding_balance > 0
                      ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    الرصيد / الديون
                  </span>
                  <span className="font-extrabold text-sm sm:text-base font-mono">
                    {selected.outstanding_balance > 0
                      ? formatILS(selected.outstanding_balance)
                      : 'لا يوجد ديون'}
                  </span>
                </div>
              </div>

              {/* 🛒 زر إجراء السريع: إنشاء طلب جديد */}
              <button
                type="button"
                onClick={() => onCreateOrder && onCreateOrder(selected.id)}
                className="w-full mt-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>إنشاء طلب جديد</span>
              </button>
            </div>
          ) : (
            /* حالة عدم اختيار عميل */
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-600">لم يتم اختيار عميل</p>
                <p className="text-xs text-slate-400">اختر عميلاً من القائمة لعرض بياناته هنا</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
