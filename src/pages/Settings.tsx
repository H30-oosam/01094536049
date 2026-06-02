import React from 'react';
import { Settings as SettingsIcon, Shield, Bell, Globe, User, Palette } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const Settings = () => {
  const { isRTL, toggleRTL, theme, toggleTheme, logoUrl, systemName, updateBranding, currency, setCurrency } = useUIStore();

  const handleBrandingUpdate = () => {
    const newName = prompt(isRTL ? 'أدخل اسم النظام الجديد' : 'Enter new system name', systemName);
    const newLogo = prompt(isRTL ? 'أدخل رابط شعار الموقع الجديد' : 'Enter new logo URL', logoUrl);
    if (newName || newLogo) {
      updateBranding({ systemName: newName || systemName, logoUrl: newLogo || logoUrl });
    }
  };

  const handleCurrencyUpdate = () => {
    const newCurrency = prompt(isRTL ? 'أدخل رمز العملة (مثل EGP, USD, SAR)' : 'Enter currency code (e.g. EGP, USD, SAR)', currency);
    if (newCurrency) {
      setCurrency(newCurrency.toUpperCase());
    }
  };

  const settingsGroups = [
    {
      title: isRTL ? 'العلامة التجارية' : 'Branding',
      items: [
        { title: isRTL ? 'اسم النظام' : 'System Name', desc: isRTL ? 'الاسم الذي يظهر في أعلى الشاشة' : 'The name displayed at the top', icon: User, action: handleBrandingUpdate, value: systemName },
        { title: isRTL ? 'شعار الموقع' : 'Site Logo', desc: isRTL ? 'تغيير صورة الشعار الرئيسية' : 'Change the main logo image', icon: Palette, action: handleBrandingUpdate, value: 'IMAGE URL' },
      ]
    },
    {
      title: isRTL ? 'عام' : 'General',
      items: [
        { title: isRTL ? 'اللغة' : 'Language', desc: isRTL ? 'تغيير لغة النظام' : 'Change system language', icon: Globe, action: toggleRTL, value: isRTL ? 'العربية' : 'English' },
        { title: isRTL ? 'العملة الافتراضية' : 'Default Currency', desc: isRTL ? 'تغيير العملة المستخدمة في النظام' : 'Change major system currency', icon: Palette, action: handleCurrencyUpdate, value: currency },
        { title: isRTL ? 'المظهر' : 'Appearance', desc: isRTL ? 'التبديل بين الوضع الليلي والنهاري' : 'Switch between light and dark mode', icon: Palette, action: toggleTheme, value: theme.toUpperCase() },
      ]
    },
    {
      title: isRTL ? 'الأمان' : 'Security',
      items: [
        { title: isRTL ? 'كلمة المرور' : 'Password', desc: isRTL ? 'تغيير كلمة مرور حسابك' : 'Change your account password', icon: Shield, action: () => {}, value: '********' },
        { title: isRTL ? 'التنبيهات' : 'Notifications', desc: isRTL ? 'إدارة تفضيلات التنبيه' : 'Manage notification preferences', icon: Bell, action: () => {}, value: 'Enabled' },
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? 'الإعدادات' : 'System Settings'}
        </h1>
        <p className="text-gray-500 font-medium">
          {isRTL ? 'تخصيص نظام Hossam HR حسب تفضيلاتك' : 'Customize Hossam HR to your preferences'}
        </p>
      </div>

      <div className="space-y-8">
        {settingsGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4">{group.title}</h3>
            <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
               <div className="divide-y divide-white/20">
                 {group.items.map((item, iIdx) => (
                   <div key={iIdx} className="p-6 flex items-center justify-between hover:bg-white/40 transition-all group">
                      <div className="flex items-center gap-5">
                         <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <item.icon className="w-6 h-6" />
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">{item.value}</span>
                         <button 
                           onClick={item.action}
                           className="px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 shadow-sm hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                         >
                           {isRTL ? 'تعديل' : 'Modify'}
                         </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
