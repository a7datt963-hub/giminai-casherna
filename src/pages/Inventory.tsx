import { useState, useEffect } from 'react';
import { useStore, Product } from '../store';
import { Search, Plus, Edit, Trash2, Camera, AlertTriangle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { v4 as uuidv4 } from 'uuid';

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, settings, user, addAuditLog } = useStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render((text) => {
        setFormData(prev => ({ ...prev, barcode: text }));
        scanner.clear();
        setScanning(false);
      }, (err) => {});
      return () => scanner.clear().catch(() => {});
    }
  }, [scanning]);

  const handleSave = () => {
    if (!formData.name || !formData.barcode || !formData.purchase_price || !formData.sell_price || !formData.quantity) {
      alert('يرجى تعبئة جميع الحقول');
      return;
    }

    if (editingId) {
      updateProduct(editingId, formData);
      addAuditLog({
        id: uuidv4(),
        action: 'تعديل منتج',
        details: `تم تعديل المنتج ${formData.name}`,
        executor_name: user.name || 'مدير',
        created_at: new Date().toISOString()
      });
    } else {
      const existing = products.find(p => p.barcode === formData.barcode);
      if (existing) {
        alert('هذا الباركود موجود مسبقاً');
        return;
      }
      addProduct({ ...formData, id: uuidv4() } as Product);
      addAuditLog({
        id: uuidv4(),
        action: 'إضافة منتج',
        details: `تم إضافة المنتج ${formData.name}`,
        executor_name: user.name || 'مدير',
        created_at: new Date().toISOString()
      });
    }
    setShowAdd(false);
    setEditingId(null);
    setFormData({});
  };

  const filteredProducts = products.filter(p => p.name.includes(search) || p.barcode.includes(search));

  if (showAdd || editingId) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-3xl shadow-sm space-y-4">
        <h2 className="text-xl font-bold mb-6 text-center">{editingId ? 'تعديل منتج' : 'إضافة منتج'}</h2>
        
        <input
          type="text"
          placeholder="اسم المنتج"
          value={formData.name || ''}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 bg-gray-50 border-none rounded-xl"
        />
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="الباركود"
            value={formData.barcode || ''}
            onChange={e => setFormData({ ...formData, barcode: e.target.value })}
            className="w-full p-3 bg-gray-50 border-none rounded-xl font-mono"
          />
          <button onClick={() => setScanning(!scanning)} className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Camera className="w-5 h-5" />
          </button>
        </div>
        
        {scanning && <div id="reader" className="w-full rounded-xl overflow-hidden bg-white shadow-sm"></div>}

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="سعر الشراء"
            value={formData.purchase_price || ''}
            onChange={e => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
            className="w-full p-3 bg-gray-50 border-none rounded-xl"
          />
          <input
            type="number"
            placeholder="سعر البيع"
            value={formData.sell_price || ''}
            onChange={e => setFormData({ ...formData, sell_price: Number(e.target.value) })}
            className="w-full p-3 bg-gray-50 border-none rounded-xl"
          />
        </div>

        <input
          type="number"
          placeholder="الكمية"
          value={formData.quantity || ''}
          onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
          className="w-full p-3 bg-gray-50 border-none rounded-xl"
        />

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium">حفظ</button>
          <button onClick={() => { setShowAdd(false); setEditingId(null); setFormData({}); }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">إلغاء</button>
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
            placeholder="بحث في المخزون..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-3">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800">{product.name}</h3>
                {product.quantity < 3 && <AlertTriangle className="w-4 h-4 text-orange-500" />}
              </div>
              <div className="text-xs text-gray-500 font-mono mt-1">{product.barcode}</div>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-gray-600">شراء: {product.purchase_price}</span>
                <span className="text-blue-600 font-medium">بيع: {product.sell_price}</span>
                <span className={`font-medium ${product.quantity < 3 ? 'text-orange-500' : 'text-green-600'}`}>كمية: {product.quantity}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setEditingId(product.id); setFormData(product); }} className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => { if(confirm('تأكيد الحذف؟')) deleteProduct(product.id); }} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
