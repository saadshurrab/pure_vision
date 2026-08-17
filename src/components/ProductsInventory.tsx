import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Eye,
  Package,
  Search,
  Box,
  PlusCircle,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Layers,
  Filter,
  RefreshCw,
  PackageOpen,
  CircleDollarSign,
  ChevronLeft,
} from 'lucide-react';
import { supabase, formatILS, type Product } from '@/lib/supabase';

// واجهات البيانات للعدسات ومخزونها (تم إضافة دعم التورic)
export interface LensProduct {
  id: string;
  brand: string;
  unit_price: number;
  bc?: string;
  dia?: string;
  is_toric?: boolean;
}

export interface LensStockItem {
  id: string;
  lens_product_id: string;
  sph: number;
  cyl?: number | null;
  axis?: number | null;
  stock_qty: number;
}

interface Props {
  onRefreshData?: () => void;
}

export function ProductsInventory({ onRefreshData }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'lenses'>('general');
  
  // ================= GENERAL PRODUCTS STATE =================
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addStockAmount, setAddStockAmount] = useState<number>(0);

  // ================= LENSES STATE (SUPABASE INTEGRATION) =================
  const [lensProducts, setLensProducts] = useState<LensProduct[]>([]);
  const [lensStocks, setLensStocks] = useState<LensStockItem[]>([]);
  const [loadingLenses, setLoadingLenses] = useState(true);
  
  // Lenses Search & Filters
  const [selectedLensId, setSelectedLensId] = useState<string>('');
  const [lensSearchTerm, setLensSearchTerm] = useState('');
  const [lensStatusFilter, setLensStatusFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  
  // Lens Feed Modal State
  const [selectedLensSphItem, setSelectedLensSphItem] = useState<{
    id?: string;
    lens_product_id: string;
    sph: number;
    cyl?: number | null;
    axis?: number | null;
    currentQty: number;
  } | null>(null);
  const [addLensStockAmount, setAddLensStockAmount] = useState<number>(0);

  const [saving, setSaving] = useState(false);

  // 1. Fetch General Products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
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
      setLoadingProducts(false);
    }
  }, []);

  // 2. Fetch Lens Products & Lens Stocks from Database
  const fetchLensesData = useCallback(async () => {
    setLoadingLenses(true);
    try {
      const { data: lensesData, error: lensesErr } = await supabase
        .from('lens_products')
        .select('*')
        .order('brand', { ascending: true });

      if (lensesErr) throw lensesErr;
      
      const fetchedLenses = (lensesData as LensProduct[]) || [];
      setLensProducts(fetchedLenses);

      if (fetchedLenses.length > 0 && !selectedLensId) {
        setSelectedLensId(fetchedLenses[0].id);
      }

      // جلب مخزون الدرجات لجميع العدسات بما فيها العادية والتوريك
      const { data: stocksData, error: stocksErr } = await supabase
        .from('lens_stock')
        .select('*');

      if (stocksErr) throw stocksErr;
      
      setLensStocks((stocksData as LensStockItem[]) || []);
    } catch (err) {
      console.error('Error fetching lenses/stocks from database:', err);
    } finally {
      setLoadingLenses(false);
    }
  }, [selectedLensId]);

  useEffect(() => {
    fetchProducts();
    fetchLensesData();
  }, [fetchProducts, fetchLensesData]);

  // Handle General Stock Addition
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

  // Handle Lens Stock Addition (UPSERT to Supabase with Toric Support)
  async function handleAddLensStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLensSphItem || addLensStockAmount <= 0) return;

    setSaving(true);
    try {
      const newQty = selectedLensSphItem.currentQty + addLensStockAmount;

      if (selectedLensSphItem.id) {
        const { error } = await supabase
          .from('lens_stock')
          .update({ stock_qty: newQty })
          .eq('id', selectedLensSphItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lens_stock')
          .insert({
            lens_product_id: selectedLensSphItem.lens_product_id,
            sph: selectedLensSphItem.sph,
            cyl: selectedLensSphItem.cyl ?? null,
            axis: selectedLensSphItem.axis ?? null,
            stock_qty: newQty,
          });

        if (error) throw error;
      }

      setSelectedLensSphItem(null);
      setAddLensStockAmount(0);
      await fetchLensesData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث مخزون العدسة');
    } finally {
      setSaving(false);
    }
  }

  // General Products Categories & Filtering
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category || 'عام'));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter((p) => (p.category || 'عام') === categoryFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => {
        const remaining = Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0));
        if (statusFilter === 'out') return remaining <= 0;
        if (statusFilter === 'low') return remaining > 0 && remaining <= 5;
        if (statusFilter === 'ok') return remaining > 5;
        return true;
      });
    }
    return result;
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Stats Calculations
  const stats = useMemo(() => {
    const totalItemsRemaining = products.reduce((sum, p) => sum + Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0)), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0)) * (p.unit_price || 0), 0);
    const lowStockCount = products.filter((p) => {
      const r = Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0));
      return r > 0 && r <= 5;
    }).length;
    const outOfStockCount = products.filter((p) => Math.max(0, (p.stock_qty || 0) - (p.consumed_stock || 0)) <= 0).length;
    return { totalItemsRemaining, totalInventoryValue, lowStockCount, outOfStockCount };
  }, [products]);

  // Currently Selected Lens Info
  const selectedLens = useMemo(() => {
    return lensProducts.find((l) => l.id === selectedLensId);
  }, [lensProducts, selectedLensId]);

  // Filtered Lens Stocks based on Search & Status Filters
  const currentLensStockList = useMemo(() => {
    if (!selectedLensId) return [];
    
    let list = lensStocks.filter((s) => s.lens_product_id === selectedLensId);

    if (lensSearchTerm.trim()) {
      const term = lensSearchTerm.trim().toLowerCase();
      list = list.filter((item) => {
        const sphMatch = item.sph.toString().includes(term);
        const cylMatch = item.cyl ? item.cyl.toString().includes(term) : false;
        const axisMatch = item.axis ? item.axis.toString().includes(term) : false;
        return sphMatch || cylMatch || axisMatch;
      });
    }

    if (lensStatusFilter !== 'all') {
      list = list.filter((item) => {
        if (lensStatusFilter === 'out') return item.stock_qty <= 0;
        if (lensStatusFilter === 'low') return item.stock_qty > 0 && item.stock_qty <= 3;
        if (lensStatusFilter === 'ok') return item.stock_qty > 3;
        return true;
      });
    }

    return list.sort((a, b) => a.sph - b.sph);
  }, [lensStocks, selectedLensId, lensSearchTerm, lensStatusFilter]);

  const lensStats = useMemo(() => {
    const activeStocks = lensStocks.filter((s) => s.lens_product_id === selectedLensId);
    const totalBoxes = activeStocks.reduce((sum, item) => sum + item.stock_qty, 0);
    const outOfStock = activeStocks.filter((item) => item.stock_qty === 0).length;
    const lowStock = activeStocks.filter((item) => item.stock_qty > 0 && item.stock_qty <= 3).length;
    return { totalBoxes, outOfStock, lowStock, totalEntries: activeStocks.length };
  }, [lensStocks, selectedLensId]);

  function getStockStatus(remaining: number) {
    if (remaining <= 0) return { label: 'نفذت', variant: 'out' as const };
    if (remaining <= 5) return { label: 'منخفض', variant: 'low' as const };
    return { label: 'متوفر', variant: 'ok' as const };
  }

  function StatusBadge({ variant, children }: { variant: 'out' | 'low' | 'ok'; children: React.ReactNode }) {
    const styles = {
      out: 'bg-rose-50 text-rose-700 border-rose-200',
      low: 'bg-amber-50 text-amber-700 border-amber-200',
      ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    const dotStyles = {
      out: 'bg-rose-500',
      low: 'bg-amber-500',
      ok: 'bg-emerald-500',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${styles[variant]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />
        {children}
      </span>
    );
  }

  return (
    <div className="space-y-5 text-slate-800" dir="rtl">
      {/* ====== Header ====== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">إدارة المخزون</h1>
          <p className="text-xs text-slate-500 mt-1">عرض توفر الأصناف والعدسات والملحقات الطبية المربوطة بقاعدة البيانات</p>
        </div>
        <button
          onClick={() => { fetchProducts(); fetchLensesData(); onRefreshData?.(); }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          تحديث البيانات
        </button>
      </div>

      {/* ====== Tabs ====== */}
      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'general'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <PackageOpen className="w-4 h-4" />
          المنتجات والملحقات
        </button>
        <button
          onClick={() => setActiveTab('lenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'lenses'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Eye className="w-4 h-4" />
          مخزون العدسات
        </button>
      </div>

      {/* ======================= GENERAL TAB ======================= */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">الأصناف الكلية</span>
                <div className="p-1.5 bg-slate-100 rounded-lg">
                  <Layers className="w-4 h-4 text-slate-600" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{products.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">صنف مسجل</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">القطع المتبقية</span>
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-600 font-mono">{stats.totalItemsRemaining}</div>
              <div className="text-[11px] text-slate-400 mt-1">قطعة في المستودع</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">القيمة الإجمالية</span>
                <div className="p-1.5 bg-emerald-50 rounded-lg">
                  <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">{formatILS(stats.totalInventoryValue)}</div>
              <div className="text-[11px] text-slate-400 mt-1">قيمة المخزون الحالي</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">تنبيهات المخزون</span>
                <div className="p-1.5 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600 font-mono">{stats.lowStockCount + stats.outOfStockCount}</span>
                <span className="text-[11px] text-slate-400">صنف</span>
              </div>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث باسم المنتج، SKU أو التصنيف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded-lg pr-9 pl-4 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">تصفية:</span>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700"
              >
                <option value="all">جميع التصنيفات</option>
                {categories.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loadingProducts ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                <span className="text-sm font-semibold text-slate-500">جاري تحميل بيانات المنتجات من قاعدة البيانات...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
                <PackageOpen className="w-12 h-12 text-slate-200" />
                <div className="text-sm font-bold text-slate-500">لا توجد أصناف مطابقة</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 pr-6 text-[11px] font-bold text-slate-500 uppercase">المنتج</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">SKU</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">السعر</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">المتبقي</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">الحالة</th>
                      <th className="p-4 pl-6 text-[11px] font-bold text-slate-500 uppercase text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => {
                      const totalStock = p.stock_qty || 0;
                      const consumed = p.consumed_stock || 0;
                      const remaining = Math.max(0, totalStock - consumed);
                      const status = getStockStatus(remaining);

                      return (
                        <tr key={p.id} className="group hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 pr-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                <Box className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-800">{p.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center font-mono text-xs">{p.sku || '—'}</td>
                          <td className="p-4 text-center font-mono text-sm font-bold">{formatILS(p.unit_price)}</td>
                          <td className="p-4 text-center font-mono text-sm font-bold">{remaining}</td>
                          <td className="p-4 text-center">
                            <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
                          </td>
                          <td className="p-4 pl-6 text-center">
                            <button
                              onClick={() => { setSelectedProduct(p); setAddStockAmount(0); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              تغذية
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

      {/* ======================= LENSES TAB ======================= */}
      {activeTab === 'lenses' && (
        <div className="space-y-5">
          {/* Lens Selector & Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">مخزون العدسات اللاصقة (Database)</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">متابعة وتحديث توفر القطع مباشرة مع جدول `lens_stock`</p>
                </div>
              </div>

              {/* اختيار العلامة التجارية */}
              {lensProducts.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-[11px] font-bold text-slate-500">العلامة التجارية:</label>
                  <div className="relative">
                    <select
                      value={selectedLensId}
                      onChange={(e) => setSelectedLensId(e.target.value)}
                      className="pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-[200px]"
                    >
                      {lensProducts.map((l) => (
                        <option key={l.id} value={l.id}>{l.brand}</option>
                      ))}
                    </select>
                    <ChevronLeft className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* تفاصيل العدسة الحالية */}
            {selectedLens && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">النوع:</span>
                  <span className="text-sm font-black text-slate-900">{selectedLens.brand}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">السعر:</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">{formatILS(selectedLens.unit_price)}</span>
                </div>
                {selectedLens.bc && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">BC:</span>
                    <span className="text-sm font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded">{selectedLens.bc}</span>
                  </div>
                )}
                {selectedLens.dia && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">DIA:</span>
                    <span className="text-sm font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded">{selectedLens.dia}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* نظام البحث والتصفية الخاص بالعدسات */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث بالقياس SPH / CYL / AXIS..."
                value={lensSearchTerm}
                onChange={(e) => setLensSearchTerm(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50/50 rounded-lg pr-9 pl-4 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">حالة التوفر:</span>
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                {(['all', 'ok', 'low', 'out'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setLensStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      lensStatusFilter === s
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {s === 'all' ? 'الكل' : s === 'ok' ? 'متوفر' : s === 'low' ? 'منخفض' : 'نفذ'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lens Stats */}
          {lensStats.totalEntries > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <div className="text-[11px] font-bold text-slate-400 mb-1">إجمالي العلب للعلامة</div>
                <div className="text-xl font-black text-slate-900 font-mono">{lensStats.totalBoxes}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <div className="text-[11px] font-bold text-slate-400 mb-1">منخفض المخزون</div>
                <div className="text-xl font-black text-amber-600 font-mono">{lensStats.lowStock}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                <div className="text-[11px] font-bold text-slate-400 mb-1">نفذت الكمية</div>
                <div className="text-xl font-black text-rose-600 font-mono">{lensStats.outOfStock}</div>
              </div>
            </div>
          )}

          {/* SPH & Toric Table from Supabase */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loadingLenses ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                <span className="text-sm font-semibold text-slate-500">جاري تحميل بيانات العدسات والمخزون...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 pr-6 text-[11px] font-bold text-slate-500 uppercase text-center">قياس القوة (SPH)</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">الانحراف (CYL)</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">المحور (AXIS)</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">الرصيد المتاح (العلب)</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">الحالة</th>
                      <th className="p-4 pl-6 text-[11px] font-bold text-slate-500 uppercase text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentLensStockList.length > 0 ? (
                      currentLensStockList.map((item) => {
                        const status = getStockStatus(item.stock_qty);

                        return (
                          <tr key={item.id} className="group hover:bg-slate-50/60 transition-colors">
                            <td className="p-4 pr-6 text-center">
                              <span className="inline-flex items-center justify-center w-20 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-sm font-bold text-slate-800" dir="ltr">
                                {item.sph > 0 ? `+${item.sph.toFixed(2)}` : item.sph.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-mono text-xs font-semibold text-slate-600" dir="ltr">
                                {item.cyl != null ? item.cyl.toFixed(2) : '—'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-mono text-xs font-semibold text-slate-600" dir="ltr">
                                {item.axis != null ? `${item.axis}°` : '—'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-mono text-sm font-bold text-slate-800">{item.stock_qty} علبة</span>
                            </td>
                            <td className="p-4 text-center">
                              <StatusBadge variant={status.variant}>
                                {status.label}
                              </StatusBadge>
                            </td>
                            <td className="p-4 pl-6 text-center">
                              <button
                                onClick={() => {
                                  setSelectedLensSphItem({
                                    id: item.id,
                                    lens_product_id: item.lens_product_id,
                                    sph: item.sph,
                                    cyl: item.cyl,
                                    axis: item.axis,
                                    currentQty: item.stock_qty,
                                  });
                                  setAddLensStockAmount(0);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 transition"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                تغذية المخزون
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <PackageOpen className="w-12 h-12 text-slate-200" />
                            <div className="text-sm font-bold text-slate-500">لا توجد سجلات مخزون مطابقة للبحث</div>
                            <div className="text-xs text-slate-400">تأكد من وجود قياسات مُدخلة لهذه العلامة في Supabase</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= MODALS ======================= */}

      {/* General Product Feeding Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
                <Box className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">تغذية مخزون المنتج</h3>
                <p className="text-xs text-slate-500">تحديث الكمية المتاحة في المستودع</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">اسم المنتج</span>
                <span className="text-xs font-bold text-slate-900">{selectedProduct.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">الرمز (SKU)</span>
                <span className="text-xs font-mono text-slate-700">{selectedProduct.sku || '—'}</span>
              </div>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                  <div className="text-[10px] text-slate-500 mb-1">المتاح حالياً</div>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {Math.max(0, (selectedProduct.stock_qty || 0) - (selectedProduct.consumed_stock || 0))} قطعة
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3">
                  <div className="text-[10px] text-emerald-600 mb-1">المجموع بعد التحديث</div>
                  <div className="text-lg font-black text-emerald-700 font-mono">
                    {Math.max(0, (selectedProduct.stock_qty || 0) - (selectedProduct.consumed_stock || 0)) + addStockAmount} قطعة
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">الكمية المضافة</label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={addStockAmount || ''}
                  onChange={(e) => setAddStockAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving || addStockAmount <= 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? 'جاري الحفظ...' : 'حفظ التحديث'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lens Stock Feeding Modal */}
      {selectedLensSphItem && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLensSphItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLensSphItem(null)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
                <Eye className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">تغذية مخزون العدسات</h3>
                <p className="text-xs text-slate-500">تحديث قاعدة البيانات لدرجة محددة</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">العلامة التجارية</span>
                <span className="text-xs font-bold text-slate-900">{selectedLens?.brand}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">درجة القوة (SPH)</span>
                <span className="text-xs font-black text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded" dir="ltr">
                  {selectedLensSphItem.sph > 0 ? `+${selectedLensSphItem.sph.toFixed(2)}` : selectedLensSphItem.sph.toFixed(2)}
                </span>
              </div>
              {selectedLensSphItem.cyl != null && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">الانحراف (CYL) / المحور (AXIS)</span>
                  <span className="text-xs font-bold text-slate-700 font-mono" dir="ltr">
                    CYL: {selectedLensSphItem.cyl.toFixed(2)} | AXIS: {selectedLensSphItem.axis}°
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleAddLensStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                  <div className="text-[10px] text-slate-500 mb-1">المتاح حالياً</div>
                  <div className="text-lg font-black text-slate-900 font-mono">{selectedLensSphItem.currentQty} علبة</div>
                </div>
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3">
                  <div className="text-[10px] text-emerald-600 mb-1">المجموع بعد التحديث</div>
                  <div className="text-lg font-black text-emerald-700 font-mono">{selectedLensSphItem.currentQty + addLensStockAmount} علبة</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">الكمية المضافة (علب)</label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={addLensStockAmount || ''}
                  onChange={(e) => setAddLensStockAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLensSphItem(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving || addLensStockAmount <= 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? 'جاري الحفظ...' : 'حفظ في قاعدة البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
