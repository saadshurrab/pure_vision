import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 🔑 حدد كلمة المرور المطلوبة هنا (يمكنك تغييرها لاحقاً)
  const SECRET_PASSWORD = '2864341'; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SECRET_PASSWORD) {
      localStorage.setItem('pvo_authenticated', 'true');
      onLoginSuccess();
    } else {
      setError('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6">
        
        {/* الشعار الرسمي للشركة */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center mb-1">
            <img 
              src="/logo.png" 
              alt="شعار شركة ومستودع الرؤيا النقية" 
              className="h-20 w-auto object-contain drop-shadow-sm"
            />
          </div>
          <h2 className="text-xl font-black text-slate-800 mt-2">
            شركة ومستودع الرؤيا النقية
          </h2>
          <p className="text-xs text-slate-500">Pure Vision Optics • نظام إدارة المبيعات</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-center gap-2 text-slate-700 font-bold text-sm mb-1">
            <Lock className="w-4 h-4 text-sky-600" />
            <span>النظام محمي بكلمة مرور</span>
          </div>
          <p className="text-xs text-slate-500">أدخل كلمة المرور للوصول إلى لوحة التحكم والطلب</p>
        </div>

        {/* نموذج إدخال كلمة المرور */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full text-center p-3 text-base font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-800"
              autoFocus
            />
            {error && <p className="text-xs text-rose-600 font-bold mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-600/20"
          >
            الدخول إلى النظام 🔓
          </button>
        </form>

      </div>
    </div>
  );
}
