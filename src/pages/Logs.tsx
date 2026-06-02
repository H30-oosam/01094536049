import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Clock, User, 
  Database, AlertCircle, CheckCircle2, Info, Loader2, Trash2
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUIStore } from '../store/uiStore';
import { format } from 'date-fns';
import { ActivityLog, ActivityType } from '../services/activityService';

const Logs = () => {
  const { isRTL } = useUIStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const localStorageKey = 'demoActivityLogs';

  const saveLogsToLocalStorage = (items: ActivityLog[]) => {
    try { localStorage.setItem(localStorageKey, JSON.stringify(items)); } catch {}
  };

  const loadLogsFromLocalStorage = (): ActivityLog[] | null => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      return raw ? JSON.parse(raw) as ActivityLog[] : null;
    } catch {
      return null;
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا السجل؟' : 'Delete this log entry?')) return;
    setLogs(prev => {
      const next = prev.filter(log => log.id !== logId);
      saveLogsToLocalStorage(next);
      return next;
    });
    try {
      await deleteDoc(doc(db, 'activity_logs', logId));
    } catch (error) {
      console.error('Log delete failed, kept local fallback:', error);
    }
  };

  useEffect(() => {
    const stored = loadLogsFromLocalStorage();
    if (stored?.length) {
      setLogs(stored);
      setLoading(false);
    }

    const q = query(
      collection(db, 'activity_logs'), 
      orderBy('timestamp', 'desc'), 
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ActivityLog));
      setLogs(docs);
      saveLogsToLocalStorage(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CREATE: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case ActivityType.DELETE: return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case ActivityType.UPDATE: return <Info className="w-4 h-4 text-indigo-500" />;
      default: return <Database className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'سجل النشاط النظامي' : 'System Activity Log'}
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            {isRTL ? 'تتبع كل تغيير وتعديل داخل النظام' : 'Track every change and update within the system'}
          </p>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="p-6 border-b border-white/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={isRTL ? 'ابحث في السجلات...' : 'Search logs...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-indigo-50 rounded-xl text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-auto max-h-175 relative transition-all">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="font-bold">{isRTL ? 'جاري تحميل السجلات...' : 'Loading logs...'}</p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md shadow-sm">
                <tr>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/40 first:rounded-tl-3xl">{isRTL ? 'النشاط' : 'Activity'}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/40">{isRTL ? 'المستخدم' : 'User'}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/40">{isRTL ? 'التفاصيل' : 'Details'}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/40">{isRTL ? 'الإجراء' : 'Action'}</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/40 last:rounded-tr-3xl">{isRTL ? 'الوقت' : 'Time'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/40 transition-colors group odd:bg-white/40 even:bg-slate-50/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(log.type)}
                        <span className="text-sm font-bold text-slate-900 capitalize">{log.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 font-medium max-w-md line-clamp-1 group-hover:line-clamp-none transition-all">
                        {log.details}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase">
                          {log.timestamp ? format(log.timestamp.toDate(), 'PPpp') : '...'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleDeleteLog(log.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
