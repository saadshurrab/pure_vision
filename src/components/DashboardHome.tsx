import { useMemo } from 'react';
import { formatILS } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
  outstanding_balance: number;
}

interface Product {
  id: string;
  name: string;
  stock_qty: number;
  consumed_stock: number;
}

interface LensStock {
  id: string;
  stock_qty: number;
}

interface Order {
  id: string;
  created_at: string;
  client_name?: string;
  total: number;
  status: 'draft' | 'confirmed' | 'cancelled';
  payment_method: string;
}

interface DashboardHomeProps {
  orders: Order[];
  clientsCount: number;
  clients: Client[];
  products: Product[];
  lensStock: LensStock[];
  onNavigate: (tab: 'new-order' | 'inventory' | 'orders-history' | 'clients') => void;
}

export function DashboardHome({
  orders,
  clientsCount,
  clients,
  products,
  lensStock,
  onNavigate,
}: DashboardHomeProps) {
  // حساب إجمالي المبيعات للطلبات المؤكدة فقط
  const totalSales = useMemo(() => {
    return orders
      .filter((o) => o.status === 'confirmed')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  // حساب إجمالي الديون المستحقة على العملاء
  const totalOutstandingBalance = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
  }, [clients]);

  // حساب النقص في المخزون
  const lowStockCount = useMemo(() => {
    const lowProducts = products.filter(
      (p) => Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0)) < 5
    ).length;
    const lowLenses = lensStock.filter((l) => (l.stock_qty || 0) < 5).length;
    return lowProducts + lowLenses;
  }, [products, lensStock]);

  // أحدث 5 طلبات
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-5 bg-[#f8fafc] p-1 sm:p-2 rounded-xl text-slate-800">
      
      {/* 1. التنبيه العلوية الأنيق (حد جانبي أخضر وخلفية بيضاء) */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 border-r-4 border-r-emerald-600 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-sm font-bold text-slate-800">
            النظام يعمل بكفاءة <span className="text-slate-400 font-normal">| آخر تحديث: اليوم</span>
          </p>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          متابعة حركة المبيعات، المخزون، والديون المستحقة بشكل مباشر
        </p>
      </div>

      {/* 2. بطاقات الإحصائيات الأربعة (نفس نمط التصميم كروت كلاسيكية أنيقة) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* إجمالي المبيعات المؤكدة */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500">إجمالي المبيعات المؤكدة</span>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              {formatILS(totalSales)}
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">▲ % عن الشهر الماضي</p>
          </div>
          <div className="absolute top-4 left-4 w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
            ₪
          </div>
        </div>

        {/* إجمالي ديون العملاء */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500">إجمالي ديون العملاء</span>
          <div>
            <div className="text-2xl font-black text-rose-600 tracking-tight flex items-baseline gap-1">
              {formatILS(totalOutstandingBalance)}
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-1">عملاء مسجلين</p>
          </div>
          <div className="absolute top-4 left-4 w-8 h-8 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center font-bold text-sm">
            💳
          </div>
        </div>

        {/* العملاء المسجلين */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500">العملاء المسجلين</span>
          <div>
            <div className="text-2xl font-black text-sky-600 tracking-tight">
              {clientsCount} <span className="text-base font-bold">عملاء</span>
            </div>
            <p className="text-[11px] font-semibold text-sky-600 mt-1">▲ عميل جديد هذا الشهر</p>
          </div>
          <div className="absolute top-4 left-4 w-8 h-8 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center font-bold text-sm">
            👥
          </div>
        </div>

        {/* تنبيهات نواقص المخزون */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500">تنبيهات نواقص المخزون</span>
          <div>
            <div className="text-2xl font-black text-amber-500 tracking-tight">
              {lowStockCount} <span className="text-base font-bold">أصناف</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-600 mt-1">⚠️ يتطلب جرد فوري</p>
          </div>
          <div className="absolute top-4 left-4 w-8 h-8 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center font-bold text-sm">
            ⚠️
          </div>
        </div>

      </div>

      {/* 3. ورقة الإجراءات السريعة (خلفية كحلي داكن راقية مثل الهيدر تماماً) */}
      <div className="bg-[#1e293b] text-white p-5 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-base font-bold tracking-wide">ورقة الإجراءات السريعة</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            يمكنك البدء فوراً بإنشاء طلب جديد أو الانتقال للتحقق من جرد المخزون.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate('new-order')}
            className="flex-1 md:flex-none bg-white text-slate-900 px-5 py-2 rounded shadow-sm text-xs font-bold hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
          >
            <span>➕</span> طلب جديد
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="flex-1 md:flex-none bg-[#0f172a] text-white border border-slate-700 px-5 py-2 rounded text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
          >
            <span>📦</span> جرد المخزون
          </button>
        </div>
      </div>

      {/* 4. جدول أحدث الطلبات والعمليات المسجلة */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-white">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>📋</span> أحدث الطلبات والعمليات المسجلة
          </h3>
          <button
            onClick={() => onNavigate('orders-history')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 transition"
          >
            عرض كافة الطلبات ←
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                <th className="p-3">رقم الطلب</th>
                <th className="p-3">تاريخ الطلب</th>
                <th className="p-3">اسم العميل</th>
                <th className="p-3">طريقة الدفع</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentOrders.length > 0 ? (
                recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition text-slate-700">
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      #{ord.id.substring(0, 8)}
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(ord.created_at).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{ord.client_name || 'غير معروف'}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                        {ord.payment_method === 'cash' ? '💵 نقدي' : ord.payment_method === 'credit' ? '💳 دين' : '🏦 بنكي'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                          ord.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        ● {ord.status === 'confirmed' ? 'مؤكد' : ord.status === 'draft' ? 'مسودة' : 'ملغى'}
                      </span>
                    </td>
                    <td className="p-3 font-black text-slate-900">{formatILS(ord.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                    لا توجد طلبات مسجلة حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
