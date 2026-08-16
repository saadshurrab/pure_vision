import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Eye,
  Package,
  Search,
  Box,
  PlusCircle,
  X,
  TrendingDown,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { supabase, formatILS, type Product, type LensProduct } from '@/lib/supabase';

interface Props {
  lensProducts?: LensProduct[];
  selectedLensId?: string;
  onSelectLens?: (id: string) => void;
  stockMap?: Map<string, number>;
  onRefreshData?: () => void;
}

export function ProductsInventory({
  lensProducts = [],
  selectedLensId = '',
  onSelectLens,
  stockMap = new Map(),
  onRefreshData,
}: Props) {
  // تبويب العرض (المستلزمات والمحاليل أو عدسات SPH)
  const [activeTab, setActiveTab] = useState<'general' | 'lenses'>('general');

  // حالات المنتجات العامة
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // حالات إضافة/تغذية كمية للمنتجات العامة
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addStockAmount, setAddStockAmount] = useState<number>(0);

  // حالات إضافة/تغذية كمية لعدسة معينة (SPH)
  const [selectedLensSph, setSelectedLensSph] = useState<{ sph: string; currentQty: number } | null>(null);
  const [addLensStockAmount, setAddLensStockAmount] = useState<number>(0);

  const [saving, setSaving] = useState(false);

  // جلب المنتجات العامة من supabase
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        setProducts(data as Product[]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // تغذية كمية منتج عام (تعديل stock_qty)
  async function handleAddStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || addStockAmount <= 0) return;

    setSaving(true);
    try {
      const currentQty = selectedProduct.stock_qty || 0;
      const newTotal = currentQty + addStockAmount;

      const { error } = await supabase
        .from('products')
        .update({ stock_qty: newTotal })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      setSelectedProduct(null);
      setAddStockAmount(0);
      await fetchProducts();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث المخزون');
    } finally {
      setSaving(false);
    }
  }

  // تغذية كمية عدسة حسب الـ SPH المحدد
  async function handleAddLensStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLensId || !selectedLensSph || addLensStockAmount <= 0) return;

    setSaving(true);
    try {
      const sphValue = parseFloat(selectedLensSph.sph);
      if (isNaN(sphValue)) throw new Error('قياس الـ SPH غير صالح');

      const newQty = selectedLensSph.currentQty + addLensStockAmount;

      const { error } = await supabase
        .from('lens_stock')
        .update({ stock_qty: newQty })
        .eq('lens_product_id', selectedLensId)
        .eq('sph', sphValue);

      if (error) throw error;

      setSelectedLensSph(null);
      setAddLensStockAmount(0);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث مخزون العدسة');
    } finally {
      setSaving(false);
    }
  }

  // تصفية المنتجات العامة حسب البحث
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;

    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // إحصائيات عامة للمخزون العام
  const totalItemsConsumed = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.consumed_stock || 0), 0);
  }, [products]);

  const totalItemsRemaining = useMemo(() => {
    return products.reduce((sum, p) => {
      const remaining = (p.stock_qty || 0) - (p.consumed_stock || 0);
      return sum + Math.max(0, remaining);
    }, 0);
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const remaining = Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0));
      return sum + remaining * (p.unit_price || 0);
    }, 0);
  }, [products]);

  // العثور على العدسة المحددة
  const selectedLens = useMemo(() => {
    return lensProducts.find((l) => l.id === selectedLensId);
  }, [lensProducts, selectedLensId]);

  // استخراج الماركات الفريدة
  const uniqueLensProducts = useMemo(() => {
    const seenBrands = new Set();
    return lensProducts.filter((item) => {
      if (seenBrands.has(item.brand)) return false;
      seenBrands.add(item.brand);
      return true;
    });
  }, [lensProducts]);

  return (
    <div className="space-y-6 text-slate-800" dir="rtl">
      {/* 1. أزرار التنقل الرئيسية بين المكونات */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Package className="w-4 h-4" />
            المستلزمات والمحاليل
          </button>

          <button
            onClick={() => setActiveTab('lenses')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'lenses'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Eye className="w-4 h-4" />
            مخزون العدسات (SPH Matrix)
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded-xl text-slate-400 text-xs border border-slate-700/50 ml-2">
          <Warehouse className="w-3.5 h-3.5 text-indigo-400" />
          <span>مستودع الرؤيا النقية</span>
        </div>
      </div>

      {/* ======================= التبويب الأول: المستلزمات والمحاليل ======================= */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* بطاقات الإحصائيات القيادية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">القطع المباعة (المستهلكة)</p>
                <h3 className="text-2xl font-black text-slate-800 font-mono mt-1">{totalItemsConsumed} <span className="text-xs font-sans font-medium text-slate-500">قطعة</span></h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">القطع المتبقية بالمخزن</p>
                <h3 className="text-2xl font-black text-indigo-900 font-mono mt-1">{totalItemsRemaining} <span className="text-xs font-sans font-medium text-slate-500">قطعة</span></h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-600">
                <Package className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">القيمة الإجمالية للمخزون</p>
                <h3 className="text-2xl font-black text-emerald-700 font-mono mt-1">{formatILS(totalInventoryValue)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* قائمة وجدول المنتجات */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Box className="w-5 h-5 text-indigo-600" />
                  حركة ومخزون المستلزمات الطبية والمحاليل
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">متابعة دقيقة للرصيد المتاح والأصناف المباعة</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="بحث باسم المنتج، SKU أو التصنيف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-300/80 bg-slate-50/50 rounded-xl pr-9 pl-4 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs">جاري تحميل وسحب المنتجات من المستودع...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">
                لا توجد أصناف مطابقة لبيانات البحث الحالية.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3.5 pr-6">الكود (SKU)</th>
                      <th className="p-3.5">اسم المنتج</th>
                      <th className="p-3.5">التصنيف</th>
                      <th className="p-3.5">سعر الوحدة</th>
                      <th className="p-3.5 text-center">الإجمالي بالشهادات</th>
                      <th className="p-3.5 text-center">المباع</th>
                      <th className="p-3.5 text-center">المتبقي بالفحص</th>
                      <th className="p-3.5 text-center pl-6">تغذية المخزون</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredProducts.map((p) => {
                      const totalStock = p.stock_qty || 0;
                      const consumed = p.consumed_stock || 0;
                      const remaining = Math.max(0, totalStock - consumed);
                      const isLowStock = remaining > 0 && remaining <= 5;
                      const isOutOfStock = remaining <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 pr-6 font-mono text-slate-500 text-[11px]">{p.sku || '—'}</td>
                          <td className="p-3.5 font-bold text-slate-800">{p.name}</td>
                          <td className="p-3.5 text-slate-500">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px]">
                              {p.category || 'عام'}
                            </span>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-700">{formatILS(p.unit_price)}</td>
                          <td className="p-3.5 text-center font-mono font-medium text-slate-600">{totalStock}</td>
                          <td className="p-3.5 text-center font-mono font-bold text-amber-700">{consumed}</td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                  : isLowStock
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                              }`}
                            >
                              {isOutOfStock ? (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  نفذت الكمية
                                </>
                              ) : (
                                `${remaining} قطعة`
                              )}
                            </span>
                          </td>
                          <td className="p-3.5 text-center pl-6">
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setAddStockAmount(0);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              إضافة شحنة
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= التبويب الثاني: عدسات SPH ======================= */}
      {activeTab === 'lenses' && (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-600" />
                استعلام وجرد مخزون العدسات اللاصقة (حسب المقاس)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة دقيقة لكميات درجات الـ SPH المتوفرة في مستودع المركز
              </p>
            </div>

            {onSelectLens && lensProducts.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  علامة العدسة:
                </label>
                <select
                  value={selectedLensId}
                  onChange={(e) => onSelectLens(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {uniqueLensProducts.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.brand}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selectedLens && (
            <div className="bg-indigo-50/40 rounded-2xl p-4 border border-indigo-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 block">العلامة التجارية المحددة حالياً:</span>
                <h3 className="text-lg font-black text-indigo-950 mt-0.5">{selectedLens.brand}</h3>
              </div>
              <div className="px-3.5 py-1.5 bg-white border border-indigo-200/80 rounded-xl text-xs font-bold text-slate-800 shadow-2xs">
                سعر العلبة: <span className="text-emerald-700 font-mono">{formatILS(selectedLens.unit_price)}</span>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200/80">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="p-3.5 text-center">قياس القوة (SPH)</th>
                  <th className="p-3.5 text-center">الكمية المتاحة بالرصيد</th>
                  <th className="p-3.5 text-center">حالة المخزون</th>
                  <th className="p-3.5 text-center">تغذية السريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {Array.from(stockMap.entries()).length > 0 ? (
                  Array.from(stockMap.entries()).map(([key, qty]) => {
                    const sph = key.split(':')[1] || key;
                    const isLow = qty > 0 && qty <= 3;
                    const isOutOfStock = qty === 0;

                    return (
                      <tr key={key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 text-center font-mono font-bold text-slate-800" dir="ltr">
                          {sph}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-900">{qty} علبة</td>
                        <td className="p-3.5 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200/60">
                              غير متوفر
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200/60">
                              منخفض
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
                              متوفر
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setSelectedLensSph({ sph, currentQty: qty });
                              setAddLensStockAmount(0);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            تغذية
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs font-medium">
                      لا توجد بيانات مخزون مسجلة لهذه الماركة حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 1. نافذة Modal: إدخال كميات جديدة لمنتج عام */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">تغذية مخزون المنتجات</h3>
                <p className="text-xs text-slate-500">تحديث كميات الشحنات الواردة للمستودع</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-4 text-xs">
              <span className="text-slate-500 block">المنتج المحدد:</span>
              <strong className="text-slate-800 text-sm font-bold block mt-0.5">{selectedProduct.name}</strong>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الكمية المضافة (بالقطع)</label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={addStockAmount || ''}
                  onChange={(e) => setAddStockAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="مثال: 50"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>الرصيد المتبقي حالياً:</span>
                  <span className="font-bold font-mono">
                    {Math.max(0, (selectedProduct.stock_qty || 0) - (selectedProduct.consumed_stock || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold border-t border-indigo-100/80 pt-1.5">
                  <span>الرصيد المتاح بعد التحديث:</span>
                  <span className="font-mono text-emerald-700">
                    {Math.max(0, (selectedProduct.stock_qty || 0) - (selectedProduct.consumed_stock || 0)) + addStockAmount}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving || addStockAmount <= 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? 'جاري الحفظ...' : 'تأكيد التغذية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. نافذة Modal: إدخال كميات جديدة لعدسة (SPH) */}
      {selectedLensSph && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedLensSph(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLensSph(null)}
              className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">تغذية مخزون العدسات</h3>
                <p className="text-xs text-slate-500">تحديث كميات درجات SPH للعدسات</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-4 text-xs space-y-1">
              <div className="text-slate-600">
                الماركة: <strong className="text-slate-900">{selectedLens?.brand}</strong>
              </div>
              <div className="text-slate-600">
                قياس (SPH): <strong className="text-indigo-700 font-mono" dir="ltr">{selectedLensSph.sph}</strong>
              </div>
            </div>

            <form onSubmit={handleAddLensStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الكمية المضافة (بالعلب)</label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={addLensStockAmount || ''}
                  onChange={(e) => setAddLensStockAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="مثال: 10"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>الرصيد المتاح حالياً:</span>
                  <span className="font-bold font-mono">{selectedLensSph.currentQty} علبة</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold border-t border-indigo-100/80 pt-1.5">
                  <span>الرصيد بعد الإضافة:</span>
                  <span className="font-mono text-emerald-700">{selectedLensSph.currentQty + addLensStockAmount} علبة</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLensSph(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving || addLensStockAmount <= 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? 'جاري الحفظ...' : 'تأكيد التغذية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
