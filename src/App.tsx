import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  supabase,
  type Client,
  type LensProduct,
  type LensStock,
  type Product,
  type CartLensItem,
  type CartProductItem,
  type InvoiceData,
  type SphSign,
  formatILS,
  formatSPH,
  SPH_ALL,
} from '@/lib/supabase';
import { ProductsInventory } from '@/components/ProductsInventory';
import { Sidebar, type TabType } from '@/components/Sidebar';
import { ClientSelector } from '@/components/ClientSelector';
import { SphMatrix, type CustomPrescription } from '@/components/SphMatrix';
import { AdditionalItems } from '@/components/AdditionalItems';
import { Cart } from '@/components/Cart';
import { OrderConfirmationModal, type OrderSummary } from '@/components/OrderConfirmationModal';
import { ClientsList } from '@/components/ClientsList';
import { OrdersHistory } from '@/components/OrdersHistory';
import { Login } from '@/components/Login';
import { DashboardHome } from '@/components/DashboardHome';

// ⏱️ مهلة الخمول بالملي ثانية (مثلاً: 60000 = دقيقة واحدة)
const INACTIVITY_TIMEOUT = 60 * 1000;

export default function App() {
  // 🔒 إدارة حالة تسجيل الدخول عبر sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('pvo_authenticated') === 'true';
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 🚪 دالة تسجيل الخروج الفعالة والأمنة بدون إعادة تحميل إجباري للصفحة
  const handleLogout = useCallback(async (e?: React.MouseEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    try {
      if (timerRef.current) clearTimeout(timerRef.current);
      sessionStorage.removeItem('pvo_authenticated');
      localStorage.removeItem('pvo_authenticated');
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
    }
  }, []);

  // ⏳ إعادة تعيين مؤقت الخمول عند حدوث تفاعل
  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  // 👂 مراقبة نشاط المستخدم
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    resetInactivityTimer();

    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // التبويب النشط
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [clients, setClients] = useState<Client[]>([]);
  const [lensProducts, setLensProducts] = useState<LensProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lensStock, setLensStock] = useState<LensStock[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // إعدادات إنشاء طلب جديد
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'bank'>('cash');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  // نافذة تأكيد الطلب
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // إعدادات مرتجعات العملاء
  const [selectedReturnClient, setSelectedReturnClient] = useState<Client | null>(null);
  const [returnItemType, setReturnItemType] = useState<'product' | 'lens'>('product');
  const [selectedReturnProductId, setSelectedReturnProductId] = useState<string>('');
  const [selectedReturnLensId, setSelectedReturnLensId] = useState<string>('');
  const [returnSph, setReturnSph] = useState<number>(0);
  const [returnQty, setReturnQty] = useState<number>(1);

  // 🔍 حالة البحث في قائمة العملاء
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // 🔄 جلب البيانات من Supabase
  const loadData = useCallback(async () => {
    try {
      const [c, l, p, ls, ord] = await Promise.all([
        supabase.from('clients').select('*').eq('active', true).order('name'),
        supabase.from('lens_products').select('*').eq('active', true).order('brand'),
        supabase.from('products').select('*').eq('active', true).order('category, name'),
        supabase.from('lens_stock').select('*'),
        supabase.from('orders').select('*, clients(name)').order('created_at', { ascending: false }),
      ]);

      if (c.error) throw c.error;
      if (l.error) throw l.error;
      if (p.error) throw p.error;
      if (ls.error) throw ls.error;

      setClients(c.data || []);
      setLensProducts(l.data || []);
      setProducts(p.data || []);
      setLensStock(ls.data || []);

      const formattedOrders = (ord.data || []).map((o: any) => ({
        ...o,
        client_name: o.clients?.name || o.client_name || null,
      }));
      setOrders(formattedOrders);

      if (l.data && l.data.length > 0) {
        if (!selectedLensId) {
          const first = l.data[0];
          setSelectedLensId(first.id);
          setSelectedBC(first.bc);
          setSelectedDIA(first.dia);
        }
        if (!selectedReturnLensId) {
          setSelectedReturnLensId(l.data[0].id);
        }
      }

      if (p.data && p.data.length > 0 && !selectedReturnProductId) {
        setSelectedReturnProductId(p.data[0].id);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [selectedLensId, selectedReturnLensId, selectedReturnProductId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const query = clientSearchQuery.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query))
    );
  }, [clients, clientSearchQuery]);

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
    setLensQuantities({});
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

  useEffect(() => {
    if (!selectedLens) return;

    setCart((prevCart) => {
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

      const preservedItems = prevCart.filter((item) => {
        const isLensItem = 'lensProductId' in item;
        if (!isLensItem) return true;
        return item.isCustom;
      });

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
    setLensQuantities({});
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

  // ✅ تعديل منطقي مهم: تخصيم واستقطاع المخزون الفعلي المتاح محلياً فور الإضافة للسلة
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

    // تحديث رقم المخزون في الـ State فوراً لينعكس على كارت المنتج لحظياً
    setProducts((prevProducts) =>
      prevProducts.map((prod) =>
        prod.id === p.id
          ? { ...prod, consumed_stock: (prod.consumed_stock || 0) + qty }
          : prod
      )
    );
  }

  // ✅ تعديل كمية المنتج في السلة وإعادة فارق المخزون
  function updateCartQty(index: number, qty: number) {
    setCart((prevCart) => {
      const item = prevCart[index];
      if (!item) return prevCart;

      if (!('lensProductId' in item)) {
        const diff = qty - item.quantity;
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p.id === item.productId
              ? { ...p, consumed_stock: Math.max(0, (p.consumed_stock || 0) + diff) }
              : p
          )
        );
      }

      if (qty <= 0) return prevCart.filter((_, i) => i !== index);
      return prevCart.map((it, i) => (i === index ? { ...it, quantity: qty } : it));
    });
  }

  // ✅ حذف المنتج من السلة وإرجاع كميته كاملة للمخزون
  function removeCartItem(index: number) {
    setCart((prevCart) => {
      const item = prevCart[index];
      if (item && !('lensProductId' in item)) {
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p.id === item.productId
              ? { ...p, consumed_stock: Math.max(0, (p.consumed_stock || 0) - item.quantity) }
              : p
          )
        );
      }
      return prevCart.filter((_, i) => i !== index);
    });
  }

  // ✅ إفراغ السلة بالكامل وإعادة تزامن المخزون المحلي
  function clearCart() {
    // إرجاع كافة الكميات المحجوزة للمنتجات العادية عند إفراغ السلة
    cart.forEach((item) => {
      if (!('lensProductId' in item)) {
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p.id === item.productId
              ? { ...p, consumed_stock: Math.max(0, (p.consumed_stock || 0) - item.quantity) }
              : p
          )
        );
      }
    });

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

  const creditExceeded = false;

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

        if (status === 'confirmed') {
          for (const item of cart) {
            if ('lensProductId' in item) {
              const currentQty = stockMap.get(`${item.lensProductId}:${item.sph}`) || 0;
              const newQty = Math.max(0, currentQty - item.quantity);
              await supabase
                .from('lens_stock')
                .update({ stock_qty: newQty })
                .eq('lens_product_id', item.lensProductId)
                .eq('sph', item.sph);
            } else if ('productId' in item) {
              const targetProduct = products.find((p) => p.id === item.productId);
              if (targetProduct) {
                const currentConsumed = targetProduct.consumed_stock || 0;
                await supabase
                  .from('products')
                  .update({ consumed_stock: currentConsumed })
                  .eq('id', item.productId);
              }
            }
          }

          if (paymentMethod === 'credit') {
            const newBalance = selectedClient.outstanding_balance + total;
            const { error: ue } = await supabase
              .from('clients')
              .update({ outstanding_balance: Math.round(newBalance * 100) / 100 })
              .eq('id', selectedClient.id);

            if (ue) throw ue;
          }

          await loadData();
        }

        let invoiceNumber: string | undefined;
        if (status === 'confirmed') {
          invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
          await supabase.from('invoices').insert({
            order_id: order.id,
            invoice_number: invoiceNumber,
          });
        }

        setShowCheckoutModal(false);
        return { orderId: order.id, invoiceNumber };
      } catch (e) {
        setSaveMsg({ type: 'err', text: e instanceof Error ? e.message : 'فشل حفظ الطلب' });
        return null;
      } finally {
        setSaving(false);
      }
    },
    [selectedClient, cart, subtotal, discountPercent, discountAmount, total, paymentMethod, notes, stockMap, products, loadData]
  );

  const calculatedReturnTotal = useMemo(() => {
    if (returnQty <= 0) return 0;
    if (returnItemType === 'product') {
      const p = products.find((prod) => prod.id === selectedReturnProductId);
      return (p?.unit_price || 0) * returnQty;
    } else {
      const l = lensProducts.find((lens) => lens.id === selectedReturnLensId);
      return (l?.unit_price || 0) * returnQty;
    }
  }, [returnItemType, selectedReturnProductId, selectedReturnLensId, returnQty, products, lensProducts]);

  async function handleReturnProduct() {
    if (!selectedReturnClient || returnQty <= 0 || calculatedReturnTotal <= 0) {
      alert('يرجى تحديد المنتج والكمية بشكل صحيح');
      return;
    }

    try {
      const updatedBalance = Math.max(0, selectedReturnClient.outstanding_balance - calculatedReturnTotal);
      const { error: clientError } = await supabase
        .from('clients')
        .update({ outstanding_balance: updatedBalance })
        .eq('id', selectedReturnClient.id);

      if (clientError) throw clientError;

      if (returnItemType === 'lens' && selectedReturnLensId) {
        const currentQty = stockMap.get(`${selectedReturnLensId}:${returnSph}`) || 0;
        await supabase
          .from('lens_stock')
          .update({ stock_qty: currentQty + returnQty })
          .eq('lens_product_id', selectedReturnLensId)
          .eq('sph', returnSph);
      } else if (returnItemType === 'product' && selectedReturnProductId) {
        const p = products.find((prod) => prod.id === selectedReturnProductId);
        if (p) {
          const newConsumed = Math.max(0, (p.consumed_stock || 0) - returnQty);
          await supabase
            .from('products')
            .update({ consumed_stock: newConsumed })
            .eq('id', selectedReturnProductId);
        }
      }

      await loadData();

      setSelectedReturnClient(null);
      setReturnQty(1);
      alert(`تم تسجيل المرتجع بنجاح وإعادة المنتجات للمخزون، وخصم مبلغ ${formatILS(calculatedReturnTotal)} من حساب العميل.`);
    } catch (e) {
      alert('حدث خطأ أثناء تسجيل المرتجع: ' + (e instanceof Error ? e.message : ''));
    }
  }

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
    if (!win) return;

    const pmLabel =
      data.paymentMethod === 'cash' ? 'نقدي' : data.paymentMethod === 'credit' ? 'دين' : 'بنكي';

    const itemRows = data.items
      .map((item) => {
        if ('lensProductId' in item) {
          const sphLabel = formatSPH(item.sph);
          const cylAxis =
            item.cyl != null
              ? `, CYL ${formatSPH(item.cyl)}${item.axis != null ? `, AXIS ${item.axis}°` : ''}`
              : '';
          return `<tr>
            <td>${item.brand} (BC ${item.bc}, DIA ${item.dia}, SPH ${sphLabel}${cylAxis})</td>
            <td style="text-align:center">${item.quantity}</td>
            <td style="text-align:left">${formatILS(item.unitPrice)}</td>
            <td style="text-align:left">${formatILS(item.unitPrice * item.quantity)}</td>
          </tr>`;
        }
        return `<tr>
          <td>${item.name}</td>
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
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f1f5f9; padding: 10px 12px; font-size: 13px; text-align: right; border-bottom: 2px solid #cbd5e1; }
  td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
  .totals { margin-right: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .totals .grand { border-top: 2px solid #0284c7; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: bold; color: #0284c7; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">شركة ومستودع الرؤيا النقية</div>
    <div>فاتورة: ${data.invoiceNumber}</div>
  </div>
  <table>
    <thead><tr><th>الصنف</th><th style="text-align:center">الكمية</th><th style="text-align:left">السعر</th><th style="text-align:left">الإجمالي</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>المجموع</span><span>${formatILS(data.subtotal)}</span></div>
    <div class="row grand"><span>الإجمالي</span><span>${formatILS(data.total)}</span></div>
  </div>
  <p>طريقة الدفع: ${pmLabel}</p>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    win.document.close();
  }

  // تسجيل الدخول
  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => {
          sessionStorage.setItem('pvo_authenticated', 'true');
          setIsAuthenticated(true);
        }}
      />
    );
  }

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">جاري تحميل البيانات...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" dir="rtl">
      {/* القائمة الجانبية المحدثة بأسلوب التصميم الثابت والأزرار الجديدة */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* المحتوى الرئيسي للمنصة مع مراعاة الهامش الأيمن للمحاذاة مع القائمة الجانبية */}
      <main className="md:pr-[220px] transition-all p-4 md:p-6 min-h-screen">

        {/* Tab 0: الشاشة الرئيسية */}
        {activeTab === 'home' && (
          <DashboardHome
            orders={orders}
            clientsCount={clients.length}
            clients={clients}
            products={products}
            lensStock={lensStock}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Tab 1: إنشاء طلب جديد */}
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
                    onToricChange={(v) => {
                      setIsToric(v);
                      setLensQuantities({});
                    }}
                    selectedCYL={selectedCYL}
                    selectedAXIS={selectedAXIS}
                    onCYLChange={(v) => {
                      setSelectedCYL(v);
                      setLensQuantities({});
                    }}
                    onAXISChange={(v) => {
                      setSelectedAXIS(v);
                      setLensQuantities({});
                    }}
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
                    onPaymentChange={(pm) => setPaymentMethod(pm as 'cash' | 'credit' | 'bank')}
                    onQtyChange={updateCartQty}
                    onRemove={removeCartItem}
                    onClear={clearCart}
                    onSaveInvoice={() => setShowCheckoutModal(true)}
                    onSaveDraft={() => setShowCheckoutModal(true)}
                    onSaveOrder={() => setShowCheckoutModal(true)}
                    saving={saving}
                    saveMsg={saveMsg}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: جرد المخزون */}
        {activeTab === 'inventory' && (
          <ProductsInventory
            lensProducts={lensProducts}
            selectedLensId={selectedLensId}
            onSelectLens={handleSelectLens}
            stockMap={stockMap}
            onRefreshData={loadData}
          />
        )}

        {/* Tab 3: سجل الطلبات */}
        {activeTab === 'orders-history' && <OrdersHistory />}

        {/* Tab 4: دليل العملاء والمرتجعات */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {selectedReturnClient && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-amber-200 pb-3">
                  <div>
                    <h3 className="font-bold text-amber-900 text-base">
                      ↩ تسجيل مرجع منتج للعميل: {selectedReturnClient.name}
                    </h3>
                    <p className="text-xs text-amber-700 mt-0.5">
                      الدين الحالي: <span className="font-bold">{formatILS(selectedReturnClient.outstanding_balance)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReturnClient(null)}
                    className="text-amber-800 text-xs font-bold hover:underline"
                  >
                    إلغاء المرتجع ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">نوع المرجع:</label>
                    <select
                      value={returnItemType}
                      onChange={(e) => setReturnItemType(e.target.value as 'product' | 'lens')}
                      className="w-full p-2 border rounded-lg text-sm bg-white font-semibold text-slate-700"
                    >
                      <option value="product">منتج عام / ملحقات</option>
                      <option value="lens">عدسة لاصقة</option>
                    </select>
                  </div>

                  {returnItemType === 'product' ? (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-amber-900 mb-1">اختر المنتج المرجع:</label>
                      <select
                        value={selectedReturnProductId}
                        onChange={(e) => setSelectedReturnProductId(e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm bg-white font-semibold text-slate-700"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatILS(p.unit_price)})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">اختر نوع العدسة:</label>
                        <select
                          value={selectedReturnLensId}
                          onChange={(e) => setSelectedReturnLensId(e.target.value)}
                          className="w-full p-2 border rounded-lg text-sm bg-white font-semibold text-slate-700"
                        >
                          {lensProducts.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.brand} ({formatILS(l.unit_price)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">مقاس العدسة (SPH):</label>
                        <select
                          value={returnSph}
                          onChange={(e) => setReturnSph(Number(e.target.value))}
                          className="w-full p-2 border rounded-lg text-sm bg-white font-semibold text-slate-700"
                        >
                          {SPH_ALL.map((sph) => (
                            <option key={sph} value={sph}>
                              {formatSPH(sph)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">الكمية المرجعة:</label>
                    <input
                      type="number"
                      min="1"
                      value={returnQty}
                      onChange={(e) => setReturnQty(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 border rounded-lg text-sm bg-white font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center bg-amber-100/70 p-3 rounded-lg border border-amber-200">
                  <div className="text-sm font-bold text-amber-900">
                    إجمالي قيمة المرجع المخصومة تلقائياً: <span className="text-emerald-700 font-extrabold text-base">{formatILS(calculatedReturnTotal)}</span>
                  </div>

                  <button
                    onClick={handleReturnProduct}
                    className="bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-amber-800 transition shadow-sm"
                  >
                    تأكيد إرجاع المنتج وخصم القيمـة
                  </button>
                </div>
              </div>
            )}

            <ClientsList clients={clients} onClientAdded={loadData} />

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">🔍 قائمة العملاء السريعة</h3>
                  <p className="text-xs text-slate-500 mt-0.5">البحث السريع واستعراض بيانات العملاء والديون المترتبة عليهم</p>
                </div>

                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    placeholder="ابحث باسم العميل أو رقم الهاتف..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
                  />
                  {clientSearchQuery && (
                    <button
                      onClick={() => setClientSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.length > 0 ? (
                  filteredClients.map((c) => (
                    <div key={c.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50 hover:bg-white hover:border-sky-300 transition shadow-sm">
                      <div>
                        <div className="font-bold text-slate-800 text-base">{c.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{c.phone ? `📱 ${c.phone}` : 'بدون رقم هاتف'}</div>
                        <div className="text-sm mt-2 font-semibold text-rose-600">
                          الدين: <span className="font-bold">{formatILS(c.outstanding_balance)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedReturnClient(c)}
                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-2 rounded-lg font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        ↩ مرجع منتج
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-400 font-semibold text-sm">
                    لم يتم العثور على أي عميل يطابق عبارة البحث "{clientSearchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* النافذة المنبثقة Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
              تأكيد خيارات حفظ وإصدار الطلب
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">طريقة الدفع:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      paymentMethod === 'cash' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50'
                    }`}
                  >
                    💵 نقدي
                  </button>
                  <button
                    onClick={() => setPaymentMethod('credit')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      paymentMethod === 'credit' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50'
                    }`}
                  >
                    💳 دين
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      paymentMethod === 'bank' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50'
                    }`}
                  >
                    🏦 بنكي
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t space-y-2">
                <button
                  onClick={handleSaveInvoice}
                  disabled={saving}
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition"
                >
                  🖨️ حفظ وطباعة الفاتورة
                </button>
                <button
                  onClick={handleSaveOrder}
                  disabled={saving}
                  className="w-full bg-sky-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-sky-700 transition"
                >
                  ✅ حفظ كطلب مؤكد
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition"
                >
                  📝 حفظ كمسودة
                </button>
              </div>

              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-full text-center text-xs text-slate-400 mt-2 hover:underline"
              >
                إلغاء والعودة للسلة
              </button>
            </div>
          </div>
        </div>
      )}

      <OrderConfirmationModal
        summary={orderSummary}
        onClose={() => setOrderSummary(null)}
        onPrint={printInvoice}
      />
    </div>
  );
}
