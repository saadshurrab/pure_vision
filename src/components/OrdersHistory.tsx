import { useEffect, useState, useMemo } from 'react';
import { supabase, formatILS, type Client } from '@/lib/supabase';

interface OrderRecord {
  id: string;
  created_at: string;
  total: number;
  status: 'draft' | 'confirmed';
  payment_method: 'cash' | 'credit' | 'bank';
  notes: string | null;
  client_id: string;
  clients: Client;
}

export function OrdersHistory() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [confirmingDraftId, setConfirmingDraftId] = useState<string | null>(null);

  // حالات الفلترة والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'confirmed'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'credit' | 'bank'>('all');

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

  // تسديد الفاتورة الآجلة
  async function handleMarkAsPaid(order: OrderRecord) {
    if (!order.clients) return;
    setPayingOrderId(order.id);

    try {
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ payment_method: 'cash' })
        .eq('id', order.id);

      if (orderErr) throw orderErr;

      const currentBalance = order.clients.outstanding_balance;
      const newBalance = Math.max(0, currentBalance - order.total);

      const { error: clientErr } = await supabase
        .from('clients')
        .update({ outstanding_balance: Math.round(newBalance * 100) / 100 })
        .eq('id', order.client_id);

      if (clientErr) throw clientErr;

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
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      if (orderErr) throw orderErr;

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

  // تصفية البيانات تلقائياً
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesClient = o.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ?? true;
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || o.payment_method === paymentFilter;
      return matchesClient && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // إحصائيات سريعة للرأسية
  const stats = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => (o.status === 'confirmed' ? acc + o.total : acc), 0);
    const pendingCredit = orders.filter((o) => o.status === 'confirmed' && o.payment_method === 'credit').length;
    const draftsCount = orders.filter((o) => o.status === 'draft').length;
    return { totalSales, pendingCredit, draftsCount, totalCount: orders.length };
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-semibold text-sm">جاري جلب سجل الفواتير والطلبات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1️⃣ بطاقات الإحصائيات الرسمية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي المبيعات المؤكدة</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatILS(stats.totalSales)}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg">
            💰
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">فواتير آجلة (تحتاج تحصيل)</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{stats.pendingCredit} فاتورة</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold text-lg">
            ⏳
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">مسودات بانتظار التأكيد</p>
            <p className="text-xl font-bold text-sky-600 mt-1">{stats.draftsCount} مسودة</p>
          </div>
          <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center font-bold text-lg">
            📝
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي الطلبات</p>
            <p className="text-xl font-bold text-slate-700 mt-1">{stats.totalCount}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-lg">
            📦
          </div>
        </div>
      </div>

      {/* 2️⃣ الحاوية الرئيسية للجدول والفلترة */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* هيدر الصفحة والتحكم */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">سجل الفواتير والطلبات</h2>
              <p className="text-xs text-slate-500 mt-0.5">متابعة تحصيل الديون ومراجعة وتأكيد كافة المعاملات المالية</p>
            </div>
            <button
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-all active:scale-95 self-start sm:self-auto"
            >
              <span>🔄</span> تحديث البيانات
            </button>
          </div>

          {/* شريط الفلترة والبحث */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="relative">
              <input
                type="text"
                placeholder="البحث باسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">🔍</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700"
            >
              <option value="all">جميع الحالات (مؤكد + مسودة)</option>
              <option value="confirmed">✅ طلبات مؤكدة فقط</option>
              <option value="draft">📝 مسودات فقط</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700"
            >
              <option value="all">جميع طرق الدفع</option>
              <option value="cash">💵 نقدي (كاش)</option>
              <option value="credit">⏳ آجل (دين)</option>
              <option value="bank">🏦 تحويل بنكي</option>
            </select>
          </div>
        </div>

        {/* 3️⃣ جدول الطلبات البرمجي */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">اسم العميل</th>
                <th className="py-3.5 px-4">التاريخ والوقت</th>
                <th className="py-3.5 px-4">طريقة الدفع</th>
                <th className="py-3.5 px-4">الإجمالي</th>
                <th className="py-3.5 px-4">حالة الطلب</th>
                <th className="py-3.5 px-4 text-center">الإجراء المطلوب / التحصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => {
                  const isDraft = o.status === 'draft';
                  const isCredit = o.payment_method === 'credit';
                  const isPaying = payingOrderId === o.id;
                  const isConfirming = confirmingDraftId === o.id;

                  return (
                    <tr
                      key={o.id}
                      className={`transition-colors ${
                        isDraft
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : isCredit
                          ? 'bg-orange-50/20 hover:bg-slate-50/80'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* رقم الطلب */}
                      <td className="py-4 px-4 font-mono font-medium text-slate-500">
                        #{o.id.slice(0, 8)}
                      </td>

                      {/* العميل */}
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        {o.clients?.name || <span className="text-slate-400 font-normal">عميل محذوف</span>}
                      </td>

                      {/* التاريخ والوقت */}
                      <td className="py-4 px-4 text-slate-500">
                        <div className="font-medium text-slate-700">
                          {new Date(o.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(o.created_at).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* طريقة الدفع */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                            o.payment_method === 'cash'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : o.payment_method === 'credit'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {o.payment_method === 'cash'
                            ? 'نقدي (كاش)'
                            : o.payment_method === 'credit'
                            ? 'آجل (دين)'
                            : 'تحويل بنكي'}
                        </span>
                      </td>

                      {/* المبلغ الإجمالي */}
                      <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                        {formatILS(o.total)}
                      </td>

                      {/* حالة الطلب */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isDraft
                              ? 'bg-amber-100/80 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100/80 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {isDraft ? '📝 مسودة' : '✅ مؤكد'}
                        </span>
                      </td>

                      {/* الإجراء والتحصيل */}
                      <td className="py-4 px-4 text-center">
                        {isDraft ? (
                          <button
                            onClick={() => handleConfirmDraft(o)}
                            disabled={isConfirming}
                            className="inline-flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:bg-slate-300 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm mx-auto"
                          >
                            {isConfirming ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                جاري التأكيد...
                              </>
                            ) : (
                              '⚡ تأكيد المسودة'
                            )}
                          </button>
                        ) : isCredit ? (
                          <button
                            onClick={() => handleMarkAsPaid(o)}
                            disabled={isPaying}
                            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm mx-auto"
                          >
                            {isPaying ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                جاري التحصيل...
                              </>
                            ) : (
                              '💳 تم التحصيل (واصل)'
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <span>✨</span> مدفوع بالكامل
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    لا توجد فواتير أو طلبات تطابق الفلترة المحددة.
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
