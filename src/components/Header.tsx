import { Eye } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-slate-900 border-b border-slate-800 shadow-md sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        
        {/* الشعار والاسم */}
        <div className="flex items-center gap-3.5">
          {/* أيقونة الشعار */}
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
            <Eye className="w-6 h-6 text-white" strokeWidth={2.2} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" title="النظام متصل" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                شركة ومستودع الرؤيا النقية
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                مستلزمات مراكز البصريات
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Pure Vision Optics Company • نظام إدارة المبيعات والمخزون
            </p>
          </div>
        </div>

        {/* معلومات النظام والتاريخ */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>نظام توريد داخلي · ₪</span>
          </div>
        </div>

      </div>
    </header>
  );
}
