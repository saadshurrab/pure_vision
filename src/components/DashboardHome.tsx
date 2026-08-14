import React from 'react';
import { 
  TrendingUp, 
  PackageAlert, 
  ShoppingCart, 
  Users, 
  ArrowUpRight, 
  Clock, 
  PlusCircle, 
  FileText, 
  Truck, 
  Calendar,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export function Dashboard() {
  // تاريخ اليوم بتنسيق عربي
  const todayDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* 1. الهيدر: ترحيب + تاريخ اليوم وآخر تحديث */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">اللوحة الرئيسية</h1>
          <p className="text-xs text-slate-500 mt-0.5">نظرة عامة على نشاط النظام والمبيعات والمخزون</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4 text-sky-600" />
            {todayDate}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <RefreshCw className="w-3 h-3 text-slate-400" />
            آخر تحديث: 10:30 ص
          </span>
        </div>
      </div>

      {/* 2. بطاقات الإحصائيات الأكبر حجماً ووضوحاً */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* المبيعات */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">إجمالي مبيعات اليوم</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              ₪ 4,949.00
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3" />
              +12% عن الأمس
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

        {/* الطلبات */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">طلبات اليوم</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              18 <span className="text-xs font-normal text-slate-400">طلب</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">4 طلبات قيد التجهيز</span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-7 h-7" />
          </div>
        </div>

        {/* تنبيهات المخزون (باللون البرتقالي بدلاً من الأحمر المقلق) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">تنبيهات المخزون</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
              88 <span className="text-sm font-bold text-amber-700">صنف</span>
            </div>
            <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
              يحتاج إعادة طلب
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <PackageAlert className="w-7 h-7" />
          </div>
        </div>

        {/* العملاء */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">إجمالي العملاء النشطين</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
              142
            </div>
            <span className="text-[11px] text-slate-400 font-medium">موزعين على 5 مناطق</span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
        </div>

      </div>

      {/* 3. شبكة المحتوى الرئيسي: الجدول + المنتجات المطلوبة */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* جدول الطلبات الحديثة (8 من 12) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          
          {/* رأس الجدول */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-sky-600" />
              <h2 className="font-bold text-slate-800 text-sm sm:text-base">أحدث الطلبات</h2>
            </div>
            {/* زر عرض الكل الزاهي والمشرق */}
            <button type="button" className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 text-xs font-bold transition flex items-center gap-1">
              <span>عرض الكل</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* الجدول مع دعم الشاشات الصغيرة */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5 pr-5">رقم الطلب</th>
                  <th className="p-3.5">العميل</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5 pl-5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {[
                  { id: '#ORD-9021', client: 'بصريات القدس', date: 'اليوم، 10:15 ص', total: '₪ 1,250.00', status: 'مكتمل', type: 'success' },
                  { id: '#ORD-9020', client: 'صيدلية النور', date: 'اليوم، 09:40 ص', total: '₪ 840.00', status: 'قيد التجهيز', type: 'pending' },
                  { id: '#ORD-9019', client: 'أحمد مسعود', date: 'أمس، 04:20 م', total: '₪ 2,100.00', status: 'مكتمل', type: 'success' },
                  { id: '#ORD-9018', client: 'بصريات الواحة', date: 'أمس، 02:15 م', total: '₪ 450.00', status: 'ملغى', type: 'danger' },
                  { id: '#ORD-9017', client: 'مركز البصرة', date: 'أمس، 11:30 ص', total: '₪ 3,100.00', status: 'مكتمل', type: 'success' },
                  { id: '#ORD-9016', client: 'نظارات الريم', date: '12 أغسطس', total: '₪ 620.00', status: 'مكتمل', type: 'success' },
                  { id: '#ORD-9015', client: 'بصريات غزة', date: '11 أغسطس', total: '₪ 1,890.00', status: 'مكتمل', type: 'success' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 pr-5 font-mono font-bold text-sky-600">{row.id}</td>
                    <td className="p-3.5 font-bold text-slate-800">{row.client}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-xs">{row.date}</td>
                    <td className="p-3.5 font-mono font-extrabold text-slate-800">{row.total}</td>
                    <td className="p-3.5 pl-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                        row.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : row.type === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* قسم الأصناف التي قاربت على الانتهاء (4 من 12) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PackageAlert className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-slate-800 text-sm">أصناف قاربت الانتهاء</h2>
            </div>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              تنبيه هام
            </span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'عدسات نيكون 1.56 Anti-Reflective', code: 'LENS-NK-01', stock: 3 },
              { name: 'إطار نظارة طبي Titanium Flex', code: 'FRM-TIT-99', stock: 1 },
              { name: 'محلول تنظيف عدسات 120ml', code: 'CLN-SOL-12', stock: 5 },
              { name: 'عدسات لاصقة ملونة - عسلي', code: 'LNS-CLR-HZ', stock: 2 },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">الكود: {item.code}</span>
                  </div>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md shrink-0">
                    متبقي {item.stock}
                  </span>
                </div>

                {/* زر طلب توريد المباشر لكل صنف */}
                <button type="button" className="w-full py-1.5 px-3 bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-slate-700 hover:text-amber-800 font-bold text-[11px] rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>طلب توريد جديد</span>
                </button>
              </div>
            ))}
          </div>

          {/* زر عرض المخزون الكامل */}
          <button type="button" className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl transition text-center flex items-center justify-center gap-1.5">
            <span>عرض المخزون الكامل</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 4. قسم "وصول سريع" لإلغاء المساحات الفارغة بالأسفل */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-sky-600" />
          إجراءات ووصول سريع
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button type="button" className="p-3.5 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 border border-slate-100 rounded-xl transition text-right group">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-800">إنشاء طلب جديد</div>
            <div className="text-[10px] text-slate-400 mt-0.5">إضافة فاتورة عميل</div>
          </button>

          <button type="button" className="p-3.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-100 rounded-xl transition text-right group">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-800">إضافة عميل جديد</div>
            <div className="text-[10px] text-slate-400 mt-0.5">تسجيل صيدلية أو مركز</div>
          </button>

          <button type="button" className="p-3.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-100 rounded-xl transition text-right group">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <Truck className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-800">إدخال بضائع للمخزن</div>
            <div className="text-[10px] text-slate-400 mt-0.5">تحديث الكميات الواردة</div>
          </button>

          <button type="button" className="p-3.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 rounded-xl transition text-right group">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs text-slate-800">تقارير المبيعات</div>
            <div className="text-[10px] text-slate-400 mt-0.5">طباعة ملخص الحسابات</div>
          </button>
        </div>
      </div>

    </div>
  );
}
