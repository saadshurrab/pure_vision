import { useState } from 'react';
import { Boxes, Droplets, Glasses, Plus, Minus, ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import { formatILS } from '@/lib/supabase';

interface Props {
  products: Product[];
  onAdd: (p: Product, qty: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  solution: 'المحاليل والقطرات',
  frame: 'الإطارات والنظارات',
  accessory: 'الملحقات والإكسسوارات',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  solution: <Droplets className="w-4 h-4 text-slate-500" />,
  frame: <Glasses className="w-4 h-4 text-slate-500" />,
  accessory: <Boxes className="w-4 h-4 text-slate-500" />,
};

export function AdditionalItems({ products, onAdd }: Props) {
  const [qtys, setQtys] = useState<Record<string, number>>({});

  const categories = ['solution', 'frame', 'accessory'];

  function setQty(id: string, delta: number) {
    setQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  }

  function handleAdd(p: Product) {
    const qty = qtys[p.id] || 0;
    if (qty > 0) {
      onAdd(p, qty);
      setQtys((prev) => ({ ...prev, [p.id]: 0 }));
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden font-sans text-slate-800" dir="rtl">
      {/* Header - الهيدر الرسمي */}
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base">الأصناف والمنتجات الإضافية</h2>
            <p className="text-[11px] text-slate-400">إضافة المحاليل، الإطارات والمستلزمات إلى الفاتورة</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {categories.map((cat) => {
          const items = products.filter((p) => p.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 w-fit">
                {CATEGORY_ICONS[cat]}
                <span>{CATEGORY_LABELS[cat]}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {items.map((p) => {
                  const currentQty = qtys[p.id] || 0;
                  const isOutOfStock = p.stock_qty <= 0;

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border border-slate-200/90 rounded-lg p-2.5 bg-white hover:border-slate-300 transition shadow-2xs"
                    >
                      {/* معلومات المنتج */}
                      <div className="flex-1 min-w-0 pl-2">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-mono font-bold text-slate-700">
                            {formatILS(p.unit_price)}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {p.sku || 'بدون رمز'}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                              p.stock_qty > 20
                                ? 'text-slate-700 bg-slate-50 border-slate-200'
                                : p.stock_qty > 0
                                ? 'text-amber-700 bg-amber-50 border-amber-200'
                                : 'text-rose-700 bg-rose-50 border-rose-200'
                            }`}
                          >
                            المخزون: {p.stock_qty}
                          </span>
                        </div>
                      </div>

                      {/* أدوات التحكم بالكمية والإضافة */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
                          <button
                            onClick={() => setQty(p.id, -1)}
                            disabled={currentQty === 0 || isOutOfStock}
                            className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={currentQty}
                            disabled={isOutOfStock}
                            onChange={(e) =>
                              setQtys((prev) => ({
                                ...prev,
                                [p.id]: Math.max(0, parseInt(e.target.value) || 0),
                              }))
                            }
                            className="w-9 text-center text-xs font-bold font-mono bg-transparent text-slate-900 focus:outline-none"
                          />
                          <button
                            onClick={() => setQty(p.id, 1)}
                            disabled={isOutOfStock}
                            className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleAdd(p)}
                          disabled={currentQty === 0 || isOutOfStock}
                          className="px-2.5 py-1.5 rounded-md text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
