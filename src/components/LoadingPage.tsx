import React from 'react';

const LoadingPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 selection:bg-indigo-500 font-sans">
      <div className="relative flex items-center justify-center mb-6">
        {/* Triple Spinning Rings */}
        <div className="absolute w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 dark:border-indigo-950 dark:border-t-indigo-400 rounded-full animate-spin"></div>
        <div className="absolute w-18 h-18 border-4 border-emerald-100 border-t-emerald-500 dark:border-emerald-950 dark:border-t-emerald-400 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>
        <div className="w-12 h-12 bg-[#002D62] dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border-2 border-slate-900/10 dark:border-slate-700">
          <span className="text-white text-md font-black">H</span>
        </div>
      </div>

      <div className="text-center animate-pulse">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
          حسام الورداني للموارد البشرية
        </h3>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 antialiased tracking-wide uppercase">
          Hossam Elwardany HR Platform
        </p>
      </div>
      
      <div className="mt-8 flex items-center gap-1.5 ">
        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
      </div>
    </div>
  );
};

export default LoadingPage;
