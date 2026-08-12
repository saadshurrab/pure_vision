import { Eye } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md">
            <Eye className="w-6 h-6 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">لوحة إدخال الطلبات</h1>
            <p className="text-xs text-slate-500">نظام إدارة طلبات متجر البصريات</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <span className="px-3 py-1.5 bg-slate-100 rounded-lg font-medium text-slate-600">
            نظام داخلي · ₪
          </span>
        </div>
      </div>
    </header>
  );
}
