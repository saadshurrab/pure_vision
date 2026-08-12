import React, { useState } from 'react';
import { 
  Search, AlertTriangle, ShoppingCart, UserCheck, 
  PackageCheck, CheckCircle2, DollarSign, Plus, Trash2, Printer 
} from 'lucide-react';

export default function OpticsOrderSystem() {
  // بيانات وهمية لمراكز البصريات
  const clients = [
    { id: 1, name: 'مركز السلام للبصريات', debt: 850, limit: 1500, status: 'نشط' },
    { id: 2, name: 'مركز الوفاء للبصريات', debt: 2100, limit: 2000, status: 'محظور - تجاوز السقف' },
    { id: 3, name: 'مركز الرؤية الحديثة', debt: 0, limit: 3000, status: 'نشط' }
  ];

  // بيانات المنتجات والمصفوفة (عدسات لاصقة)
  const lensBrands = [
    { id: 'b1', name: 'Brand Alpha - Monthly Soft', price: 10.00 },
    { id: 'b2', name: 'Brand Beta - Daily Color', price: 15.00 }
  ];

  // القياسات المتاحة مع كمياتها في المخزن
  const initialStock = {
    '-1.00': 45,
    '-1.25': 12,
    '-1.50': 0,  // نفذت الكمية
    '-1.75': 30,
    '-2.00': 80,
    '-2.25': 15,
    '-2.50': 5
  };

  // بيانات المحاليل والإطارات
  const extraProducts = [
    { id: 'e1', name: 'محلول تعقيم متعدد الأغراض 360ml', price: 4.50, category: 'محاليل' },
    { id: 'e2', name: 'إطار طبي خشب بلجيكي (أسود)', price: 25.00, category: 'إطارات' },
    { id: 'e3', name: 'حافظة نظارات جلد فاخر', price: 1.50, category: 'إكسسوارات' }
  ];

  // حالات النموذج (Form States)
  const [selectedClient, setSelectedClient] = useState(clients[0]);
  const [selectedBrand, setSelectedBrand] = useState(lensBrands[0]);
  const [matrixQuantities, setMatrixQuantities] = useState({});
  const [selectedExtra, setSelectedExtra] = useState(extraProducts[0]);
  const [extraQuantity, setExtraQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('دين');
  const [notes, setNotes] = useState('');

  // إدخال كميات مصفوفة القياسات
  const handleMatrixChange = (sph, value) => {
    const qty = parseInt(value) || 0;
    setMatrixQuantities(prev => ({
      ...prev,
      [sph]: qty
    }));
  };

  // إضافة القياسات المحددة من الشبكة إلى السلة
  const addMatrixToCart = () => {
    const newItems = [];
    Object.entries(matrixQuantities).forEach(([sph, qty]) => {
      if (qty > 0) {
        newItems.push({
          id: `${selectedBrand.id}_SPH_${sph}`,
          name: `${selectedBrand.name} (SPH: ${sph})`,
          price: selectedBrand.price,
          quantity: qty,
          total: selectedBrand.price * qty
        });
      }
    });

    if (newItems.length > 0) {
      setCart(prev => [...prev, ...newItems]);
      setMatrixQuantities({}); // إعادة ضبط المدخلات
    }
  };

  // إضافة صنف إضافي (محلول/إطار) للسلة
  const addExtraToCart = () => {
    if (extraQuantity <= 0) return;
    const newItem = {
      id: `${selectedExtra.id}_${Date.now()}`,
      name: selectedExtra.name,
      price: selectedExtra.price,
      quantity: extraQuantity,
      total: selectedExtra.price * extraQuantity
    };
    setCart(prev => [...prev, newItem]);
    setExtraQuantity(1);
  };

  // حذف صنف من السلة
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // الحسابات المادية
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const isOverLimit = (selectedClient.debt + grandTotal) > selectedClient.limit;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans dir-rtl" dir="rtl">
      
      {/* 1. الشريط العلوي (Header) */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <PackageCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-wide">نظام إمداد البصريات | Optics Order Flow</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="relative">
            <input 
              type="text" 
              placeholder="بحث سريع: عميل، فاتورة، صنف..." 
              className="bg-slate-800 text-slate-200 px-4 py-2 pr-9 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            👤 الموظف الداخلي: <span className="font-semibold text-blue-400">سعد</span>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="p-6 max-w-7xl mx-auto grid grid-cols-12 gap-6">

        {/* 2. اللوحة اليمنى والوسطى: تسجيل الطلبية ومصفوفة القياسات (8 أعمدة) */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* اختيار العميل وحالة الدين */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-md font-bold mb-3 flex items-center gap-2 text-slate-700">
              <UserCheck className="w-5 h-5 text-blue-600" />
              بيانات مركز البصريات
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">اختر المركز:</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  value={selectedClient.id}
                  onChange={(e) => setSelectedClient(clients.find(c => c.id === parseInt(e.target.value)))}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">طريقة الدفع:</label>
                <div className="flex gap-4 pt-2">
                  {['نقدي', 'دين', 'شيك'].map(method => (
                    <label key={method} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === method} 
                        onChange={() => setPaymentMethod(method)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* بطاقة ملخص المديونية للعميل */}
            <div className={`mt-4 p-3 rounded-lg border text-xs flex justify-between items-center ${
              isOverLimit ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                إجمالي الدين الحالي: <span className="font-bold">${selectedClient.debt}</span> | 
                سقف الدين المسموح: <span className="font-bold">${selectedClient.limit}</span>
              </div>
              {isOverLimit && (
                <div className="flex items-center gap-1 text-red-600 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  تحذير: الطلب يتجاوز سقف الدين المحدد!
                </div>
              )}
            </div>
          </div>

          {/* مصفوفة مقاسات العدسات (Power Grid / Matrix) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-bold flex items-center gap-2 text-slate-700">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                شبكة إضافة العدسات (SPH Matrix)
              </h2>
              <select 
                className="border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white"
                value={selectedBrand.id}
                onChange={(e) => setSelectedBrand(lensBrands.find(b => b.id === e.target.value))}
              >
                {lensBrands.map(b => (
                  <option key={b.id} value={b.id}>{b.name} - (${b.price})</option>
                ))}
              </select>
            </div>

            {/* شبكة الإدخال */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-xs text-slate-600">
                    <th className="p-2 border border-slate-200">الدرجة (SPH)</th>
                    {Object.keys(initialStock).map(sph => (
                      <th key={sph} className="p-2 border border-slate-200 dir-ltr">{sph}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-slate-200 text-xs font-bold bg-slate-50">المتوفر</td>
                    {Object.entries(initialStock).map(([sph, count]) => (
                      <td key={sph} className={`p-2 border border-slate-200 text-xs font-semibold ${
                        count === 0 ? 'text-red-500 bg-red-50' : 'text-slate-600'
                      }`}>
                        {count === 0 ? 'نفذت' : count}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-200 text-xs font-bold bg-slate-50">الطلب</td>
                    {Object.entries(initialStock).map(([sph, count]) => (
                      <td key={sph} className="p-1 border border-slate-200">
                        <input 
                          type="number" 
                          min="0"
                          max={count}
                          disabled={count === 0}
                          value={matrixQuantities[sph] || ''}
                          onChange={(e) => handleMatrixChange(sph, e.target.value)}
                          className={`w-12 text-center p-1 border rounded text-xs focus:ring-2 focus:ring-blue-500 ${
                            count === 0 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300'
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <button 
              onClick={addMatrixToCart}
              className="mt-4 w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة المقاسات المحددة للسلة
            </button>
          </div>

          {/* إضافة المحاليل والإكسسوارات */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-md font-bold mb-3 text-slate-700">إضافة المحاليل والإطارات</h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">اختر الصنف:</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  value={selectedExtra.id}
                  onChange={(e) => setSelectedExtra(extraProducts.find(p => p.id === e.target.value))}
                >
                  {extraProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - (${p.price})</option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <label className="block text-xs font-semibold text-slate-500 mb-1">الكمية:</label>
                <input 
                  type="number" 
                  min="1"
                  value={extraQuantity}
                  onChange={(e) => setExtraQuantity(parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs text-center"
                />
              </div>

              <button 
                onClick={addExtraToCart}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>
          </div>

        </section>

        {/* 3. اللوحة اليسرى: ملخص الفاتورة وإتمام الطلب (4 أعمدة) */}
        <section className="col-span-12 lg:col-span-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <h2 className="text-md font-bold mb-4 pb-2 border-b border-slate-100 text-slate-700 flex justify-between items-center">
              <span>ملخص الفاتورة</span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold">{cart.length} أصناف</span>
            </h2>

            {/* قائمة العناصر الإضافية بالمستودع */}
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
              {cart.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">لم يتم إضافة أي أصناف للسلة بعد.</p>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div className="flex-1">
                      <div className="font-bold text-slate-700">{item.name}</div>
                      <div className="text-slate-400 font-mono mt-0.5">
                        {item.quantity} x ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">${item.total.toFixed(2)}</span>
                      <button 
                        onClick={() => removeFromCart(index)}
                        className="text-red-400 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* الحسابات المالية */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500">
                <span>الخصم ($):</span>
                <input 
                  type="number" 
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 border border-slate-300 rounded p-1 text-xs text-left dir-ltr font-mono"
                />
              </div>

              <div className="flex justify-between text-slate-900 font-bold text-base border-t border-slate-200 pt-2">
                <span>الصافي النهائي:</span>
                <span className="font-mono text-blue-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* ملاحظات الفاتورة */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 mb-1">ملاحظات التوصيل / الطلب:</label>
              <textarea 
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: توصيل مع مندوب الفترة المسائية..."
                className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            {/* أزرار الحفظ والإصدار */}
            <div className="mt-5 space-y-2">
              <button 
                disabled={cart.length === 0}
                onClick={() => alert('تم تأكيد الطلبية وطباعة الفاتورة بنجاح!')}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                حفظ وتأكيد الطلب وطباعة
              </button>

              <button 
                disabled={cart.length === 0}
                onClick={() => alert('تم حفظ الفاتورة كمسودة.')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs transition-colors"
              >
                حفظ كمسودة
              </button>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}