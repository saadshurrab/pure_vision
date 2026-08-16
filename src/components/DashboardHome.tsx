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

  // حساب النقص في المخزون (منتجات أو عدسات كميتها أقل من 5)
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
    <div className="space-y-6">
      {/* 1. لوحة تحكم بيور فيجن والإحصائيات السريعة (فوق) */}
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-800">لوحة تحكم Pure Vision Optics</h1>
            <p className="text-xs text-slate-500 mt-1">
              متابعة حركة المبيعات، المخزون، والديون المستحقة بشكل مباشر.
            </p>
          </div>
          <span className="bg-sky-50 text-sky-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-sky-200">
            النظام يعمل بكفاءة 🟢
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* إجمالي المبيعات */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">إجمالي المبيعات المؤكدة</p>
              <h3 className="text-2xl font-black text-emerald-600">{formatILS(totalSales)}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">
              💰
            </div>
          </div>

          {/* الديون المستحقة */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">إجمالي ديون العملاء</p>
              <h3 className="text-2xl font-black text-rose-600">{formatILS(totalOutstandingBalance)}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl font-bold">
              💳
            </div>
          </div>

          {/* عدد العملاء */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">العملاء المسجلين</p>
              <h3 className="text-2xl font-black text-sky-700">{clientsCount} عميل</h3>
            </div>
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center text-xl font-bold">
              👥
            </div>
          </div>

          {/* تنبيهات المخزون */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">تنبيهات نواقص المخزون</p>
              <h3 className="text-2xl font-black text-amber-600">{lowStockCount} أصناف</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold">
              ⚠️
            </div>
          </div>
        </div>
      </div>

      {/* 2. البيانات والعمليات (أحدث الطلبات) (بالوسط) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-slate-800 text-base">📋 أحدث الطلبات والعمليات المسجلة</h3>
          <button
            onClick={() => onNavigate('orders-history')}
            className="text-xs font-bold text-sky-600 hover:underline"
          >
            عرض كافة الطلبات ←
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-600 text-xs font-bold">
                <th className="p-3">تاريخ الطلب</th>
                <th className="p-3">اسم العميل</th>
                <th className="p-3">طريقة الدفع</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((ord) => (
                  <tr key={ord.id} className="border-b hover:bg-slate-50/80 transition text-sm">
                    <td className="p-3 text-slate-500 text-xs">
                      {new Date(ord.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{ord.client_name || 'غير معروف'}</td>
                    <td className="p-3 text-xs font-semibold">
                      {ord.payment_method === 'cash' ? '💵 نقدي' : ord.payment_method === 'credit' ? '💳 دين' : '🏦 بنكي'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          ord.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : ord.status === 'draft'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {ord.status === 'confirmed' ? 'مؤكد' : ord.status === 'draft' ? 'مسودة' : 'ملغى'}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-sky-800">{formatILS(ord.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-sm">
                    لا توجد طلبات مسجلة حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. الورقة والإجراءات السريعة (تحت في الأسفل) */}
      <div className="bg-gradient-to-r from-sky-800 to-sky-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">ورقة الإجراءات السريعة والطلبات</h2>
          <p className="text-xs text-sky-200 mt-1">يمكنك البدء فوراً بإنشاء طلب جديد أو الانتقال للتحقق من جرد المخزون.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('new-order')}
            className="bg-white text-sky-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-sky-50 transition shadow-sm"
          >
            ➕ طلب جديد
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="bg-sky-700 text-white border border-sky-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-sky-600 transition"
          >
            📦 جرد المخزون
          </button>
        </div>
      </div>
    </div>
  );
}
