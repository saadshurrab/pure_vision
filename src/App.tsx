import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  supabase,
  type Client,
  type LensProduct,
  type LensStock,
  type Product,
  type CartLensItem,
  type CartProductItem,
  type PaymentMethod,
  type InvoiceData,
  type SphSign,
  formatILS,
  formatSPH,
  SPH_ALL,
} from '@/lib/supabase';
import { Header } from '@/components/Header';
import { ClientSelector } from '@/components/ClientSelector';
import { SphMatrix, type CustomPrescription } from '@/components/SphMatrix';
import { AdditionalItems } from '@/components/AdditionalItems';
import { Cart } from '@/components/Cart';
import { OrderConfirmationModal, type OrderSummary } from '@/components/OrderConfirmationModal';
import { ClientsList } from '@/components/ClientsList';
import { OrdersHistory } from '@/components/OrdersHistory';

export default function App() {
  const [activeTab, setActiveTab] = useState<'new-order' | 'orders-history' | 'clients'>('new-order');
  const [clients, setClients] = useState<Client[]>([]);
  const [lensProducts, setLensProducts] = useState<LensProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lensStock, setLensStock] = useState<LensStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedLensId, setSelectedLensId] = useState<string>('');
  const [sphSign, setSphSign] = useState<SphSign>('minus');
  const [selectedBC, setSelectedBC] = useState<string>('');
  const [selectedDIA, setSelectedDIA] = useState<string>('');
  const [isToric, setIsToric] = useState(false);
  const [selectedCYL, setSelectedCYL] = useState<number | null>(null);
  const [selectedAXIS, setSelectedAXIS] = useState<number | null>(null);
  const [customPrescription, setCustomPrescription] = useState<CustomPrescription | null>(null);
  const [lensQuantities, setLensQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<(CartLensItem | CartProductItem)[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [c, l, p, ls] = await Promise.all([
        supabase.from('clients').select('*').eq('active', true).order('name'),
        supabase.from('lens_products').select('*').eq('active', true).order('brand'),
        supabase.from('products').select('*').eq('active', true).order('category, name'),
        supabase.from('lens_stock').select('*'),
      ]);

      if (c.error) throw c.error;
      if (l.error) throw l.error;
      if (p.error) throw p.error;
      if (ls.error) throw ls.error;

      setClients(c.data || []);
      setLensProducts(l.data || []);
      setProducts(p.data || []);
      setLensStock(ls.data || []);

      if (l.data && l.data.length > 0 && !selectedLensId) {
        const first = l.data[0];
        setSelectedLensId(first.id);
        setSelectedBC(first.bc);
        setSelectedDIA(first.dia);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [selectedLensId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const selectedLens = useMemo(() => {
    return (
      lensProducts.find(
        (l) => l.id === selectedLensId && l.bc === selectedBC && l.dia === selectedDIA
      ) || lensProducts.find((l) => l.id === selectedLensId) || null
    );
  }, [lensProducts, selectedLensId, selectedBC, selectedDIA]);

  const availableBCs = useMemo(() => {
    const bcs = [...new Set(lensProducts.filter((l) => l.id === selectedLensId).map((l) => l.bc))];
    return bcs.sort();
  }, [lensProducts, selectedLensId]);

  const availableDIAs = useMemo(() => {
    const dias = [
      ...new Set(
        lensProducts
          .filter((l) => l.id === selectedLensId && l.bc === selectedBC)
          .map((l) => l.dia)
      ),
    ];
    return dias.sort();
  }, [lensProducts, selectedLensId, selectedBC]);

  function handleSelectLens(id: string) {
    setSelectedLensId(id);
    const variants = lensProducts.filter((l) => l.id === id);
    if (variants.length > 0) {
      const bcs = [...new Set(variants.map((v) => v.bc))].sort();
      setSelectedBC(bcs[0] || '');
      const diasForBC = [
        ...new Set(variants.filter((v) => v.bc === bcs[0]).map((v) => v.dia)),
      ].sort();
      setSelectedDIA(diasForBC[0] || '');
    }
  }

  function handleBCChange(bc: string) {
    setSelectedBC(bc);
    const dias = [
      ...new Set(
        lensProducts.filter((l) => l.id === selectedLensId && l.bc === bc).map((l) => l.dia)
      ),
    ].sort();
    if (dias.length > 0 && !dias.includes(selectedDIA)) {
      setSelectedDIA(dias[0]);
    }
  }

  const stockMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of lensStock) {
      m.set(`${s.lens_product_id}:${s.sph}`, s.stock_qty);
    }
    return m;
  }, [lensStock]);

  /* =========================================================
     الخطوة 3 (المُعدّلة): مزامنة المصفوفة الحالية (Matrix) مع السلة
     ========================================================= */
  useEffect(() => {
    if (!selectedLens) return;

    setCart((prevCart) => {
      // 1. تجميع كل عناصر Matrix الحالية التي أطرافها > 0
      const key = (sph: number) => `${selectedLens.id}:${sph}`;
      const updatedMatrixItems: CartLensItem[] = SPH_ALL.map((sph) => {
        const qty = lensQuantities[key(sph)] || 0;
        return {
          lensProductId: selectedLens.id,
          brand: selectedLens.brand,
          bc: selectedLens.bc,
          dia: selectedLens.dia,
          unitPrice: selectedLens.unit_price,
          sph,
          cyl: isToric ? selectedCYL : null,
          axis: isToric ? selectedAXIS : null,
          isCustom: false,
          quantity: qty,
        };
      }).filter((item) => item.quantity > 0);

      // 2. استبعاد جميع عناصر Matrix السابقة (أي عنصر عدسة ليس custom)
      // والاحتفاظ فقط بالمنتجات الإضافية وبنود المقاسات الخاصة isCustom
      const preservedItems = prevCart.filter((item) => {
        const isLensItem = 'lensProductId' in item;
        if (!isLensItem) return true; // منتج إضافي (Product)
        return item.isCustom;        // عدسة مخصصة (Custom Prescription)
      });

      // 3. دمج العناصر المحفوظة مع عناصر المصفوفة المحدّثة
      return [...preservedItems, ...updatedMatrixItems];
    });
  }, [lensQuantities, selectedLens, isToric, selectedCYL, selectedAXIS]);

  function setLensQty(sph: number, qty: number) {
    if (!selectedLens) return;
    const key = `${selectedLens.id}:${sph}`;
    setLensQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[key];
      else next[key] = qty;
      return next;
    });
  }

  function clearLensGrid() {
    if (!selectedLens) return;
    setLensQuantities((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${selectedLens.id}:`)) delete next[k];
      });
      return next;
    });
  }

  function addCustomPrescription() {
    if (!customPrescription || customPrescription.sph === null || !selectedLens) return;
    const item: CartLensItem = {
      lensProductId: selectedLens.id,
      brand: selectedLens.brand,
      bc: selectedLens.bc,
      dia: selectedLens.dia,
      unitPrice: selectedLens.unit_price,
      sph: customPrescription.sph,
      cyl: customPrescription.cyl ?? null,
      axis: customPrescription.axis ?? null,
      isCustom: true,
      quantity: customPrescription.quantity || 1,
    };
    setCart((prev) => [...prev, item]);
    setCustomPrescription(null);
  }

  function addProduct(p: Product, qty: number) {
    if (qty <= 0) return;
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => !('lensProductId' in i) && (i as CartProductItem).productId === p.id
      );
      if (idx >= 0) {
        const copy = [...prev];
        const existing = copy[idx] as CartProductItem;
        copy[idx] = { ...existing, quantity: existing.quantity + qty };
        return copy;
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          category: p.category,
          sku: p.sku,
          unitPrice: p.unit_price,
          quantity: qty,
        },
      ];
    });
  }

  function updateCartQty(index: number, qty: number) {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((_, i) => i !== index);
      return prev.map((it, i) => (i === index ? { ...it, quantity: qty } : it));
    });
  }

  function removeCartItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  function clearCart() {
    setCart([]);
    setLensQuantities({});
    setDiscountPercent(0);
    setNotes('');
    setPaymentMethod('cash');
    setSaveMsg(null);
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [cart]
  );

  const discountAmount = useMemo(
    () => Math.round(subtotal * (discountPercent / 100) * 100) / 100,
    [subtotal, discountPercent]
  );

  const total = useMemo(
    () => Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100),
    [subtotal, discountAmount]
  );

  const availableCredit = selectedClient
    ? selectedClient.credit_limit - selectedClient.outstanding_balance
    : 0;

  const creditExceeded = selectedClient ? total > availableCredit : false;

  const persistOrder = useCallback(
    async (status: 'draft' | 'confirmed'): Promise<{ orderId: string; invoiceNumber?: string } | null> => {
      if (!selectedClient) {
        setSaveMsg({ type: 'err', text: 'يرجى اختيار العميل أولاً' });
        return null;
      }
      if (cart.length === 0) {
        setSaveMsg({ type: 'err', text: 'السلة فارغة، أضف منتجات قبل الحفظ' });
        return null;
      }
      if (status === 'confirmed' && creditExceeded) {
        setSaveMsg({ type: 'err', text: 'القيمة الإجمالية تتجاوز الرصيد المتاح للعميل' });
        return null;
      }

      setSaving(true);
      setSaveMsg(null);
      try {
        const { data: order, error: oe } = await supabase
          .from('orders')
          .insert({
            client_id: selectedClient.id,
            subtotal: Math.round(subtotal * 100) / 100,
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            total,
            status,
            payment_method: paymentMethod,
            notes: notes || null,
          })
          .select()
          .single();

        if (oe) throw oe;

        const items = cart.map((i) =>
          'lensProductId' in i
            ? {
                order_id: order.id,
                item_type: 'lens',
                lens_product_id: i.lensProductId,
                sph: i.sph,
                cyl: i.cyl,
                axis: i.axis,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                line_total: Math.round(i.unitPrice * i.quantity * 100) / 100,
              }
            : {
                order_id: order.id,
                item_type: 'product',
                product_id: i.productId,
                sph: null,
                cyl: null,
                axis: null,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                line_total: Math.round(i.unitPrice * i.quantity * 100) / 100,
              }
        );

        const { error: ie } = await supabase.from('order_items').insert(items);
        if (ie) throw ie;

        let invoiceNumber: string | undefined;

        if (status === 'confirmed') {
          const newBalance = selectedClient.outstanding_balance + total;
          const { error: ue } = await supabase
            .from('clients')
            .update({ outstanding_balance: Math.round(newBalance * 100) / 100 })
            .eq('id', selectedClient.id);

          if (ue) throw ue;

          setClients((prev) =>
            prev.map((c) =>
              c.id === selectedClient.id ? { ...c, outstanding_balance: newBalance } : c
            )
          );

          invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
          const { error: invErr } = await supabase.from('invoices').insert({
            order_id: order.id,
            invoice_number: invoiceNumber,
          });

          if (invErr) throw invErr;
        }

        return { orderId: order.id, invoiceNumber };
      } catch (e) {
        setSaveMsg({ type: 'err', text: e instanceof Error ? e.message : 'فشل حفظ الطلب' });
        return null;
      } finally {
        setSaving(false);
      }
    },
    [selectedClient, cart, creditExceeded, subtotal, discountPercent, discountAmount, total, paymentMethod, notes]
  );

  async function handleSaveDraft() {
    const result = await persistOrder('draft');
    if (result && selectedClient) {
      setOrderSummary({
        orderId: result.orderId,
        invoiceNumber: '',
        client: selectedClient,
        items: cart,
        subtotal,
        discountPercent,
        discountAmount,
        total,
        paymentMethod,
        status: 'draft',
        createdAt: new Date().toISOString(),
      });
      clearCart();
    }
  }

  async function handleSaveOrder() {
    const result = await persistOrder('confirmed');
    if (!result || !selectedClient) return;

    setOrderSummary({
      orderId: result.orderId,
      invoiceNumber: result.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`,
      client: selectedClient,
      items: cart,
      subtotal,
      discountPercent,
      discountAmount,
      total,
      paymentMethod,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });
    clearCart();
  }

  async function handleSaveInvoice() {
    if (!selectedClient) return;
    const result = await persistOrder('confirmed');
    if (!result) return;

    const invoiceNumber = result.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`;
    const invoice: InvoiceData = {
      invoiceNumber,
      orderId: result.orderId,
      client: selectedClient,
      items: cart,
      subtotal,
      discountPercent,
      discountAmount,
      total,
      paymentMethod,
      notes,
      createdAt: new Date().toISOString(),
    };

    setOrderSummary({
      orderId: result.orderId,
      invoiceNumber,
      client: selectedClient,
      items: cart,
      subtotal,
      discountPercent,
      discountAmount,
      total,
      paymentMethod,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });

    printInvoice(invoice);
    clearCart();
  }

  function printInvoice(data: InvoiceData) {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) {
      setSaveMsg({ type: 'err', text: 'تعذر فتح نافذة الطباعة — يرجى السماح بالنوافذ المنبثقة' });
      return;
    }

    const pmLabel =
      data.paymentMethod === 'cash' ? 'نقدي' : data.paymentMethod === 'credit' ? 'دين' : 'شيك';

    const itemRows = data.items
      .map((item) => {
        if ('lensProductId' in item) {
          const sphLabel = formatSPH(item.sph);
          const cylAxis =
            item.cyl != null
              ? `, CYL ${formatSPH(item.cyl)}${item.axis != null ? `, AXIS ${item.axis}°` : ''}`
              : '';
          const customTag = item.isCustom ? ' [مقاس خاص]' : '';
          return `<tr>
            <td>${item.brand}${customTag} (BC ${item.bc}, DIA ${item.dia}, SPH ${sphLabel}${cylAxis})</td>
            <td style="text-align:center">${item.quantity}</td>
            <td style="text-align:left">${formatILS(item.unitPrice)}</td>
            <td style="text-align:left">${formatILS(item.unitPrice * item.quantity)}</td>
          </tr>`;
        }
        return `<tr>
          <td>${item.name}${item.sku ? ` (${item.sku})` : ''}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:left">${formatILS(item.unitPrice)}</td>
          <td style="text-align:left">${formatILS(item.unitPrice * item.quantity)}</td>
        </tr>`;
      })
      .join('');

    win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>فاتورة ${data.invoiceNumber}</title>
<style>
  * { font-family: 'Segoe UI', Tahoma, sans-serif; box-sizing: border-box; }
  body { padding: 40px; color: #1e293b; max-width: 700px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #0284c7; padding-bottom: 20px; }
  .logo { font-size: 24px; font-weight: bold; color: #0284c7; }
  .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
  .invoice-info { text-align: left; }
  .invoice-info h2 { font-size: 20px; margin: 0 0 8px; color: #0f172a; }
  .invoice-info p { margin: 2px 0; font-size: 13px; color: #475569; }
  .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
  .client-box h3 { margin: 0 0 8px; font-size: 14px; color: #64748b; }
  .client-box p { margin: 4px 0; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f1f5f9; padding: 10px 12px; font-size: 13px; text-align: right; border-bottom: 2px solid #cbd5e1; }
  td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
  .totals { margin-right: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .totals .grand { border-top: 2px solid #0284c7; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: bold; color: #0284c7; }
  .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  .pm-badge { display: inline-block; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 4px 12px; font-size: 13px; color: #0369a1; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">متجر البصريات</div>
      <div class="subtitle">نظام إدارة الطلبات · جميع الأسعار بالشيكل الإسرائيلي (₪)</div>
    </div>
    <div class="invoice-info">
      <h2>فاتورة مبيعات</h2>
      <p>رقم الفاتورة: ${data.invoiceNumber}</p>
      <p>رقم الطلب: ${data.orderId.slice(0, 8)}</p>
      <p>التاريخ: ${new Date(data.createdAt).toLocaleDateString('ar-EG')}</p>
    </div>
  </div>

  <div class="client-box">
    <h3>بيانات العميل</h3>
    <p><strong>${data.client.name}</strong> (${data.client.code})</p>
    <p>${data.client.city || '—'} · ${data.client.phone || '—'}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>الصنف</th>
        <th style="text-align:center">الكمية</th>
        <th style="text-align:left">سعر الوحدة</th>
        <th style="text-align:left">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>المجموع الفرعي</span><span>${formatILS(data.subtotal)}</span></div>
    ${data.discountAmount > 0 ? `<div class="row"><span>الخصم (${data.discountPercent}%)</span><span style="color:#dc2626">- ${formatILS(data.discountAmount)}</span></div>` : ''}
    <div class="row grand"><span>الإجمالي النهائي</span><span>${formatILS(data.total)}</span></div>
  </div>

  <div style="margin-top: 20px;">
    <span class="pm-badge">طريقة الدفع: ${pmLabel}</span>
  </div>

  ${data.notes ? `<p style="margin-top: 20px; font-size: 13px; color: #475569;"><strong>ملاحظات:</strong> ${data.notes}</p>` : ''}

  <div class="footer">
    شكراً لتعاملكم معنا · هذه الفاتورة صادرة إلكترونياً من نظام إدارة الطلبات
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`);
    win.document.close();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-600 text-lg bg-red-50 border border-red-200 rounded-xl px-6 py-4">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" dir="rtl">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 bg-white rounded-xl p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('new-order')}
            className={`flex-1 py-2.5 text-center font-semibold text-sm rounded-lg transition-all ${
              activeTab === 'new-order'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            🛒 إنشاء طلب جديد
          </button>
          <button
            onClick={() => setActiveTab('orders-history')}
            className={`flex-1 py-2.5 text-center font-semibold text-sm rounded-lg transition-all ${
              activeTab === 'orders-history'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            📋 سجل الطلبات
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex-1 py-2.5 text-center font-semibold text-sm rounded-lg transition-all ${
              activeTab === 'clients'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            👥 دليل العملاء
          </button>
        </div>

        {/* View tab content */}
        {activeTab === 'new-order' && (
          <>
            <ClientSelector
              clients={clients}
              selectedClientId={selectedClientId}
              onSelect={setSelectedClientId}
            />

            {selectedClient && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                  <SphMatrix
                    lensProducts={lensProducts}
                    selectedLensId={selectedLensId}
                    onSelectLens={handleSelectLens}
                    quantities={lensQuantities}
                    onSetQty={setLensQty}
                    onClear={clearLensGrid}
                    stockMap={stockMap}
                    sphSign={sphSign}
                    onSphSignChange={setSphSign}
                    selectedBC={selectedBC}
                    selectedDIA={selectedDIA}
                    onBCChange={handleBCChange}
                    onDIAChange={setSelectedDIA}
                    availableBCs={availableBCs}
                    availableDIAs={availableDIAs}
                    isToric={isToric}
                    onToricChange={setIsToric}
                    selectedCYL={selectedCYL}
                    selectedAXIS={selectedAXIS}
                    onCYLChange={setSelectedCYL}
                    onAXISChange={setSelectedAXIS}
                    customPrescription={customPrescription}
                    onCustomPrescriptionChange={setCustomPrescription}
                    onAddCustomPrescription={addCustomPrescription}
                  />
                  <AdditionalItems products={products} onAdd={addProduct} />
                </div>
                <div className="lg:col-span-1">
                  <Cart
                    cart={cart}
                    subtotal={subtotal}
                    discountPercent={discountPercent}
                    discountAmount={discountAmount}
                    total={total}
                    availableCredit={availableCredit}
                    creditExceeded={creditExceeded}
                    client={selectedClient}
                    notes={notes}
                    paymentMethod={paymentMethod}
                    onDiscountChange={setDiscountPercent}
                    onNotesChange={setNotes}
                    onPaymentChange={setPaymentMethod}
                    onQtyChange={updateCartQty}
                    onRemove={removeCartItem}
                    onClear={clearCart}
                    onSaveInvoice={handleSaveInvoice}
                    onSaveDraft={handleSaveDraft}
                    onSaveOrder={handleSaveOrder}
                    saving={saving}
                    saveMsg={saveMsg}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'orders-history' && <OrdersHistory />}

        {activeTab === 'clients' && <ClientsList clients={clients} onClientAdded={loadData} />}
      </main>

      <OrderConfirmationModal
        summary={orderSummary}
        onClose={() => setOrderSummary(null)}
        onPrint={printInvoice}
      />
    </div>
  );
}
