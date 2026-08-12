import { useState } from 'react';
import { Boxes, Droplets, Glasses, Plus, Minus } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import { formatILS } from '@/lib/supabase';

interface Props {
  products: Product[];
  onAdd: (p: Product, qty: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  solution: 'المحاليل والقطرات',
  frame: 'الإطارات',
  accessory: 'الإكسسوارات',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  solution: <Droplets className="w-4 h-4" />,
  frame: <Glasses className="w-4 h-4" />,
  accessory: <Boxes className="w-4 h-4" />,
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
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Boxes className="w-5 h-5 text-sky-600" />
        <h2 className="font-bold text-slate-800">أصناف إضافية</h2>
      </div>
      <div className="p-5 space-y-6">
        {categories.map((cat) => {
          const items = products.filter((p) => p.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 mb-3">
                {CATEGORY_ICONS[cat]}
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border border-slate-200 rounded-xl p-3 hover:border-sky-300 hover:bg-sky-50/30 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{p.sku || '—'}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-medium text-slate-600">
                          {formatILS(p.unit_price)}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            p.stock_qty > 20
                              ? 'text-emerald-600 bg-emerald-50'
                              : 'text-amber-600 bg-amber-50'
                          }`}
                        >
                          مخزون: {p.stock_qty}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQty(p.id, -1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={qtys[p.id] || 0}
                        onChange={(e) =>
                          setQtys((prev) => ({
                            ...prev,
                            [p.id]: Math.max(0, parseInt(e.target.value) || 0),
                          }))
                        }
                        className="w-12 text-center text-sm font-medium rounded-lg border border-slate-200 px-1 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        onClick={() => setQty(p.id, 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAdd(p)}
                        disabled={(qtys[p.id] || 0) === 0}
                        className="mr-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
