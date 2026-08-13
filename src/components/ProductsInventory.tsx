import { useEffect, useState } from 'react';
import { Eye, Package, Search, Box } from 'lucide-react';
import { supabase, formatILS, type Product, type LensProduct } from '@/lib/supabase';

interface Props {
  lensProducts?: LensProduct[];
  selectedLensId?: string;
  onSelectLens?: (id: string) => void;
  stockMap?: Map<string, number>;
}

export function ProductsInventory({
  lensProducts = [],
  selectedLensId = '',
  onSelectLens,
  stockMap = new Map(),
}: Props) {
  // تبويب العرض (العدسات أو المنتجات العامة)
  const [activeTab, setActiveTab] = useState<'general' | 'lenses'>('general');

  // حالات المنتجات العامة
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // حالات إضافة/تعديل كمية منتج
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addStockAmount, setAddStockAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }

  // إضافة كمية جديدة للمخزون
  async function handleAddStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || addStockAmount <= 0) return;

    setSaving(true);
    try {
      const newTotal = (selectedProduct.total_stock || 0) + addStockAmount;

      const { error } = await supabase
        .from('products')
        .update({ total_stock: newTotal })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      setSelectedProduct(null);
      setAddStockAmount(0);
      fetchProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث المخزون');
    } finally {
      setSaving(false);
    }
  }

  // تصفية المنتجات العامة حسب البحث
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // إحصائيات عامة للمخزون العام
  const totalItemsConsumed = products.reduce((sum, p) => sum + (p.consumed_stock || 0), 0);
  const totalItemsRemaining = products.reduce((sum, p) => {
    const remaining = (p.total_stock || 0) - (p.consumed_stock || 0);
    return sum + Math.max(0, remaining);
  }, 0);

  // العثور على العدسة المحددة
  const selectedLens = lensProducts.find((l) => l.id === selectedLensId);
  const uniqueLensProducts = Array.from(
    new Map(lensProducts.map((item) => [item.brand, item])).values()
  );

  return (
    <div className="space-y-6">
      {/* 1. أزرار التنقل بين المكونات */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-start gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === 'general'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          المستلزمات والنظارات
        </button>

        <button
          onClick={() => setActiveTab('lenses')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === 'lenses'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          مخزون العدسات (SPH)
        </button>
      </div>

      {/* ======================= التبويب الأول: المستلزمات والنظارات ======================= */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* بطاقات الإحصائيات السريعة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-amber-700">إجمالي قطع المنتجات المستهلكة (المباعة)</p>
                <h3 className="text-3xl font-bold text-amber-800 mt-1">{totalItemsConsumed} قطعة</h3>
              </div>
              <span className="text-4xl">📦</span>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-sky-700">إجمالي القطع المتبقية بالمخزن</p>
                <h3 className="text-3xl font-bold text-sky-800 mt-1">{totalItemsRemaining} قطعة</h3>
              </div>
              <span className="text-4xl">🏬</span>
            </div>
          </div>

          {/* قائمة وجدول المنتجات */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">حركة المخزون والمنتجات</h2>
                <p className="text-sm text-slate-500">متابعة المنتجات المستهلكة والكميات المتبقية والمتاحة للبيع</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="بحث باسم المنتج أو الكود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">جاري تحميل قائمة المنتجات...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                      <th className="p-3">الكود</th>
                      <th className="p-3">اسم المنتج</th>
                      <th className="p-3">السعر</th>
                      <th className="p-3">الكمية الكلية</th>
                      <th className="p-3">المستهلك (المباع)</th>
                      <th className="p-3">المتبقي بالمخزن</th>
                      <th className="p-3 text-center">تغذية المخزون</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredProducts.map((p) => {
                      const total = p.total_stock || 0;
                      const consumed = p.consumed_stock || 0;
                      const remaining = total - consumed;
                      const isLowStock = remaining <= 5;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-500">{p.code || '—'}</td>
                          <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                          <td className="p-3 font-medium text-slate-700">{formatILS(p.price)}</td>
                          <td className="p-3 font-medium text-slate-600">{total}</td>
                          <td className="p-3 font-bold text-amber-600">{consumed} قطعة</td>
                          <td className="p-3 font-bold">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg ${
                                remaining <= 0
                                  ? 'bg-red-100 text-red-700'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {remaining > 0 ? `${remaining} قطعة` : 'نفذت الكمية ⚠️'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedProduct(p)}
                              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 font-medium px-3 py-1 rounded-lg text-xs transition-all"
                            >
                              + إضافة كمية
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
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Box className="w-5 h-5 text-sky-600" />
                مخزون العدسات اللاصقة (حسب المقاس)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                اختر نوع العدسة للتعرف على كمية مقاسات الـ SPH المتوفرة
              </p>
            </div>

            {onSelectLens && lensProducts.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700">اختر ماركة العدسة:</label>
                <select
                  value={selectedLensId}
                  onChange={(e) => onSelectLens(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            <div className="bg-sky-50/60 rounded-xl p-4 border border-sky-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-xs font-bold text-sky-600 block">النوع المحدد حالياً:</span>
                <h3 className="text-xl font-black text-sky-950">{selectedLens.brand}</h3>
              </div>
              <span className="px-3 py-1 rounded-lg bg-white border border-sky-200 text-xs font-bold text-slate-700">
                السعر: {formatILS(selectedLens.unit_price)}
              </span>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                  <th className="p-3 text-center">قياس (SPH)</th>
                  <th className="p-3 text-center">الكمية المتوفرة بالمخزن</th>
                  <th className="p-3 text-center">حالة المخزون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {Array.from(stockMap.entries()).length > 0 ? (
                  Array.from(stockMap.entries()).map(([key, qty]) => {
                    const sph = key.split(':')[1] || key;
                    const isLow = qty <= 3;
                    return (
                      <tr key={key} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center font-bold text-slate-700">{sph}</td>
                        <td className="p-3 text-center font-bold text-slate-900">{qty} قطعة</td>
                        <td className="p-3 text-center">
                          {qty === 0 ? (
                            <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                              غير متوفر
                            </span>
                          ) : isLow ? (
                            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                              منخفض
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                              متوفر
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      لا توجد بيانات عدسات حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* نافذة إدخال كميات جديدة للمخزون */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">تغذية المخزون</h3>
            <p className="text-sm text-slate-600 mb-4">
              المنتج: <strong className="text-slate-800">{selectedProduct.name}</strong>
            </p>

            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الكمية القادمة/المضافة (بالقطع)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addStockAmount || ''}
                  onChange={(e) => setAddStockAmount(Number(e.target.value))}
                  placeholder="مثال: 50"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-base font-semibold text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>الكمية المتبقية الحالية:</span>
                  <span className="font-bold">
                    {Math.max(0, (selectedProduct.total_stock || 0) - (selectedProduct.consumed_stock || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>الكمية المتبقية بعد التغذية:</span>
                  <span className="font-bold text-emerald-600">
                    {Math.max(0, (selectedProduct.total_stock || 0) - (selectedProduct.consumed_stock || 0)) + addStockAmount}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 text-sm hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ التغيرات ✅'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
