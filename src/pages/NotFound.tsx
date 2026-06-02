import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const NotFound = () => {
  const navigate = useNavigate();
  const { isRTL } = useUIStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl td-card bg-white dark:bg-slate-900 p-8 md:p-12 text-center rounded-3xl border-2 border-slate-900/15">
        
        {/* Visual 404 Illustration */}
        <div className="relative mb-8 text-neutral-800 dark:text-neutral-100 font-serif font-black italic select-none">
          <span className="text-8xl sm:text-9xl leading-none text-slate-100 dark:text-slate-800 drop-shadow-[4px_4px_0px_#002D62] dark:drop-shadow-[4px_4px_0px_#38bdf8]">
            404
          </span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white rounded-2xl border-2 border-slate-900 px-4 py-2 text-sm uppercase tracking-wider font-extrabold shadow-[3px_3px_0px_0px_#000]">
            {isRTL ? 'الصفحة غير موجودة' : 'Not Found'}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 leading-tight">
          {isRTL ? 'عفواً، هذه الصفحة ضلت طريقها' : 'Page Not Found'}
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
          {isRTL 
            ? 'ربما تمت إزالة الصفحة التي تبحث عنها، أو تم تغيير اسمها، أو أنها غير متاحة مؤقتاً.'
            : 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'}
        </p>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="td-btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isRTL ? 'رجوع للخلف' : 'Go Back'}</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="td-btn-primary w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{isRTL ? 'الصحفة الرئيسية' : 'Go Home'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
