import { useEffect, useState, useMemo } from 'react';
import { supabase, formatILS, type Client, type InvoiceData } from '@/lib/supabase';

interface OrderRecord {
  id: string;
  created_at: string;
  total: number;
  subtotal?: number;
  discount_percent?: number;
  discount_amount?: number;
  status: 'draft' | 'confirmed';
  payment_method: 'cash' | 'credit' | 'bank';
  notes: string | null;
  client_id: string;
  clients: Client;
  order_items?: any[];
  invoices?: { invoice_number: string }[];
}

interface OrdersHistoryProps {
  onPrintInvoice?: (invoiceData: InvoiceData) => void;
}

export function OrdersHistory({ onPrintInvoice }: OrdersHistoryProps) {
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
    // جلب الطلبات مع بيانات العميل والأصناف ورقم الفاتورة
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients(*),
        order_items(
          *,
          lens_products(brand, bc, dia),
          products(name, category)
        ),
        invoices(invoice_number)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as OrderRecord[]);
    }
    setLoading(false);
  }

  // معالجة فتح وطباعة الفاتورة للطلب المحدد
  const handlePrint = (order: OrderRecord) => {
    if (!onPrintInvoice) return;

    const items = (order.order_items || []).map((item) => {
      if (item.item_type === 'lens' || item.lens_product_id) {
        return {
          lensProductId: item.lens_product_id,
          brand: item.lens_products?.brand || 'عدسة',
          bc: item.lens_products?.bc || '',
          dia: item.lens_products?.dia || '',
          unitPrice: item.unit_price,
          sph: item.sph,
          cyl: item.cyl,
          axis: item.axis,
          quantity: item.quantity,
        };
      }
      return {
        productId: item.product_id,
        name: item.products?.name || 'منتج',
        unitPrice: item.unit_price,
        quantity: item.quantity,
      };
    });

    const invoiceNumber =
      order.invoices && order.invoices.length > 0
        ? order.invoices[0].invoice_number
        : `INV-${order.id.slice(0, 8).toUpperCase()}`;

    const invoiceData: InvoiceData = {
      invoiceNumber,
      orderId: order.id,
      client: order.clients || { name: 'عميل نقدي' },
      items,
      subtotal: order.subtotal || order.total,
      discountPercent: order.discount_percent || 0,
      discountAmount: order.discount_amount || 0,
      total: order.total,
      paymentMethod: order.payment_method || 'cash',
      notes: order.notes,
      createdAt: order.created_at,
    };

    onPrintInvoice(invoiceData);
  };

  // تسديد الفاتورة الآجلة
  async function handleMarkAsPaid(order: OrderRecord) {
    if (!order.clients) return;
    setPayingOrderId(order.id);

    try {
      // 1. تحديث طريقة الدفع للطلب لتصبح نقدي (كاش)
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ payment_method: 'cash' })
        .eq('id', order.id);

      if (orderErr) throw orderErr;

      // 2. جلب أحدث رصيد للعميل مباشرة من القاعدة لتفادي أي تضارب
      const { data: freshClient, error: fetchErr } = await supabase
        .from('clients')
        .select('outstanding_balance')
        .eq('id', order.client_id)
        .single();

      if (fetchErr) throw fetchErr;

      const currentBalance = freshClient?.outstanding_balance ?? order.clients.outstanding_balance ?? 0;
      const newBalance = Math.max(0, currentBalance - order.total);

      // 3. خصم مبلغ الفاتورة من دين العميل في جدول العملاء
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

      // إذا كان الدفع أجلاً (دين)، يُضاف إجمالي الطلب إلى حساب العميل
      if (order.payment_method === 'credit') {
        const { data: freshClient, error: fetchErr } = await supabase
          .from('clients')
          .select('outstanding_balance')
          .eq('id', order.client_id)
          .single();

        if (fetchErr) throw fetchErr;

        const currentBalance = freshClient?.outstanding_balance ?? order.clients.outstanding_balance ?? 0;
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

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesClient = o.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ?? true;
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || o.payment_method === paymentFilter;
      return matchesClient && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => (o.status === 'confirmed' ? acc + o.total : acc), 0);
    const pendingCreditOrders = orders.filter((o) => o.status === 'confirmed' && o.payment_method === 'credit');
    const pendingCreditCount = pendingCreditOrders.length;
    const pendingCreditAmount = pendingCreditOrders.reduce((acc, o) => acc + o.total, 0);
    const draftsCount = orders.filter((o) => o.status === 'draft').length;
    return { totalSales, pendingCreditCount, pendingCreditAmount, draftsCount, totalCount: orders.length };
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-[350px] flex flex-col items-center justify-center bg-white border border-slate-300 rounded-sm p-8 shadow-sm">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-3" />
        <p className="text-slate-600 font-medium text-xs tracking-wide">جاري تحميل البيانات المالية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans" dir="rtl">
      {/* 1️⃣ لوحة الملخص المالي الكلاسيكية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 border border-slate-300 rounded-sm shadow-xs border-r-4 border-r-emerald-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">إجمالي المبيعات المؤكدة</span>
            <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m0-10V4m0 16v-2" />
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2 font-mono dir-ltr text-right">{formatILS(stats.totalSales)}</p>
        </div>

        <div className="bg-white p-4 border border-slate-300 rounded-sm shadow-xs border-r-4 border-r-rose-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">فواتير غير مسددة (ديون)</span>
            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-lg font-bold text-rose-700 font-mono dir-ltr">{formatILS(stats.pendingCreditAmount)}</p>
            <span className="text-xs font-medium text-slate-500">({stats.pendingCreditCount} فاتورة)</span>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-300 rounded-sm shadow-xs border-r-4 border-r-sky-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">المسودات المؤجلة</span>
            <svg className="w-4 h-4 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">{stats.draftsCount} <span className="text-xs font-normal text-slate-500">مسودة</span></p>
        </div>

        <div className="bg-white p-4 border border-slate-300 rounded-sm shadow-xs border-r-4 border-r-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">إجمالي السجلات</span>
            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">{stats.totalCount}</p>
        </div>
      </div>

      {/* 2️⃣ الحاوية الرئيسية للبيانات والأدوات */}
      <div className="bg-white border border-slate-300 rounded-sm shadow-xs">
        {/* الترويسة وأدوات التحكم الرسمية */}
        <div className="p-4 bg-slate-50 border-b border-slate-300 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">سجل الطلبات والمعاملات المالية</h2>
            </div>
            <button
              onClick={fetchOrders}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 transition-colors active:bg-slate-200"
            >
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تحديث البيانات
            </button>
          </div>

          {/* شريط الفلترة المتقدم */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="relative">
              <input
                type="text"
                placeholder="البحث باسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-slate-600 font-medium text-slate-800 placeholder-slate-400"
              />
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-slate-600 font-medium text-slate-700"
            >
              <option value="all">تصفية حسب الحالة (الكل)</option>
              <option value="confirmed">طلبات مؤكدة</option>
              <option value="draft">مسودات</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-slate-600 font-medium text-slate-700"
            >
              <option value="all">تصفية حسب طريقة الدفع (الكل)</option>
              <option value="cash">نقدي (كاش)</option>
              <option value="credit">آجل (على الحساب / دين)</option>
              <option value="bank">تحويل بنكي</option>
            </select>
          </div>
        </div>

        {/* 3️⃣ جدول البيانات الرسمية */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider border-b border-slate-900">
                <th className="py-2.5 px-3 border-l border-slate-700">رقم الطلب</th>
                <th className="py-2.5 px-3 border-l border-slate-700">اسم العميل</th>
                <th className="py-2.5 px-3 border-l border-slate-700">تاريخ الطلب</th>
                <th className="py-2.5 px-3 border-l border-slate-700">طريقة الدفع</th>
                <th className="py-2.5 px-3 border-l border-slate-700">الإجمالي</th>
                <th className="py-2.5 px-3 border-l border-slate-700">الحالة</th>
                <th className="py-2.5 px-3 border-l border-slate-700 text-center">الفاتورة</th>
                <th className="py-2.5 px-3 text-center">حالة التحصيل / الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => {
                  const isDraft = o.status === 'draft';
                  const isCredit = o.payment_method === 'credit';
                  const isPaying = payingOrderId === o.id;
                  const isConfirming = confirmingDraftId === o.id;

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-slate-100/70 transition-colors ${
                        isDraft ? 'bg-amber-50/30' : isCredit ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* رقم الطلب */}
                      <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-600 border-l border-slate-200">
                        #{o.id.slice(0, 8)}
                      </td>

                      {/* العميل */}
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-l border-slate-200">
                        {o.clients?.name || <span className="text-slate-400 font-normal">عميل محذوف</span>}
                      </td>

                      {/* التاريخ والوقت */}
                      <td className="py-2.5 px-3 text-slate-600 border-l border-slate-200 font-mono text-[11px]">
                        {new Date(o.created_at).toLocaleDateString('en-GB')}{' '}
                        <span className="text-slate-400">
                          {new Date(o.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* طريقة الدفع */}
                      <td className="py-2.5 px-3 border-l border-slate-200">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold border ${
                            o.payment_method === 'cash'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : o.payment_method === 'credit'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-sky-50 text-sky-800 border-sky-300'
                          }`}
                        >
                          {o.payment_method === 'cash'
                            ? 'نقدي (كاش)'
                            : o.payment_method === 'credit'
                            ? 'على الحساب (دين)'
                            : 'تحويل بنكي'}
                        </span>
                      </td>

                      {/* المبلغ الإجمالي */}
                      <td className="py-2.5 px-3 font-bold font-mono text-slate-900 border-l border-slate-200">
                        {formatILS(o.total)}
                      </td>

                      {/* حالة الطلب */}
                      <td className="py-2.5 px-3 border-l border-slate-200">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold border ${
                            isDraft
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {isDraft ? 'مسودة' : 'مؤكد'}
                        </span>
                      </td>

                      {/* عمود الفاتورة / العرض والطباعة */}
                      <td className="py-2.5 px-3 border-l border-slate-200 text-center">
                        <button
                          onClick={() => handlePrint(o)}
                          title="معاينة وطباعة الفاتورة"
                          className="inline-flex items-center justify-center gap-1 bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 font-semibold px-2 py-1 rounded-sm text-[11px] transition-colors shadow-xs"
                        >
                          <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          الفاتورة
                        </button>
                      </td>

                      {/* حالة التحصيل والإجراء */}
                      <td className="py-2.5 px-3 text-center">
                        {isDraft ? (
                          <button
                            onClick={() => handleConfirmDraft(o)}
                            disabled={isConfirming}
                            className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold px-2.5 py-1 rounded-sm text-[11px] transition-colors border border-slate-900 shadow-xs mx-auto"
                          >
                            {isConfirming ? (
                              'جاري التأكيد...'
                            ) : (
                              <>
                                <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                تأكيد المسودة
                              </>
                            )}
                          </button>
                        ) : isCredit ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-xs border border-rose-200">
                              غير مسدد (آجل)
                            </span>
                            <button
                              onClick={() => handleMarkAsPaid(o)}
                              disabled={isPaying}
                              className="inline-flex items-center justify-center gap-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-semibold px-2.5 py-1 rounded-sm text-[11px] transition-colors border border-emerald-800 shadow-xs"
                            >
                              {isPaying ? (
                                'جاري التحصيل...'
                              ) : (
                                <>
                                  <svg className="w-3 h-3 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  تحصيل
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            مسدد بالكامل
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium text-xs">
                    لا توجد سجلات مالية أو طلبات مطابقة للفلترة المحددة.
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
