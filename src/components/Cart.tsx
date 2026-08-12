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
  FileCheck,
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

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  credit: <CreditCard className="w-4 h-4" />,
  check: <FileCheck className="w-4 h-4" />,
};

function categoryIcon(cat: string) {
  if (cat === 'solution') return <Droplets className="w-3.5 h-3.5" />;
  if (cat === 'frame') return <Glasses className="w-3.5 h-3.5" />;
  return <Boxes className="w-3.5 h-3.5" />;
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
    <div className="lg:sticky lg:top-24">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-7rem)]">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-sky-600" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -left-2 bg-sky-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <h2 className="font-bold text-slate-800">سلة الطلب</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> تفريغ
            </button>
          )}
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 py-10">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">السلة فارغة</p>
              <p className="text-xs mt-1">أضف عدسات أو منتجات لبدء الطلب</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-xl p-3 animate-slide-in"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {isLensItem(item) ? (
                        <>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                            <Eye className="w-3.5 h-3.5 text-sky-500" />
                            {item.brand}
                            {item.isCustom && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                <Sparkles className="w-2.5 h-2.5" />
                                مقاس خاص
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            BC {item.bc} · DIA {item.dia} · SPH {formatSPH(item.sph)}
                            {item.cyl != null && <> · CYL {formatSPH(item.cyl)}</>}
                            {item.axis != null && <> · AXIS {item.axis}°</>}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                            {categoryIcon(item.category)}
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.sku || '—'}</div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(idx)}
                      className="text-slate-300 hover:text-red-500 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onQtyChange(idx, item.quantity - 1)}
                        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => onQtyChange(idx, parseInt(e.target.value) || 0)}
                        className="w-12 text-center text-sm font-medium rounded-md border border-slate-200 px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        onClick={() => onQtyChange(idx, item.quantity + 1)}
                        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-sm"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {formatILS(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 text-left">
                    {formatILS(item.unitPrice)} × {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50/50">
          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">طريقة الدفع</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => onPaymentChange(pm.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-bold transition ${
                    paymentMethod === pm.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {PAYMENT_ICONS[pm.icon]}
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <label className="text-sm text-slate-600 flex-shrink-0">نسبة الخصم %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={discountPercent || ''}
              onChange={(e) =>
                onDiscountChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
              }
              placeholder="0"
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Notes */}
          <div className="flex items-start gap-2">
            <StickyNote className="w-4 h-4 text-slate-400 mt-1.5" />
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="ملاحظات الطلب..."
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              rows={2}
            />
          </div>

          {/* Totals */}
          <div className="space-y-1.5 pt-1">
            <Row label="المجموع الفرعي" value={formatILS(subtotal)} />
            {discountAmount > 0 && (
              <Row
                label={`الخصم (${discountPercent}%)`}
                value={`- ${formatILS(discountAmount)}`}
                color="text-red-600"
              />
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="font-bold text-slate-700">الإجمالي النهائي</span>
              <span className="text-xl font-bold text-sky-700">{formatILS(total)}</span>
            </div>
          </div>

          {/* Credit warning */}
          {creditExceeded && client && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                الإجمالي ({formatILS(total)}) يتجاوز الرصيد المتاح ({formatILS(availableCredit)}) للعميل {client.name}
              </span>
            </div>
          )}

          {/* Save message */}
          {saveMsg && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                saveMsg.type === 'ok'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {saveMsg.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {saveMsg.text}
            </div>
          )}

          {/* Primary action: Save Order */}
          <button
            onClick={onSaveOrder}
            disabled={cart.length === 0 || creditExceeded || saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg"
          >
            <Save className="w-5 h-5" />
            {saving ? 'جاري الحفظ...' : 'حفظ الطلب'}
          </button>

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSaveDraft}
              disabled={cart.length === 0 || saving}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <FileText className="w-4 h-4" />
              حفظ كمسودة
            </button>
            <button
              onClick={onSaveInvoice}
              disabled={cart.length === 0 || creditExceeded || saving}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Printer className="w-4 h-4" />
              حفظ وطباعة
            </button>
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
