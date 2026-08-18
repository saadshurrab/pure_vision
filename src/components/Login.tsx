import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🔑 كلمة المرور المطلوبة
  const SECRET_PASSWORD = '2864341'; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('يرجى إدخال كلمة المرور أولاً.');
      return;
    }

    setIsLoading(true);

    // محاكاة استجابة سريعة لإعطاء انطباع احترافي بالتحقق
    setTimeout(() => {
      if (password === SECRET_PASSWORD) {
        sessionStorage.setItem('pvo_authenticated', 'true');
        onLoginSuccess();
      } else {
        setError('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.');
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none" 
      dir="rtl"
    >
      {/* 🌌 خلفية تفاعلية بلمسات بصريات حديثة (أضواء نيون خافتة) */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* 💳 بطاقة تسجيل الدخول الرئيسية */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-sky-950/40 space-y-7">
          
          {/* الترويسة الشعار والعنوان */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl blur-sm opacity-25 group-hover:opacity-50 transition duration-300" />
              <div className="relative bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-center shadow-inner">
                <img 
                  src="/logo.png" 
                  alt="شعار شركة ومستودع الرؤيا النقية" 
                  className="h-16 w-auto object-contain filter drop-shadow"
                />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-black text-white tracking-tight">
                شركة ومستودع الرؤيا النقية
              </h1>
              <p className="text-xs font-medium text-sky-400/90 tracking-wide">
                Pure Vision Optics • نظام إدارة المبيعات
              </p>
            </div>
          </div>

          {/* شريط الإشارة للأمان */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-200">الوصول المحمي للنظام</p>
              <p className="text-[11px] text-slate-400">أدخل كلمة المرور الخاصة بالبوابة للبدء</p>
            </div>
          </div>

          {/* نموذج إدخال كلمة المرور */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 text-right pr-1">
                كلمة المرور
              </label>
              
              <div className="relative">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="• • • • • • • •"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  disabled={isLoading}
                  className={`w-full pr-10 pl-10 py-3 text-sm text-white bg-slate-950/60 border ${
                    error ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:border-sky-500 focus:ring-sky-500/20'
                  } rounded-xl font-mono focus:outline-none focus:ring-4 transition duration-200 placeholder-slate-600 dir-ltr text-left`}
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-xs font-semibold text-rose-400 pt-1 pr-1 text-right animate-shake">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-sky-500/20 active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>الدخول إلى لوحة التحكم</span>
                  <ArrowLeft className="w-4 h-4 text-sky-100 group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* التذييل الحقوق */}
          <div className="pt-2 text-center border-t border-slate-800/60">
            <p className="text-[11px] text-slate-500 font-medium">
              جميع الحقوق محفوظة © {new Date().getFullYear()} شركة الرؤيا النقية
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
