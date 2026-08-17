import { useState, useMemo } from 'react';
import { supabase, type Client, formatILS } from '@/lib/supabase';
import { 
  Search, 
  UserPlus, 
  CheckCircle2, 
  X, 
  CreditCard, 
  Wallet, 
  TrendingDown, 
  Building2, 
  Phone, 
  MapPin, 
  Hash, 
  Sparkles 
} from 'lucide-react';

interface Props {
  clients: Client[];
  onClientAdded: () => void;
}

export function ClientsList({ clients, onClientAdded }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<Client | null>(null);

  // حالة البحث المباشر
  const [searchQuery, setSearchQuery] = useState('');

  // حالات إضافة عميل
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  // حالات التسديد
  const [payAmount, setPayAmount] = useState<number>(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // فلترة العملاء بناءً على حقل البحث
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase().trim();
    return clients.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCode = c.code?.toLowerCase().includes(q);
      const matchPhone = c.phone?.includes(q);
      const matchCity = c.city?.toLowerCase().includes(q);
      return matchName || matchCode || matchPhone || matchCity;
    });
  }, [clients, searchQuery]);

  // إحصائيات عامة
  const totalDebtSum = clients.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
  const totalPaidSum = clients.reduce((sum, c) => sum + (c.total_paid || 0), 0);

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code) {
      setError('يرجى كتابة اسم العميل والكود');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: err } = await supabase.from('clients').insert({
        name,
        code,
        city: city || null,
        phone: phone || null,
        outstanding_balance: 0,
        total_paid: 0,
        active: true,
      });

      if (err) throw err;

      setShowAddModal(false);
      setName('');
      setCode('');
      setCity('');
      setPhone('');
      onClientAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء إضافة العميل');
    } finally {
      setSaving(false);
    }
  }

  // تسجيل عملية تسديد (واصل)
  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!showPayModal || payAmount <= 0) return;

    setSaving(true);
    setError(null);

    try {
      const currentBalance = showPayModal.outstanding_balance || 0;
      const currentTotalPaid = showPayModal.total_paid || 0;

      const newBalance = Math.max(0, currentBalance - payAmount);
      const newTotalPaid = currentTotalPaid + payAmount;

      const { error: err } = await supabase
        .from('clients')
        .update({
          outstanding_balance: Math.round(newBalance * 100) / 100,
          total_paid: Math.round(newTotalPaid * 100) / 100,
        })
        .eq('id', showPayModal.id);

      if (err) throw err;

      setShowPayModal(null);
      setPayAmount(0);
      onClientAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء التسديد');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 dir-rtl">
      {/* 📊 بطاقات ملخص الإحصائيات الرسمية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-xs flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500 rounded-r-2xl" />
          <div>
            <p className="text-xs font-semibold tracking-wide text-rose-600 uppercase">إجمالي الديون القائمة (المستحقة)</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1 font-mono tracking-tight">{formatILS(totalDebtSum)}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100/60">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 rounded-r-2xl" />
          <div>
            <p className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">إجمالي المدفوعات التراكمية (الواصل)</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1 font-mono tracking-tight">{formatILS(totalPaidSum)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/60">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 🏛️ جدول وسجل العملاء الرئيسي */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* الترويسة وأدوات التحكم */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-500" />
              دليل العملاء والحسابات
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">متابعة دقيقة للأرصدة القائمة وعمليات التسديد المباشرة</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* حقل البحث */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، الكود، الهاتف، أو المدينة..."
                className="w-full pr-9 pl-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-xl transition-all text-xs shadow-xs active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة عميل جديد</span>
            </button>
          </div>
        </div>

        {/* الجدول */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                <th className="py-3.5 px-4"><span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-slate-400" /> الكود</span></th>
                <th className="py-3.5 px-4">اسم العميل</th>
                <th className="py-3.5 px-4"><span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> المدينة</span></th>
                <th className="py-3.5 px-4"><span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> الهاتف</span></th>
                <th className="py-3.5 px-4">إجمالي الدين</th>
                <th className="py-3.5 px-4">إجمالي المدفوعات (الواصل)</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {filteredClients.length > 0 ? (
                filteredClients.map((c) => {
                  const hasDebt = (c.outstanding_balance || 0) > 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">{c.code}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{c.city || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{c.phone || '—'}</td>
                      <td className={`py-3.5 px-4 font-bold font-mono ${hasDebt ? 'text-rose-600' : 'text-slate-400'}`}>
                        {formatILS(c.outstanding_balance || 0)}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-emerald-600">
                        {formatILS(c.total_paid || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {hasDebt ? (
                          <button
                            onClick={() => {
                              setShowPayModal(c);
                              setPayAmount(c.outstanding_balance);
                            }}
                            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all mx-auto active:scale-[0.97]"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>تسديد دفعة</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-100 font-medium">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            حساب مخلص
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-normal">
                    {searchQuery ? `لا توجد نتائج مطابقة لـ "${searchQuery}"` : 'لا يوجد عملاء مسجلين حالياً.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💳 نافذة تسجيل دفعة تسديد (Modal) */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowPayModal(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">تسجيل دفعة مسددة</h3>
                <p className="text-xs text-slate-500">إدخال مبلغ جديد لحساب العميل</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1 mb-4">
              <div className="flex justify-between text-slate-600">
                <span>اسم العميل:</span>
                <strong className="text-slate-900">{showPayModal.name}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>الرصيد المتبقي المستحق:</span>
                <strong className="text-rose-600 font-mono">{formatILS(showPayModal.outstanding_balance)}</strong>
              </div>
            </div>

            {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl mb-4 border border-rose-100">{error}</div>}

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المبلغ الواصل (₪)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={showPayModal.outstanding_balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl p-2.5 text-base font-mono font-bold text-slate-900 outline-none transition-all"
                />
              </div>

              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>الدين بعد الخصم:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatILS(Math.max(0, showPayModal.outstanding_balance - payAmount))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي المدفوعات الجديد:</span>
                  <span className="font-bold font-mono text-emerald-600">
                    {formatILS((showPayModal.total_paid || 0) + payAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? 'جاري التأكيد...' : 'تأكيد العملية'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👤 نافذة إضافة عميل جديد (Modal) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">إضافة عميل جديد</h3>
                <p className="text-xs text-slate-500">سجل بيانات العملاء والمستحقات المباشرة</p>
              </div>
            </div>

            {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl mb-4 border border-rose-100">{error}</div>}

            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم العميل / الشركة</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسم العميل كاملاً"
                  className="w-full border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 rounded-xl p-2.5 text-xs text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">كود العميل التعريفى</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="مثال: CLT-105"
                  className="w-full border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 rounded-xl p-2.5 text-xs font-mono text-slate-900 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المدينة</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="اسم المدينة"
                    className="w-full border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 rounded-xl p-2.5 text-xs text-slate-900 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="059xxxxxxx"
                    className="w-full border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 rounded-xl p-2.5 text-xs font-mono text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-xs transition-all disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
