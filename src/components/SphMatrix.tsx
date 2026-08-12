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
} from 'lucide-react';
import type { LensProduct, LensStock, SphSign } from '@/lib/supabase';
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

  const rowSize = sphSign === 'minus' ? 16 : 16;
  const rows: number[][] = [];
  for (let i = 0; i < sphValues.length; i += rowSize) {
    rows.push(sphValues.slice(i, i + rowSize));
  }

  function renderSphRow(slice: number[]) {
    return (
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky right-0 bg-white px-3 py-2 text-center text-xs font-bold text-slate-500 border-b border-slate-200 w-20">
              SPH ↓
            </th>
            {slice.map((sph) => {
              const stock = selected ? stockMap.get(`${selected.id}:${sph}`) ?? 0 : 0;
              const lowStock = stock <= 10;
              return (
                <th
                  key={sph}
                  className={`px-1 py-2 text-center text-xs font-bold border-b border-slate-200 ${
                    lowStock ? 'text-amber-600' : 'text-slate-500'
                  }`}
                >
                  {formatSPH(sph)}
                  <span
                    className={`block text-[10px] font-normal mt-0.5 ${
                      lowStock ? 'text-amber-500' : 'text-slate-400'
                    }`}
                  >
                    ({stock})
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="sticky right-0 bg-white px-3 py-2 text-center text-xs font-medium text-slate-400 border-b border-slate-100">
              كمية
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
                    className={`w-full min-w-[48px] px-1 py-1.5 text-center text-sm rounded-lg border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                      overStock
                        ? 'border-red-400 focus:ring-red-500 text-red-700'
                        : entered > 0
                        ? 'border-sky-400 focus:ring-sky-500 text-sky-700 font-bold bg-sky-50'
                        : 'border-slate-200 focus:ring-sky-500 text-slate-700'
                    }`}
                  />
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-sky-600" />
          <h2 className="font-bold text-slate-800">مصفوفة القوة (SPH Matrix)</h2>
        </div>
        <button
          onClick={onClear}
          disabled={totalQty === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Trash2 className="w-4 h-4" /> مسح الكميات
        </button>
      </div>

      {/* Lens specs controls */}
      <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">العلامة</label>
          <select
            value={selectedLensId}
            onChange={(e) => onSelectLens(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {lensProducts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.brand}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">BC</label>
          <select
            value={selectedBC}
            onChange={(e) => onBCChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {availableBCs.map((bc) => (
              <option key={bc} value={bc}>
                {bc}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">DIA</label>
          <select
            value={selectedDIA}
            onChange={(e) => onDIAChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {availableDIAs.map((dia) => (
              <option key={dia} value={dia}>
                {dia}
              </option>
            ))}
          </select>
        </div>
        {selected && (
          <span className="text-xs text-slate-500 mr-auto">
            السعر: <strong className="text-slate-700">{formatILS(selected.unit_price)}</strong> / علبة
          </span>
        )}
      </div>

      {/* Toric toggle + +/- sign toggle */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Toric toggle */}
          <button
            onClick={() => onToricChange(!isToric)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${
              isToric
                ? 'border-violet-500 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            توريك (استجماتيزم)
          </button>

          {/* +/- Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <button
              onClick={() => onSphSignChange('minus')}
              className={`flex items-center gap-1.5 px-5 py-2 text-sm font-bold transition ${
                sphSign === 'minus'
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Minus className="w-4 h-4" />
              سالب (−)
            </button>
            <button
              onClick={() => onSphSignChange('plus')}
              className={`flex items-center gap-1.5 px-5 py-2 text-sm font-bold transition ${
                sphSign === 'plus'
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              موجب (+)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">
            إجمالي الكمية: <strong className="text-sky-700">{totalQty}</strong>
          </span>
          <span className="text-slate-600">
            إجمالي القيمة: <strong className="text-emerald-700">{formatILS(totalValue)}</strong>
          </span>
        </div>
      </div>

      {/* CYL / AXIS controls (only when toric is enabled) */}
      {isToric && (
        <div className="px-5 py-3 bg-violet-50/30 border-b border-violet-100 flex items-center gap-4 flex-wrap animate-fade-in">
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-violet-500" />
            <label className="text-xs font-medium text-violet-700">CYL</label>
            <select
              value={selectedCYL ?? ''}
              onChange={(e) => onCYLChange(e.target.value ? parseFloat(e.target.value) : null)}
              className="px-3 py-1.5 rounded-lg border border-violet-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
            <label className="text-xs font-medium text-violet-700">AXIS</label>
            <select
              value={selectedAXIS ?? ''}
              onChange={(e) => onAXISChange(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1.5 rounded-lg border border-violet-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
            <span className="text-xs text-amber-600">يرجى اختيار CYL و AXIS لإضافة عدسات توريك</span>
          )}
        </div>
      )}

      <div className="px-5 py-2 bg-sky-50/30 border-b border-sky-100">
        <span className="text-xs text-slate-400">
          الأرقام بين الأقواس = المخزون المتاح · Enter للانتقال للتالي · الأسهم للتنقل
        </span>
      </div>

      {/* Grid */}
      <div className="p-5 overflow-x-auto space-y-2">
        {rows.map((slice, rowIdx) => (
          <div key={rowIdx}>{renderSphRow(slice)}</div>
        ))}

        {totalQty === 0 && (
          <div className="mt-4 flex flex-col items-center justify-center text-slate-400 py-6 border border-dashed border-slate-200 rounded-xl">
            <Package className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">
              أدخل الكميات لكل قوة عدسة ({sphSign === 'minus' ? 'سالبة' : 'موجبة'}) لإضافتها إلى السلة
            </p>
            <p className="text-xs mt-1 text-slate-400">استخدم Enter للتنقل السريع بين الخلايا</p>
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
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>الكمية المدخلة تتجاوز المخزون المتاح في {overs.length} قوة عدسة</span>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Custom Prescription Panel */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            مقاس خاص / وصفة مخصصة (Custom Prescription)
          </span>
          <span className="text-xs text-slate-400">{showCustom ? 'إخفاء ▲' : 'إظهار ▼'}</span>
        </button>

        {showCustom && (
          <div className="px-5 py-4 bg-amber-50/30 border-t border-amber-100 animate-fade-in">
            <p className="text-xs text-slate-500 mb-3">
              أدخل قيمة SPH خارج النطاق القياسي (من {CUSTOM_SPH_MIN} إلى {CUSTOM_SPH_MAX}) مع إمكانية إضافة CYL و AXIS
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">SPH مخصص</label>
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">CYL (اختياري)</label>
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">AXIS° (اختياري)</label>
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الكمية</label>
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <button
              onClick={onAddCustomPrescription}
              disabled={!customPrescription || !customPrescription.sph}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              إضافة المقاس الخاص للسلة
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
