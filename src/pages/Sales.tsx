import { useState, useEffect } from 'react';
import { useStore, Product, SaleItem } from '../store';
import { Search, Camera, Plus, Minus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { v4 as uuidv4 } from 'uuid';

export default function SalesPage() {
  const { products, addSale, user, settings, addAuditLog } = useStore();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render((text) => {
        handleScan(text);
        scanner.clear();
        setScanning(false);
      }, (err) => {});
      return () => scanner.clear().catch(() => {});
    }
  }, [scanning]);

  const handleScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
    } else {
      alert('المنتج غير متوفر');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item);
      }
      return [...prev, { id: uuidv4(), product_id: product.id, quantity: 1, price: product.sell_price, total: product.sell_price }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0) - discount;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const sale = {
      id: uuidv4(),
      invoice_number: Date.now(),
      total_amount: totalAmount,
      total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
      discount,
      created_at: new Date().toISOString(),
      created_by: user.name || 'مدير',
      items: cart
    };

    addSale(sale);
    addAuditLog({
      id: uuidv4(),
      action: 'بيع',
      details: `فاتورة رقم ${sale.invoice_number} بقيمة ${totalAmount}`,
      executor_name: user.name || 'مدير',
      created_at: new Date().toISOString()
    });

    setLastSale(sale);
    setShowInvoice(true);
    setCart([]);
    setDiscount(0);
  };

  const filteredProducts = products.filter(p => p.name.includes(search) || p.barcode.includes(search));

  if (showInvoice && lastSale) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-sm">
        <div className="text-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <h2 className="text-2xl font-bold">تم البيع بنجاح</h2>
        </div>
        <div className="border-t border-b border-gray-200 py-4 mb-6 text-sm space-y-2">
          <div className="flex justify-between"><span>رقم الفاتورة:</span> <span>{lastSale.invoice_number}</span></div>
          <div className="flex justify-between"><span>التاريخ:</span> <span>{new Date(lastSale.created_at).toLocaleString('ar-SA')}</span></div>
          <div className="flex justify-between"><span>الشركة:</span> <span>{settings.companyName}</span></div>
        </div>
        <div className="space-y-2 mb-6">
          {lastSale.items.map((item: any) => {
            const product = products.find(p => p.id === item.product_id);
            return (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{product?.name || 'منتج محذوف'} x{item.quantity}</span>
                <span>{item.total} {settings.currency}</span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-gray-200 pt-4 mb-6 font-bold flex justify-between">
          <span>المجموع:</span>
          <span>{lastSale.total_amount} {settings.currency}</span>
        </div>
        <button onClick={() => setShowInvoice(false)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium">إغلاق</button>
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
            placeholder="بحث بالاسم أو الباركود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>
        <button
          onClick={() => setScanning(!scanning)}
          className={`p-3 rounded-2xl transition ${scanning ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      {scanning && <div id="reader" className="w-full rounded-2xl overflow-hidden bg-white shadow-sm"></div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filteredProducts.map(product => (
          <div key={product.id} onClick={() => addToCart(product)} className="bg-white p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition border border-gray-50">
            <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
            <div className="text-blue-600 font-medium mt-1">{product.sell_price} {settings.currency}</div>
            <div className="text-xs text-gray-400 mt-2">الكمية: {product.quantity}</div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            السلة
          </h3>
          
          <div className="space-y-3">
            {cart.map(item => {
              const product = products.find(p => p.id === item.product_id);
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{product?.name}</div>
                    <div className="text-xs text-gray-500">{item.price} {settings.currency}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-xl border border-gray-200">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-50 rounded-r-xl"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-50 rounded-l-xl"><Plus className="w-4 h-4" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="خصم إضافي"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm"
              />
            </div>
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>الإجمالي:</span>
              <span className="text-blue-600">{totalAmount} {settings.currency}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-sm hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              إتمام البيع
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
