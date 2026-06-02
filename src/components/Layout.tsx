import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isRTL, theme } = useUIStore();
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'ar' : 'en';
  }, [isRTL]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const isPowerUser = user?.role === 'super-admin' || user?.role === 'admin';

  // Map paths to permission keys
  const getRequiredPermissionForPath = (path: string): string | null => {
    if (path === '/') return 'dashboard';
    if (path.startsWith('/employees') || path.startsWith('/org-chart')) return 'employees';
    if (path.startsWith('/tasks')) return 'tasks';
    if (path.startsWith('/candidates') || path.startsWith('/onboarding') || path.startsWith('/crm')) return 'recruitment';
    if (path.startsWith('/performance') || path.startsWith('/training') || path.startsWith('/payroll') || path.startsWith('/attendance') || path.startsWith('/leaves')) return 'performancePay';
    if (path.startsWith('/announcements') || path.startsWith('/documents') || path.startsWith('/files') || path.startsWith('/assets') || path.startsWith('/logs') || path.startsWith('/whatsapp') || path.startsWith('/settings')) return 'system';
    if (path.startsWith('/users')) return 'permissions';
    return null;
  };

  const reqPerm = getRequiredPermissionForPath(location.pathname);
  let hasAccess = true;
  if (reqPerm && !isPowerUser) {
    const userPerms = (user as any)?.permissions;
    if (userPerms) {
      hasAccess = userPerms[reqPerm] === true;
    } else {
      // Default fallback
      if (user?.role === 'manager') {
        hasAccess = reqPerm !== 'permissions';
      } else if (user?.role === 'employee') {
        hasAccess = reqPerm === 'dashboard' || reqPerm === 'tasks' || reqPerm === 'performancePay'; // Let them see performance pages (like leaves form) if no explicit permissions set
      } else {
        hasAccess = false;
      }
    }
  }

  return (
    <div className={`min-h-screen flex ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isRTL ? 'lg:mr-72' : 'lg:ml-72'
      }`}>
        <Navbar />
        <div className="p-4 md:p-8 pb-16 w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname + '-' + hasAccess}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {hasAccess ? children : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white/60 backdrop-blur-md rounded-4xl border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <span className="text-4xl font-black">🚫</span>
                  </div>
                  <h2 className="text-2xl font-black text-rose-950 mb-2">
                    {isRTL ? 'عذراً، هذه الصفحة غير مصرحة لك' : 'Access Denied / Restricted Page'}
                  </h2>
                  <p className="text-slate-500 font-bold max-w-md">
                    {isRTL 
                      ? 'ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى التواصل مع مسؤول النظام لتعديل صلاحياتك.' 
                      : 'You do not have the required permissions to access this page. Please contact your system administrator.'}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Layout;
