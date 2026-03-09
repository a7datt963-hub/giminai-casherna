import { useState } from 'react';
import { useStore } from '../store';
import { User, Copy, RefreshCw, LogOut, Settings, ShieldAlert, Check, X, Shield, Download, Upload, Cloud, Share2, Crown } from 'lucide-react';

export default function SummaryPage() {
  const { user, token, setUser, logout, settings, updateSettings, subscription } = useStore();
  const [view, setView] = useState<'main' | 'choose' | 'manager_profile' | 'employee_join' | 'recovery' | 'settings'>('main');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (user.managerCode) {
      navigator.clipboard.writeText(user.managerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createManager = async () => {
    try {
      const res = await fetch('/api/auth/manager/create', { method: 'POST' });
      const data = await res.json();
      if (data.token) {
        setUser(data.user, data.token);
        setView('main');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const changeManagerCode = async () => {
    if (!confirm('تغيير الكود سيؤدي إلى تسجيل خروج جميع الموظفين فوراً. هل أنت متأكد؟')) return;
    try {
      const res = await fetch('/api/auth/manager/change-code', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.token) {
        setUser({ ...user, managerCode: data.managerCode }, data.token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (view === 'choose') {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-center">اختيار نوع الحساب</h2>
        <div className="space-y-4">
          <button
            onClick={createManager}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            مدير
          </button>
          <button
            onClick={() => setView('employee_join')}
            className="w-full py-4 bg-gray-100 text-gray-800 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            موظف
          </button>
          <button
            onClick={() => setView('main')}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  if (view === 'employee_join') return <EmployeeJoin setView={setView} />;
  if (view === 'manager_profile') return <ManagerProfile setView={setView} />;
  if (view === 'recovery') return <AccountRecovery setView={setView} />;
  if (view === 'settings') return <SettingsPanel setView={setView} />;

  const isPro = subscription?.plan === 'pro';

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {user.role === 'manager' && (
        <div className="bg-white p-4 rounded-3xl shadow-sm flex justify-between items-center">
          <button 
            onClick={() => {
              const url = `${window.location.origin}/?join=${user.managerCode}`;
              navigator.clipboard.writeText(url);
              alert('تم نسخ رابط الدعوة');
            }}
            className="flex items-center gap-2 text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition"
          >
            <Share2 className="w-4 h-4" />
            مشاركة رابط الانضمام
          </button>
          {!isPro && (
            <button onClick={() => setView('settings')} className="flex items-center gap-2 text-orange-600 font-medium bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition">
              <Crown className="w-4 h-4" />
              ترقية PRO
            </button>
          )}
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col items-center relative">
        {user.role === 'manager' && (
          <button onClick={() => setView('settings')} className="absolute top-4 left-4 p-2 text-gray-400 hover:text-blue-600">
            <Settings className="w-5 h-5" />
          </button>
        )}
        
        <div 
          className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 mb-4 cursor-pointer hover:bg-gray-200 transition"
          onClick={() => user.role === 'manager' && setView('manager_profile')}
        >
          {user.role === 'guest' ? '-' : user.managerCode?.[0] || <User />}
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {user.role === 'guest' ? 'ضيف' : user.role === 'manager' ? 'مدير النظام' : user.name}
          {isPro && <Crown className="w-5 h-5 text-orange-500" />}
        </h2>
        
        <div className="mt-2 text-gray-500 font-mono text-lg tracking-widest">
          {user.managerCode || '-----'}
        </div>

        {user.role === 'guest' && (
          <div className="mt-6 w-full space-y-3">
            <button
              onClick={() => setView('choose')}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:bg-blue-700 transition"
            >
              اختيار نوع الحساب
            </button>
            <button
              onClick={() => setView('recovery')}
              className="w-full py-3 bg-white text-blue-600 border border-blue-100 rounded-xl font-medium hover:bg-blue-50 transition"
            >
              استرداد الحساب
            </button>
          </div>
        )}

        {user.role === 'manager' && (
          <div className="mt-6 w-full space-y-3">
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'تم النسخ' : 'نسخ الكود'}
              </button>
              <button
                onClick={changeManagerCode}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              >
                <RefreshCw className="w-4 h-4" />
                تغيير الكود
              </button>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-gray-700 transition"
            >
              <LogOut className="w-4 h-4" />
              تسجيل خروج
            </button>
          </div>
        )}

        {user.role === 'employee' && (
          <div className="mt-6 w-full">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition"
            >
              <LogOut className="w-5 h-5" />
              تسجيل خروج
            </button>
          </div>
        )}
      </div>

      {user.role === 'manager' && <EmployeeManagement />}
    </div>
  );
}

function SettingsPanel({ setView }: { setView: any }) {
  const { settings, updateSettings, subscription, token } = useStore();
  const [activationCode, setActivationCode] = useState('');
  const isPro = subscription?.plan === 'pro';

  const handleActivate = async () => {
    try {
      const res = await fetch('/api/manager/activate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activationCode })
      });
      const data = await res.json();
      if (data.success) {
        alert('تم تفعيل الاشتراك بنجاح!');
        // Trigger sync to get updated subscription
        fetch('/api/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      } else {
        alert(data.error || 'كود غير صالح');
      }
    } catch (err) {
      alert('خطأ في الاتصال');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <h2 className="text-xl font-bold mb-6">الإعدادات</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم الشركة</label>
            <input 
              type="text" 
              value={settings.companyName} 
              onChange={e => updateSettings({ companyName: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">العملة</label>
            <select 
              value={settings.currency} 
              onChange={e => updateSettings({ currency: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl bg-white"
            >
              <option value="$">$ دولار</option>
              <option value="ل.س">ل.س ليرة سورية</option>
              <option value="€">€ يورو</option>
              <option value="ر.س">ر.س ريال سعودي</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Crown className={`w-5 h-5 ${isPro ? 'text-orange-500' : 'text-gray-400'}`} />
              الاشتراك {isPro ? '(PRO مفعل)' : '(مجاني)'}
            </h3>
            
            {!isPro && (
              <div className="bg-orange-50 p-4 rounded-2xl mb-4">
                <p className="text-sm text-orange-800 mb-3">قم بالترقية لفتح الميزات المتقدمة (استيراد/تصدير، تتبع، منتجات لا نهائية).</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="أدخل كود التفعيل" 
                    value={activationCode}
                    onChange={e => setActivationCode(e.target.value.toUpperCase())}
                    className="flex-1 p-3 border-none rounded-xl font-mono uppercase text-sm"
                  />
                  <button onClick={handleActivate} className="px-4 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600">تفعيل</button>
                </div>
                <div className="mt-3 text-xs text-orange-600">
                  لطلب كود: <a href="https://wa.me/+963982559890" target="_blank" rel="noreferrer" className="underline font-bold">تواصل عبر واتساب</a>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h3 className="font-bold mb-4">النسخ الاحتياطي والبيانات</h3>
            <button className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${isPro ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}>
              <Download className="w-5 h-5" /> تصدير البيانات (PRO)
            </button>
            <button className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${isPro ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}>
              <Upload className="w-5 h-5" /> استيراد البيانات (PRO)
            </button>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h3 className="font-bold mb-4 text-red-600">منطقة الخطر</h3>
            <button onClick={() => { if(confirm('تأكيد تصفير الأرباح؟')) { /* implement */ } }} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100">تصفير الأرباح</button>
            <button onClick={() => { if(confirm('تأكيد حذف سجل المبيعات؟')) { /* implement */ } }} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100">حذف سجل المبيعات</button>
          </div>
        </div>
        
        <button onClick={() => setView('main')} className="w-full py-3 mt-6 bg-gray-100 text-gray-700 rounded-xl font-medium">عودة</button>
      </div>
    </div>
  );
}

function EmployeeJoin({ setView }: { setView: any }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleJoin = async () => {
    try {
      const res = await fetch('/api/auth/employee/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerCode: code, name })
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setSuccess(true);
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    }
  };

  if (success) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">تم إرسال الطلب</h2>
        <p className="text-gray-500 mb-6">يرجى انتظار موافقة المدير للدخول إلى النظام.</p>
        <button onClick={() => setView('main')} className="w-full py-3 bg-gray-100 rounded-xl font-medium">عودة</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-center">انضمام كموظف</h2>
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">كود المدير</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full p-3 border border-gray-200 rounded-xl font-mono text-center tracking-widest uppercase"
            placeholder="XXXXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم الموظف</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl"
            placeholder="أدخل اسمك"
          />
        </div>
        <button
          onClick={handleJoin}
          disabled={!code || !name}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
        >
          إرسال طلب انضمام
        </button>
        <button onClick={() => setView('choose')} className="w-full py-2 text-gray-500 text-sm">عودة</button>
      </div>
    </div>
  );
}

function ManagerProfile({ setView }: { setView: any }) {
  const { token } = useStore();
  const [formData, setFormData] = useState({ email: '', password: '', username: '', phone: '' });
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    try {
      const res = await fetch('/api/auth/manager/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) setMsg('تم حفظ البيانات بنجاح');
    } catch (err) {
      setMsg('حدث خطأ');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-center">إعدادات حساب المدير</h2>
      {msg && <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mb-4 text-sm">{msg}</div>}
      <div className="space-y-4">
        <input type="email" placeholder="البريد الإلكتروني" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, email: e.target.value})} />
        <input type="password" placeholder="كلمة السر" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, password: e.target.value})} />
        <input type="text" placeholder="اسم المستخدم" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, username: e.target.value})} />
        <input type="tel" placeholder="رقم الهاتف" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, phone: e.target.value})} />
        
        <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium">حفظ البيانات</button>
        <button onClick={() => setView('main')} className="w-full py-2 text-gray-500 text-sm">عودة</button>
      </div>
    </div>
  );
}

function AccountRecovery({ setView }: { setView: any }) {
  const { setUser } = useStore();
  const [formData, setFormData] = useState({ email: '', phone: '', password: '', managerCode: '' });
  const [error, setError] = useState('');

  const handleRecover = async () => {
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.token) {
        setUser(data.user, data.token);
        setView('main');
      } else {
        setError(data.error || 'فشل الاسترداد');
      }
    } catch (err) {
      setError('حدث خطأ');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-center">استرداد الحساب</h2>
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="space-y-4">
        <input type="text" placeholder="كود المدير" className="w-full p-3 border rounded-xl font-mono uppercase" onChange={e => setFormData({...formData, managerCode: e.target.value.toUpperCase()})} />
        <input type="email" placeholder="البريد الإلكتروني" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, email: e.target.value})} />
        <input type="tel" placeholder="رقم الهاتف" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input type="password" placeholder="كلمة السر" className="w-full p-3 border rounded-xl" onChange={e => setFormData({...formData, password: e.target.value})} />
        <p className="text-xs text-gray-500">أدخل كود المدير واثنتين من المعلومات الأخرى لاسترداد الحساب.</p>
        <button onClick={handleRecover} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium">استرداد</button>
        <button onClick={() => setView('main')} className="w-full py-2 text-gray-500 text-sm">عودة</button>
      </div>
    </div>
  );
}

function EmployeeManagement() {
  const { token } = useStore();
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchEmployees = async () => {
    // In a real app, we'd fetch from an endpoint. For now, we'll rely on sync data or a specific endpoint.
    // Let's assume we have a way to fetch them or they are in the store.
    // Since we need to manage them, let's add a quick fetch here.
    try {
      const res = await fetch('/api/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.users) setEmployees(data.users.filter((u: any) => u.role === 'employee'));
    } catch (err) {}
  };

  // Call fetchEmployees on mount
  useState(() => {
    fetchEmployees();
  });

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/manager/employees/${id}/status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchEmployees();
  };

  const updatePermissions = async (id: string, permissions: string) => {
    await fetch(`/api/manager/employees/${id}/permissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions })
    });
    fetchEmployees();
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600" />
        إدارة الموظفين
      </h3>
      
      <div className="space-y-4">
        {employees.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">لا يوجد موظفين حالياً</p>
        ) : (
          employees.map(emp => (
            <div key={emp.id} className="p-4 border border-gray-100 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">{emp.name}</span>
                {emp.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(emp.id, 'active')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Check className="w-4 h-4" /></button>
                    <button onClick={() => updateStatus(emp.id, 'rejected')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => updateStatus(emp.id, 'kicked')} className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full hover:bg-red-100">طرد</button>
                )}
              </div>
              {emp.status === 'active' && (
                <select 
                  value={emp.permissions} 
                  onChange={(e) => updatePermissions(emp.id, e.target.value)}
                  className="text-sm p-2 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <option value="sales_only">موظف بيع فقط</option>
                  <option value="sales_inventory">بيع + تعديل وإضافة مخزون</option>
                  <option value="deputy_manager">نائب مدير</option>
                </select>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
