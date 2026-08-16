import { useRef, useState } from 'react';
import {
  Grid3x3,
  Trash2,
  Package,
  Minus,
  Plus,
  SlidersHorizontal,
  Sparkles,
  RotateCw,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowDown,
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
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white mb-3 shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="sticky right-0 z-10 bg-slate-100 px-3 py-2.5 border-l border-slate-200 text-center w-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SPH</span>
                <ArrowDown className="w-3 h-3 text-slate-400 mx-auto mt-0.5" />
              </th>
              {slice.map((sph) => {
                const stock = selected ? stockMap.get(`${selected.id}:${sph}`) ?? 0 : 0;
                const isOutOfStock = stock === 0;
                const isLowStock = stock > 0 && stock <= 10;

                return (
                  <th
                    key={sph}
                    className={`px-1.5 py-2 text-center min-w-[52px] border-b border-slate-100 ${
                      isOutOfStock
                        ? 'bg-rose-50/30'
                        : isLowStock
                        ? 'bg-amber-50/30'
                        : ''
                    }`}
                  >
                    <div className="font-mono text-[11px] font-bold text-slate-700">{formatSPH(sph)}</div>
                    <div
                      className={`text-[10px] font-medium mt-0.5 ${
                        isOutOfStock
                          ? 'text-rose-500 font-bold'
                          : isLowStock
                          ? 'text-amber-600 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {isOutOfStock ? 'نفذت' : `${stock}`}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sticky right-0 z-10 bg-slate-50 font-bold px-3 py-2 text-center text-[11px] text-slate-600 border-l border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
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
                      className={`w-full h-8 text-center font-mono text-sm font-semibold rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-200 ${
                        overStock
                          ? 'border-rose-400 bg-rose-50/60 text-rose-800'
                          : entered > 0
                          ? 'border-slate-900 bg-slate-50 text-slate-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:border-slate-400'
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
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-800 dir-rtl">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            <Grid3x3 className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-wide">مصفوفة قوّات العدسات</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">إدخال الطلبيات السريعة حسب درجات القوة</p>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={totalQty === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> مسح
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            العلامة التجارية:
          </label>
          <select
            value={selectedLensId}
            onChange={(e) => onSelectLens(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
          >
            {uniqueLensProducts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.brand}
              </option>
            ))}
          </select>

          {selected && (
            <span className="px-2.5 py-1 bg-slate-200/60 rounded-md text-[11px] font-medium text-slate-700">
              {formatILS(selected.unit_price)} <span className="text-slate-500">/ علبة</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px]">
            <span className="text-slate-500">القطع:</span>
            <span className="font-bold font-mono text-sm text-slate-900">{totalQty}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px]">
            <span className="text-emerald-700">القيمة:</span>
            <span className="font-bold font-mono text-sm text-emerald-800">{formatILS(totalValue)}</span>
          </div>
        </div>
      </div>

      {/* Config Bar */}
      <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onToricChange(!isToric)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
              isToric
                ? 'border-slate-800 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            عدسات توريك
          </button>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              onClick={() => onSphSignChange('minus')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                sphSign === 'minus'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minus className="w-3 h-3" />
              سالب
            </button>
            <button
              onClick={() => onSphSignChange('plus')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                sphSign === 'plus'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3 h-3" />
              موجب
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Enter أو الأسهم للتنقل</span>
        </div>
      </div>

      {/* Toric Controls */}
      {isToric && (
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 text-slate-600" />
            <label className="text-[11px] font-bold text-slate-700">CYL:</label>
            <select
              value={selectedCYL ?? ''}
              onChange={(e) => onCYLChange(e.target.value ? parseFloat(e.target.value) : null)}
              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">— اختر —</option>
              {CYL_VALUES.map((cyl) => (
                <option key={cyl} value={cyl}>
                  {formatSPH(cyl)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-700">AXIS:</label>
            <select
              value={selectedAXIS ?? ''}
              onChange={(e) => onAXISChange(e.target.value ? parseInt(e.target.value) : null)}
              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">— اختر —</option>
              {AXIS_VALUES.map((axis) => (
                <option key={axis} value={axis}>
                  {axis}°
                </option>
              ))}
            </select>
          </div>

          {(!selectedCYL || !selectedAXIS) && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              يلزم تحديد CYL و AXIS
            </span>
          )}
        </div>
      )}

      {/* Matrix Grid */}
      <div className="p-5 bg-slate-50/50">
        {rows.map((slice, rowIdx) => (
          <div key={rowIdx}>{renderSphRow(slice)}</div>
        ))}

        {totalQty === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white">
            <Package className="w-10 h-10 mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">
              المصفوفة جاهزة — اختر العلامة التجارية وادخل الكميات
            </p>
            <p className="text-xs mt-1 text-slate-400">انقر على أي خلية واكتب العدد مباشرة</p>
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
              <div className="mt-3 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs font-bold text-rose-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                تحذير: الكمية تتجاوز المخزون في {overs.length} مقاس
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Custom Prescription */}
      <div className="border-t border-slate-200 bg-white">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-full px-5 py-3 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            وصفة خاصة (Custom Prescription)
          </span>
          {showCustom ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showCustom && (
          <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 mb-3">
              درجات SPH من {CUSTOM_SPH_MIN} إلى {CUSTOM_SPH_MAX} مع CYL و AXIS اختياريين.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">SPH مخصص</label>
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
                  placeholder="-15.00"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">CYL</label>
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
                  placeholder="-2.25"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">AXIS°</label>
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
                  placeholder="90"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">الكمية</label>
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
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={onAddCustomPrescription}
                disabled={!customPrescription || !customPrescription.sph}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                إضافة للسلة
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
