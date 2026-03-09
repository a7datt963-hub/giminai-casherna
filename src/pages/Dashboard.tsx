import { useState } from 'react';
import { useStore } from '../store';
import { TrendingUp, Package, DollarSign, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { sales, settings, products } = useStore();
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const now = new Date();
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    if (filter === 'daily') return saleDate.toDateString() === now.toDateString();
    if (filter === 'weekly') {
      const diff = now.getTime() - saleDate.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    }
    if (filter === 'monthly') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    return true;
  });

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalItemsSold = filteredSales.reduce((sum, sale) => sum + sale.total_items, 0);
  
  // Calculate net profit
  let netProfit = 0;
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const profitPerItem = item.price - product.purchase_price;
        netProfit += profitPerItem * item.quantity;
      }
    });
    netProfit -= sale.discount;
  });

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          لوحة التحكم
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="p-2 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-100"
        >
          <option value="daily">اليوم</option>
          <option value="weekly">هذا الأسبوع</option>
          <option value="monthly">هذا الشهر</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="text-sm text-gray-500 mb-1">إجمالي المبيعات</div>
          <div className="text-2xl font-bold text-gray-800">{totalSales.toFixed(2)} {settings.currency}</div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-sm text-gray-500 mb-1">صافي الربح</div>
          <div className="text-2xl font-bold text-gray-800">{netProfit.toFixed(2)} {settings.currency}</div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center justify-center text-center col-span-2">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-6 h-6" />
          </div>
          <div className="text-sm text-gray-500 mb-1">عدد المنتجات المباعة</div>
          <div className="text-3xl font-bold text-gray-800">{totalItemsSold}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          آخر المبيعات
        </h3>
        <div className="space-y-3">
          {filteredSales.slice(-5).reverse().map(sale => (
            <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
              <div>
                <div className="font-medium text-sm">فاتورة #{sale.invoice_number}</div>
                <div className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleTimeString('ar-SA')}</div>
              </div>
              <div className="text-blue-600 font-bold">{sale.total_amount} {settings.currency}</div>
            </div>
          ))}
          {filteredSales.length === 0 && (
            <div className="text-center text-gray-500 py-4 text-sm">لا يوجد مبيعات في هذه الفترة</div>
          )}
        </div>
      </div>
    </div>
  );
}
