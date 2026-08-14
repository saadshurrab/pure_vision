import { ShoppingBag, CheckCircle, Clock } from 'lucide-react';

interface StatsProps {
  orders: any[];
}

export function StatsOverview({ orders }: StatsProps) {
  const totalOrders = orders.length;
  const confirmed = orders.filter((o) => o.status === 'confirmed').length;
  const pending = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">إجمالي الطلبات</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalOrders}</h3>
        </div>
        <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
          <ShoppingBag className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">طلبات مؤكدة</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{confirmed}</h3>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">قيد الانتظار</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{pending}</h3>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Clock className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
