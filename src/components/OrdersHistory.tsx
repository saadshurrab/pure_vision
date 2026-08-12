import { useEffect, useState } from 'react';
import { supabase, formatILS, type Client } from '@/lib/supabase';

interface OrderRecord {
  id: string;
  created_at: string;
  total: number;
  status: 'draft' | 'confirmed';
  payment_method: string;
  notes: string | null;
  clients: Client;
}

export function OrdersHistory() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, clients(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as OrderRecord[]);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل سجل الطلبات...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">سجل الطلبات والفواتير</h2>
          <p className="text-sm text-slate-500">عرض أحدث الطلبات المحفوظة والمؤكدة</p>
        </div>
        <button
          onClick={fetchOrders}
          className="text-sky-600 hover:text-sky-700 font-medium text-sm"
        >
          🔄 تحديث البيانات
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <th className="p-3">رقم الطلب</th>
              <th className="p-3">العميل</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">طريقة الدفع</th>
              <th className="p-3">المبلغ الإجمالي</th>
              <th className="p-3">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono text-slate-500">{o.id.slice(0, 8)}</td>
                <td className="p-3 font-semibold text-slate-800">{o.clients?.name || '—'}</td>
                <td className="p-3 text-slate-500">
                  {new Date(o.created_at).toLocaleDateString('ar-EG')} - {new Date(o.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-3 text-slate-600">
                  {o.payment_method === 'cash' ? 'نقدي' : o.payment_method === 'credit' ? 'دين' : 'شيك'}
                </td>
                <td className="p-3 font-bold text-sky-700">{formatILS(o.total)}</td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      o.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {o.status === 'confirmed' ? 'مؤكد' : 'مسودة'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}