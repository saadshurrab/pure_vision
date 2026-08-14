import React, { useMemo } from 'react';
import { formatILS } from '@/lib/supabase';

interface DashboardHomeProps {
  orders: any[];
  clientsCount: number;
  products?: any[];
  lensStock?: any[];
  onNavigate: (tab: 'new-order' | 'inventory' | 'orders-history' | 'clients') => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  orders,
  clientsCount,
  products = [],
  lensStock = [],
  onNavigate,
}) => {
  // حساب المبيعات والطلبات
  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  const todayOrders = orders.filter((o) => {
    if (!o.created_at) return false;
    const today = new Date().toISOString().split('T')[0];
    return o.created_at.startsWith(today);
  });

  // 🎯 جلب أحدث 5 طلبات بترتيب تنازلي حسب تاريخ الإنشاء
  const latestOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [orders]);

  // حساب المنتجات منخفضة المخزون (أقل من 5 قطع)
  const lowStockProductsCount = products.filter(
    (p) => Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0)) < 5
  ).length;

  const lowStockLensesCount = lensStock.filter((s) => s.stock_qty < 5).length;
  const totalLowStock = lowStockProductsCount + lowStockLensesCount;

  // قائمة بأبرز التنبيهات للمخزون المنخفض
  const lowStockItems = [
    ...products
      .filter((p) => Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0)) < 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        type: 'منتج',
        qty: Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0)),
      })),
    ...lensStock
      .filter((s) => s.stock_qty < 5)
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        name: `عدسة قياس (${s.sph > 0 ? `+${s.sph}` : s.sph})`,
        type: 'عدسة',
        qty: s.stock_qty,
      })),
  ].slice(0, 5);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 📊 البطاقات الإحصائية الأربعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">طلبات اليوم</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{todayOrders.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl font-bold">
            📦
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي الطلبات</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{orders.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            ✅
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">💰 إجمالي المبيعات</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{formatILS(totalSales)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold">
            📈
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">📉 تنبيهات المخزون</p>
            <h3 className={`text-2xl font-bold mt-1 ${totalLowStock > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {totalLowStock} <span className="text-xs font-normal text-slate-400">صنف منخفض</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
        </div>
      </div>

      {/* 📥 أحدث الطلبات + تنبيهات نقص المخزون */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* جدول أحدث الطلبات المحسن */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">📋 أحدث الطلبات المسجلة</h3>
            <button
              onClick={() => onNavigate('orders-history')}
              className="text-xs text-sky-600 hover:underline font-bold"
            >
              عرض الكل ⬅
            </button>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b">
                  <th className="p-3 font-bold w-24">رقم الطلب</th>
                  <th className="p-3 font-bold">طريقة الدفع</th>
                  <th className="p-3 font-bold text-center">الحالة</th>
                  <th className="p-3 font-bold text-left w-28">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {latestOrders.length > 0 ? (
                  latestOrders.map((ord, idx) => (
                    <tr
                      key={ord.id}
                      className={`border-b transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                      } hover:bg-sky-50/50`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-700">
                        #{ord.id.slice(0, 8)}
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        {ord.payment_method === 'cash'
                          ? '💵 نقدي'
                          : ord.payment_method === 'credit'
                          ? '💳 دين'
                          : '🏦 بنكي'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            ord.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status === 'confirmed' ? 'مؤكد' : 'مسودة'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 text-left">
                        {formatILS(ord.total || 0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      لا توجد طلبات حديثة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* تنبيهات المخزون والأصناف المنخفضة */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">🚨 أصناف قاربت على الانتهاء</h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-sky-600 hover:underline font-bold"
            >
              المخزون ⬅
            </button>
          </div>

          <div className="space-y-2.5">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <span className="text-[10px] text-slate-500 font-semibold">{item.type}</span>
                  </div>
                  <span className="bg-rose-100 text-rose-700 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                    متبقي: {item.qty}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                ✨ جميع الأصناف والمخزون في حالة ممتازة!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
