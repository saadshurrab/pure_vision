import React, { useState } from 'react';

export type TabType = 'home' | 'new-order' | 'inventory' | 'orders-history' | 'clients';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: (e: React.MouseEvent) => void;
}

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  // حالة فتح/إغلاق القائمة في الجوال
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // عناصر القائمة الرئيسية
  const menuItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'new-order', label: 'طلب جديد', icon: '🛒' },
    { id: 'inventory', label: 'المخزون', icon: '📦' },
    { id: 'orders-history', label: 'الطلبات', icon: '📋' },
    { id: 'clients', label: 'العملاء', icon: '👥' },
  ];

  return (
    <>
      {/* زر الـ Hamburger للجوال فقط */}
      <button
        type="button"
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="md:hidden fixed top-3 right-3 z-50 bg-[#1e293b] text-white p-2.5 rounded-lg border border-slate-700 shadow-md focus:outline-none"
        aria-label="فتح القائمة"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* خلفية معتمة عند فتح القائمة في الجوال */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
        />
      )}

      {/* القائمة الجانبية (Sidebar) */}
      <aside
        className={`
          fixed top-0 right-0 h-screen bg-[#1e293b] text-slate-200 z-40
          w-[220px] transition-transform duration-300 ease-in-out border-l border-slate-800
          flex flex-col justify-between select-none
          ${isOpenMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        {/* القسم العلوي: الهيدر والتبويبات */}
        <div>
          {/* الشعار PV */}
          <div className="h-16 flex items-center justify-start px-5 border-b border-slate-800/80 gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-lg font-black text-sky-400">
              👁️
            </div>
            <span className="font-extrabold text-white text-lg tracking-wider">
              PV <span className="text-xs font-normal text-slate-400">Optics</span>
            </span>
          </div>

          {/* التبويبات */}
          <nav className="p-3 space-y-1.5 mt-2">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpenMobile(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all relative
                    ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border-r-4 border-amber-500'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* القسم السفلي: زر تسجيل الخروج مثبت في الأسفل */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={(e) => {
              setIsOpenMobile(false);
              onLogout(e);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
          >
            <span className="text-base">🔒</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
