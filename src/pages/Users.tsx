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
}

const Users = () => {
  const { isRTL } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'employee' as SystemUser['role'],
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
    if (user) {
      setEditingUser(user);
      setFormData({ email: user.email, displayName: user.displayName, role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ email: '', displayName: '', role: 'employee' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SystemUser = {
      id: editingUser?.id ?? `local-${Date.now()}`,
      email: formData.email,
      displayName: formData.displayName,
      role: formData.role,
    };

    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', payload.id), {
          email: payload.email,
          displayName: payload.displayName,
          role: payload.role,
        });
        updateLocalUser(payload);
        if (currentUser) logActivity(currentUser as any, 'UPDATE_USER', `Updated user ${payload.email}`, ActivityType.UPDATE, 'users');
      } else {
        await setDoc(doc(db, 'users', payload.id), {
          email: payload.email,
          displayName: payload.displayName,
          role: payload.role,
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
            {isRTL ? 'إدارة المستخدمين والصلاحيات' : 'User Management & Permissions'}
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            {isRTL ? 'التحكم في من يمكنه الوصول للنظام وماذا يشاهد' : 'Control who can access the system and what they see'}
          </p>
        </div>
        <button onClick={() => openEditModal()} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold">
          <UserPlus className="w-5 h-5" />
          <span>{isRTL ? 'إضافة مستخدم' : 'Add User'}</span>
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'المستخدم' : 'User'}</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الدور / الصلاحية' : 'Role / Permission'}</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'البريد الإلكتروني' : 'Email'}</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {user.displayName?.charAt(0) || user.email.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{user.displayName || 'Unnamed User'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {user.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <select 
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value as SystemUser['role'])}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider outline-none border-none ring-0 ${
                        user.role === 'super-admin' ? 'bg-purple-950/20 text-purple-400' : 
                        user.role === 'admin' ? 'bg-rose-500/10 text-rose-400' : 
                        user.role === 'manager' ? 'bg-emerald-500/10 text-emerald-400' : 
                        'bg-white/5 text-slate-400'
                      }`}
                    >
                      {currentUser?.role === 'super-admin' && (
                        <option value="super-admin">Super Admin</option>
                      )}
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEditModal(user)} className="p-2 text-indigo-600 hover:text-indigo-800 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
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
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">{editingUser ? (isRTL ? 'تعديل مستخدم' : 'Edit User') : (isRTL ? 'إضافة مستخدم جديد' : 'Add New User')}</h2>
                <p className="text-sm text-slate-500">{isRTL ? 'يمكنك تعديل بيانات المستخدم وصلاحياته' : 'Edit user details and permissions'}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-all">
                <XCircle className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder={isRTL ? 'الاسم الكامل' : 'Full Name'}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {currentUser?.role === 'super-admin' && <option value="super-admin">Super Admin</option>}
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-8 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                  {editingUser ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'حفظ' : 'Save')}
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
