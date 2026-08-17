import { ShoppingBag, CheckCircle, Clock, TrendingUp, Users, CircleDollarSign, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Order {
  id: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  total_amount?: number;
  created_at?: string;
  client_name?: string;
}

interface StatsProps {
  orders: Order[];
  clientsCount?: number;
  inventoryValue?: number;
  lowStockCount?: number;
}

export function StatsOverview({ orders, clientsCount = 0, inventoryValue = 0, lowStockCount = 0 }: StatsProps) {
  const totalOrders = orders.length;
  const confirmed = orders.filter((o) => o.status === 'confirmed').length;
  const pending = orders.filter((o) => o.status === 'pending').length;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;

  const totalRevenue = orders
    .filter((o) => o.status === 'confirmed')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const avgOrderValue = confirmed > 0 ? totalRevenue / confirmed : 0;
  const confirmationRate = totalOrders > 0 ? Math.round((confirmed / totalOrders) * 100) : 0;

  // حساب الطلبات لهذا الشهر
  const now = new Date();
  const thisMonthOrders = orders.filter((o) => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthOrders
    .filter((o) => o.status === 'confirmed')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const stats = [
    {
      label: 'إجمالي الإيرادات',
      value: formatCurrency(totalRevenue),
      sub: `${confirmed} طلبية مؤكدة`,
      icon: CircleDollarSign,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: thisMonthRevenue > 0 ? `+${formatCurrency(thisMonthRevenue)} هذا الشهر` : undefined,
      trendUp: true,
    },
    {
      label: 'متوسط قيمة الطلبية',
      value: formatCurrency(avgOrderValue),
      sub: 'للطلبيات المؤكدة',
      icon: TrendingUp,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      trend: avgOrderValue > 0 ? `${Math.round(avgOrderValue)} ₪ متوسط` : undefined,
      trendUp: true,
    },
    {
      label: 'إجمالي الطلبات',
      value: totalOrders.toString(),
      sub: `${pending} قيد الانتظار`,
      icon: ShoppingBag,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      trend: confirmationRate > 0 ? `${confirmationRate}% مؤكدة` : undefined,
      trendUp: confirmationRate >= 70,
    },
    {
      label: 'العملاء المسجلين',
      value: clientsCount.toString(),
      sub: 'عميل نشط',
      icon: Users,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      trend: clientsCount > 0 ? `${clientsCount} عميل` : undefined,
      trendUp: true,
    },
  ];

  // صف ثاني — تنبيهات سريعة
  const alerts = [
    {
      label: 'طلبات قيد الانتظار',
      value: pending,
      icon: Clock,
      color: pending > 0 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-slate-400 bg-slate-50 border-slate-200',
      urgent: pending > 5,
    },
    {
      label: 'مخزون منخفض',
      value: lowStockCount,
      icon: Package,
      color: lowStockCount > 0 ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-400 bg-slate-50 border-slate-200',
      urgent: lowStockCount > 0,
    },
    {
      label: 'قيمة المخزون',
      value: formatCurrency(inventoryValue),
      icon: CircleDollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      urgent: false,
    },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* الصف الرئيسي — 4 كروت */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-xl font-black text-slate-900 font-mono mt-1">{stat.value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">{stat.sub}</span>
                {stat.trend && (
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${stat.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.trend}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* صف التنبيهات — 3 كروت صغيرة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {alerts.map((alert, i) => {
          const Icon = alert.icon;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${alert.color} ${alert.urgent ? 'shadow-sm' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] font-bold opacity-80">{alert.label}</div>
                <div className="text-sm font-black font-mono">{alert.value}</div>
              </div>
              {alert.urgent && (
                <span className="w-2 h-2 rounded-full bg-current animate-pulse flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* شريط التقدم — نسبة التأكيد */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-500">معدل تأكيد الطلبيات</span>
          <span className="text-xs font-black text-slate-900 font-mono">{confirmationRate}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out bg-slate-800"
            style={{ width: `${confirmationRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-medium">
          <span>{confirmed} مؤكدة</span>
          <span>{pending} قيد الانتظار</span>
          <span>{cancelled} ملغية</span>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  if (amount === 0) return '₪ 0.00';
  return `₪ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
