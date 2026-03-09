import { useState } from 'react';
import { useStore } from '../store';
import { FileText, Search, Printer, Share2, X } from 'lucide-react';

export default function InvoicesPage() {
  const { sales, settings, products } = useStore();
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const filteredSales = sales.filter(sale => 
    sale.invoice_number.toString().includes(search) || 
    sale.created_by.includes(search)
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (selectedInvoice) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-3xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">تفاصيل الفاتورة</h2>
          <button onClick={() => setSelectedInvoice(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">{settings.companyName}</h3>
            <p className="text-sm text-gray-500">فاتورة مبيعات</p>
          </div>
          
          <div className="border-t border-b border-gray-200 py-4 mb-6 text-sm space-y-2">
            <div className="flex justify-between"><span>رقم الفاتورة:</span> <span>{selectedInvoice.invoice_number}</span></div>
            <div className="flex justify-between"><span>التاريخ:</span> <span>{new Date(selectedInvoice.created_at).toLocaleString('ar-SA')}</span></div>
            <div className="flex justify-between"><span>البائع:</span> <span>{selectedInvoice.created_by}</span></div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-xs font-bold text-gray-500 border-b border-gray-100 pb-2">
              <span>المنتج</span>
              <span>الكمية</span>
              <span>السعر</span>
              <span>المجموع</span>
            </div>
            {selectedInvoice.items.map((item: any) => {
              const product = products.find(p => p.id === item.product_id);
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="w-1/3 truncate">{product?.name || 'منتج محذوف'}</span>
                  <span className="w-1/6 text-center">{item.quantity}</span>
                  <span className="w-1/4 text-center">{item.price}</span>
                  <span className="w-1/4 text-left">{item.total}</span>
                </div>
              );
            })}
          </div>
          
          <div className="border-t border-gray-200 pt-4 space-y-2">
            {selectedInvoice.discount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>الخصم:</span>
                <span>-{selectedInvoice.discount} {settings.currency}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>الإجمالي:</span>
              <span className="text-blue-600">{selectedInvoice.total_amount} {settings.currency}</span>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-gray-500">
            شكراً لزيارتكم
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition">
            <Printer className="w-5 h-5" />
            طباعة
          </button>
          <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition">
            <Share2 className="w-5 h-5" />
            مشاركة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-3xl shadow-sm flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث برقم الفاتورة أو البائع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredSales.map(sale => (
          <div 
            key={sale.id} 
            onClick={() => setSelectedInvoice(sale)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between cursor-pointer hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">فاتورة #{sale.invoice_number}</h3>
                <div className="text-xs text-gray-500 mt-1">{new Date(sale.created_at).toLocaleString('ar-SA')}</div>
                <div className="text-xs text-gray-400 mt-1">البائع: {sale.created_by}</div>
              </div>
            </div>
            <div className="text-left">
              <div className="font-bold text-blue-600">{sale.total_amount} {settings.currency}</div>
              <div className="text-xs text-gray-500 mt-1">{sale.total_items} عناصر</div>
            </div>
          </div>
        ))}
        
        {filteredSales.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>لا توجد فواتير مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
