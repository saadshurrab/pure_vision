import { useEffect, useState } from 'react';
import { supabase, formatILS, type Client } from '@/lib/supabase';

interface OrderRecord {
  id: string;
  created_at: string;
  total: number;
  status: 'draft' | 'confirmed';
  payment_method: 'cash' | 'credit' | 'cheque';
  notes: string | null;
  client_id: string;
  clients: Client;
}

export function OrdersHistory() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [confirmingDraftId, setConfirmingDraftId] = useState<string | null>(null);

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

  // تسديد الفاتورة الآجلة (تحويلها لنقدي وخصم قيمة الدين من العميل)
  async function handleMarkAsPaid(order: OrderRecord) {
    if (!order.clients) return;
    setPayingOrderId(order.id);

    try {
      // 1. تحديث طريقة الدفع للطلب إلى كاش
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ payment_method: 'cash' })
        .eq('id', order.id);

      if (orderErr) throw orderErr;

      // 2. خصم قيمة الطلب من دين العميل
      const currentBalance = order.clients.outstanding_balance;
      const newBalance = Math.max(0, currentBalance - order.total);

      const { error: clientErr } = await supabase
        .from('clients')
        .update({ outstanding_balance: Math.round(newBalance * 100) / 100 })
        .eq('id', order.client_id);

      if (clientErr) throw clientErr;

      // إعادة تحديث الجدول
      await fetchOrders();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء تسديد الفاتورة');
    } finally {
      setPayingOrderId(null);
    }
  }

  // تحويل المسودة إلى طلب مؤكد
  async function handleConfirmDraft(order: OrderRecord) {
    if (!order.clients) return;
    setConfirmingDraftId(order.id);

    try {
      // 1. تحديث حالة الطلب إلى مؤكد
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      if (orderErr) throw orderErr;

      // 2. إذا كانت طريقة الدفع دين، تمت إضافتها لدين العميل
      if (order.payment_method === 'credit') {
        const currentBalance = order.clients.outstanding_balance;
        const newBalance = currentBalance + order.total;

        const { error: clientErr } = await supabase
          .from('clients')
          .update({ outstanding_balance: Math.round(newBalance * 100) / 100 })
          .eq('id', order.client_id);

        if (clientErr) throw clientErr;
      }

      await fetchOrders();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء تأكيد المسودة');
    } finally {
      setConfirmingDraftId(null);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل سجل الطلبات...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">سجل الطلبات والفواتير</h2>
          <p className="text-sm text-slate-500">عرض وحالة كافة الطلبات والمبيعات</p>
        </div>
        <button
          onClick={fetchOrders}
          className="text-sky-600 hover:text-sky-700 font-medium text-sm flex items-center gap-1"
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
              <th className="p-3">التاريخ والوقت</th>
              <th className="p-3">طريقة الدفع</th>
              <th className="p-3">المبلغ الإجمالي</th>
              <th className="p-3">حالة الطلب</th>
              <th className="p-3 text-center">التحصيل / واصل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {orders.map((o) => {
              const isDraft = o.status === 'draft';
              const isCredit = o.payment_method === 'credit';
              const isPaying = payingOrderId === o.id;
              const isConfirming = confirmingDraftId === o.id;

              return (
                <tr key={o.id} className={isDraft ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50'}>
                  <td className="p-3 font-mono text-slate-500">{o.id.slice(0, 8)}</td>
                  <td className="p-3 font-semibold text-slate-800">{o.clients?.name || '—'}</td>
                  <td className="p-3 text-slate-500">
                    {new Date(o.created_at).toLocaleDateString('ar-EG')} -{' '}
                    {new Date(o.created_at).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-3">
  <span
    className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
      o.payment_method === 'cash'
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : o.payment_method === 'credit'
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-purple-50 text-purple-700 border border-purple-200'
    }`}
  >
    {o.payment_method === 'cash'
      ? 'نقدي (كاش)'
      : o.payment_method === 'credit'
      ? 'آجل (دين)'
      : 'شيك'}
  </span>
</td>
                  <td className="p-3 font-bold text-sky-700">{formatILS(o.total)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        isDraft
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isDraft ? '📝 مسودة' : '✅ مؤكد'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {isDraft ? (
                      <button
                        onClick={() => handleConfirmDraft(o)}
                        disabled={isConfirming}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1 mx-auto shadow-sm"
                      >
                        {isConfirming ? 'جاري التأكيد...' : '⚡ تأكيد المسودة'}
                      </button>
                    ) : isCredit ? (
                      <button
                        onClick={() => handleMarkAsPaid(o)}
                        disabled={isPaying}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1 mx-auto shadow-sm"
                      >
                        {isPaying ? 'جاري التحصيل...' : '✅ تم التحصيل (واصل)'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">مدفوع بالكامل ✨</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
