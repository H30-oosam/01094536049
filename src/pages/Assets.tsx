import React, { useState } from 'react';
import { 
  Laptop, Smartphone, CreditCard, Box, 
  Search, Plus, User, Calendar, AlertCircle,
  CheckCircle2, Clock, MoreVertical, Download,
  Edit3, Trash2, X
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { logActivity, ActivityType } from '../services/activityService';

interface Asset {
  id: string;
  name: string;
  category: string;
  sn: string;
  assignedTo: string;
  status: 'In Use' | 'Available' | 'In Repair';
  date: string;
  createdAt: string;
  updatedAt: string;
}

const Assets = () => {
  const { isRTL } = useUIStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Laptop',
    sn: '',
    assignedTo: '',
    status: 'Available' as Asset['status']
  });

  const localStorageKey = 'demoAssets';

  const saveAssetsToLocalStorage = (items: Asset[]) => {
    try { localStorage.setItem(localStorageKey, JSON.stringify(items)); } catch {}
  };

  const loadAssetsFromLocalStorage = (): Asset[] | null => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      return raw ? JSON.parse(raw) as Asset[] : null;
    } catch {
      return null;
    }
  };

  const [assets, setAssets] = useState<Asset[]>(() => {
    const stored = loadAssetsFromLocalStorage();
    return stored || [
      { id: '1', name: 'MacBook Pro 14"', category: 'Laptop', sn: 'MBP-2024-X1', assignedTo: 'Alice Freeman', status: 'In Use', date: '2024-01-15', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
      { id: '2', name: 'iPhone 15 Pro', category: 'Mobile', sn: 'IPH-992-B2', assignedTo: 'Zaid Al-Harbi', status: 'In Use', date: '2024-02-10', createdAt: '2024-02-10', updatedAt: '2024-02-10' },
      { id: '3', name: 'Dell UltraSharp 27"', category: 'Monitor', sn: 'DEL-U27-M1', assignedTo: 'Sarah Chen', status: 'Available', date: '-', createdAt: '2024-03-01', updatedAt: '2024-03-01' },
      { id: '4', name: 'Access Card #402', category: 'Security', sn: 'AC-402', assignedTo: 'Omar Farooq', status: 'In Use', date: '2023-12-01', createdAt: '2023-12-01', updatedAt: '2023-12-01' },
      { id: '5', name: 'Logitech MX Master 3', category: 'Input', sn: 'LOG-MX3-S1', assignedTo: 'David Miller', status: 'In Repair', date: '2024-05-01', createdAt: '2024-04-01', updatedAt: '2024-05-01' },
    ];
  });

  const addLocalAsset = (asset: Asset) => {
    setAssets(prev => {
      const next = [...prev, asset];
      saveAssetsToLocalStorage(next);
      return next;
    });
  };

  const updateLocalAsset = (asset: Asset) => {
    setAssets(prev => {
      const next = prev.map(item => item.id === asset.id ? asset : item);
      saveAssetsToLocalStorage(next);
      return next;
    });
  };

  const removeLocalAsset = (id: string) => {
    setAssets(prev => {
      const next = prev.filter(item => item.id !== id);
      saveAssetsToLocalStorage(next);
      return next;
    });
  };

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.sn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Use': return 'bg-emerald-50 text-emerald-600';
      case 'Available': return 'bg-blue-50 text-blue-600';
      case 'In Repair': return 'bg-rose-50 text-rose-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Laptop': return <Laptop className="w-5 h-5" />;
      case 'Mobile': return <Smartphone className="w-5 h-5" />;
      case 'Security': return <CreditCard className="w-5 h-5" />;
      default: return <Box className="w-5 h-5" />;
    }
  };

  const openEditModal = (asset: Asset | null = null) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        name: asset.name,
        category: asset.category,
        sn: asset.sn,
        assignedTo: asset.assignedTo,
        status: asset.status
      });
    } else {
      setEditingAsset(null);
      setFormData({
        name: '',
        category: 'Laptop',
        sn: '',
        assignedTo: '',
        status: 'Available'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Asset = {
      id: editingAsset?.id ?? `asset-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      sn: formData.sn,
      assignedTo: formData.assignedTo,
      status: formData.status,
      date: formData.assignedTo ? new Date().toISOString().split('T')[0] : '-',
      createdAt: editingAsset?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingAsset) {
      updateLocalAsset(payload);
      if (user) logActivity(user as any, 'UPDATE_ASSET', `Updated asset: ${payload.name}`, ActivityType.UPDATE, 'assets');
    } else {
      addLocalAsset(payload);
      if (user) logActivity(user as any, 'CREATE_ASSET', `Created asset: ${payload.name}`, ActivityType.CREATE, 'assets');
    }

    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا الأصل؟' : 'Delete this asset?')) return;
    removeLocalAsset(id);
    if (user) logActivity(user as any, 'DELETE_ASSET', `Deleted asset ID: ${id}`, ActivityType.DELETE, 'assets');
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة الأصول والعهد' : 'IT Asset & Equipment'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'تتبع الأجهزة والعهد المسلمة للموظفين' : 'Track company hardware and equipment assigned to team members'}
          </p>
        </div>
        <button onClick={() => openEditModal()} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          <span>{isRTL ? 'إضافة أصل جديد' : 'Register New Asset'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: isRTL ? 'إجمالي الأصول' : 'Total Assets', val: '248', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: isRTL ? 'قيد الاستخدام' : 'Assigned', val: '192', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: isRTL ? 'متوفر' : 'Available', val: '46', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: isRTL ? 'قيد الإصلاح' : 'Maintenance', val: '10', color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-xl p-6 rounded-5xl border border-white/80 shadow-2xl shadow-indigo-100/20">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
             <div className={`text-2xl font-black ${stat.color} italic`}>{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-6xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="p-8 border-b border-white/40 flex items-center justify-between flex-wrap gap-4">
           <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={isRTL ? 'البحث بالاسم أو الرقم التسلسلي...' : 'Search asset name or S/N...'}
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/80 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest">
            <Download className="w-4 h-4" />
            <span>{isRTL ? 'تقرير الجرد' : 'Inventory Report'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الأصل' : 'Asset'}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الفئة' : 'Category'}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'مسلم لـ' : 'Assigned To'}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'تاريخ التسليم' : 'Assign Date'}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الحالة' : 'Status'}</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-white/40 transition-all group">
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                            {getCategoryIcon(asset.category)}
                         </div>
                         <div>
                            <div className="text-sm font-bold text-slate-900">{asset.name}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">S/N: {asset.sn}</div>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-600">{asset.category}</span>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <User className="w-4 h-4 text-slate-300" />
                         <span className="text-sm font-bold text-slate-700">{asset.assignedTo}</span>
                      </div>
                   </td>
                   <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-xs font-black text-slate-400 uppercase">{asset.date}</span>
                   </td>
                   <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(asset)}
                          className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title={isRTL ? 'تعديل' : 'Edit'}
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title={isRTL ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-8 border-b border-slate-200">
              <h2 className="text-2xl font-black text-indigo-950">
                {editingAsset ? (isRTL ? 'تعديل الأصل' : 'Edit Asset') : (isRTL ? 'إضافة أصل جديد' : 'New Asset')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {isRTL ? 'اسم الأصل' : 'Asset Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isRTL ? 'مثال: MacBook Pro 14"' : 'e.g., MacBook Pro 14"'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {isRTL ? 'الفئة' : 'Category'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  >
                    <option value="Laptop">{isRTL ? 'حاسوب محمول' : 'Laptop'}</option>
                    <option value="Mobile">{isRTL ? 'هاتف ذكي' : 'Mobile'}</option>
                    <option value="Monitor">{isRTL ? 'شاشة' : 'Monitor'}</option>
                    <option value="Security">{isRTL ? 'أمان' : 'Security'}</option>
                    <option value="Input">{isRTL ? 'أدوات إدخال' : 'Input Device'}</option>
                    <option value="Other">{isRTL ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {isRTL ? 'الرقم التسلسلي' : 'Serial Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.sn}
                    onChange={(e) => setFormData({ ...formData, sn: e.target.value })}
                    placeholder={isRTL ? 'مثال: MBP-2024-X1' : 'e.g., MBP-2024-X1'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {isRTL ? 'مسلم لـ' : 'Assigned To'}
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    placeholder={isRTL ? 'اسم الموظف' : 'Employee name'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {isRTL ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Asset['status'] })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  >
                    <option value="In Use">{isRTL ? 'قيد الاستخدام' : 'In Use'}</option>
                    <option value="Available">{isRTL ? 'متوفر' : 'Available'}</option>
                    <option value="In Repair">{isRTL ? 'قيد الإصلاح' : 'In Repair'}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  {editingAsset ? (isRTL ? 'حفظ التعديلات' : 'Update Asset') : (isRTL ? 'إضافة الأصل' : 'Add Asset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
