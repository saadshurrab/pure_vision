import { useState } from 'react';
import { supabase, type Client, formatILS } from '@/lib/supabase';

interface Props {
  clients: Client[];
  onClientAdded: () => void;
}

export function ClientsList({ clients, onClientAdded }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [creditLimit, setCreditLimit] = useState(1000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        credit_limit: creditLimit,
        outstanding_balance: 0,
        active: true,
      });

      if (err) throw err;

      setShowAddModal(false);
      setName('');
      setCode('');
      setCity('');
      setPhone('');
      setCreditLimit(1000);
      onClientAdded(); // إعادة تحميل قائمة العملاء في App.tsx
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء إضافة العميل');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">دليل العملاء</h2>
          <p className="text-sm text-slate-500">إدارة وعرض رصيد وحد الائتمان للعملاء</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + إضافة عميل جديد
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <th className="p-3">الكود</th>
              <th className="p-3">اسم العميل</th>
              <th className="p-3">المدينة</th>
              <th className="p-3">رقم الهاتف</th>
              <th className="p-3">حد الائتمان</th>
              <th className="p-3">الرصيد المستحق (الدين)</th>
              <th className="p-3">المتبقي المتاح</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {clients.map((c) => {
              const available = c.credit_limit - c.outstanding_balance;
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-500">{c.code}</td>
                  <td className="p-3 font-semibold text-slate-800">{c.name}</td>
                  <td className="p-3 text-slate-600">{c.city || '—'}</td>
                  <td className="p-3 text-slate-600">{c.phone || '—'}</td>
                  <td className="p-3">{formatILS(c.credit_limit)}</td>
                  <td className="p-3 font-semibold text-amber-600">
                    {formatILS(c.outstanding_balance)}
                  </td>
                  <td className={`p-3 font-semibold ${available < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatILS(available)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* مودال إضافة عميل */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">إضافة عميل جديد</h3>
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم العميل/المحل</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كود العميل</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  placeholder="مثال: CLT-105"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المدينة</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">حد الائتمان (₪)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium"
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