import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Search, Filter, MoreVertical, 
  Clock, Calendar, CheckCircle2, Loader2, Users, LayoutGrid, List, XCircle
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { logActivity, ActivityType } from '../services/activityService';

const Projects = () => {
  const { isRTL, currency } = useUIStore();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: 0,
  });

  const localStorageKey = 'demoProjects';

  const saveProjectsToLocalStorage = (items: any[]) => {
    try { localStorage.setItem(localStorageKey, JSON.stringify(items)); } catch {}
  };

  const loadProjectsFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const defaultProjects = [
    {
      id: 'p1',
      name: 'HR Portal Launch',
      description: 'Internal portal setup for HR workflows.',
      status: 'active',
      startDate: '2024-05-01',
      endDate: '2024-12-31',
      budget: 12000,
    },
  ];

  useEffect(() => {
    const stored = loadProjectsFromLocalStorage();
    if (stored?.length) {
      setProjects(stored);
      setLoading(false);
    }

    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(docs);
      saveProjectsToLocalStorage(docs);
      setLoading(false);
    }, (error) => {
      console.error('Project fetch failed, using local fallback:', error);
      setProjects(stored?.length ? stored : defaultProjects);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openModal = (project: any | null = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
      });
    } else {
      setEditingProject(null);
      setFormData({ name: '', description: '', status: 'planning', startDate: new Date().toISOString().split('T')[0], endDate: '', budget: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectPayload = {
      ...formData,
      id: editingProject?.id ?? `local-${Date.now()}`,
      createdBy: user?.uid,
      createdAt: editingProject?.createdAt || serverTimestamp(),
    };

    try {
      if (editingProject) {
        await updateDoc(doc(db, 'projects', editingProject.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        setProjects(prev => prev.map(item => item.id === editingProject.id ? { ...item, ...formData, updatedAt: new Date() } : item));
      } else {
        await addDoc(collection(db, 'projects'), {
          ...formData,
          createdBy: user?.uid,
          createdAt: serverTimestamp(),
        });
      }
      if (user) logActivity(user as any, editingProject ? 'UPDATE_PROJECT' : 'CREATE_PROJECT', `${editingProject ? 'Updated' : 'Created'} project: ${formData.name}`, editingProject ? ActivityType.UPDATE : ActivityType.CREATE, 'projects');
      if (!editingProject) setProjects(prev => [...prev, projectPayload]);
    } catch (error) {
      console.error('Project save failed, using local fallback:', error);
      if (editingProject) {
        setProjects(prev => prev.map(item => item.id === editingProject.id ? { ...item, ...formData } : item));
      } else {
        setProjects(prev => [...prev, projectPayload]);
      }
      saveProjectsToLocalStorage(editingProject ? projects.map(item => item.id === editingProject.id ? { ...item, ...formData } : item) : [...projects, projectPayload]);
    }

    setIsModalOpen(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', status: 'planning', startDate: new Date().toISOString().split('T')[0], endDate: '', budget: 0 });
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا المشروع؟' : 'Delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(prev => prev.filter(item => item.id !== projectId));
      saveProjectsToLocalStorage(projects.filter(item => item.id !== projectId));
      if (user) logActivity(user as any, 'DELETE_PROJECT', `Deleted project ${projectId}`, ActivityType.DELETE, 'projects');
    } catch (error) {
      console.error('Project delete failed, using local fallback:', error);
      setProjects(prev => prev.filter(item => item.id !== projectId));
      saveProjectsToLocalStorage(projects.filter(item => item.id !== projectId));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة المشاريع' : 'Project Management'}
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            {isRTL ? 'تخطيط ومتابعة مشاريع الشركة' : 'Plan and track company projects'}
          </p>
        </div>
        <button 
          onClick={() => openModal(null)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>{isRTL ? 'مشروع جديد' : 'New Project'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : projects.map((project) => (
          <div key={project.id} className="bg-white/60 border border-white/80 p-6 rounded-4xl shadow-xl shadow-indigo-100/20 hover:shadow-2xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openModal(project)} className="px-3 py-1 text-xs font-black uppercase text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                  {isRTL ? 'تعديل' : 'Edit'}
                </button>
                <button onClick={() => handleDelete(project.id)} className="px-3 py-1 text-xs font-black uppercase text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-all">
                  {isRTL ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
              project.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {project.status}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-2 mt-4">{project.name}</h3>
            <p className="text-sm text-slate-500 mb-6 line-clamp-2">{project.description}</p>
            
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{project.endDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-indigo-600">{currency} {project.budget?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-5xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{editingProject ? (isRTL ? 'تعديل المشروع' : 'Edit Project') : (isRTL ? 'إضافة مشروع جديد' : 'New Project')}</h2>
                <p className="text-sm text-slate-500">{isRTL ? 'حدّث بيانات المشروع أو أنشئ مشروعاً جديداً' : 'Update the project details or create a new one'}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingProject(null); }} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-all">
                <XCircle className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                placeholder={isRTL ? 'اسم المشروع' : 'Project Name'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.name}
                required
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <textarea 
                placeholder={isRTL ? 'الوصف' : 'Description'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 h-32"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <input 
                  type="date"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="date"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                />
                <input 
                  type="number"
                  placeholder={isRTL ? 'الميزانية' : 'Budget'}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={formData.budget}
                  onChange={e => setFormData({...formData, budget: Number(e.target.value)})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingProject(null); }} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">
                  {editingProject ? (isRTL ? 'تحديث المشروع' : 'Update Project') : (isRTL ? 'حفظ المشروع' : 'Save Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
