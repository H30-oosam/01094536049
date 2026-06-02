import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, UserPlus, Shield, ShieldAlert, 
  ShieldCheck, MoreVertical, Trash2, Mail, Lock, XCircle
} from 'lucide-react';
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { logActivity, ActivityType } from '../services/activityService';

interface SystemUser {
  id: string;
  email: string;
  role: 'super-admin' | 'admin' | 'manager' | 'employee';
  displayName: string;
  password?: string;
  permissions?: Record<string, boolean>;
}

const Users = () => {
  const { isRTL } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'employee' as SystemUser['role'],
    password: '',
    permissions: {
      dashboard: true,
      employees: false,
      tasks: true,
      recruitment: false,
      performancePay: false,
      system: false,
      permissions: false,
    } as Record<string, boolean>
  });

  const localStorageKey = 'demoUsers';

  const saveUsersToLocalStorage = (items: SystemUser[]) => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const loadUsersFromLocalStorage = (): SystemUser[] | null => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      return raw ? (JSON.parse(raw) as SystemUser[]) : null;
    } catch {
      return null;
    }
  };

  const addLocalUser = (user: SystemUser) => {
    setUsers(prev => {
      const next = [...prev, user];
      saveUsersToLocalStorage(next);
      return next;
    });
  };

  const updateLocalUser = (user: SystemUser) => {
    setUsers(prev => {
      const next = prev.map(item => item.id === user.id ? user : item);
      saveUsersToLocalStorage(next);
      return next;
    });
  };

  const removeLocalUser = (id: string) => {
    setUsers(prev => {
      const next = prev.filter(item => item.id !== id);
      saveUsersToLocalStorage(next);
      return next;
    });
  };

  const defaultUsers: SystemUser[] = [
    { id: 'u1', email: 'admin@example.com', role: 'super-admin', displayName: 'Admin User' },
    { id: 'u2', email: 'manager@example.com', role: 'manager', displayName: 'HR Manager' },
    { id: 'u3', email: 'employee@example.com', role: 'employee', displayName: 'Staff Member' },
  ];

  useEffect(() => {
    const stored = loadUsersFromLocalStorage();
    if (stored?.length) {
      setUsers(stored);
      setLoading(false);
    }

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemUser));
      setUsers(docs);
      saveUsersToLocalStorage(docs);
      setLoading(false);
    }, (error) => {
      console.error('Users fetch failed, using local fallback:', error);
      setUsers(stored?.length ? stored : defaultUsers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateRole = async (userId: string, newRole: SystemUser['role']) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      const existing = users.find(u => u.id === userId);
      if (existing) updateLocalUser({ ...existing, role: newRole });
      if (currentUser) {
        logActivity(
          currentUser as any, 
          'UPDATE_USER_ROLE', 
          `Changed user role: ${userId} to ${newRole}`, 
          ActivityType.UPDATE, 
          'users'
        );
      }
    } catch (error) {
      console.error('Users role update failed, fallback to local update:', error);
      const existing = users.find(u => u.id === userId);
      if (existing) updateLocalUser({ ...existing, role: newRole });
    }
  };

  const openEditModal = (user: SystemUser | null = null) => {
    setShowPassword(false);
    if (user) {
      setEditingUser(user);
      setFormData({ 
        email: user.email, 
        displayName: user.displayName, 
        role: user.role,
        password: user.password || '',
        permissions: user.permissions || {
          dashboard: true,
          employees: ['super-admin', 'admin', 'manager'].includes(user.role),
          tasks: true,
          recruitment: ['super-admin', 'admin', 'manager'].includes(user.role),
          performancePay: ['super-admin', 'admin', 'manager'].includes(user.role),
          system: ['super-admin', 'admin'].includes(user.role),
          permissions: ['super-admin', 'admin'].includes(user.role),
        }
      });
    } else {
      setEditingUser(null);
      setFormData({ 
        email: '', 
        displayName: '', 
        role: 'employee',
        password: '',
        permissions: {
          dashboard: true,
          employees: false,
          tasks: true,
          recruitment: false,
          performancePay: false,
          system: false,
          permissions: false,
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SystemUser = {
      id: editingUser?.id ?? `demo-emp-${Date.now()}`,
      email: formData.email,
      displayName: formData.displayName,
      role: formData.role,
      password: formData.password || '',
      permissions: formData.permissions,
    };

    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', payload.id), {
          email: payload.email,
          displayName: payload.displayName,
          role: payload.role,
          password: payload.password,
          permissions: payload.permissions,
        });
        updateLocalUser(payload);
        if (currentUser) logActivity(currentUser as any, 'UPDATE_USER', `Updated user ${payload.email}`, ActivityType.UPDATE, 'users');
      } else {
        await setDoc(doc(db, 'users', payload.id), {
          uid: payload.id,
          email: payload.email,
          displayName: payload.displayName,
          role: payload.role,
          password: payload.password,
          permissions: payload.permissions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addLocalUser(payload);
        if (currentUser) logActivity(currentUser as any, 'CREATE_USER', `Created user ${payload.email}`, ActivityType.CREATE, 'users');
      }
    } catch (error) {
      console.error('Users save failed, fallback to local only:', error);
      if (editingUser) updateLocalUser(payload); else addLocalUser(payload);
    }

    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا المستخدم؟' : 'Delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      removeLocalUser(userId);
      if (currentUser) logActivity(currentUser as any, 'DELETE_USER', `Deleted user ${userId}`, ActivityType.DELETE, 'users');
    } catch (error) {
      console.error('Users delete failed, fallback local only:', error);
      removeLocalUser(userId);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super-admin': return <ShieldAlert className="w-4 h-4 text-purple-500" />;
      case 'admin': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'manager': return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default: return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة المستخدمين والصلاحيات بالتفصيل' : 'User Management & Permissions Details'}
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            {isRTL ? 'التحكم الدقيق في إنشاء حسابات الموظفين وتخصيص كافة صلاحياتهم بدقة' : 'Granular control over employee account creation and precise permission assignment'}
          </p>
        </div>
        <button onClick={() => openEditModal()} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold cursor-pointer">
          <UserPlus className="w-5 h-5" />
          <span>{isRTL ? 'إضافة موظف / حساب جديد' : 'Add Employee Account'}</span>
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{isRTL ? 'المستخدم' : 'User'}</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{isRTL ? 'الدور / المسمى الوظيفي' : 'Role / Title'}</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{isRTL ? 'بيانات الدخول والملخص' : 'Credentials & Permissions Summary'}</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{isRTL ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3 justify-start flex-row">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                        {user.displayName?.charAt(0) || user.email.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{user.displayName || 'Unnamed User'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {user.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <select 
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value as SystemUser['role'])}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider outline-none border-none ring-0 ${
                          user.role === 'super-admin' ? 'bg-purple-950/20 text-purple-400' : 
                          user.role === 'admin' ? 'bg-rose-500/10 text-rose-400' : 
                          user.role === 'manager' ? 'bg-emerald-500/10 text-emerald-400' : 
                          'bg-indigo-50/50 text-indigo-600'
                        }`}
                      >
                        {currentUser?.role === 'super-admin' && (
                          <option value="super-admin">Super Admin</option>
                        )}
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5 items-start">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{user.email}</span>
                      </div>
                      {user.password && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-mono bg-slate-100 rounded px-1.5 py-0.5 text-slate-700">
                            {revealedPasswords[user.id] ? user.password : '••••••••'}
                          </span>
                          <button 
                            onClick={() => setRevealedPasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))} 
                            className="text-[10px] text-indigo-600 font-black hover:underline cursor-pointer"
                          >
                            {revealedPasswords[user.id] ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'إظهار' : 'Show')}
                          </button>
                        </div>
                      )}
                      
                      {/* Permissions Summary Tags */}
                      <div className="flex flex-wrap gap-1 mt-1 max-w-sm">
                        {user.permissions ? Object.entries(user.permissions).map(([key, val]) => {
                          if (!val) return null;
                          let labelAr = '';
                          let labelEn = '';
                          if (key === 'dashboard') { labelAr = 'الرئيسية'; labelEn = 'Dashboard'; }
                          else if (key === 'employees') { labelAr = 'الموظفين'; labelEn = 'Employees'; }
                          else if (key === 'tasks') { labelAr = 'المهام'; labelEn = 'Tasks'; }
                          else if (key === 'recruitment') { labelAr = 'التوظيف'; labelEn = 'Recruitment'; }
                          else if (key === 'performancePay') { labelAr = 'الرواتب'; labelEn = 'Performance'; }
                          else if (key === 'system') { labelAr = 'النظام'; labelEn = 'System'; }
                          else if (key === 'permissions') { labelAr = 'الصلاحيات'; labelEn = 'Permissions'; }
                          
                          return (
                            <span key={key} className="text-[9px] bg-indigo-50 text-indigo-700 font-black px-1.5 py-0.5 rounded-lg border border-indigo-100/40">
                              {isRTL ? labelAr : labelEn}
                            </span>
                          );
                        }) : (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 font-bold rounded-lg border border-amber-100">
                            {isRTL ? 'صلاحيات تلقائية حسب الفئة' : 'Default Role Access'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEditModal(user)} className="p-2 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer" title={isRTL ? 'تعديل الصلاحيات والمستخدم' : 'Edit Credentials'}>
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer" title={isRTL ? 'حذف الحساب' : 'Delete User'}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <UsersIcon className="w-12 h-12" />
                      <p className="font-bold">{isRTL ? 'لا يوجد مستخدمين مسجلين' : 'No registered users found'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingUser ? (isRTL ? 'تعديل بيانات وصلاحيات الموظف' : 'Modify Employee & Permissions') : (isRTL ? 'إنشاء حساب موظف جديد' : 'New Employee Account')}
                </h2>
                <p className="text-sm text-slate-500">
                  {isRTL ? 'قم بتعيين اسم المستخدم، كلمة السر، وحدد صلاحياته بدقة' : 'Set username, password, and specify strict system access permissions'}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer">
                <XCircle className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                    {isRTL ? 'الاسم الكامل للموظف' : 'Full Employee Name'}
                  </label>
                  <input
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder={isRTL ? 'مثال: أحمد محمد' : 'Full Name'}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                    {isRTL ? 'البريد الإلكتروني (اسم المستخدم)' : 'Corporate Email Address'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="employee@company.com"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                    {isRTL ? 'كلمة المرور المشفرة' : 'Secure Account Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-600 hover:underline cursor-pointer"
                    >
                      {showPassword ? (isRTL ? 'إخفاء' : 'عرض') : (isRTL ? 'عرض' : 'Show')}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                    {isRTL ? 'التصنيف الأساسي للموظف' : 'Employee Basic Role Group'}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const selRole = e.target.value as any;
                      const isPowerUser = ['super-admin', 'admin', 'manager'].includes(selRole);
                      setFormData({
                        ...formData,
                        role: selRole,
                        permissions: {
                          dashboard: true,
                          employees: isPowerUser,
                          tasks: true,
                          recruitment: isPowerUser,
                          performancePay: isPowerUser,
                          system: ['super-admin', 'admin'].includes(selRole),
                          permissions: ['super-admin', 'admin'].includes(selRole),
                        }
                      });
                    }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                  >
                    {currentUser?.role === 'super-admin' && <option value="super-admin">Super Admin</option>}
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
              </div>

              {/* Granular Checkboxes Accordion */}
              <div className="space-y-2 mt-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.1em] block">
                  {isRTL ? 'تخصيص الصلاحيات الفردية بدقة (تفعيل / إلغاء صفحات محددة)' : 'Customize Precise Granular Permissions (Enable/Disable Pages)'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-slate-50 rounded-3xl border border-slate-150 max-h-52 overflow-y-auto">
                  {[
                    { key: 'dashboard', labelAr: 'لوحة القيادة والتحليلات الرئيسية', labelEn: 'Dashboard & Analytics' },
                    { key: 'employees', labelAr: 'بيانات الموظفين والترقيات الهيكلية', labelEn: 'Employee Profiles & Org Chart' },
                    { key: 'tasks', labelAr: 'متابعة وإسناد المهام المطلوبة', labelEn: 'Task Assignments' },
                    { key: 'recruitment', labelAr: 'إدارة التوظيف والمرشحين وتجربة CRM', labelEn: 'Recruitment, Candidates & onboarding' },
                    { key: 'performancePay', labelAr: 'الأداء والرواتب وحضور الموظفين والإجازات', labelEn: 'Performance, Payroll, Attendance' },
                    { key: 'system', labelAr: 'التحكم بالتعاميم والملفات وإرسال واتساب وبث النشرات', labelEn: 'Documents, Bulletins, WhatsApp Connect' },
                    { key: 'permissions', labelAr: 'إدارة حسابات المسؤولين وتشفير الصلاحيات العليا', labelEn: 'User Accounts & Roles Control' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-100 hover:bg-indigo-50/30 transition-colors cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.permissions[item.key] === true}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [item.key]: e.target.checked
                          }
                        })}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 leading-tight">
                        {isRTL ? item.labelAr : item.labelEn}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold cursor-pointer">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-8 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 cursor-pointer">
                  {editingUser ? (isRTL ? 'تحديث الحساب' : 'Update Credentials') : (isRTL ? 'إنشاء الآن' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
