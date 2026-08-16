import React, { useState } from 'react';

export type TabType = 'home' | 'new-order' | 'inventory' | 'orders-history' | 'clients';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: (e: React.MouseEvent) => void;
}

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'new-order', label: 'طلب جديد', icon: '🛒' },
    { id: 'inventory', label: 'المخزون', icon: '📦' },
    { id: 'orders-history', label: 'الطلبات', icon: '📋' },
    { id: 'clients', label: 'العملاء', icon: '👥' },
  ];

  return (
    <>
      {/* زر الـ Hamburger — ظاهر دائماً */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-4 right-4 z-50 bg-[#0f172a] text-white p-2.5 rounded-md border border-sky-500/30 shadow-lg focus:outline-none transition hover:bg-[#1e293b]"
        aria-label="فتح/إغلاق القائمة"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* خلفية معتمة عند فتح القائمة */}
      {isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        />
      )}

      {/* القائمة الجانبية */}
      <aside
        className={`
          fixed top-0 right-0 h-screen bg-[#0f172a] text-slate-400 z-40
          transition-all duration-300 ease-in-out border-l border-sky-500/10
          flex flex-col justify-between select-none shadow-2xl
          ${isExpanded ? 'w-[260px] translate-x-0' : 'w-[72px] translate-x-0'}
        `}
      >
        {/* القسم العلوي */}
        <div>
          {/* الشعار */}
          <div className={`h-[72px] flex items-center border-b border-sky-500/10 gap-3 ${isExpanded ? 'px-5' : 'px-0 justify-center'}`}>
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-xl shrink-0">
              👁️
            </div>
            {isExpanded && (
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-bold text-white text-base tracking-wide truncate">
                  PV <span className="text-sky-400 font-normal">Optics</span>
                </span>
                <span className="text-[10px] text-slate-500 tracking-wider">MANAGEMENT SYSTEM</span>
              </div>
            )}
          </div>

          {/* التبويبات */}
          <nav className={`py-5 space-y-1 ${isExpanded ? 'px-3' : 'px-2'}`}>
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    // في الجوال نغلق بعد الاختيار
                    if (window.innerWidth < 768) setIsExpanded(false);
                  }}
                  className={`
                    w-full flex items-center gap-3.5 rounded-md text-sm font-semibold transition-all duration-200 relative
                    ${isExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'}
                    ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm border-l-2 border-sky-300'
                        : 'text-slate-400 hover:bg-sky-500/10 hover:text-sky-300'
                    }
                  `}
                  title={!isExpanded ? item.label : undefined}
                >
                  <span className={`text-xl shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  {isExpanded && (
                    <span className="tracking-wide truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* القسم السفلي */}
        <div className={`pb-4 ${isExpanded ? 'px-3' : 'px-2'}`}>
          <div className="border-t border-sky-500/10 pt-3">
            <button
              type="button"
              onClick={(e) => {
                onLogout(e);
              }}
              className={`
                w-full flex items-center rounded-md text-sm font-semibold text-slate-400 hover:bg-sky-500/10 hover:text-sky-300 transition-all duration-200
                ${isExpanded ? 'gap-3.5 px-4 py-3' : 'px-0 py-3 justify-center'}
              `}
              title={!isExpanded ? 'تسجيل الخروج' : undefined}
            >
              <span className="text-xl shrink-0">🔒</span>
              {isExpanded && (
                <span className="truncate">تسجيل الخروج</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
