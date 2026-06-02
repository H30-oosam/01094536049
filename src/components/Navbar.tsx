import React from 'react';
import { Bell, Search, Globe, Settings, Sun, Moon, Menu, X } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const { isRTL, toggleRTL, theme, toggleTheme, sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <header className="h-20 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      
      {/* Mobile Menu Trigger & Right side branding in Arabic RTL */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* User Info / Brand Label matching the top-right in the image */}
        <div className="hidden md:flex flex-col leading-tight select-none text-right">
          <span className="text-xs font-black text-slate-800">
            HossamElwardany
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-0.5">
            {isRTL ? 'خدمات الموارد البشرية' : 'HR Platform Administration'}
          </span>
        </div>
      </div>
      
      {/* Fine-tuned Centered Search Input matching the image */}
      <div className="hidden md:block w-full max-w-md mx-4">
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
          <input
            type="text"
            placeholder={isRTL ? 'ابحث في النظام...' : 'Search in System...'}
            className={`w-full bg-slate-50 border border-slate-200/60 text-slate-800 font-medium rounded-full py-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 ${
              isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4'
            }`}
          />
        </div>
      </div>

      {/* Left-aligned clean option buttons matching the image */}
      <div className="flex items-center gap-2">
        {/* EN Language toggle */}
        <button
          onClick={toggleRTL}
          className="h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          title={isRTL ? 'English' : 'العربية'}
        >
          <span className="font-extrabold uppercase tracking-wide">{isRTL ? 'EN' : 'AR'}</span>
          <Globe className="w-4 h-4 text-slate-500- stroke-[2]" />
        </button>

        {/* Global settings gear icon styled as circular button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-full hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
          title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
        </button>

        {/* Bell Notification */}
        <NotificationCenter />
      </div>
    </header>
  );
};

export default Navbar;
