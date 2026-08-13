import React, { useState, useEffect } from 'react';
import { supabase, Client, ClientTransaction, formatILS } from '../types'; // أعد ضبط مسار types حسب مجلده لديك

export const ClientStatement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [transactions, setTransactions] = useState<ClientTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (!error && data) {
      setClients(data);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      fetchStatement();
    } else {
      setTransactions([]);
    }
  }, [selectedClientId, startDate, endDate]);

  const fetchStatement = async () => {
    setLoading(true);
    let query = supabase
      .from('client_transactions')
      .select('*')
      .eq('client_id', selectedClientId)
      .order('transaction_date', { ascending: true });

    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);

    const { data, error } = await query;

    if (!error && data) {
      let running = 0;
      const formatted = data.map((t: ClientTransaction) => {
        running += (t.debit || 0) - (t.credit || 0) - (t.discount || 0) - (t.return_amount || 0);
        return { ...t, running_balance: running };
      });
      setTransactions(formatted);
    }
    setLoading(false);
  };

  const totalDebit = transactions.reduce((acc, t) => acc + (t.debit || 0), 0);
  const totalCredit = transactions.reduce((acc, t) => acc + (t.credit || 0), 0);
  const totalDiscount = transactions.reduce((acc, t) => acc + (t.discount || 0), 0);
  const totalReturn = transactions.reduce((acc, t) => acc + (t.return_amount || 0), 0);
  const finalBalance = totalDebit - totalCredit - totalDiscount - totalReturn;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm space-y-6" dir="rtl">
      {/* هيدر والفلترة */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">كشف حساب زبون</h2>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="p-2 border rounded-md min-w-[220px] bg-gray-50 focus:bg-white"
          >
            <option value="">-- اختر الزبون --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border rounded-md"
          />
          <span className="text-gray-500">إلى</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border rounded-md"
          />

          <button
            onClick={() => window.print()}
            disabled={!selectedClientId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            طباعة الكشف
          </button>
        </div>
      </div>

      {selectedClientId ? (
        <>
          {/* كروت الملخص المالي */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-xs text-red-600 font-semibold block">إجمالي المطلوب (مدين)</span>
              <span className="text-lg font-bold text-red-700">{formatILS(totalDebit)}</span>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-xs text-green-600 font-semibold block">إجمالي الواصل (دائن)</span>
              <span className="text-lg font-bold text-green-700">{formatILS(totalCredit)}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-xs text-amber-600 font-semibold block">إجمالي الخصم</span>
              <span className="text-lg font-bold text-amber-700">{formatILS(totalDiscount)}</span>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <span className="text-xs text-purple-600 font-semibold block">إجمالي المرجع</span>
              <span className="text-lg font-bold text-purple-700">{formatILS(totalReturn)}</span>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg col-span-2 md:col-span-1">
              <span className="text-xs text-blue-600 font-semibold block">الرصيد المتبقي</span>
              <span className="text-xl font-extrabold text-blue-800">{formatILS(finalBalance)}</span>
            </div>
          </div>

          {/* جدول كشف الحساب */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-100 border-b text-gray-700">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">رقم المرجع/الفاتورة</th>
                  <th className="p-3">البيان</th>
                  <th className="p-3 text-red-600">مدين (طلبيات)</th>
                  <th className="p-3 text-green-600">دائن (واصل)</th>
                  <th className="p-3 text-amber-600">خصم</th>
                  <th className="p-3 text-purple-600">مرجع</th>
                  <th className="p-3 font-bold">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-6 text-gray-500">جاري تحميل البيانات...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-6 text-gray-500">لا توجد حركات مالية لهذه الفترة.</td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{new Date(t.transaction_date).toLocaleDateString('ar-EG')}</td>
                      <td className="p-3 font-mono">{t.invoice_number || '-'}</td>
                      <td className="p-3">{t.description}</td>
                      <td className="p-3 text-red-600 font-medium">{t.debit ? formatILS(t.debit) : '-'}</td>
                      <td className="p-3 text-green-600 font-medium">{t.credit ? formatILS(t.credit) : '-'}</td>
                      <td className="p-3 text-amber-600">{t.discount ? formatILS(t.discount) : '-'}</td>
                      <td className="p-3 text-purple-600">{t.return_amount ? formatILS(t.return_amount) : '-'}</td>
                      <td className="p-3 font-bold dir-ltr text-right">{formatILS(t.running_balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-400">
          الرجاء اختيار زبون من القائمة أعلاه لمشاهدة كشف الحساب الخاص به.
        </div>
      )}
    </div>
  );
};
