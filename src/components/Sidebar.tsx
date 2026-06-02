import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  CalendarDays, 
  Wallet, 
  Briefcase, 
  GraduationCap, 
  Settings, 
  LogOut,
  LayoutDashboard,
  UserPlus,
  TrendingUp,
  CheckSquare,
  Map,
  History,
  ScrollText,
  Megaphone,
  FileText,
  BarChart3,
  Shield,
  Heart,
  Rocket,
  Box,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Sidebar = () => {
  const { isRTL, logoUrl, systemName, sidebarOpen, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  const handleSignOut = async () => {
    localStorage.removeItem('demoUser');
    localStorage.removeItem('authToken');
    await signOut(auth);
  };

  const categories = [
    {
      title: isRTL ? 'الرئيسية' : 'Main',
      items: [
        { name: isRTL ? 'لوحة القيادة' : 'Dashboard', icon: LayoutDashboard, path: '/' },
      ]
    },
    {
      title: isRTL ? 'إدارة الموظفين' : 'Employee Management',
      items: [
        { name: isRTL ? 'الموظفون' : 'Employees', icon: Users, path: '/employees' },
        { name: isRTL ? 'الهيكل التنظيمي' : 'Org Chart', icon: Users, path: '/org-chart' },
        { name: isRTL ? 'المهام' : 'Tasks', icon: CheckSquare, path: '/tasks' },
      ]
    },
    {
      title: isRTL ? 'التوظيف' : 'Recruitment',
      items: [
        { name: isRTL ? 'المرشحون' : 'Candidates', icon: UserPlus, path: '/candidates', badge: 630 },
        { name: isRTL ? 'تهيئة الموظفين الجدد' : 'Onboarding', icon: Rocket, path: '/onboarding' },
        { name: isRTL ? 'تجربة الموظف' : 'Employee CRM', icon: Heart, path: '/crm' },
      ]
    },
    {
      title: isRTL ? 'الأداء والتطوير' : 'Performance & Payroll',
      items: [
        { name: isRTL ? 'الأداء والتقييم' : 'Performance', icon: TrendingUp, path: '/performance' },
        { name: isRTL ? 'التدريب والتطوير' : 'Training', icon: GraduationCap, path: '/training' },
        { name: isRTL ? 'الرواتب والمسيرات' : 'Payroll', icon: Wallet, path: '/payroll' },
        { name: isRTL ? 'الحضور والانصراف' : 'Attendance', icon: Clock, path: '/attendance' },
        { name: isRTL ? 'الإجازات والطلبات' : 'Leaves', icon: Calendar, path: '/leaves' },
      ]
    },
    {
      title: isRTL ? 'النظام' : 'System Settings',
      items: [
        { name: isRTL ? 'الإعلانات' : 'News & Broadcast', icon: Megaphone, path: '/announcements' },
        { name: isRTL ? 'جهاز العقود والتعاميم' : 'Documents Builder', icon: ScrollText, path: '/documents' },
        { name: isRTL ? 'الملفات والمستندات' : 'Files', icon: FileText, path: '/files' },
        { name: isRTL ? 'الأصول والموارد' : 'Assets Management', icon: Box, path: '/assets' },
        { name: isRTL ? 'سجل العمليات والتدقيق' : 'Audit Logs', icon: History, path: '/logs' },
        { name: isRTL ? 'الصلاحيات والمستخدمين' : 'Permissions', icon: Shield, path: '/users' },
        { name: isRTL ? 'ربط واتساب ويب' : 'WhatsApp Web Connect', icon: MessageSquare, path: '/whatsapp' },
        { name: isRTL ? 'إعدادات النظام والصفحات' : 'Settings', icon: Settings, path: '/settings' },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-[#070e1b]/40 backdrop-blur-sm z-55 transition-opacity duration-300 lg:hidden ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <div className={`fixed top-0 bottom-0 w-72 bg-[#0a1120] border-none flex flex-col z-60 transition-transform duration-300 ease-out lg:translate-x-0 ${
        isRTL 
          ? `right-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}` 
          : `left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
      }`}>
        
        {/* Flat Premium Branding Area with custom icon nodes & user-defined name text */}
        <div className="p-6 border-b border-white/8 mb-2">
          <div className="flex items-center justify-between gap-3 flex-row-reverse">
            <div className="w-10 h-10 bg-[#135bf6] rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/10 shrink-0">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            
            <div className="text-right flex-1 select-none">
              <h2 className="text-sm font-black text-white tracking-tight leading-tight">
                {isRTL ? 'خدمات الموارد البشرية' : 'HR Services'}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-1">
                HossamElwardany
              </p>
            </div>
          </div>
          
          <div className="mt-4 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-wider rounded-lg uppercase flex items-center gap-2 border border-emerald-500/15 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ACTIVE & SAFE</span>
          </div>
        </div>

        {/* Categorized and polished Navigation with hover states */}
        <nav className="flex-1 px-4 py-3 space-y-5 overflow-y-auto custom-scrollbar">
          {categories.map((cat, index) => (
            <div key={index} className="space-y-1">
              <p className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">
                {cat.title}
              </p>
              <div className="space-y-0.5">
                {cat.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#135bf6] text-white font-black'
                          : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4 stroke-[2.5] shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-[#1f293d] text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User identification card at the bottom */}
        <div className="p-4 border-t border-white/5 bg-[#070d18]">
          <div className="mb-3 px-3 py-2 flex items-center gap-2.5 bg-white/5 rounded-xl border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-[#135bf6] text-white flex items-center justify-center font-black text-sm shrink-0">
              {user?.displayName?.charAt(0) || 'H'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.displayName || 'HossamElwardany'}
              </p>
              <p className="text-[9px] text-gray-500 truncate font-black uppercase mt-0.5">
                {isRTL ? 'مدير الموارد البشرية' : 'HR Administrator'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-rose-500 bg-white/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isRTL ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
