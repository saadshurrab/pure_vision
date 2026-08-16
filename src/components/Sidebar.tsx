import React, { useState } from 'react';

export type TabType = 'home' | 'new-order' | 'inventory' | 'orders-history' | 'clients';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: (e?: React.MouseEvent) => void;
}

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { id: 'home' as TabType, label: 'الرئيسية', icon: '🏠' },
    { id: 'new-order' as TabType, label: 'طلب جديد', icon: '🛒' },
    { id: 'inventory' as TabType, label: 'المخزون', icon: '📦' },
    { id: 'orders-history' as TabType, label: 'الطلبات', icon: '📋' },
    { id: 'clients' as TabType, label: 'العملاء', icon: '👥' },
  ];

  return (
    <>
      {/* زر المنيو للهواتف والشاشات الصغيرة */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-700"
      >
        ☰
      </button>

      {/* خلفية معتمة عند فتح القائمة على الهواتف */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
        />
      )}

      {/* القائمة الجانبية */}
      <aside
        className={`fixed top-0 right-0 h-screen bg-slate-900 text-slate-100 z-40 transition-all duration-300 flex flex-col border-l border-slate-800 shadow-xl ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* هيدر القائمة */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="bg-sky-600 p-2 rounded-xl text-lg">👁️</div>
              <div>
                <h1 className="font-bold text-base text-sky-400 leading-tight">PV Optics</h1>
                <span className="text-[10px] text-slate-400 block tracking-wider uppercase">Management System</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title={isCollapsed ? "توسيع القائمة" : "طَي القائمة"}
          >
            {isCollapsed ? '◀' : '▶'}
          </button>
        </div>

        {/* عناصر القائمة */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* زر تسجيل الخروج */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? "تسجيل الخروج" : undefined}
          >
            <span className="text-xl">🔒</span>
            {!isCollapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
