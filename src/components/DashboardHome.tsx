import { formatILS } from '@/lib/supabase';
import { StatsOverview } from '@/components/StatsOverview';

interface DashboardHomeProps {
  orders: any[];
  clientsCount: number;
  onNavigate: (tab: 'new-order' | 'inventory' | 'orders-history' | 'clients') => void;
}

export function DashboardHome({ orders, clientsCount, onNavigate }: DashboardHomeProps) {
  // أحدث 5 طلبات
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. بطاقات الإحصائيات الشاملة */}
      <StatsOverview orders={orders} />

      {/* 2. أزرار إجراءات سريعة */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          ⚡ وصول سريع
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('new-order')}
            className="p-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center justify-between transition shadow-sm group"
          >
            <span>🛒 إنشاء طلب جديد</span>
            <span className="text-xl group-hover:translate-x-[-4px] transition-transform">←</span>
          </button>

          <button
            onClick={() => onNavigate('inventory')}
            className="p-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-between transition shadow-sm group"
          >
            <span>📦 فحص المخزون</span>
            <span className="text-xl group-hover:translate-x-[-4px] transition-transform">←</span>
          </button>

          <button
            onClick={() => onNavigate('orders-history')}
            className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-between transition group"
          >
            <span>📋 سجل الطلبات</span>
            <span className="text-xl group-hover:translate-x-[-4px] transition-transform">←</span>
          </button>

          <button
            onClick={() => onNavigate('clients')}
            className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-between transition group"
          >
            <span>👥 دليل العملاء ({clientsCount})</span>
            <span className="text-xl group-hover:translate-x-[-4px] transition-transform">←</span>
          </button>
        </div>
      </div>

      {/* 3. جدول أحدث الطلبات */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            🕒 أحدث الطلبات المسجلة
          </h3>
          <button
            onClick={() => onNavigate('orders-history')}
            className="text-xs font-bold text-sky-600 hover:underline"
          >
            عرض كافة الطلبات ←
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-400">لا توجد طلبات مسجلة حتى الآن.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b">
                  <th className="p-3">رقم الطلب</th>
                  <th className="p-3">اسم العميل</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-400">{ord.id.slice(0, 8)}...</td>
                    <td className="p-3 font-bold text-slate-800">{ord.clients?.name || 'عميل'}</td>
                    <td className="p-3 text-slate-500">{new Date(ord.created_at).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3 font-semibold text-slate-600">
                      {ord.payment_method === 'cash' ? '💵 نقدي' : ord.payment_method === 'credit' ? '💳 دين' : '🏦 بنكي'}
                    </td>
                    <td className="p-3 font-black text-emerald-600">{formatILS(ord.total)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                          ord.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {ord.status === 'confirmed' ? 'مؤكد' : 'مسودة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
