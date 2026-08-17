import { useEffect, useRef } from 'react';
import { CheckCircle2, X, Eye, Droplets, Glasses, Boxes, Printer, Sparkles, CreditCard, AlertCircle } from 'lucide-react';
import type { Client, CartItem, PaymentMethod, InvoiceData } from '@/lib/supabase';
import { supabase, isLensItem, formatILS, formatSPH } from '@/lib/supabase';

export interface OrderSummary {
  orderId: string;
  invoiceNumber: string;
  client: Client;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paidAmount?: number;      // المبلغ المدفوع
  remainingAmount?: number; // المبلغ المتبقي (الدين)
  paymentMethod: PaymentMethod;
  status: 'draft' | 'confirmed';
  createdAt: string;
}

interface Props {
  summary: OrderSummary | null;
  onClose: () => void;
  onPrint?: (data: InvoiceData) => void;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'نقدي (كاش)',
  credit: 'على الحساب (دين)',
  check: 'شيك',
};

function categoryIcon(cat: string) {
  if (cat === 'solution') return <Droplets className="w-4 h-4 text-sky-500" />;
  if (cat === 'frame') return <Glasses className="w-4 h-4 text-sky-500" />;
  return <Boxes className="w-4 h-4 text-sky-500" />;
}

export function OrderConfirmationModal({ summary, onClose, onPrint }: Props) {
  // منع تكرار الخصم لنفس الطلب
  const hasDeductedRef = useRef<string | null>(null);

  // دالة خصم الكميات من قاعدة البيانات Supabase عند تأكيد الطلب
  useEffect(() => {
    if (!summary || summary.status !== 'confirmed') return;
    
    // إذا تم الخصم لهذا الطلب من قبل، نمنع التكرار
    if (hasDeductedRef.current === summary.orderId) return;

    async function deductInventory() {
      try {
        for (const item of summary!.items) {
          if (isLensItem(item)) {
            // === 1. خصم مخزون العدسات من جدول lens_stock ===
            if (!item.lensProductId) continue;

            let query = supabase
              .from('lens_stock')
              .select('id, stock_qty')
              .eq('lens_product_id', item.lensProductId)
              .eq('sph', item.sph);

            if (item.cyl != null) {
              query = query.eq('cyl', item.cyl);
            }
            if (item.axis != null) {
              query = query.eq('axis', item.axis);
            }

            const { data: lensStockData, error: lensFetchErr } = await query.maybeSingle();

            if (!lensFetchErr && lensStockData) {
              const currentStock = lensStockData.stock_qty || 0;
              const newStock = Math.max(0, currentStock - item.quantity);

              await supabase
                .from('lens_stock')
                .update({ stock_qty: newStock })
                .eq('id', lensStockData.id);
            }
          } else {
            // === 2. خصم المنتجات العادية والإكسسوارات من جدول products ===
            const productId = item.id;
            if (!productId) continue;

            const { data: prodData, error: prodFetchErr } = await supabase
              .from('products')
              .select('consumed_stock, stock_qty')
              .eq('id', productId)
              .maybeSingle();

            if (!prodFetchErr && prodData) {
              const currentConsumed = prodData.consumed_stock || 0;
              const newConsumed = currentConsumed + item.quantity;

              await supabase
                .from('products')
                .update({ consumed_stock: newConsumed })
                .eq('id', productId);
            }
          }
        }
        hasDeductedRef.current = summary!.orderId;
        console.log('تم خصم عناصر الطلب من المخزون بنجاح!');
      } catch (err) {
        console.error('حدث خطأ أثناء خصم المخزون:', err);
      }
    }

    deductInventory();
  }, [summary]);

  useEffect(() => {
    if (!summary) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [summary, onClose]);

  if (!summary) return null;

  const isConfirmed = summary.status === 'confirmed';

  // حساب المبالغ بدقة لتحديد حالة الدفع (دين / مسدد / جزئي)
  const total = summary.total || 0;
  
  // إذا لم تُمرر قيم explicit، نحدد بناءً على طريقة الدفع
  let paidAmount = summary.paidAmount !== undefined 
    ? summary.paidAmount 
    : (summary.paymentMethod === 'credit' ? 0 : total);
    
  let remainingAmount = summary.remainingAmount !== undefined 
    ? summary.remainingAmount 
    : Math.max(0, total - paidAmount);

  // تحديد بطاقة الحالة المالية للطلب
  const isFullyPaid = remainingAmount <= 0;
  const isFullyCredit = paidAmount <= 0 && total > 0;
  const isPartiallyPaid = paidAmount > 0 && remainingAmount > 0;

  // تجهيز بيانات الفاتورة وإرسال اسم العميل وكافة البيانات للطباعة
  const handlePrint = () => {
    if (!onPrint) return;
    const invoice: InvoiceData & { paidAmount?: number; remainingAmount?: number } = {
      invoiceNumber: summary.invoiceNumber,
      orderId: summary.orderId,
      client: summary.client, // يحتوي على اسم العميل (summary.client.name) وبقية بياناته
      items: summary.items,
      subtotal: summary.subtotal,
      discountPercent: summary.discountPercent,
      discountAmount: summary.discountAmount,
      total: summary.total,
      paidAmount,
      remainingAmount,
      paymentMethod: summary.paymentMethod,
      notes: '',
      createdAt: summary.createdAt,
    };
    onPrint(invoice);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - إظهار الفاتورة بجانب علامة التأكيد */}
        <div
          className={`px-6 py-5 flex items-center justify-between ${
            isConfirmed
              ? isFullyCredit
                ? 'bg-gradient-to-l from-rose-600 to-amber-600'
                : isPartiallyPaid
                ? 'bg-gradient-to-l from-amber-600 to-sky-600'
                : 'bg-gradient-to-l from-emerald-600 to-teal-600'
              : 'bg-gradient-to-l from-slate-600 to-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* علامة التأكيد */}
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>

            {/* تفاصيل الفاتورة بجانب علامة التأكيد */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {isConfirmed ? 'تم تسجيل الطلب بنجاح' : 'تم حفظ المسودة بنجاح'}
                </h2>
              </div>
              <p className="text-sm text-white/90 font-medium">
                {isConfirmed ? `فاتورة رقم: ${summary.invoiceNumber}` : `مسودة رقم: ${summary.orderId.slice(0, 8)}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
            title="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Client info - عرض اسم العميل بوضوح داخل الفاتورة */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">اسم العميل</div>
              <div className="font-bold text-slate-900 text-base">{summary.client.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                كود: {summary.client.code} {summary.client.city ? `· ${summary.client.city}` : ''}
              </div>
            </div>
            <div className="text-left">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-sm">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                {PAYMENT_LABELS[summary.paymentMethod] || 'نقدي'}
              </span>
            </div>
          </div>

          {/* Items summary */}
          <div>
            <div className="text-sm font-bold text-slate-700 mb-2">
              الأصناف ({summary.items.length})
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {summary.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm border-b border-slate-100 pb-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isLensItem(item) ? (
                      <Eye className="w-4 h-4 text-sky-500 flex-shrink-0" />
                    ) : (
                      categoryIcon(item.category)
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-slate-700 truncate flex items-center gap-1">
                        {isLensItem(item) ? item.brand : item.name}
                        {isLensItem(item) && item.isCustom && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                            <Sparkles className="w-2.5 h-2.5" />
                            مقاس خاص
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isLensItem(item)
                          ? `BC ${item.bc} · DIA ${item.dia} · SPH ${formatSPH(item.sph)}${item.cyl != null ? ` · CYL ${formatSPH(item.cyl)}` : ''}${item.axis != null ? ` · AXIS ${item.axis}°` : ''}`
                          : `×${item.quantity}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="font-medium text-slate-700">
                      {formatILS(item.unitPrice * item.quantity)}
                    </div>
                    {isLensItem(item) && (
                      <div className="text-xs text-slate-400">×{item.quantity}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">المجموع الفرعي</span>
              <span className="font-medium text-slate-700">{formatILS(summary.subtotal)}</span>
            </div>
            {summary.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">الخصم ({summary.discountPercent}%)</span>
                <span className="font-medium text-rose-600">- {formatILS(summary.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
              <span className="font-black text-slate-800">إجمالي الفاتورة</span>
              <span className="text-lg font-black text-slate-900 font-mono">{formatILS(summary.total)}</span>
            </div>
          </div>

          {/* FINANCIAL STATUS BADGE */}
          <div className="pt-2">
            {isFullyPaid && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  حالة التحصيل: مسدد بالكامل
                </span>
                <span className="font-mono">{formatILS(total)}</span>
              </div>
            )}

            {isFullyCredit && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  حالة التحصيل: غير مسدد (آجل / دين بالكامل)
                </span>
                <span className="font-mono font-black text-rose-700">{formatILS(remainingAmount)}</span>
              </div>
            )}

            {isPartiallyPaid && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    حالة التحصيل: دفع جزئي
                  </span>
                  <span className="text-amber-700 font-mono">متبقي (دين): {formatILS(remainingAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 border-t border-amber-200/60 pt-1">
                  <span>الواصل (المدفوع): {formatILS(paidAmount)}</span>
                  <span>من إجمالي: {formatILS(total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
          {isConfirmed && onPrint && (
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              طباعة الفاتورة
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 transition shadow-md"
          >
            طلب جديد
          </button>
        </div>
      </div>
    </div>
  );
}
