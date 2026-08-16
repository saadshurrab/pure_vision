import React from 'react';
import { type Client, type Product, type LensStock, formatILS } from '@/lib/supabase';
import { type TabType } from '@/components/Sidebar';
import { 
  TrendingUp, 
  CreditCard, 
  Users, 
  AlertTriangle, 
  ClipboardList, 
  Zap, 
  PlusCircle, 
  Package, 
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

interface DashboardHomeProps {
  orders: any[];
  clientsCount: number;
  clients: Client[];
  products: Product[];
  lensStock: LensStock[];
  onNavigate: (tab: TabType) => void;
}

export function DashboardHome({
  orders,
  clientsCount,
  clients,
  products,
  lensStock,
  onNavigate,
}: DashboardHomeProps) {
  // حساب المبيعات الإجمالية للطلبات المؤكدة
  const totalSales = orders
    .filter((o) => o.status === 'confirmed')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // حساب إجمالي الديون المستحقة على العملاء
  const totalOutstandingBalance = clients.reduce(
    (sum, c) => sum + (c.outstanding_balance || 0),
    0
  );

  // حساب عدد المنتجات والعدسات التي أوشكت على الانتهاء
  const lowStockLenses = lensStock.filter((s) => s.stock_qty < 5).length;
  const lowStockProducts = products.filter(
    (p) => Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0)) < 5
  ).length;
  const totalLowStock = lowStockLenses + lowStockProducts;

  // أحدث 5 طلبات
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 🏛️ الهيدر الرئيسي الرسمي للشركة */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 text-white p-5 md:p-6 shadow-md">
        {/* لمسة إضاءة خلفية هادئة ورسمية */}
        <div className="absolute left-0 top-0 w-96 h-full bg-gradient-to-r from-sky-600/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-md text-sky-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              النظام الإداري المركزي المباشر
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
              <span>Pure Vision Optics Company</span>
            </h1>
            
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
              شركة ومستودع الرؤيا النقية لمستلزمات مراكز البصريات — لوحة التحكم الخاصة بإدارة المبيعات، الطلبيات، ومراقبة المخزون بمرونة ودقة عالية.
            </p>
          </div>

          {/* حالة النظام */}
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-lg border border-slate-700/60 flex-shrink-0">
            <div className="w-8 h-8 rounded-md bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">حالة النظام</div>
              <div className="text-xs font-semibold text-emerald-400">متصل وجاهز للعمل</div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 بطاقات الإحصائيات الرسمية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* المبيعات */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">إجمالي المبيعات المؤكدة</p>
            <h3 className="text-lg font-bold text-slate-900">
              {formatILS(totalSales)}
            </h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* الديون */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">إجمالي ديون العملاء</p>
            <h3 className="text-lg font-bold text-rose-600">
              {formatILS(totalOutstandingBalance)}
            </h3>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center border border-rose-100">
            <CreditCard size={20} />
          </div>
        </div>

        {/* العملاء */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">العملاء المسجلون</p>
            <h3 className="text-lg font-bold text-slate-900">
              {clientsCount} <span className="text-xs font-normal text-slate-500">عميل</span>
            </h3>
          </div>
          <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center border border-sky-100">
            <Users size={20} />
          </div>
        </div>

        {/* نقص المخزون */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">تنبيهات نقص المخزون</p>
            <h3 className="text-lg font-bold text-amber-600">
              {totalLowStock} <span className="text-xs font-normal text-slate-500">صنف</span>
            </h3>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* 🚀 أحدث الطلبيات والإجراءات السريعة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* جدول أحدث الطلبيات */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <ClipboardList size={18} className="text-slate-500" />
              أحدث الطلبات المسجلة
            </h3>
            <button
              onClick={() => onNavigate('orders-history')}
              className="text-xs text-sky-600 font-semibold hover:text-sky-800 transition flex items-center gap-1"
            >
              عرض السجل الكامل
              <ChevronLeft size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs border-y border-slate-100">
                  <th className="p-2.5 font-semibold">اسم العميل</th>
                  <th className="p-2.5 font-semibold">المبلغ</th>
                  <th className="p-2.5 font-semibold">طريقة الدفع</th>
                  <th className="p-2.5 font-semibold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {recentOrders.length > 0 ? (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-800">
                        {o.client_name || 'عميل نقدي'}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900">
                        {formatILS(o.total)}
                      </td>
                      <td className="p-2.5 text-slate-600 font-normal">
                        {o.payment_method === 'cash'
                          ? 'نقدي'
                          : o.payment_method === 'credit'
                          ? 'آجل (دين)'
                          : 'تحويل بنكي'}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium inline-block border ${
                            o.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : 'bg-amber-50 text-amber-700 border-amber-200/60'
                          }`}
                        >
                          {o.status === 'confirmed' ? 'مؤكد' : 'مسودة'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 text-xs">
                      لا توجد طلبات مسجلة مؤخراً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* الإجراءات السريعة */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Zap size={18} className="text-slate-500" />
            إجراءات سريعة
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => onNavigate('new-order')}
              className="w-full text-right bg-sky-50/50 hover:bg-sky-50 text-sky-950 border border-sky-200/80 p-3 rounded-lg font-medium text-xs transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-2.5">
                <PlusCircle size={16} className="text-sky-600" />
                إنشاء طلبية جديدة
              </span>
              <ChevronLeft size={14} className="text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('inventory')}
              className="w-full text-right bg-slate-50/60 hover:bg-slate-100/80 text-slate-800 border border-slate-200/80 p-3 rounded-lg font-medium text-xs transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-2.5">
                <Package size={16} className="text-slate-600" />
                فحص مخزون العدسات والملحقات
              </span>
              <ChevronLeft size={14} className="text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('clients')}
              className="w-full text-right bg-slate-50/60 hover:bg-slate-100/80 text-slate-800 border border-slate-200/80 p-3 rounded-lg font-medium text-xs transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-2.5">
                <Users size={16} className="text-slate-600" />
                دليل العملاء وتسجيل المرتجعات
              </span>
              <ChevronLeft size={14} className="text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
