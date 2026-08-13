import React from 'react';

export function Header() {
  return (
    <header className="bg-slate-900 border-b border-slate-800 shadow-md sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        
        {/* الشعار والاسم */}
        <div className="flex items-center gap-4">
          <button
  onClick={() => {
    localStorage.removeItem('pvo_authenticated');
    window.location.reload();
  }}
  className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30 text-xs font-bold transition"
>
  🔒 خروج
</button>
          {/* الشعار المبني بالكامل عن طريق الكود (Code-generated Logo) */}
          <div className="relative flex items-center justify-center p-1.5 bg-white rounded-xl shadow-lg shadow-sky-500/10 border border-slate-700 h-14 min-w-[56px] px-2">
            <div className="flex flex-col items-center justify-center">
              {/* رسمة العين برمجياً عبر SVG */}
              <svg 
                viewBox="0 0 100 45" 
                className="w-11 h-6"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* قوس العين العلوي والسفلي باللون الأسود/الداكن */}
                <path 
                  d="M 5 28 C 25 2, 65 2, 95 20 C 70 32, 50 32, 30 25 M 30 25 C 20 22, 10 24, 5 28" 
                  stroke="#1e293b" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                
                {/* بؤبؤ العين مع التدرج الأزرق */}
                <defs>
                  <radialGradient id="pupilGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="70%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="18" r="8.5" fill="url(#pupilGrad)" stroke="#1e293b" strokeWidth="1.5" />
                <circle cx="48" cy="16" r="2.5" fill="#ffffff" />
              </svg>

              {/* نص Pure Vision أسفل العين */}
              <span className="text-[8px] font-black tracking-widest text-slate-900 uppercase -mt-0.5">
                Pure Vision
              </span>
            </div>

            {/* نقطة حالة الاتصال الخضراء */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" title="النظام متصل" />
          </div>

          {/* تفاصيل الاسم والعنوان */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                شركة ومستودع الرؤيا النقية
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Pure Vision
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              مستلزمات مراكز البصريات • نظام إدارة المبيعات والمخزون
            </p>
          </div>

        </div>

        {/* مؤشر حالة النظام */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>نظام توريد داخلي · ₪</span>
          </div>
        </div>

      </div>
    </header>
  );
}
