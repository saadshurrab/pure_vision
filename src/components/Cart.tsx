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
  Receipt,
  Plus,
  Minus
} from 'lucide-react';
import type { Client, CartLensItem, CartProductItem, PaymentMethod } from '@/lib/supabase';
import { isLensItem, formatILS, formatSPH, PAYMENT_METHODS } from '@/lib/supabase';

interface Props {
  cart: (CartLensItem | CartProductItem)[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
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

const PAYMENT_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  cash: { icon: <Banknote className="w-4 h-4" />, label: 'نقدي' },
  credit: { icon: <CreditCard className="w-4 h-4" />, label: 'آجل' },
  check: { icon: <Building2 className="w-4 h-4" />, label: 'بنكي' },
};

function categoryIcon(cat: string) {
  if (cat === 'solution') return <Droplets className="w-3.5 h-3.5 text-slate-500" />;
  if (cat === 'frame') return <Glasses className="w-3.5 h-3.5 text-slate-500" />;
  return <Boxes className="w-3.5 h-3.5 text-slate-500" />;
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
    <div className="lg:sticky lg:top-4 transition-all duration-300 font-sans text-slate-800" dir="rtl">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-auto min-h-[500px] overflow-hidden">
        
        {/* Header - الهيدر الرسمي */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <Receipt className="w-5 h-5 text-slate-200" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-slate-100 text-slate-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-slate-900">
                  {itemCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base">سلة الطلبية / الفاتورة</h2>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-rose-300 hover:text-white font-medium bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 px-2.5 py-1 rounded-md transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> تفريغ السلة
            </button>
          )}
        </div>

        {/* Items List - القائمة */}
        <div className="p-3.5 space-y-2.5 bg-slate-50/50 flex-1">
          {cart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-bold text-slate-600">السلة فارغة حالياً</p>
              <p className="text-xs text-slate-400">أضف المنتجات أو المجموعات للبدء بالحساب</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200/90 bg-white rounded-lg p-3 transition shadow-2xs hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {isLensItem(item) ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                          <Eye className="w-4 h-4 text-slate-600 shrink-0" />
                          <span className="truncate">{item.brand}</span>
                          {item.isCustom && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                              تصنيع خاص
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1 dir-ltr text-right bg-slate-50 p-1 rounded border border-slate-100">
                          BC {item.bc} · DIA {item.dia} · SPH {formatSPH(item.sph)}
                          {item.cyl != null && <> · CYL {formatSPH(item.cyl)}</>}
                          {item.axis != null && <> · AXIS {item.axis}°</>}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                          {categoryIcon(item.category)}
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">رمز الصنف: {item.sku || '—'}</div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => onRemove(idx)}
                    className="text-slate-400 hover:text-rose-600 transition p-1 rounded hover:bg-slate-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5 border border-slate-200">
                    <button
                      onClick={() => onQtyChange(idx, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-xs transition shadow-2xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => onQtyChange(idx, parseInt(e.target.value) || 0)}
                      className="w-10 text-center text-xs font-bold font-mono bg-transparent text-slate-900 focus:outline-none"
                    />
                    <button
                      onClick={() => onQtyChange(idx, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-xs transition shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-left">
                    <div className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                      {formatILS(item.unitPrice * item.quantity)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatILS(item.unitPrice)} × {item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - خيارات الدفع والملخص */}
        <div className="border-t border-slate-200 p-4 space-y-3.5 bg-white">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">طريقة الدفع المحدد</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((pm) => {
                const config = PAYMENT_CONFIG[pm.value] || { icon: null, label: pm.label };
                const isSelected = paymentMethod === pm.value;
                return (
                  <button
                    key={pm.value}
                    onClick={() => onPaymentChange(pm.value)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-bold transition ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {config.icon}
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label className="text-xs font-bold text-slate-600 shrink-0">الخصم %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent || ''}
                onChange={(e) =>
                  onDiscountChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                }
                placeholder="0"
                className="w-full text-xs font-bold text-slate-900 font-mono bg-transparent text-left focus:outline-none"
              />
            </div>

            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">
              <StickyNote className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="إضافة ملاحظة على الطلب..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none resize-none leading-relaxed"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <Row label="المجموع الفرعي" value={formatILS(subtotal)} />
            {discountAmount > 0 && (
              <Row
                label={`الخصم التجاري (${discountPercent}%)`}
                value={`- ${formatILS(discountAmount)}`}
                color="text-rose-700 font-bold"
              />
            )}
            <div className="pt-2 flex justify-between items-center border-t border-dashed border-slate-300 mt-2">
              <span className="font-bold text-slate-900 text-sm">الإجمالي النهائي</span>
              <span className="text-lg font-black font-mono text-slate-900">{formatILS(total)}</span>
            </div>
          </div>

          {saveMsg && (
            <div
              className={`flex items-center gap-2 rounded-lg p-2.5 text-xs font-bold ${
                saveMsg.type === 'ok'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {saveMsg.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{saveMsg.text}</span>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              onClick={onSaveOrder}
              disabled={cart.length === 0 || saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'تأكيد واعتماد الطلب'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onSaveDraft}
                disabled={cart.length === 0 || saving}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                حفظ كمسودة
              </button>
              <button
                onClick={onSaveInvoice}
                disabled={cart.length === 0 || saving}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={`font-mono font-bold ${color || 'text-slate-800'}`}>{value}</span>
    </div>
  );
}
