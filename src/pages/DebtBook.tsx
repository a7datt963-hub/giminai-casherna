import { useState } from 'react';
import { useStore, Debt } from '../store';
import { BookOpen, Plus, Search, Trash2, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function DebtBookPage() {
  const { debts, addDebt, updateDebt, deleteDebt, settings, user, addAuditLog } = useStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [formData, setFormData] = useState({ person_name: '', amount: 0, details: '' });

  const filteredDebts = debts.filter(d => d.person_name.includes(search));

  const handleAddDebt = () => {
    if (!formData.person_name || formData.amount <= 0) {
      alert('يرجى إدخال اسم الشخص والمبلغ');
      return;
    }
    
    const debt: Debt = {
      id: uuidv4(),
      person_name: formData.person_name,
      amount: formData.amount,
      paid: 0,
      details: formData.details,
      created_at: new Date().toISOString()
    };
    
    addDebt(debt);
    addAuditLog({
      id: uuidv4(),
      action: 'إضافة دين',
      details: `تم إضافة دين بقيمة ${debt.amount} لـ ${debt.person_name}`,
      executor_name: user.name || 'مدير',
      created_at: new Date().toISOString()
    });
    
    setShowAdd(false);
    setFormData({ person_name: '', amount: 0, details: '' });
  };

  const handlePayment = (id: string, amount: number) => {
    if (amount <= 0) return;
    updateDebt(id, amount);
    setPaymentAmount(0);
    setExpandedId(null);
    
    const debt = debts.find(d => d.id === id);
    if (debt) {
      addAuditLog({
        id: uuidv4(),
        action: 'تسديد دين',
        details: `تم تسديد ${amount} من دين ${debt.person_name}`,
        executor_name: user.name || 'مدير',
        created_at: new Date().toISOString()
      });
    }
  };

  if (showAdd) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-3xl shadow-sm space-y-4">
        <h2 className="text-xl font-bold mb-6 text-center">إضافة دين جديد</h2>
        
        <input
          type="text"
          placeholder="اسم الشخص"
          value={formData.person_name}
          onChange={e => setFormData({ ...formData, person_name: e.target.value })}
          className="w-full p-3 bg-gray-50 border-none rounded-xl"
          list="person-names"
        />
        <datalist id="person-names">
          {Array.from(new Set(debts.map(d => d.person_name))).map(name => (
            <option key={name} value={name} />
          ))}
        </datalist>
        
        <input
          type="number"
          placeholder="المبلغ"
          value={formData.amount || ''}
          onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
          className="w-full p-3 bg-gray-50 border-none rounded-xl"
        />
        
        <textarea
          placeholder="التفاصيل (اختياري)"
          value={formData.details}
          onChange={e => setFormData({ ...formData, details: e.target.value })}
          className="w-full p-3 bg-gray-50 border-none rounded-xl h-24 resize-none"
        />

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button onClick={handleAddDebt} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium">حفظ</button>
          <button onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">إلغاء</button>
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
            placeholder="بحث في الديون..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        {filteredDebts.map(debt => {
          const remaining = debt.amount - debt.paid;
          const isExpanded = expandedId === debt.id;
          
          return (
            <div key={debt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : debt.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{debt.person_name}</h3>
                    <div className="text-xs text-gray-500 mt-1">{new Date(debt.created_at).toLocaleDateString('ar-SA')}</div>
                  </div>
                </div>
                <div className="text-left flex items-center gap-3">
                  <div>
                    <div className="font-bold text-orange-600">{remaining} {settings.currency}</div>
                    <div className="text-xs text-gray-500 mt-1">من أصل {debt.amount}</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {debt.details && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                      {debt.details}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">المدفوع: <span className="font-bold text-green-600">{debt.paid} {settings.currency}</span></span>
                    <span className="text-gray-500">المتبقي: <span className="font-bold text-orange-600">{remaining} {settings.currency}</span></span>
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="مبلغ الدفعة"
                      value={paymentAmount || ''}
                      onChange={e => setPaymentAmount(Number(e.target.value))}
                      className="flex-1 p-3 bg-gray-50 border-none rounded-xl text-sm"
                    />
                    <button 
                      onClick={() => handlePayment(debt.id, paymentAmount)}
                      className="p-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition flex items-center gap-2 font-medium"
                    >
                      <DollarSign className="w-5 h-5" />
                      تسديد
                    </button>
                    <button 
                      onClick={() => { if(confirm('تأكيد الحذف؟')) deleteDebt(debt.id); }}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredDebts.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>لا توجد ديون مسجلة</p>
          </div>
        )}
      </div>
    </div>
  );
}
