import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Users, Package, RefreshCw, Search, Calendar } from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  client_name?: string;
  total_amount: number;
  discount: number;
  final_amount: number;
  payment_method: string;
  status: string;
}

export const OrdersHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 1. جلب الطلبات مع client_id
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // 2. جلب قائمة العملاء لربط الأسماء يدوياً وتجنب خطأ العلاقات في TypeScript
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name');

      const clientsMap = new Map<string, string>();
      (clientsData || []).forEach((c: { id: string; name: string }) => {
        clientsMap.set(c.id, c.name);
      });

      // 3. تنسيق البيانات بأمان
      const formattedOrders: Order[] = (ordersData || []).map((order: Record<string, any>) => ({
        id: String(order.id || ''),
        created_at: String(order.created_at || new Date().toISOString()),
        client_name: clientsMap.get(order.client_id) || order.client_name || 'عميل نقدي / غير محدد',
        total_amount: Number(order.total_amount || 0),
        discount: Number(order.discount || 0),
        final_amount: Number(order.final_amount || order.total_amount || 0),
        payment_method: String(order.payment_method || 'نقدي'),
        status: String(order.status || 'مكتمل'),
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(
    (order) =>
      order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6 dir-rtl" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            سجل الطلبات والبيانات المتاحة
          </h2>
          <p className="text-sm text-gray-500 mt-1">عرض وتصفح جميع الطلبات والفواتير المسجلة في النظام</p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </button>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ابحث باسم العميل أو رقم الطلب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* جدول عرض البيانات */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري تحميل السجلات من قاعدة البيانات...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
          لا توجد طلبات محجوزة أو مسجلة حالياً
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm font-semibold border-b">
                <th className="p-3">رقم الطلب</th>
                <th className="p-3">اسم العميل</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">طريقة الدفع</th>
                <th className="p-3">الإجمالي (₪)</th>
                <th className="p-3">الخصم (₪)</th>
                <th className="p-3">الصافي (₪)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-mono text-xs text-gray-600">{order.id.slice(0, 8)}...</td>
                  <td className="p-3 font-semibold text-gray-800">{order.client_name}</td>
                  <td className="p-3 text-gray-500">
                    <span className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.created_at).toLocaleString('ar-EG')}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {order.payment_method}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{order.total_amount.toFixed(2)} ₪</td>
                  <td className="p-3 text-red-500">-{order.discount.toFixed(2)} ₪</td>
                  <td className="p-3 font-bold text-green-700">{order.final_amount.toFixed(2)} ₪</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};