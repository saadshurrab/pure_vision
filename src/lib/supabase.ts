// ── إعدادات الاتصال بـ Neon عبر HTTP API المباشر ──
const databaseUrl = import.meta.env.VITE_NEON_DATABASE_URL as string;

// دالة تنفيذ استعلامات SQL المباشرة لـ Neon
export async function sql(strings: TemplateStringsArray | string, ...values: any[]) {
  if (!databaseUrl) {
    console.error('تنبيه: لم يتم العثور على VITE_NEON_DATABASE_URL في ملف البيئة');
    return [];
  }

  let query = '';
  if (typeof strings === 'string') {
    query = strings;
  } else {
    query = strings[0];
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      const formattedVal =
        val === null || val === undefined
          ? 'NULL'
          : typeof val === 'string'
          ? `'${val.replace(/'/g, "''")}'`
          : typeof val === 'boolean'
          ? val ? 'TRUE' : 'FALSE'
          : val;
      query += formattedVal + strings[i + 1];
    }
  }

  try {
    const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
    if (!match) throw new Error('رابط قاعدة البيانات غير صحيح');

    const [, , password, host] = match;
    const httpUrl = `https://${host}/sql`;

    const response = await fetch(httpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}`,
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result.rows || [];
  } catch (err) {
    console.error('خطأ في استعلام SQL:', err);
    throw err;
  }
}

// ── محاكي Supabase الحقيقي المربوط بـ Neon DB ──
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table: string) => {
    return {
      // 1. القراءة من Neon DB
      select: async (columns: string = '*') => {
        try {
          const rows = await sql(`SELECT ${columns === '*' ? '*' : columns} FROM ${table} ORDER BY id DESC;`);
          return { data: rows, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      },

      // 2. الإدخال في Neon DB
      insert: async (records: Record<string, any> | Record<string, any>[]) => {
        try {
          const items = Array.isArray(records) ? records : [records];
          if (items.length === 0) return { data: [], error: null };

          const keys = Object.keys(items[0]);
          const cols = keys.join(', ');

          const insertedRows = [];
          for (const item of items) {
            const vals = keys.map((k) => {
              const val = item[k];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              if (typeof val === 'object') return `'${JSON.stringify(val)}'`;
              return val;
            }).join(', ');

            const query = `INSERT INTO ${table} (${cols}) VALUES (${vals}) RETURNING *;`;
            const res = await sql(query);
            if (res && res[0]) insertedRows.push(res[0]);
          }

          return { data: insertedRows, error: null };
        } catch (error: any) {
          console.error(`خطأ أثناء الإدخال في جدول ${table}:`, error);
          return { data: null, error };
        }
      },

      // 3. التحديث في Neon DB
      update: async (data: Record<string, any>) => {
        return {
          eq: async (column: string, value: any) => {
            try {
              const setClause = Object.keys(data)
                .map((k) => {
                  const val = data[k];
                  const formattedVal =
                    val === null
                      ? 'NULL'
                      : typeof val === 'string'
                      ? `'${val.replace(/'/g, "''")}'`
                      : typeof val === 'boolean'
                      ? val ? 'TRUE' : 'FALSE'
                      : val;
                  return `${k} = ${formattedVal}`;
                })
                .join(', ');

              const formattedEqVal = typeof value === 'string' ? `'${value}'` : value;
              const query = `UPDATE ${table} SET ${setClause} WHERE ${column} = ${formattedEqVal} RETURNING *;`;
              const res = await sql(query);
              return { data: res, error: null };
            } catch (error: any) {
              return { data: null, error };
            }
          },
        };
      },

      // 4. الحذف من Neon DB
      delete: async () => {
        return {
          eq: async (column: string, value: any) => {
            try {
              const formattedVal = typeof value === 'string' ? `'${value}'` : value;
              const query = `DELETE FROM ${table} WHERE ${column} = ${formattedVal} RETURNING *;`;
              const res = await sql(query);
              return { data: res, error: null };
            } catch (error: any) {
              return { data: null, error };
            }
          },
        };
      },
    };
  },
};

// ── Currency helper ──
export const CURRENCY_SYMBOL = '₪';
export const CURRENCY_NAME_AR = 'شيكل';

export function formatILS(amount: number): string {
  return `${(amount || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪`;
}

// ── SPH sign selector ──
export type SphSign = 'minus' | 'plus';

export const SPH_NEGATIVE: number[] = (() => {
  const vals: number[] = [];
  for (let v = -0.5; v >= -12.001; v -= 0.25) {
    vals.push(Math.round(v * 100) / 100);
  }
  return vals;
})();

export const SPH_POSITIVE: number[] = (() => {
  const vals: number[] = [];
  for (let v = 0.5; v <= 8.001; v += 0.25) {
    vals.push(Math.round(v * 100) / 100);
  }
  return vals;
})();

export const SPH_ALL: number[] = [...SPH_NEGATIVE, ...SPH_POSITIVE];

export const CYL_VALUES: number[] = (() => {
  const vals: number[] = [];
  for (let v = -0.75; v >= -5.001; v -= 0.25) {
    vals.push(Math.round(v * 100) / 100);
  }
  return vals;
})();

export const AXIS_VALUES: number[] = (() => {
  const vals: number[] = [];
  for (let v = 10; v <= 180; v += 10) {
    vals.push(v);
  }
  return vals;
})();

export const CUSTOM_SPH_MIN = -30;
export const CUSTOM_SPH_MAX = 20;

export function getSPHValues(sign: SphSign): number[] {
  return sign === 'minus' ? SPH_NEGATIVE : SPH_POSITIVE;
}

export function formatSPH(sph: number): string {
  return sph > 0 ? `+${sph.toFixed(2)}` : sph.toFixed(2);
}

export const BC_OPTIONS = ['8.4', '8.5', '8.6', '8.7', '8.8'];
export const DIA_OPTIONS = ['14.0', '14.2', '14.5'];

export type PaymentMethod = 'cash' | 'credit' | 'check';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'نقدي', icon: 'cash' },
  { value: 'credit', label: 'دين', icon: 'credit' },
  { value: 'check', label: 'شيك', icon: 'check' },
];

export interface Client {
  id: string;
  created_at: string;
  name: string;
  code: string;
  city?: string;
  phone?: string;
  outstanding_balance: number;
  total_paid: number;
  active: boolean;
}

export interface ClientTransaction {
  id: string;
  client_id: string;
  invoice_number: string | null;
  transaction_date: string;
  debit: number;
  credit: number;
  discount: number;
  return_amount: number;
  balance: number;
  running_balance: number;
  description: string;
  created_at: string;
}

export interface ClientSummary {
  client_id: string;
  name: string;
  total_debit: number;
  total_credit: number;
  total_discount: number;
  total_return: number;
  final_balance: number;
}

export interface LensProduct {
  id: string;
  brand: string;
  bc: string;
  dia: string;
  unit_price: number;
  active: boolean;
}

export interface LensStock {
  id: string;
  lens_product_id: string;
  sph: number;
  stock_qty: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'solution' | 'frame' | 'accessory';
  sku: string | null;
  unit_price: number;
  stock_qty: number;
  consumed_stock: number;
  active: boolean;
}

export interface OrderRow {
  id: string;
  client_id: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  status: string;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  item_type: 'product' | 'lens';
  product_id: string | null;
  lens_product_id: string | null;
  sph: number | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CartLensItem {
  lensProductId: string;
  brand: string;
  bc: string;
  dia: string;
  unitPrice: number;
  sph: number;
  cyl: number | null;
  axis: number | null;
  isCustom: boolean;
  quantity: number;
}

export interface CartProductItem {
  productId: string;
  name: string;
  category: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
}

export type CartItem = CartLensItem | CartProductItem;

export function isLensItem(item: CartItem): item is CartLensItem {
  return (item as CartLensItem).lensProductId !== undefined;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  client: Client;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
}
