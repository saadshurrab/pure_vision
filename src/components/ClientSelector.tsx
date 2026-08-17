import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Search, 
  X, 
  PlusCircle, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  ChevronLeft,
  UserCheck,
  CreditCard,
  Building
} from 'lucide-react';
import type { Client } from '@/lib/supabase';
import { formatILS } from '@/lib/supabase';

interface Props {
  clients: Client[];
  selectedClientId: string;
  onSelect: (id: string) => void;
  onCreateOrder?: (clientId: string) => void;
}

export function ClientSelector({ clients, selectedClientId, onSelect, onCreateOrder }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  // العميل المحدد حالياً
  const selected = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  // فلترة قائمة العملاء بناءً على المدخلات
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const term = searchTerm.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term) ||
        c.city?.toLowerCase().includes(term) ||
        c.phone?.includes(term)
    );
  }, [clients, searchTerm]);

  // التمرير والسلوك عند اختيار إنشاء طلب
  const handleCreateOrder = (clientId: string) => {
    if (onCreateOrder) {
      onCreateOrder(clientId);
    }

    const orderSection = document.getElementById('order-section');
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({
        top: window.scrollY + 600,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 dir-rtl" dir="rtl">
      
      {/* 🔍 1. شريط البحث الموحد */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المركز أو العميل، الكود، المدينة، أو رقم الهاتف..."
            className="w-full pr-10 pl-10 py-2.5 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. قسم المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* 📜 الجانب الأيمن: قائمة نتائج البحث والعملاء */}
        <div className="lg:col-span-6 space-y-2 max-h-[540px] overflow-y-auto pr-0.5 pl-1 custom-scrollbar">
          {filteredClients.length > 0 ? (
            filteredClients.map((c) => {
              const isSelected = c.id === selectedClientId;
              const hasDebt = (c.outstanding_balance || 0) > 0;

              return (
                <div
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-slate-800 text-white border border-slate-700/60'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-bold text-xs sm:text-sm truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {c.name}
                        </h4>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold ${
                          isSelected ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.code}
                        </span>
                      </div>

                      <div className={`flex items-center gap-3 text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {c.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 opacity-70" />
                            {c.phone}
                          </span>
                        )}
                        {c.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 opacity-70" />
                            {c.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-left flex items-center gap-2">
                    {hasDebt ? (
                      <div className={`flex flex-col items-end px-2.5 py-1 rounded-lg border ${
                        isSelected 
                          ? 'bg-rose-950/50 border-rose-800 text-rose-200' 
                          : 'bg-rose-50 border-rose-100 text-rose-700'
                      }`}>
                        <span className="text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          مستحق
                        </span>
                        <span className="text-[11px] font-mono font-bold">
                          {formatILS(c.outstanding_balance)}
                        </span>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
                        isSelected 
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                          : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        منتظم
                      </div>
                    )}
                    <ChevronLeft className={`w-4 h-4 ${isSelected ? 'text-slate-400' : 'text-slate-300'}`} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              لا يطابق بحثك أي عميل أو مركز مسجل حالياً.
            </div>
          )}
        </div>

        {/* 🏢 الجانب الأيسر: بطاقة التفاصيل والمعاينة الرسمية */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs sticky top-4">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-700" />
              بطاقة بيانات العميل
            </span>
            {selected && (
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-semibold">
                كود الحساب: {selected.code}
              </span>
            )}
          </div>

          {selected ? (
            <div className="space-y-4">
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base truncate">
                    {selected.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selected.city || 'العنوان غير محدد'}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    رقم التواصل
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 font-mono">
                    {selected.phone || 'غير مسجل'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    حالة الحساب
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    نشط
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    selected.outstanding_balance > 0
                      ? 'bg-rose-50/50 border-rose-200/80 text-rose-900'
                      : 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    الرصيد المستحق
                  </span>
                  <span className="font-bold text-sm sm:text-base font-mono">
                    {selected.outstanding_balance > 0
                      ? formatILS(selected.outstanding_balance)
                      : '0.00 ₪'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCreateOrder(selected.id)}
                className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>متابعة إنشاء طلب جديد</span>
              </button>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">لم يتم تحديد عميل</p>
              <p className="text-xs text-slate-400 max-w-xs">
                قم باختيار أحد العملاء من القائمة الجانبية لاستعراض بياناته وإنشاء طلب جديد.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
