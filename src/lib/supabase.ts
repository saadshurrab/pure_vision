import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

// ── Currency helper ──
export const CURRENCY_SYMBOL = '₪';
export const CURRENCY_NAME_AR = 'شيكل';

export function formatILS(amount: number): string {
  return `${(amount || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪`;
}

// ── SPH sign selector ──
export type SphSign = 'minus' | 'plus';

// ── SPH values: Negative -0.50 to -12.00 in 0.25 steps (46 values) ──
export const SPH_NEGATIVE: number[] = (() => {
  const vals: number[] = [];
  for (let v = -0.5; v >= -12.001; v -= 0.25) {
    vals.push(Math.round(v * 100) / 100);
  }
  return vals;
})();

// ── SPH values: Positive +0.50 to +8.00 in 0.25 steps (31 values) ──
export const SPH_POSITIVE: number[] = (() => {
  const vals: number[] = [];
  for (let v = 0.5; v <= 8.001; v += 0.25) {
    vals.push(Math.round(v * 100) / 100);
  }
  return vals;
})();

// ── All standard SPH values (for syncing cart) ──
export const SPH_ALL: number[] = [...SPH_NEGATIVE, ...SPH_POSITIVE];

// ── CYL values for astigmatism/toric: -0.75 to -5.00 in 0.25 steps ──
export const CYL_VALUES: number[] = (() => {
  const vals: number[] = [];
  for (let v = -0.75; v >= -5.001; v -= 0.25) {
    vals.push(Math.round(v * 100) / 100);
  }
  return vals;
})();

// ── AXIS values: 10° to 180° in 10° steps ──
export const AXIS_VALUES: number[] = (() => {
  const vals: number[] = [];
  for (let v = 10; v <= 180; v += 10) {
    vals.push(v);
  }
  return vals;
})();

// ── Custom SPH limits ──
export const CUSTOM_SPH_MIN = -30;
export const CUSTOM_SPH_MAX = 20;

export function getSPHValues(sign: SphSign): number[] {
  return sign === 'minus' ? SPH_NEGATIVE : SPH_POSITIVE;
}

export function formatSPH(sph: number): string {
  return sph > 0 ? `+${sph.toFixed(2)}` : sph.toFixed(2);
}

// ── Available BC and DIA options ──
export const BC_OPTIONS = ['8.4', '8.5', '8.6', '8.7', '8.8'];
export const DIA_OPTIONS = ['14.0', '14.2', '14.5'];

// ── Payment methods ──
export type PaymentMethod = 'cash' | 'credit' | 'check';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'نقدي', icon: 'cash' },
  { value: 'credit', label: 'دين', icon: 'credit' },
  { value: 'check', label: 'شيك', icon: 'check' },
];

// ── Types ──
export interface Client {
  id: string;
  created_at: string;
  name: string;
  code: string;
  city?: string;
  phone?: string;
  outstanding_balance: number; // إجمالي الدين الحكالي/الرصيد النهائي
  total_paid: number;          // إجمالي الدائن (الواصل)
  active: boolean;
}

// ── حركة كشف حساب الزبون (الجديد ✨ المطابق للدفتري والملف) ──
export interface ClientTransaction {
  id: string;
  client_id: string;
  invoice_number: string | null;
  transaction_date: string;
  debit: number;          // مدين (مطلوبات / طلبيات)
  credit: number;         // دائن (مقبوضات / واصل)
  discount: number;       // الخصم
  return_amount: number;  // قيمة المرجع
  balance: number;        // رصيد الحركة
  running_balance: number;// الرصيد التراكمي
  description: string;    // البيان (طلبية، دفعة، رصيد سابق...)
  created_at: string;
}

// ── ملخص كشف حساب الزبون الشامل ──
export interface ClientSummary {
  client_id: string;
  name: string;
  total_debit: number;    // إجمالي المدين
  total_credit: number;   // إجمالي الدائن
  total_discount: number; // إجمالي الخصم
  total_return: number;   // إجمالي المرجع
  final_balance: number;  // الرصيد النهائي المتبقي
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
  stock_qty: number;       // الكمية الكلية المسجلة للمنتج
  consumed_stock: number;  // الكمية المستهلكة (المباعة)
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

// ── Cart item types ──
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

// ── Invoice data for printing ──
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
