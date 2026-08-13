import { useMemo } from 'react';
import {
  ShoppingCart,
  Trash2,
  Tag,
  Save,
  AlertTriangle,
  CheckCircle2,
  X,
  StickyNote,
  Eye,
  Droplets,
  Glasses,
  Boxes,
  Banknote,
  CreditCard,
  Building2,
  Printer,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { Client, CartLensItem, CartProductItem, PaymentMethod } from '@/lib/supabase';
import { isLensItem, formatILS, formatSPH, PAYMENT_METHODS } from '@/lib/supabase';

interface Props {
  cart: (CartLensItem | CartProductItem)[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  availableCredit: number;
  creditExceeded: boolean;
  client: Client | null;
  notes: string;
  paymentMethod: PaymentMethod;
  onDiscountChange: (v: number) => void;
  onNotesChange: (v: string) => void;
  onPaymentChange: (v: PaymentMethod) => void;
  onQtyChange: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onSaveInvoice: () => void;
  onSaveDraft: () => void;
  onSaveOrder: () => void;
  saving: boolean;
  saveMsg: { type: 'ok' | 'err'; text: string } | null;
}

// تحديث الأيقونات وطريقة العرض (استبدال شيك بـ بنكي)
const PAYMENT_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  cash: { icon: <Banknote className="w-4 h-4" />, label: 'نقدي' },
  credit: { icon: <CreditCard className="w-4 h-4" />, label: 'آجل' },
  check: { icon: <Building2 className="w-4 h-4" />, label: 'بنكي' }, // تم تحويل المسمى ليظهر كـ بنكي
};

function categoryIcon(cat: string) {
  if (cat === 'solution') return <Droplets className="w-3.5 h-3.5 text-sky-500" />;
  if (cat === 'frame') return <Glasses className="w-3.5 h-3.5 text-indigo-500" />;
  return <Boxes className="w-3.5 h-3.5 text-amber-500" />;
}

export function Cart({
  cart,
  subtotal,
  discountPercent,
  discountAmount,
  total,
  availableCredit,
  creditExceeded,
  client,
  notes,
  paymentMethod,
  onDiscountChange,
  onNotesChange,
  onPaymentChange,
  onQtyChange,
  onRemove,
  onClear,
  onSaveInvoice,
  onSaveDraft,
  onSaveOrder,
  saving,
  saveMsg,
}: Props) {
  const itemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  return (
    <div className="lg:sticky lg:top-20">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
        
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-sky-600" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -left-2 bg-sky-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </div>
            <h2 className="font-bold text-slate-800 text-base">سلة الطلب</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> تفريغ
            </button>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-500">السلة فارغة حالياً</p>
              <p className="text-xs mt-0.5 text-slate-400">أضف عناصر من المصفوفة أو المنتجات</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 hover:border-slate-300 bg-white rounded-xl p-3 transition shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {isLensItem(item) ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Eye className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="truncate">{item.brand}</span>
                          {item.isCustom && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 shrink-0">
                              <Sparkles className="w-2.5 h-2.5" />
                              خاص
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1 dir-ltr text-right">
                          BC {item.bc} · DIA {item.dia} · SPH {formatSPH(item.sph)}
                          {item.cyl != null && <> · CYL {formatSPH(item.cyl)}</>}
                          {item.axis != null && <> · AXIS {item.axis}°</>}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          {categoryIcon(item.category)}
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{item.sku || '—'}</div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => onRemove(idx)}
                    className="text-slate-300 hover:text-rose-600 transition p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* التحكم بالكمية والسعر */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                    <button
                      onClick={() => onQtyChange(idx, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-xs shadow-2xs"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => onQtyChange(idx, parseInt(e.target.value) || 0)}
                      className="w-10 text-center text-xs font-bold bg-transparent text-slate-800 focus:outline-none"
                    />
                    <button
                      onClick={() => onQtyChange(idx, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-xs shadow-2xs"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800">
                      {formatILS(item.unitPrice * item.quantity)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {formatILS(item.unitPrice)} × {item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 space-y-3.5 bg-slate-50/70">
          
          {/* طريقة الدفع */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">طريقة الدفع</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((pm) => {
                const config = PAYMENT_CONFIG[pm.value] || { icon: PAYMENT_ICONS[pm.icon], label: pm.label };
                return (
                  <button
                    key={pm.value}
                    onClick={() => onPaymentChange(pm.value)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === pm.value
                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-2xs ring-1 ring-sky-400/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100/80'
                    }`}
                  >
                    {config.icon}
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* الخصم والملاحظات */}
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label className="text-xs font-medium text-slate-600 shrink-0">الخصم %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent || ''}
                onChange={(e) =>
                  onDiscountChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                }
                placeholder="0"
                className="w-full text-xs font-bold text-slate-800 bg-transparent text-left focus:outline-none"
              />
            </div>

            <div className="flex items-start gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
              <StickyNote className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="ملاحظات حول الطلب..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none resize-none leading-relaxed"
                rows={1}
              />
            </div>
          </div>

          {/* الحسابات النهائية */}
          <div className="space-y-1 pt-1 border-t border-slate-200">
            <Row label="المجموع الفرعي" value={formatILS(subtotal)} />
            {discountAmount > 0 && (
              <Row
                label={`الخصم (${discountPercent}%)`}
                value={`- ${formatILS(discountAmount)}`}
                color="text-rose-600 font-semibold"
              />
            )}
            <div className="pt-1.5 flex justify-between items-center border-t border-dashed border-slate-300 mt-1">
              <span className="font-bold text-slate-800 text-sm">الإجمالي النهائي</span>
              <span className="text-lg font-extrabold text-sky-700">{formatILS(total)}</span>
            </div>
          </div>

          {/* التنبيهات */}
          {creditExceeded && client && (
            <div className="flex items-start gap-1.5 bg-rose-50 border border-rose-200 rounded-xl p-2 text-xs text-rose-700 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>الإجمالي يتجاوز الحد المتاح للعميل ({formatILS(availableCredit)})</span>
            </div>
          )}

          {saveMsg && (
            <div
              className={`flex items-center gap-1.5 rounded-xl p-2 text-xs font-semibold ${
                saveMsg.type === 'ok'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {saveMsg.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{saveMsg.text}</span>
            </div>
          )}

          {/* أزرار العمليات */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onSaveOrder}
              disabled={cart.length === 0 || creditExceeded || saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'تأكيد وحفظ الطلب'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onSaveDraft}
                disabled={cart.length === 0 || saving}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                مسودة
              </button>
              <button
                onClick={onSaveInvoice}
                disabled={cart.length === 0 || creditExceeded || saving}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                حفظ وطباعة
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${color || 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
