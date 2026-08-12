import { useEffect } from 'react';
import { CheckCircle2, X, Eye, Droplets, Glasses, Boxes, Printer, Sparkles } from 'lucide-react';
import type { Client, CartItem, PaymentMethod, InvoiceData } from '@/lib/supabase';
import { isLensItem, formatILS, formatSPH } from '@/lib/supabase';

export interface OrderSummary {
  orderId: string;
  invoiceNumber: string;
  client: Client;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
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
  cash: 'نقدي',
  credit: 'دين',
  check: 'شيك',
};

function categoryIcon(cat: string) {
  if (cat === 'solution') return <Droplets className="w-4 h-4 text-sky-500" />;
  if (cat === 'frame') return <Glasses className="w-4 h-4 text-sky-500" />;
  return <Boxes className="w-4 h-4 text-sky-500" />;
}

export function OrderConfirmationModal({ summary, onClose, onPrint }: Props) {
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

  const handlePrint = () => {
    if (!onPrint) return;
    const invoice: InvoiceData = {
      invoiceNumber: summary.invoiceNumber,
      orderId: summary.orderId,
      client: summary.client,
      items: summary.items,
      subtotal: summary.subtotal,
      discountPercent: summary.discountPercent,
      discountAmount: summary.discountAmount,
      total: summary.total,
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
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 flex items-center justify-between ${
            isConfirmed
              ? 'bg-gradient-to-l from-emerald-600 to-teal-600'
              : 'bg-gradient-to-l from-slate-600 to-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isConfirmed ? 'تم حفظ الطلب بنجاح' : 'تم حفظ المسودة بنجاح'}
              </h2>
              <p className="text-sm text-white/80">
                {isConfirmed ? `فاتورة رقم ${summary.invoiceNumber}` : `مسودة رقم ${summary.orderId.slice(0, 8)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Client info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="text-xs text-slate-500 mb-1">العميل</div>
            <div className="font-bold text-slate-800">{summary.client.name}</div>
            <div className="text-sm text-slate-500">
              {summary.client.code} · {summary.client.city || '—'}
            </div>
          </div>

          {/* Items summary */}
          <div>
            <div className="text-sm font-bold text-slate-700 mb-2">
              الأصناف ({summary.items.length})
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
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

          {/* Totals */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">المجموع الفرعي</span>
              <span className="font-medium text-slate-700">{formatILS(summary.subtotal)}</span>
            </div>
            {summary.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">الخصم ({summary.discountPercent}%)</span>
                <span className="font-medium text-red-600">- {formatILS(summary.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-700">الإجمالي</span>
              <span className="text-xl font-bold text-sky-700">{formatILS(summary.total)}</span>
            </div>
          </div>

          {/* Payment + status */}
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-lg text-sky-700 font-medium">
              الدفع: {PAYMENT_LABELS[summary.paymentMethod]}
            </span>
            <span
              className={`px-3 py-1.5 rounded-lg font-medium ${
                isConfirmed
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                  : 'bg-slate-100 border border-slate-200 text-slate-600'
              }`}
            >
              {isConfirmed ? 'مؤكد' : 'مسودة'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
          {isConfirmed && onPrint && (
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              <Printer className="w-4 h-4" />
              طباعة الفاتورة
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-700 transition shadow-md"
          >
            طلب جديد
          </button>
        </div>
      </div>
    </div>
  );
}
