import { useRef, useState } from 'react';
import {
  Grid3x3,
  Trash2,
  Package,
  AlertCircle,
  Minus,
  Plus,
  SlidersHorizontal,
  Sparkles,
  RotateCw,
  Info,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { LensProduct, SphSign } from '@/lib/supabase';
import {
  getSPHValues,
  formatILS,
  formatSPH,
  CYL_VALUES,
  AXIS_VALUES,
  CUSTOM_SPH_MIN,
  CUSTOM_SPH_MAX,
} from '@/lib/supabase';

export interface CustomPrescription {
  sph: number;
  cyl: number | null;
  axis: number | null;
  quantity: number;
}

interface Props {
  lensProducts: LensProduct[];
  selectedLensId: string;
  onSelectLens: (id: string) => void;
  quantities: Record<string, number>;
  onSetQty: (sph: number, qty: number) => void;
  onClear: () => void;
  stockMap: Map<string, number>;
  sphSign: SphSign;
  onSphSignChange: (sign: SphSign) => void;
  selectedBC: string;
  selectedDIA: string;
  onBCChange: (bc: string) => void;
  onDIAChange: (dia: string) => void;
  availableBCs: string[];
  availableDIAs: string[];
  isToric: boolean;
  onToricChange: (toric: boolean) => void;
  selectedCYL: number | null;
  selectedAXIS: number | null;
  onCYLChange: (cyl: number | null) => void;
  onAXISChange: (axis: number | null) => void;
  customPrescription: CustomPrescription | null;
  onCustomPrescriptionChange: (cp: CustomPrescription | null) => void;
  onAddCustomPrescription: () => void;
}

export function SphMatrix({
  lensProducts,
  selectedLensId,
  onSelectLens,
  quantities,
  onSetQty,
  onClear,
  stockMap,
  sphSign,
  onSphSignChange,
  selectedBC,
  selectedDIA,
  onBCChange,
  onDIAChange,
  availableBCs,
  availableDIAs,
  isToric,
  onToricChange,
  selectedCYL,
  selectedAXIS,
  onCYLChange,
  onAXISChange,
  customPrescription,
  onCustomPrescriptionChange,
  onAddCustomPrescription,
}: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const selected = lensProducts.find((l) => l.id === selectedLensId);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // إزالة الأسماء المكررة من القائمة المنسدلة للعلامة التجارية
  const uniqueLensProducts = Array.from(
    new Map(lensProducts.map((item) => [item.brand, item])).values()
  );

  const sphValues = getSPHValues(sphSign);

  const totalQty = selected
    ? sphValues.reduce((sum, sph) => sum + (quantities[`${selected.id}:${sph}`] || 0), 0)
    : 0;
  const totalValue = selected
    ? sphValues.reduce(
        (sum, sph) => sum + (quantities[`${selected.id}:${sph}`] || 0) * selected.unit_price,
        0
      )
    : 0;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, sph: number) {
    if (!selected) return;
    const idx = sphValues.indexOf(sph);
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextIdx = idx + 1;
      if (nextIdx < sphValues.length) {
        const nextKey = `${selected.id}:${sphValues[nextIdx]}`;
        inputRefs.current.get(nextKey)?.focus();
        inputRefs.current.get(nextKey)?.select();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextIdx = idx + 1;
      if (nextIdx < sphValues.length) {
        inputRefs.current.get(`${selected.id}:${sphValues[nextIdx]}`)?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const prevIdx = idx - 1;
      if (prevIdx >= 0) {
        inputRefs.current.get(`${selected.id}:${sphValues[prevIdx]}`)?.focus();
      }
    }
  }

  const rowSize = 16;
  const rows: number[][] = [];
  for (let i = 0; i < sphValues.length; i += rowSize) {
    rows.push(sphValues.slice(i, i + rowSize));
  }

  function renderSphRow(slice: number[]) {
    return (
      <div className="overflow-x-auto border border-slate-200/80 rounded-xl shadow-sm bg-white mb-3">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="sticky right-0 z-10 bg-slate-100/90 backdrop-blur-sm px-3 py-2.5 border-l border-slate-200 text-center w-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                SPH ↓
              </th>
              {slice.map((sph) => {
                const stock = selected ? stockMap.get(`${selected.id}:${sph}`) ?? 0 : 0;
                const isOutOfStock = stock === 0;
                const isLowStock = stock > 0 && stock <= 10;

                return (
                  <th
                    key={sph}
                    className={`px-1.5 py-2 text-center min-w-[58px] border-b border-slate-100 ${
                      isOutOfStock
                        ? 'bg-rose-50/40 text-rose-700'
                        : isLowStock
                        ? 'bg-amber-50/40 text-amber-700'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold tracking-tight">{formatSPH(sph)}</div>
                    <div
                      className={`text-[10px] font-medium mt-0.5 font-sans ${
                        isOutOfStock
                          ? 'text-rose-500 font-bold'
                          : isLowStock
                          ? 'text-amber-600 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {isOutOfStock ? 'نفذت' : `(${stock})`}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sticky right-0 z-10 bg-slate-50 font-bold px-3 py-2 text-center text-xs text-slate-600 border-l border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                الكمية
              </td>
              {slice.map((sph) => {
                const key = selected ? `${selected.id}:${sph}` : '';
                const qty = selected ? quantities[key] || '' : '';
                const stock = selected ? stockMap.get(key) ?? 0 : 0;
                const entered = selected ? quantities[key] || 0 : 0;
                const overStock = entered > stock;

                return (
                  <td key={sph} className="p-1">
                    <input
                      ref={(el) => {
                        if (el && selected) inputRefs.current.set(key, el);
                      }}
                      type="number"
                      min={0}
                      value={qty}
                      onChange={(e) => onSetQty(sph, parseInt(e.target.value) || 0)}
                      onKeyDown={(e) => handleKeyDown(e, sph)}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      className={`w-full h-9 text-center font-mono text-sm font-semibold rounded-md border transition-all duration-150 focus:outline-none ${
                        overStock
                          ? 'border-rose-400 bg-rose-50/80 text-rose-800 ring-2 ring-rose-300/50'
                          : entered > 0
                          ? 'border-indigo-500 bg-indigo-50/60 text-indigo-950 ring-2 ring-indigo-200/60 font-bold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-800 dir-rtl">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
            <Grid3x3 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-bold text-base tracking-wide">مصفوفة قوّات العدسات (SPH Matrix)</h2>
            <p className="text-xs text-slate-400 mt-0.5">إدارة شاشات الجرد وإدخال الطلبيات السريعة للمستودع</p>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={totalQty === 0}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/50 hover:text-rose-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> مسح المدخلات
        </button>
      </div>

      {/* Control Toolbar */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between flex-wrap gap-4">
        {/* Brand selection */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            العلامة التجارية:
          </label>
          <select
            value={selectedLensId}
            onChange={(e) => onSelectLens(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {uniqueLensProducts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.brand}
              </option>
            ))}
          </select>

          {selected && (
            <div className="px-3 py-1 bg-slate-200/60 rounded-lg text-xs font-medium text-slate-700">
              سعر العلبة: <strong className="text-slate-900 font-bold">{formatILS(selected.unit_price)}</strong>
            </div>
          )}
        </div>

        {/* Live Summary Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-medium">
            <span className="text-slate-500">إجمالي القطع:</span>
            <span className="font-bold font-mono text-sm text-indigo-600">{totalQty}</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-sm text-xs font-medium">
            <span className="text-emerald-700">القيمة الإجمالية:</span>
            <span className="font-bold font-mono text-sm text-emerald-800">{formatILS(totalValue)}</span>
          </div>
        </div>
      </div>

      {/* Configuration Toggles */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Toric Toggle */}
          <button
            onClick={() => onToricChange(!isToric)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              isToric
                ? 'border-purple-500 bg-purple-50/80 text-purple-900 shadow-sm ring-2 ring-purple-100'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
            عدسات توريك (Toric Astigmatism)
          </button>

          {/* Plus / Minus Sign Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 shadow-inner">
            <button
              onClick={() => onSphSignChange('minus')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sphSign === 'minus'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              سالب (−)
            </button>
            <button
              onClick={() => onSphSignChange('plus')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sphSign === 'plus'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              موجب (+)
            </button>
          </div>
        </div>

        {/* Dynamic Controls Info */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>استخدم <strong>Enter</strong> أو <strong>الأسهم</strong> للتنقل السريع بين المقاسات</span>
        </div>
      </div>

      {/* Toric Controls Bar */}
      {isToric && (
        <div className="px-6 py-3 bg-purple-50/50 border-b border-purple-100 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 text-purple-600" />
            <label className="text-xs font-bold text-purple-900">CYL:</label>
            <select
              value={selectedCYL ?? ''}
              onChange={(e) => onCYLChange(e.target.value ? parseFloat(e.target.value) : null)}
              className="px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs font-semibold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">— اختر SPH CYL —</option>
              {CYL_VALUES.map((cyl) => (
                <option key={cyl} value={cyl}>
                  {formatSPH(cyl)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-purple-900">AXIS:</label>
            <select
              value={selectedAXIS ?? ''}
              onChange={(e) => onAXISChange(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs font-semibold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">— اختر المحور —</option>
              {AXIS_VALUES.map((axis) => (
                <option key={axis} value={axis}>
                  {axis}°
                </option>
              ))}
            </select>
          </div>

          {(!selectedCYL || !selectedAXIS) && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-md border border-amber-200/80">
              تنبيه: يلزم تحديد قيمة CYL والمحور AXIS لإضافة التوريك للسلة
            </span>
          )}
        </div>
      )}

      {/* Grid Container */}
      <div className="p-6 bg-slate-50/30">
        {rows.map((slice, rowIdx) => (
          <div key={rowIdx}>{renderSphRow(slice)}</div>
        ))}

        {totalQty === 0 && (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white/50">
            <Package className="w-10 h-10 mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              الماتريكس جاهزة لإدخال كميات العدسات ({sphSign === 'minus' ? 'السالبة −' : 'الموجبة +'})
            </p>
            <p className="text-xs mt-1 text-slate-400">انقر على أي خلية وادخل العدد مباشرةً</p>
          </div>
        )}

        {selected && totalQty > 0 && (() => {
          const overs = sphValues.filter(
            (sph) =>
              (quantities[`${selected.id}:${sph}`] || 0) >
              (stockMap.get(`${selected.id}:${sph}`) ?? 0)
          );
          if (overs.length > 0) {
            return (
              <div className="mt-2 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>تحذير: الكمية المدخلة تتجاوز الرصيد المتوفر بالمخزون لـ ({overs.length}) مقاسات مختلفة!</span>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Custom Prescription Section */}
      <div className="border-t border-slate-200 bg-white">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-full px-6 py-3.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <span className="flex items-center gap-2 text-indigo-900">
            <Sparkles className="w-4 h-4 text-amber-500" />
            إدخال وصفة أو مقاس خاص (Custom Prescription)
          </span>
          <span className="text-slate-400 flex items-center gap-1 font-normal">
            {showCustom ? (
              <>إخفاء القائمة <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>إظهار الإعدادات الخاصة <ChevronDown className="w-4 h-4" /></>
            )}
          </span>
        </button>

        {showCustom && (
          <div className="px-6 py-5 bg-amber-50/20 border-t border-amber-100/60 animate-fade-in">
            <p className="text-xs font-medium text-slate-500 mb-4">
              يمكنك كتابة درجات SPH الخاصة من ({CUSTOM_SPH_MIN} إلى {CUSTOM_SPH_MAX}) مع إضافة القيم الاختيارية لـ CYL و AXIS.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">SPH مخصص</label>
                <input
                  type="number"
                  step={0.25}
                  min={CUSTOM_SPH_MIN}
                  max={CUSTOM_SPH_MAX}
                  value={customPrescription?.sph ?? ''}
                  onChange={(e) =>
                    onCustomPrescriptionChange({
                      sph: parseFloat(e.target.value) || 0,
                      cyl: customPrescription?.cyl ?? null,
                      axis: customPrescription?.axis ?? null,
                      quantity: customPrescription?.quantity ?? 1,
                    })
                  }
                  placeholder="مثال: -15.00"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">CYL (اختياري)</label>
                <input
                  type="number"
                  step={0.25}
                  value={customPrescription?.cyl ?? ''}
                  onChange={(e) =>
                    onCustomPrescriptionChange({
                      sph: customPrescription?.sph ?? 0,
                      cyl: e.target.value ? parseFloat(e.target.value) : null,
                      axis: customPrescription?.axis ?? null,
                      quantity: customPrescription?.quantity ?? 1,
                    })
                  }
                  placeholder="مثال: -2.25"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">AXIS° (اختياري)</label>
                <input
                  type="number"
                  step={10}
                  min={0}
                  max={180}
                  value={customPrescription?.axis ?? ''}
                  onChange={(e) =>
                    onCustomPrescriptionChange({
                      sph: customPrescription?.sph ?? 0,
                      cyl: customPrescription?.cyl ?? null,
                      axis: e.target.value ? parseInt(e.target.value) : null,
                      quantity: customPrescription?.quantity ?? 1,
                    })
                  }
                  placeholder="مثال: 90"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الكمية</label>
                <input
                  type="number"
                  min={1}
                  value={customPrescription?.quantity ?? 1}
                  onChange={(e) =>
                    onCustomPrescriptionChange({
                      sph: customPrescription?.sph ?? 0,
                      cyl: customPrescription?.cyl ?? null,
                      axis: customPrescription?.axis ?? null,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={onAddCustomPrescription}
                disabled={!customPrescription || !customPrescription.sph}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                إضافة المقاس الخاص إلى السلة
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
