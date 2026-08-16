import React, { useState } from 'react';

export type TabType = 'home' | 'new-order' | 'inventory' | 'orders-history' | 'clients';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: (e: React.MouseEvent) => void;
}

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

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
        className="md:hidden fixed top-4 right-4 z-50 bg-[#0f172a] text-white p-2.5 rounded-md border border-sky-500/30 shadow-lg focus:outline-none transition hover:bg-[#1e293b]"
        aria-label="فتح القائمة"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* خلفية معتمة عند فتح القائمة في الجوال */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}

      {/* القائمة الجانبية */}
      <aside
        className={`
          fixed top-0 right-0 h-screen bg-[#0f172a] text-slate-400 z-40
          w-[240px] transition-transform duration-300 ease-in-out border-l border-sky-500/10
          flex flex-col justify-between select-none shadow-2xl
          ${isOpenMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        {/* القسم العلوي */}
        <div>
          {/* الشعار */}
          <div className="h-[72px] flex items-center px-6 border-b border-sky-500/10 gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-xl">
              👁️
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-white text-base tracking-wide">
                PV <span className="text-sky-400 font-normal">Optics</span>
              </span>
              <span className="text-[10px] text-slate-500 tracking-wider">MANAGEMENT SYSTEM</span>
            </div>
          </div>

          {/* التبويبات */}
          <nav className="px-3 py-5 space-y-1">
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
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 relative group
                    ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm border-r-2 border-sky-300'
                        : 'text-slate-400 hover:bg-sky-500/10 hover:text-sky-300'
                    }
                  `}
                >
                  <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className="tracking-wide">{item.label}</span>
                  {isActive && (
                    <span className="absolute left-3 w-1.5 h-1.5 rounded-full bg-sky-300" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* القسم السفلي */}
        <div className="px-3 pb-4">
          <div className="border-t border-sky-500/10 pt-3">
            <button
              type="button"
              onClick={(e) => {
                setIsOpenMobile(false);
                onLogout(e);
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-md text-sm font-semibold text-slate-400 hover:bg-sky-500/10 hover:text-sky-300 transition-all duration-200"
            >
              <span className="text-xl">🔒</span>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
