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
        className="md:hidden fixed top-3 right-3 z-50 bg-slate-900 text-slate-200 p-2 rounded-lg shadow-md border border-slate-700/60 hover:bg-slate-800 transition"
        aria-label="Toggle Menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* خلفية معتمة للهواتف */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* القائمة الجانبية الرسمية */}
      <aside
        className={`fixed top-0 right-0 h-screen bg-slate-900 text-slate-300 z-40 transition-all duration-300 ease-in-out flex flex-col border-l border-slate-800 shadow-2xl select-none ${
          isCollapsed ? 'w-16' : 'w-60'
        } ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* هيدر القائمة - الهوية الرسمية */}
        <div className="h-14 px-3.5 border-b border-slate-800/80 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="bg-slate-800 text-sky-400 p-1.5 rounded-md border border-slate-700/50 flex-shrink-0">
                <Eye size={18} />
              </div>
              <div className="truncate">
                <h1 className="font-semibold text-xs text-slate-100 tracking-wide uppercase">PV Optics</h1>
                <span className="text-[9px] text-slate-400 block tracking-normal">Management System</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-md transition ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? "توسيع القائمة" : "طَي القائمة"}
          >
            {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* عناصر القائمة الرسمية */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
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
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                {/* مؤشر رمزي جانب العنصر النشط */}
                {isActive && (
                  <span className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-sky-400 rounded-l-full" />
                )}

                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* زر تسجيل الخروج */}
        <div className="p-2 border-t border-slate-800/80">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border hover:border-rose-500/20 transition ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? "تسجيل الخروج" : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
