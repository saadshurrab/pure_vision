import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  Users, 
  ArrowUpRight, 
  PlusCircle, 
  FileText, 
  Truck, 
  Calendar,
  RefreshCw
} from 'lucide-react';
import { supabase, formatILS } from '@/lib/supabase';

export function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrdersCount: 0,
    pendingOrdersCount: 0,
    lowStockCount: 0,
    activeClientsCount: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. جلب العملاء
      const { data: clientsData, error: clientsErr, count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact' });

      if (clientsErr) console.error('خطأ في جلب العملاء:', clientsErr.message);

      // 2. جلب المنتجات وقليلة المخزون
      const { data: productsData, error: prodErr, count: prodCount } = await supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (prodErr) console.error('خطأ في جلب المنتجات:', prodErr.message);

      const lowStock = productsData?.filter((p: any) => (p.quantity || 0) <= 5) || [];

      // 3. جلب الطلبات
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select(`
          *,
          clients ( name )
        `)
        .order('created_at', { ascending: false });

      if (ordersErr) {
        console.error('خطأ في جلب الطلبات:', ordersErr.message);
        setErrorMsg(`تعذر جلب البيانات: ${ordersErr.message}`);
      }

      // حساب المبيعات والطلبات اليومية
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = ordersData?.filter((o: any) => o.created_at?.startsWith(today)) || [];
      const todaySales = todayOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

      setStats({
        todaySales,
        todayOrdersCount: todayOrders.length,
        pendingOrdersCount: ordersData?.filter((o: any) => o.status === 'pending' || o.status === 'قيد التجهيز').length || 0,
        lowStockCount: lowStock.length,
        activeClientsCount: clientsCount || clientsData?.length || 0,
      });

      setRecentOrders(ordersData?.slice(0, 7) || []);
      setLowStockItems(lowStock.slice(0, 5));

    } catch (err: any) {
      console.error('خطأ عام أثناء الاتصال:', err);
      setErrorMsg(err.message || 'حدث خطأ في الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const todayDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* تنبيه بالخطأ إن وجد */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-bold">
          ⚠️ {errorMsg} (تحقق من وحدة التحكم Console بالضغط على F12 لرؤية التفاصيل)
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">اللوحة الرئيسية</h1>
          <p className="text-xs text-slate-500 mt-0.5">نظرة عامة على نشاط النظام والمبيعات والمخزون</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4 text-sky-600" />
            {todayDate}
          </span>
          <span className="text-slate-300">|</span>
          <button 
            type="button" 
            onClick={fetchDashboardData}
            className="flex items-center gap-1 font-mono text-[11px] hover:text-sky-600 transition"
          >
            <RefreshCw className={`w-3 h-3 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">إجمالي مبيعات اليوم</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {formatILS(stats.todaySales)}
            </div>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">طلبات اليوم</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {stats.todayOrdersCount} <span className="text-xs font-normal text-slate-400">طلب</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{stats.pendingOrdersCount} قيد التجهيز</span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">تنبيهات المخزون</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
              {stats.lowStockCount} <span className="text-sm font-bold text-amber-700">صنف</span>
            </div>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">إجمالي العملاء</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {stats.activeClientsCount}
            </div>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">أحدث الطلبات</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5 pr-5">رقم الطلب</th>
                  <th className="p-3.5">العميل</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5 pl-5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentOrders.length > 0 ? (
                  recentOrders.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 pr-5 font-mono font-bold text-sky-600">
                        #{String(row.id).slice(0, 8)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {row.clients?.name || row.client_name || 'عميل'}
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-xs">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG') : '-'}
                      </td>
                      <td className="p-3.5 font-mono font-extrabold text-slate-800">
                        {formatILS(row.total_amount || 0)}
                      </td>
                      <td className="p-3.5 pl-5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {row.status || 'معلق'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-400">
                      {loading ? 'جاري تحميل البيانات...' : 'لا توجد طلبات مسجلة في قاعدة البيانات'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-slate-800 text-sm border-b pb-3 border-slate-100">أصناف منخفضة بالمخزن</h2>
          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">{item.code}</span>
                  </div>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    {item.quantity}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-xs text-slate-400">
                {loading ? 'جاري الفحص...' : 'لا توجد أصناف منخفضة'}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
