import React, { useState, useEffect } from 'react';

export type TabType = 'home' | 'new-order' | 'inventory' | 'orders-history' | 'clients';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: (e: React.MouseEvent) => void;
  onToggle?: (expanded: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, onLogout, onToggle }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && isExpanded) {
        setIsExpanded(false);
        onToggle?.(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'new-order', label: 'طلب جديد', icon: '🛒' },
    { id: 'inventory', label: 'المخزون', icon: '📦' },
    { id: 'orders-history', label: 'الطلبات', icon: '📋' },
    { id: 'clients', label: 'العملاء', icon: '👥' },
  ];

  const sidebarWidth = isMobile ? (isExpanded ? 260 : 0) : (isExpanded ? 260 : 72);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  return (
    <>
      {/* خلفية معتمة عند الفتح في الجوال */}
      {isMobile && isExpanded && (
        <div
          onClick={() => {
            setIsExpanded(false);
            onToggle?.(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      {/* القائمة الجانبية */}
      <aside
        style={{ width: sidebarWidth }}
        className={`
          fixed top-0 right-0 h-screen bg-[#0f172a] text-slate-400 z-50
          transition-all duration-300 ease-in-out
          flex flex-col justify-between select-none shadow-2xl border-l border-sky-500/10
          ${isMobile && !isExpanded ? 'translate-x-full' : 'translate-x-0'}
        `}
      >
        <div className="overflow-hidden flex-1 flex flex-col">
          {/* الهيدر وزر التبديل داخل القائمة */}
          <div className="h-[72px] flex items-center justify-between px-3 border-b border-sky-500/10 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
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

            {/* زر القائمة (Hamburger) مثبت في أعلى القائمة */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-md bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 transition focus:outline-none shrink-0"
              title={isExpanded ? 'تصغير القائمة' : 'توسيع القائمة'}
            >
              <span className="text-lg leading-none">☰</span>
            </button>
          </div>

          {/* العناصر */}
          <nav className="py-5 space-y-1.5 px-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobile) {
                      setIsExpanded(false);
                      onToggle?.(false);
                    }
                  }}
                  className={`
                    w-full flex items-center rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden
                    ${isExpanded ? 'gap-3.5 px-3.5 py-3 justify-start' : 'px-0 py-3 justify-center'}
                    ${isActive ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30' : 'text-slate-400 hover:bg-sky-500/10 hover:text-sky-300'}
                  `}
                  title={!isExpanded ? item.label : undefined}
                >
                  {isActive && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-300 rounded-l-full" />}
                  <span className={`text-xl shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                  {isExpanded && <span className="tracking-wide truncate whitespace-nowrap">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* زر تسجيل الخروج */}
        <div className="p-2 pb-4 shrink-0 border-t border-sky-500/10">
          <button
            type="button"
            onClick={onLogout}
            className={`
              w-full flex items-center rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all duration-200
              ${isExpanded ? 'gap-3.5 px-3.5 py-3 justify-start' : 'px-0 py-3 justify-center'}
            `}
            title={!isExpanded ? 'تسجيل الخروج' : undefined}
          >
            <span className="text-xl shrink-0">🔒</span>
            {isExpanded && <span className="truncate whitespace-nowrap">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
