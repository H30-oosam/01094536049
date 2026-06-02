import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Calendar as CalendarIcon, UserCheck, Timer, Loader2, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, limit, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { logActivity, ActivityType } from '../services/activityService';
import { format } from 'date-fns';

const Attendance = () => {
  const { isRTL } = useUIStore();
  const { user } = useAuthStore();
  const [checkedIn, setCheckedIn] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formState, setFormState] = useState({ type: 'CHECK_IN', date: format(new Date(), 'yyyy-MM-dd'), time: format(new Date(), 'hh:mm a') });
  const localStorageKey = 'demoAttendance';

  const saveAttendanceToLocalStorage = (items: any[]) => {
    try { localStorage.setItem(localStorageKey, JSON.stringify(items)); } catch {}
  };
  const loadAttendanceFromLocalStorage = (): any[] | null => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const stored = loadAttendanceFromLocalStorage();
    if (stored?.length) {
      setRecords(stored);
      setLoading(false);
    }

    const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(docs);
      saveAttendanceToLocalStorage(docs);
      const presentCount = docs.length;
      setStats({ present: presentCount, late: Math.floor(presentCount * 0.1), absent: Math.max(0, 5 - presentCount) });
      setLoading(false);
    }, (error) => {
      console.error('Attendance fetch failed, using local fallback:', error);
      const fallback = stored ?? [];
      setRecords(fallback);
      const presentCount = fallback.length;
      setStats({ present: presentCount, late: Math.floor(presentCount * 0.1), absent: Math.max(0, 5 - presentCount) });
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'attendance');
    });

    return () => unsubscribe();
  }, []);

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setFormState({ type: record.type, date: record.date, time: record.time });
    setIsModalOpen(true);
  };

  const handleAttendance = async () => {
    if (!user) return;
    
    const type = checkedIn ? 'CHECK_OUT' : 'CHECK_IN';
    const actionLabel = checkedIn ? (isRTL ? 'تسجيل انصراف' : 'Check Out') : (isRTL ? 'تسجيل حضور' : 'Check In');
    const newRecord = {
      userId: user.uid,
      userName: user.displayName || user.email,
      type,
      time: format(new Date(), 'hh:mm a'),
      date: format(new Date(), 'yyyy-MM-dd'),
      timestamp: serverTimestamp(),
    };
    
    try {
      await addDoc(collection(db, 'attendance'), newRecord);
      logActivity(user as any, type, `${actionLabel} for ${user.displayName}`, ActivityType.UPDATE, 'attendance');
      setCheckedIn(!checkedIn);
      setRecords(prev => [{ id: `local-${Date.now()}`, ...newRecord }, ...prev]);
      saveAttendanceToLocalStorage([{ id: `local-${Date.now()}`, ...newRecord }, ...records]);
    } catch (error) {
      console.error('Attendance save failed, using local fallback:', error);
      const fallbackRecord = { id: `local-${Date.now()}`, ...newRecord };
      setRecords(prev => [fallbackRecord, ...prev]);
      saveAttendanceToLocalStorage([fallbackRecord, ...records]);
      setCheckedIn(!checkedIn);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const updatedRecord = { ...editingRecord, ...formState, timestamp: serverTimestamp() };

    try {
      await updateDoc(doc(db, 'attendance', editingRecord.id), { ...formState, timestamp: serverTimestamp() });
      setRecords(prev => prev.map(rec => rec.id === editingRecord.id ? updatedRecord : rec));
      saveAttendanceToLocalStorage(records.map(rec => rec.id === editingRecord.id ? updatedRecord : rec));
      if (user) logActivity(user as any, 'UPDATE_ATTENDANCE', `Edited attendance record for ${editingRecord.userName}`, ActivityType.UPDATE, 'attendance');
    } catch (error) {
      console.error('Attendance update failed, using local fallback:', error);
      setRecords(prev => prev.map(rec => rec.id === editingRecord.id ? { ...rec, ...formState } : rec));
      saveAttendanceToLocalStorage(records.map(rec => rec.id === editingRecord.id ? { ...rec, ...formState } : rec));
    }
    setEditingRecord(null);
    setIsModalOpen(false);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف سجل الحضور؟' : 'Delete attendance record?')) return;
    try {
      await deleteDoc(doc(db, 'attendance', recordId));
      setRecords(prev => prev.filter(rec => rec.id !== recordId));
      saveAttendanceToLocalStorage(records.filter(rec => rec.id !== recordId));
      if (user) logActivity(user as any, 'DELETE_ATTENDANCE', `Deleted attendance record ${recordId}`, ActivityType.DELETE, 'attendance');
    } catch (error) {
      console.error('Attendance delete failed, using local fallback:', error);
      setRecords(prev => prev.filter(rec => rec.id !== recordId));
      saveAttendanceToLocalStorage(records.filter(rec => rec.id !== recordId));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'الحضور والانصراف الذكي' : 'Smart Attendance Tracking'}
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            {isRTL ? 'تتبع ساعات عمل الموظفين والحضور اليومي' : 'Track employee work hours and daily attendance'}
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl p-2 rounded-2xl border border-white/80 shadow-lg flex items-center gap-2">
           <button 
             onClick={handleAttendance}
             className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
               checkedIn 
                 ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                 : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
             }`}
           >
             <Timer className="w-5 h-5 transition-transform group-hover:rotate-12" />
             {checkedIn 
               ? (isRTL ? 'تسجيل انصراف' : 'Check Out') 
               : (isRTL ? 'تسجيل حضور' : 'Check In')}
           </button>
           <div className="px-4 text-center border-s border-indigo-50">
             <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">{isRTL ? 'الوقت' : 'Time'}</p>
             <p className="text-sm font-mono font-black text-indigo-900 mt-1">{format(new Date(), 'hh:mm:ss')}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
            <div className="p-8 border-b border-white/40 flex items-center justify-between">
              <h3 className="text-lg font-black text-indigo-950 uppercase italic">{isRTL ? 'سجل العمليات الأخيرة' : "Recent Activity Log"}</h3>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-slate-400 font-black uppercase tracking-widest border-b border-white/20 bg-slate-50/30">
                      <th className="px-8 py-4 font-black">{isRTL ? 'الموظف' : 'Employee'}</th>
                      <th className="px-8 py-4 font-black">{isRTL ? 'النوع' : 'Action'}</th>
                      <th className="px-8 py-4 font-black">{isRTL ? 'الوقت' : 'Time'}</th>
                      <th className="px-8 py-4 font-black">{isRTL ? 'التاريخ' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/20">
                    {records.map(row => (
                      <tr key={row.id} className="group hover:bg-white/40 transition-all">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                              {row.userName.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700">{row.userName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                              row.type === 'CHECK_IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {row.type === 'CHECK_IN' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {row.type}
                            </span>
                            <button onClick={() => openEditModal(row)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteRecord(row.id)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-rose-500 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{row.time}</td>
                        <td className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 p-8 shadow-2xl shadow-indigo-200/20">
            <h3 className="text-lg font-black text-indigo-950 uppercase italic mb-6">{isRTL ? 'إحصائيات اليوم' : 'Daily Stats'}</h3>
            <div className="space-y-4">
              <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100/50 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-emerald-700">{stats.present}</p>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{isRTL ? 'حاضر' : 'Present'}</p>
                </div>
                <UserCheck className="w-8 h-8 text-emerald-600/30" />
              </div>
              
              <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100/50 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-amber-700">{stats.late}</p>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">{isRTL ? 'تأخير' : 'Late'}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600/30" />
              </div>

              <div className="p-5 bg-rose-50 rounded-3xl border border-rose-100/50 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-rose-700">{stats.absent}</p>
                  <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest">{isRTL ? 'غائب' : 'Absent'}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-rose-600/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{isRTL ? 'تعديل السجل' : 'Edit Record'}</h2>
                <p className="text-sm text-slate-500">{isRTL ? 'تحديث تفاصيل الحضور أو الانصراف' : 'Update the attendance or checkout details'}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingRecord(null); }} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-all">
                <XCircle className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="grid gap-4">
              <select
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100"
                value={formState.type}
                onChange={(e) => setFormState({ ...formState, type: e.target.value })}
              >
                <option value="CHECK_IN">Check In</option>
                <option value="CHECK_OUT">Check Out</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={formState.date}
                  onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  type="text"
                  value={formState.time}
                  onChange={(e) => setFormState({ ...formState, time: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingRecord(null); }} className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-8 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                  {isRTL ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
