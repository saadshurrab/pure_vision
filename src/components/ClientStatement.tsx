import { useEffect, useState } from 'react';
import { supabase, formatILS } from '@/lib/supabase';

interface ClientSummaryData {
  client_id: string;
  name: string;
  total_debit: number;
  total_credit: number;
  total_discount: number;
  total_return: number;
  final_balance: number;
}

interface TransactionData {
  id: string;
  invoice_number: string;
  transaction_date: string;
  debit: number;
  credit: number;
  discount: number;
  return_amount: number;
  description: string;
}

export function ClientStatement() {
  const [summaries, setSummaries] = useState<ClientSummaryData[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSummaryData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientSummaries();
  }, []);

  // جلب ملخص حسابات الزبائن
  async function fetchClientSummaries() {
    setLoading(true);
    const { data, error } = await supabase.from('client_summary').select('*');
    if (!error && data) {
      setSummaries(data);
      if (data.length > 0) handleSelectClient(data[0]);
    }
    setLoading(false);
  }

  // جلب كشف حساب زبون محدد
  async function handleSelectClient(client: ClientSummaryData) {
    setSelectedClient(client);
    const { data } = await supabase
      .from('client_transactions')
      .select('*')
      .eq('client_id', client.client_id)
      .order('transaction_date', { ascending: true });

    setTransactions(data || []);
  }

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل سجلات وحسابات العملاء...</div>;

  return (
    <div className="space-y-6 dir-rtl">
      {/* اختيار الزبون لكشف الحساب */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-md-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">كشف حساب وتفاصيل سجل الزبائن</h2>
          <p className="text-xs text-slate-500">مطابق لدفتري الحسابات والملف المالي الرئيسي</p>
        </div>

        <select
          onChange={(e) => {
            const found = summaries.find((s) => s.client_id === e.target.value);
            if (found) handleSelectClient(found);
          }}
          value={selectedClient?.client_id || ''}
          className="border border-slate-300 rounded-xl px-4 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {summaries.map((s) => (
            <option key={s.client_id} value={s.client_id}>
              {s.name} — (الرصيد: {formatILS(s.final_balance)})
            </option>
          ))}
        </select>
      </div>

      {/* ملخص الحساب الخاص بالعميل المختار */}
      {selectedClient && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <span className="text-xs text-blue-600 block">إجمالي المدين (الطلبيات)</span>
            <strong className="text-lg text-blue-800">{formatILS(selectedClient.total_debit)}</strong>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <span className="text-xs text-emerald-600 block">إجمالي الدائن (الواصل)</span>
            <strong className="text-lg text-emerald-800">{formatILS(selectedClient.total_credit)}</strong>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
            <span className="text-xs text-purple-600 block">إجمالي الخصم</span>
            <strong className="text-lg text-purple-800">{formatILS(selectedClient.total_discount)}</strong>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
            <span className="text-xs text-orange-600 block">إجمالي المرجع</span>
            <strong className="text-lg text-orange-800">{formatILS(selectedClient.total_return)}</strong>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-xs text-red-600 block">الرصيد النهائي المتبقي</span>
            <strong className="text-lg text-red-800">{formatILS(selectedClient.final_balance)}</strong>
          </div>
        </div>
      )}

      {/* جدول كشف الحساب التفصيلي */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 overflow-x-auto">
        <h3 className="font-bold text-slate-800 mb-4">جدول كشف الحساب التفصيلي (المدين والدائن)</h3>
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-bold">
              <th className="p-3">رقم الفاتورة</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">مدين (طلبية)</th>
              <th className="p-3">دائن (واصل)</th>
              <th className="p-3">الخصم</th>
              <th className="p-3">قيمة المرجع</th>
              <th className="p-3">البيان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-500">{t.invoice_number || '—'}</td>
                  <td className="p-3 text-slate-600">{t.transaction_date}</td>
                  <td className="p-3 font-semibold text-blue-600">{t.debit > 0 ? formatILS(t.debit) : '—'}</td>
                  <td className="p-3 font-semibold text-emerald-600">{t.credit > 0 ? formatILS(t.credit) : '—'}</td>
                  <td className="p-3 text-purple-600">{t.discount > 0 ? formatILS(t.discount) : '—'}</td>
                  <td className="p-3 text-orange-600">{t.return_amount > 0 ? formatILS(t.return_amount) : '—'}</td>
                  <td className="p-3 font-medium text-slate-800">{t.description || '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-400">
                  لا توجد حركات مسجلة لهذا العميل بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
