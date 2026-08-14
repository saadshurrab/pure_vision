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
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { supabase, formatILS } from '@/lib/supabase';

interface OrderItem {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  clients?: { name: string } | null;
}

interface LowStockItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
}

export function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrdersCount: 0,
    pendingOrdersCount: 0,
    lowStockCount: 0,
    activeClientsCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  // جلب البيانات الحقيقية من Supabase
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. حساب مبيعات وطلبات اليوم
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', todayStart.toISOString());

      const todaySales = todayOrders?.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0) || 0;
      const todayOrdersCount = todayOrders?.length || 0;
      const pendingOrdersCount = todayOrders?.filter(o => o.status === 'pending' || o.status === 'قيد التجهيز').length || 0;

      // 2. حساب عدد عناصر المخزون التي قلّت كميتها (أقل من 5 كمثال)
      const { data: lowStockData, count: lowStockCount } = await supabase
        .from('products')
        .select('id, name, code, quantity', { count: 'exact' })
        .lte('quantity', 5)
        .limit(4);

      // 3. عدد العملاء
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('id', { count: 'exact' });

      // 4. أحدث 7 طلبات مع اسم العميل
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          clients ( name )
        `)
        .order('created_at', { ascending: false })
        .limit(7);

      setStats({
        todaySales,
        todayOrdersCount,
        pendingOrdersCount,
        lowStockCount: lowStockCount || 0,
        activeClientsCount: clientsCount || 0,
      });

      setLowStockItems(lowStockData || []);
      setRecentOrders((ordersData as unknown as OrderItem[]) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      
      {/* 1. الهيدر */}
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
            تحديث
          </button>
        </div>
      </div>

      {/* 2. بطاقات الإحصائيات الحقيقية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* المبيعات الحقيقية */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">إجمالي مبيعات اليوم</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {formatILS(stats.todaySales)}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3" />
              مُحسّب تلقائياً
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

        {/* الطلبات الحقيقية */}
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

        {/* تنبيهات المخزون الحقيقية */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">تنبيهات المخزون</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
              {stats.lowStockCount} <span className="text-sm font-bold text-amber-700">صنف</span>
            </div>
            <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
              كمية منخفضة
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
        </div>

        {/* العملاء الحقيقيون */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">إجمالي العملاء</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              {stats.activeClientsCount}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">مسجلين بالسستم</span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
        </div>

      </div>

      {/* 3. شبكة المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* جدول الطلبات الفعلي من قاعدة البيانات */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-sky-600" />
              <h2 className="font-bold text-slate-800 text-sm sm:text-base">أحدث الطلبات الحقيقية</h2>
            </div>
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
                        #{row.id.slice(0, 8)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {row.clients?.name || 'عميل غير معروف'}
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-xs">
                        {new Date(row.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-3.5 font-mono font-extrabold text-slate-800">
                        {formatILS(row.total_amount)}
                      </td>
                      <td className="p-3.5 pl-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                          row.status === 'completed' || row.status === 'مكتمل'
                            ? 'bg-emerald-50 text-emerald-700' 
                            : row.status === 'pending' || row.status === 'قيد التجهيز'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {row.status || 'معلق'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-slate-400">
                      لا توجد طلبات مسجلة حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* قسم الأصناف التي قاربت على الانتهاء الفعلي */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-slate-800 text-sm">أصناف منخفضة بالمخزن</h2>
            </div>
          </div>

          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400">الكود: {item.code || 'N/A'}</span>
                    </div>
                    <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md shrink-0">
                      متبقي {item.quantity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-xs text-slate-400">
                جميع المنتجات متوفرة بكميات جيدة 👍
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. وصول سريع */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-sky-600" />
          إجراءات ووصول سريع
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button type="button" className="p-3.5 bg-slate-50 hover:bg-sky-50 border border-slate-100 rounded-xl transition text-right">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-800">إنشاء طلب جديد</div>
          </button>

          <button type="button" className="p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl transition text-right">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-2">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-800">إضافة عميل جديد</div>
          </button>

          <button type="button" className="p-3.5 bg-slate-50 hover:bg-amber-50 border border-slate-100 rounded-xl transition text-right">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-2">
              <Truck className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-800">إدخال بضائع للمخزن</div>
          </button>

          <button type="button" className="p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 rounded-xl transition text-right">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-800">تقارير المبيعات</div>
          </button>
        </div>
      </div>

    </div>
  );
}
