import React, { useState } from 'react';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  Users, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  Eye
} from 'lucide-react';

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
    { id: 'home' as TabType, label: 'الرئيسية', icon: Home },
    { id: 'new-order' as TabType, label: 'طلب جديد', icon: ShoppingCart },
    { id: 'inventory' as TabType, label: 'المخزون', icon: Package },
    { id: 'orders-history' as TabType, label: 'الطلبات', icon: ClipboardList },
    { id: 'clients' as TabType, label: 'العملاء', icon: Users },
  ];

  return (
    <>
      {/* زر القائمة للشاشات الصغيرة */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-3 right-3 z-50 bg-slate-900 text-slate-200 p-2 rounded-lg shadow-md border border-slate-700/60 hover:bg-slate-800 transition-colors"
        aria-label="Toggle Menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* خلفية معتمة للهواتف */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40"
        />
      )}

      {/* القائمة الجانبية — عرض أضيق */}
      <aside
        className={`fixed top-0 right-0 h-screen bg-slate-900 text-slate-300 z-40 transition-[width] duration-300 ease-in-out flex flex-col border-l border-slate-800 shadow-2xl select-none ${
          isCollapsed ? 'w-14' : 'w-52'
        } ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* هيدر القائمة */}
        <div className="h-12 px-2.5 border-b border-slate-800/80 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="bg-slate-800 text-sky-400 p-1 rounded-md border border-slate-700/50 flex-shrink-0">
                <Eye size={16} />
              </div>
              <div className="truncate">
                <h1 className="font-semibold text-[11px] text-slate-100 tracking-wide uppercase">PV Optics</h1>
                <span className="text-[8px] text-slate-400 block tracking-normal">Management System</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex p-1 text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] rounded transition-colors ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? "توسيع القائمة" : "طَي القائمة"}
          >
            {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* عناصر القائمة — مسافات مضغوطة */}
        <nav className="flex-1 px-1.5 py-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`group relative w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px] font-medium border border-transparent transition-colors duration-200 ${
                  isActive
                    ? 'bg-sky-500/[0.06] text-sky-400 font-semibold'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                {/* مؤشر العنصر النشط */}
                {isActive && (
                  <span className="absolute right-0 top-2 bottom-2 w-[2px] bg-sky-400 rounded-l-full" />
                )}

                <Icon 
                  size={16} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`flex-shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`} 
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* زر تسجيل الخروج */}
        <div className="p-1.5 border-t border-slate-800/80">
          <button
            onClick={onLogout}
            className={`group w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px] font-medium text-slate-500 border border-transparent transition-colors duration-200 hover:bg-white/[0.03] hover:text-rose-400 ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? "تسجيل الخروج" : undefined}
          >
            <LogOut 
              size={16} 
              className="flex-shrink-0 text-slate-500 group-hover:text-rose-400 transition-colors duration-200" 
            />
            {!isCollapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
