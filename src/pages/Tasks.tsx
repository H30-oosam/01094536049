import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Plus, Search, Filter, 
  Clock, Calendar, CheckCircle2, Loader2, Users, 
  Trash2, User, AlertCircle, Edit3
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { logActivity, ActivityType } from '../services/activityService';
import { motion, AnimatePresence } from 'motion/react';

const Tasks = () => {
  const { isRTL } = useUIStore();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: '',
  });
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const localStorageKey = 'demoTasks';

  const saveTasksToLocalStorage = (items: any[]) => {
    try { localStorage.setItem(localStorageKey, JSON.stringify(items)); } catch {}
  };
  const loadTasksFromLocalStorage = (): any[] | null => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const stored = loadTasksFromLocalStorage();
    if (stored?.length) {
      setTasks(stored);
      setLoading(false);
    }

    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(docs);
      saveTasksToLocalStorage(docs);
      setLoading(false);
    }, (error) => {
      console.error('Tasks fetch failed, using local fallback:', error);
      setTasks(stored ?? []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openTaskModal = (task: any | null = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo || '',
      });
    } else {
      setEditingTask(null);
      setFormData({ title: '', priority: 'medium', status: 'todo', dueDate: new Date().toISOString().split('T')[0], assignedTo: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, createdBy: user?.uid, createdAt: editingTask?.createdAt || serverTimestamp() };
    try {
      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), payload);
        setTasks(prev => prev.map(task => task.id === editingTask.id ? { ...task, ...formData } : task));
      } else {
        await addDoc(collection(db, 'tasks'), payload);
        setTasks(prev => [{ id: `local-${Date.now()}`, ...payload }, ...prev]);
      }
      if (user) {
        logActivity(user as any, editingTask ? 'UPDATE_TASK' : 'CREATE_TASK', `${editingTask ? 'Updated' : 'Created'} task: ${formData.title}`, editingTask ? ActivityType.UPDATE : ActivityType.CREATE, 'tasks');
      }
      saveTasksToLocalStorage(editingTask ? tasks.map(task => task.id === editingTask.id ? { ...task, ...formData } : task) : [{ id: `local-${Date.now()}`, ...payload }, ...tasks]);
      setIsModalOpen(false);
      setEditingTask(null);
      setFormData({ title: '', priority: 'medium', status: 'todo', dueDate: new Date().toISOString().split('T')[0], assignedTo: '' });
    } catch (error) {
      console.error('Task save failed, using local fallback:', error);
      if (editingTask) {
        setTasks(prev => prev.map(task => task.id === editingTask.id ? { ...task, ...formData } : task));
      } else {
        const localTask = { id: `local-${Date.now()}`, ...payload };
        setTasks(prev => [localTask, ...prev]);
      }
      setIsModalOpen(false);
      setEditingTask(null);
    }
  };

  const isDueDatePast = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  const isTaskOverdue = (task: any) => {
    if (task.status === 'done') return false;
    return isDueDatePast(task.dueDate);
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    if (togglingTaskId) return;
    setTogglingTaskId(taskId);

    // Keep state active during checkbox animation sequence
    await new Promise(resolve => setTimeout(resolve, 450));

    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    setTasks(prev => {
      const next = prev.map(task => task.id === taskId ? { ...task, status: newStatus } : task);
      saveTasksToLocalStorage(next);
      return next;
    });
    setTogglingTaskId(null);

    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
    } catch (error) {
      console.error('Task toggle failed, using local fallback:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذه المهمة؟' : 'Delete this task?')) return;
    setTasks(prev => {
      const next = prev.filter(task => task.id !== taskId);
      saveTasksToLocalStorage(next);
      return next;
    });
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Task delete failed, using local fallback:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterMode === 'pending') {
      return task.status !== 'done';
    }
    if (filterMode === 'completed') {
      return task.status === 'done';
    }
    if (filterMode === 'overdue') {
      return isTaskOverdue(task);
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aDone = a.status === 'done';
    const bDone = b.status === 'done';
    if (aDone && !bDone) return 1;
    if (!aDone && bDone) return -1;
    return 0;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'متابعة المهام' : 'Task Tracker'}
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            {isRTL ? 'إدارة مهام الفريق والإنتاجية' : 'Manage team tasks and productivity'}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>{isRTL ? 'مهمة جديدة' : 'New Task'}</span>
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="p-6 border-b border-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800">{isRTL ? 'المهام الجارية' : 'Ongoing Tasks'}</h3>
            <div className="flex gap-2 mt-1.5">
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase">Todo: {tasks.filter(t => t.status !== 'done').length}</div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase">Done: {tasks.filter(t => t.status === 'done').length}</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                  : 'bg-white/80 text-indigo-950 border-[#002D62]/10 hover:border-indigo-400'
              }`}
            >
              {isRTL ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 transition-all cursor-pointer ${
                filterMode === 'pending'
                  ? 'bg-[#002D62] text-white border-[#002D62] shadow-md shadow-indigo-100'
                  : 'bg-white/80 text-indigo-950 border-[#002D62]/10 hover:border-indigo-400'
              }`}
            >
              {isRTL ? 'قيد العمل' : 'Pending'}
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 transition-all cursor-pointer ${
                filterMode === 'completed'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                  : 'bg-white/80 text-indigo-950 border-[#002D62]/10 hover:border-indigo-400'
              }`}
            >
              {isRTL ? 'المكتملة' : 'Completed'}
            </button>
            <button
              onClick={() => setFilterMode('overdue')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 transition-all cursor-pointer ${
                filterMode === 'overdue'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200 animate-pulse'
                  : 'bg-white/80 text-rose-600 border-rose-200 hover:border-rose-400 font-extrabold'
              }`}
            >
              {isRTL ? 'المتأخرة' : 'Overdue'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100 relative">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <AnimatePresence initial={false}>
              {sortedTasks.map((task) => {
                const isOverdue = isTaskOverdue(task);
                const isToggling = togglingTaskId === task.id;
                const isChecked = isToggling ? (task.status !== 'done') : (task.status === 'done');
                return (
                  <motion.div 
                    layout
                    key={task.id} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className={`p-5 flex items-center justify-between hover:bg-white/40 transition-colors group ${
                      isOverdue ? 'bg-rose-50/15 hover:bg-rose-50/25 border-l-4 border-rose-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <motion.button 
                        onClick={() => toggleTask(task.id, task.status)}
                        animate={isToggling ? {
                          scale: [1, 1.35, 1],
                          backgroundColor: isChecked ? '#10b981' : 'transparent',
                          borderColor: isChecked ? '#10b981' : '#cbd5e1',
                        } : {
                          scale: 1,
                          backgroundColor: isChecked ? '#10b981' : 'transparent',
                          borderColor: isChecked ? '#10b981' : '#cbd5e1',
                        }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                          isChecked ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-300 text-transparent hover:border-indigo-400'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isChecked ? 'text-white' : 'text-transparent'}`} />
                      </motion.button>
                      <div>
                        <h4 className={`text-sm font-bold transition-all ${
                          task.status === 'done' 
                            ? 'text-slate-300 line-through' 
                            : isOverdue 
                              ? 'text-rose-700 dark:text-rose-400 font-extrabold' 
                              : 'text-slate-800'
                        }`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-tighter ${
                            isOverdue ? 'text-rose-500 font-black' : 'text-slate-400'
                          }`}>
                            {isOverdue ? <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500 animate-pulse" /> : <Clock className="w-3" />}
                            {task.dueDate} {isOverdue && (isRTL ? '(متأخرة!)' : '(OVERDUE!)')}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            task.status === 'done' 
                              ? 'bg-slate-100 text-slate-400' 
                              : task.priority === 'high' 
                                ? 'bg-rose-50 text-rose-600' 
                                : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openTaskModal(task)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-indigo-600 transition-all cursor-pointer">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {isModalOpen && (() => {
        const isPast = isDueDatePast(formData.dueDate);
        return (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className={`bg-white rounded-5xl shadow-2xl w-full max-w-sm p-8 border-3 transition-all duration-300 ${
              isPast ? 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.25)]' : 'border-transparent'
            }`}>
              <h2 className={`text-2xl font-bold mb-6 ${isPast ? 'text-rose-600 font-black' : 'text-slate-900'}`}>
                {editingTask ? (isRTL ? 'تعديل المهمة' : 'Edit Task') : (isRTL ? 'إضافة مهمة جديدة' : 'New Task')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isPast && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black rounded-xl animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{isRTL ? 'تنبيه: تاريخ الاستحقاق فايت ومضى!' : 'Warning: Due date is in the past!'}</span>
                  </div>
                )}
                <div className={`space-y-4 p-4 rounded-3xl border-2 transition-all duration-300 ${isPast ? 'border-rose-300 bg-rose-50/10' : 'border-transparent'}`}>
                  <input 
                    placeholder={isRTL ? 'عنوان المهمة' : 'Task Title'}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all text-xs font-bold ${
                      isPast 
                        ? 'border-rose-400 focus:ring-rose-500/20 text-rose-950 placeholder:text-rose-400 bg-rose-50/10' 
                        : 'border-slate-200 focus:ring-indigo-500/20 text-slate-900'
                    }`}
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <select 
                      className={`px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 transition-all ${
                        isPast ? 'border-rose-300 focus:ring-rose-500/20 text-rose-800' : 'border-slate-200 focus:ring-indigo-500/20 text-slate-700'
                      }`}
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className={`px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 transition-all ${
                        isPast ? 'border-rose-300 focus:ring-rose-500/20 text-rose-800' : 'border-slate-200 focus:ring-indigo-500/20 text-slate-700'
                      }`}
                    >
                      <option value="todo">Todo</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input 
                      type="date"
                      className={`px-4 py-3 bg-slate-50 border rounded-xl text-xs outline-none focus:ring-2 transition-all ${
                        isPast 
                          ? 'border-rose-400 bg-rose-50/20 text-rose-700 font-extrabold focus:ring-rose-500/20' 
                          : 'border-slate-200 focus:ring-indigo-500/20 text-slate-900'
                      }`}
                      value={formData.dueDate}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder={isRTL ? 'مخصص لـ' : 'Assigned To'}
                      value={formData.assignedTo}
                      onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                      className={`px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:ring-2 transition-all ${
                        isPast 
                          ? 'border-rose-300 focus:ring-rose-500/20 text-rose-800 placeholder:text-rose-400' 
                          : 'border-slate-200 focus:ring-indigo-500/20 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditingTask(null); }} className="flex-1 py-3 text-xs font-extrabold text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer">
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button className={`flex-1 py-3 text-xs font-extrabold text-white rounded-xl shadow-lg transition-all cursor-pointer ${
                    isPast 
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                  }`}>
                    {editingTask ? (isRTL ? 'تحديث المهمة' : 'Update Task') : (isRTL ? 'حفظ' : 'Save Task')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Tasks;
