import { type Client, type Product, type LensStock, formatILS } from '@/lib/supabase';
import { type TabType } from '@/components/Sidebar';

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

  // حساب عدد المنتجات والعدسات التي قوشكت على الانتهاء
  const lowStockLenses = lensStock.filter((s) => s.stock_qty < 5).length;
  const lowStockProducts = products.filter(
    (p) => Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0)) < 5
  ).length;
  const totalLowStock = lowStockLenses + lowStockProducts;

  // أحدث 5 طلبات
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 🟦 لوحة التعريف الرئيسية بشركة Pure Vision Optics */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white p-6 md:p-8 shadow-xl border border-sky-700/50">
        {/* خلفية جمالية خفيفة */}
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -top-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 px-3 py-1 rounded-full text-sky-200 text-xs font-semibold backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              النظام الإداري المركزي المباشر
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Pure Vision Optics Company</span>
            </h1>
            
            <p className="text-sky-100/80 text-sm md:text-base max-w-2xl font-light leading-relaxed">
              شركة ومستودع الرؤيا النقية لمستلزمات مراكز البصريات — لوحة التحكم الخاصة بإدارة المبيعات، الطلبيات، ومراقبة المخزون بمرونة ودقة عالية.
            </p>
          </div>

          {/* شعار/أيقونة سريعة للشركة */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/15 shadow-inner">
            <div className="w-10 h-10 rounded-lg bg-sky-500/30 flex items-center justify-center text-xl">
              👁️
            </div>
            <div>
              <div className="text-xs text-sky-200 font-medium">حالة النظام</div>
              <div className="text-sm font-bold text-white">متصل وجاهز للعمل</div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي المبيعات المؤكدة</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
              {formatILS(totalSales)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">
            💰
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي ديون العملاء</p>
            <h3 className="text-xl font-extrabold text-rose-600 mt-1">
              {formatILS(totalOutstandingBalance)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl font-bold">
            💳
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">العملاء المسجلون</p>
            <h3 className="text-xl font-extrabold text-sky-700 mt-1">
              {clientsCount} عميل
            </h3>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center text-xl font-bold">
            👥
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">تنبيهات نقص المخزون</p>
            <h3 className="text-xl font-extrabold text-amber-600 mt-1">
              {totalLowStock} صنف
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
        </div>
      </div>

      {/* 🚀 الوصول السريع وأحدث الطلبيات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* أحدث الطلبيات */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span>📋</span> أحدث الطلبات المسجلة
            </h3>
            <button
              onClick={() => onNavigate('orders-history')}
              className="text-xs text-sky-600 font-bold hover:underline"
            >
              عرض السجل الكامل ←
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs">
                  <th className="p-2.5 rounded-r-lg font-semibold">اسم العميل</th>
                  <th className="p-2.5 font-semibold">المبلغ</th>
                  <th className="p-2.5 font-semibold">طريقة الدفع</th>
                  <th className="p-2.5 rounded-l-lg font-semibold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentOrders.length > 0 ? (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 font-bold text-slate-800">
                        {o.client_name || 'عميل نقدي'}
                      </td>
                      <td className="p-2.5 font-bold text-sky-700">
                        {formatILS(o.total)}
                      </td>
                      <td className="p-2.5 text-xs text-slate-600 font-medium">
                        {o.payment_method === 'cash'
                          ? '💵 نقدي'
                          : o.payment_method === 'credit'
                          ? '💳 دين'
                          : '🏦 بنكي'}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                            o.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
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

        {/* اختصارات العمل السريعة */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base border-b pb-3 flex items-center gap-2">
            <span>⚡</span> إجراءات سريعة
          </h3>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('new-order')}
              className="w-full text-right bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 p-3.5 rounded-xl font-bold text-sm transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <span>➕</span> إنشاء طلبية جديدة
              </span>
              <span className="text-sky-500 group-hover:translate-x-[-4px] transition-transform">←</span>
            </button>

            <button
              onClick={() => onNavigate('inventory')}
              className="w-full text-right bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 p-3.5 rounded-xl font-bold text-sm transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <span>📦</span> فحص مخزون العدسات والملحقات
              </span>
              <span className="text-slate-400 group-hover:translate-x-[-4px] transition-transform">←</span>
            </button>

            <button
              onClick={() => onNavigate('clients')}
              className="w-full text-right bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 p-3.5 rounded-xl font-bold text-sm transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <span>👥</span> دليل العملاء وتسجيل المرتجعات
              </span>
              <span className="text-slate-400 group-hover:translate-x-[-4px] transition-transform">←</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
