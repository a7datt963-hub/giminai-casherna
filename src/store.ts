import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get, set } from 'idb-keyval';

export interface User {
  id: string;
  role: 'guest' | 'manager' | 'employee';
  managerCode?: string;
  name?: string;
  permissions?: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  purchase_price: number;
  sell_price: number;
  quantity: number;
}

export interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  invoice_number: number;
  total_amount: number;
  total_items: number;
  discount: number;
  created_at: string;
  created_by: string;
  items: SaleItem[];
}

export interface Debt {
  id: string;
  person_name: string;
  amount: number;
  paid: number;
  details: any;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  executor_name: string;
  created_at: string;
}

interface AppState {
  user: User;
  token: string | null;
  products: Product[];
  sales: Sale[];
  debts: Debt[];
  auditLogs: AuditLog[];
  subscription: any;
  settings: {
    currency: string;
    companyName: string;
  };
  setUser: (user: User, token?: string) => void;
  logout: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addSale: (sale: Sale) => void;
  addDebt: (debt: Debt) => void;
  updateDebt: (id: string, paid: number) => void;
  deleteDebt: (id: string) => void;
  addAuditLog: (log: AuditLog) => void;
  setSyncData: (data: any) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: { id: 'guest', role: 'guest' },
      token: null,
      products: [],
      sales: [],
      debts: [],
      auditLogs: [],
      subscription: null,
      settings: {
        currency: '$',
        companyName: 'شركتي',
      },
      setUser: (user, token) => set((state) => ({ user, token: token || state.token })),
      logout: () => set({ user: { id: 'guest', role: 'guest' }, token: null, products: [], sales: [], debts: [], auditLogs: [] }),
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, product) => set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...product } : p)),
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      })),
      addSale: (sale) => set((state) => ({ sales: [...state.sales, sale] })),
      addDebt: (debt) => set((state) => ({ debts: [...state.debts, debt] })),
      updateDebt: (id, paid) => set((state) => ({
        debts: state.debts.map((d) => (d.id === id ? { ...d, paid: d.paid + paid } : d)),
      })),
      deleteDebt: (id) => set((state) => ({
        debts: state.debts.filter((d) => d.id !== id),
      })),
      addAuditLog: (log) => set((state) => ({ auditLogs: [...state.auditLogs, log] })),
      setSyncData: (data) => set((state) => ({
        products: data.products || state.products,
        sales: data.sales || state.sales,
        debts: data.debts || state.debts,
        auditLogs: data.auditLogs || state.auditLogs,
        subscription: data.subscription || state.subscription,
      })),
      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
    }),
    {
      name: 'pos-storage',
      storage: {
        getItem: async (name) => {
          return (await get(name)) || null;
        },
        setItem: async (name, value) => {
          await set(name, value);
        },
        removeItem: async (name) => {
          await set(name, null);
        },
      },
    }
  )
);
