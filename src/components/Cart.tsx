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
  client: Client | null; // تم إزالة props الخاصة بالرصيد
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

const PAYMENT_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  cash: { icon: <Banknote className="w-4 h-4" />, label: 'نقدي' },
  credit: { icon: <CreditCard className="w-4 h-4" />, label: 'آجل' },
  check: { icon: <Building2 className="w-4 h-4" />, label: 'بنكي' },
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
    <div className="lg:sticky lg:top-4 h-full">
      {/* تم تعديل الارتفاع ليأخذ مساحة أكبر ولا يبدو صغيراً */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-2rem)] min-h-[600px]">
        
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-sky-600" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -left-2 bg-sky-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </div>
            <h2 className="font-bold text-slate-800 text-lg">سلة الطلب</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClear}
              className="text-sm text-rose-600 hover:text-rose-700 font-semibold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> تفريغ
            </button>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-16 h-16 mb-3 opacity-20 text-slate-400" />
              <p className="text-base font-semibold text-slate-500">السلة فارغة حالياً</p>
              <p className="text-sm mt-1 text-slate-400">أضف عناصر من المصفوفة أو المنتجات</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 hover:border-slate-300 bg-white rounded-xl p-3.5 transition shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {isLensItem(item) ? (
                      <>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                          <Eye className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="truncate">{item.brand}</span>
                          {item.isCustom && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 shrink-0">
                              <Sparkles className="w-3 h-3" />
                              خاص
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-1.5 dir-ltr text-right">
                          BC {item.bc} · DIA {item.dia} · SPH {formatSPH(item.sph)}
                          {item.cyl != null && <> · CYL {formatSPH(item.cyl)}</>}
                          {item.axis != null && <> · AXIS {item.axis}°</>}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                          {categoryIcon(item.category)}
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-mono">{item.sku || '—'}</div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => onRemove(idx)}
                    className="text-slate-300 hover:text-rose-600 transition p-1.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <button
                      onClick={() => onQtyChange(idx, item.quantity - 1)}
                      className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-sm shadow-sm"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => onQtyChange(idx, parseInt(e.target.value) || 0)}
                      className="w-12 text-center text-sm font-bold bg-transparent text-slate-800 focus:outline-none"
                    />
                    <button
                      onClick={() => onQtyChange(idx, item.quantity + 1)}
                      className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-sm shadow-sm"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-800">
                      {formatILS(item.unitPrice * item.quantity)}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {formatILS(item.unitPrice)} × {item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 space-y-4 bg-white rounded-b-2xl">
          
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">طريقة الدفع</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const config = PAYMENT_CONFIG[pm.value] || { icon: null, label: pm.label };
                return (
                  <button
                    key={pm.value}
                    onClick={() => onPaymentChange(pm.value)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-sm font-bold transition-all ${
                      paymentMethod === pm.value
                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-400/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {config.icon}
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Tag className="w-4 h-4 text-slate-400 shrink-0" />
              <label className="text-sm font-medium text-slate-600 shrink-0">الخصم %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent || ''}
                onChange={(e) =>
                  onDiscountChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                }
                placeholder="0"
                className="w-full text-sm font-bold text-slate-800 bg-transparent text-left focus:outline-none"
              />
            </div>

            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <StickyNote className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="ملاحظات حول الطلب..."
                className="w-full text-sm text-slate-800 bg-transparent focus:outline-none resize-none leading-relaxed"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <Row label="المجموع الفرعي" value={formatILS(subtotal)} />
            {discountAmount > 0 && (
              <Row
                label={`الخصم (${discountPercent}%)`}
                value={`- ${formatILS(discountAmount)}`}
                color="text-rose-600 font-semibold"
              />
            )}
            <div className="pt-2 flex justify-between items-center border-t border-dashed border-slate-300 mt-2">
              <span className="font-bold text-slate-800 text-base">الإجمالي النهائي</span>
              <span className="text-xl font-extrabold text-sky-700">{formatILS(total)}</span>
            </div>
          </div>

          {saveMsg && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${
                saveMsg.type === 'ok'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {saveMsg.type === 'ok' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              )}
              <span>{saveMsg.text}</span>
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            {/* تمت إزالة شرط creditExceeded من الأزرار */}
            <button
              onClick={onSaveOrder}
              disabled={cart.length === 0 || saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'تأكيد وحفظ الطلب'}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onSaveDraft}
                disabled={cart.length === 0 || saving}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                مسودة
              </button>
              <button
                onClick={onSaveInvoice}
                disabled={cart.length === 0 || saving}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Printer className="w-4 h-4 text-slate-500" />
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
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${color || 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
