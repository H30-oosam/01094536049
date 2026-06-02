import React, { useState, useEffect } from 'react';
import { 
  Calendar, Check, X, Search, Plus, 
  User, Clock, Filter, FileText,
  AlertCircle, Briefcase, Zap, Loader2, Info
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, getDocs, orderBy, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { logActivity, ActivityType } from '../services/activityService';
import { format, differenceInDays } from 'date-fns';

const Leaves = () => {
  const { isRTL } = useUIStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formState, setFormState] = useState({
    employeeId: '',
    type: 'annual',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'approved': 
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40';
      case 'Rejected':
      case 'rejected': 
        return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40';
      case 'Pending':
      case 'pending': 
        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40';
      default: return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  useEffect(() => {
    // 1. Fetch Leaves from Firestore
    const qLeaves = query(collection(db, 'leaves'), orderBy('createdAt', 'desc'));
    const unsubscribeLeaves = onSnapshot(qLeaves, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaves(docs);
      setLoading(false);
    }, (error) => {
      console.error('Leaves load failed, using local:', error);
      // Fallback local items if offline
      const localLeaves = localStorage.getItem('demoLeaves');
      if (localLeaves) {
        setLeaves(JSON.parse(localLeaves));
      } else {
        setLeaves([
          { id: '1', employeeName: 'Zaid Al-Harbi', employeeId: 'EMP-002', type: 'annual', startDate: '2026-06-01', endDate: '2026-06-15', days: 14, status: 'approved', reason: 'Summer Vacation' },
          { id: '2', employeeName: 'Fatima Mohamed', employeeId: 'EMP-002', type: 'sick', startDate: '2026-05-12', endDate: '2026-05-13', days: 2, status: 'approved', reason: 'Medical Checkup' },
          { id: '3', employeeName: 'Ahmed Hassan', employeeId: 'EMP-001', type: 'unpaid', startDate: '2026-05-20', endDate: '2026-05-22', days: 3, status: 'rejected', reason: 'Personal Conflict' },
          { id: '4', employeeName: 'Omar Ali', employeeId: 'EMP-003', type: 'annual', startDate: '2026-06-10', endDate: '2026-06-11', days: 1, status: 'pending', reason: 'Family Issue' },
        ]);
      }
      setLoading(false);
    });

    // 2. Fetch Employees for reference
    const qEmps = query(collection(db, 'employees'));
    const unsubscribeEmps = onSnapshot(qEmps, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(docs);
    }, (err) => {
      console.error('Employees load failed in Leaves page:', err);
      const localEmps = localStorage.getItem('demoEmployees');
      if (localEmps) setEmployees(JSON.parse(localEmps));
    });

    return () => {
      unsubscribeLeaves();
      unsubscribeEmps();
    };
  }, []);

  // Save changes helper to localStorage for offline robustness
  useEffect(() => {
    if (leaves.length > 0) {
      localStorage.setItem('demoLeaves', JSON.stringify(leaves));
    }
  }, [leaves]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.employeeId) return;
    setSubmitting(true);

    const targetEmp = employees.find(emp => emp.id === formState.employeeId);
    const empName = targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : 'System Employee';
    const empCode = targetEmp ? targetEmp.employeeId : 'EMP-000';

    const start = new Date(formState.startDate);
    const end = new Date(formState.endDate);
    const requestedDays = Math.max(1, differenceInDays(end, start) + 1);

    const newRequest = {
      employeeId: formState.employeeId,
      employeeName: empName,
      employeeCode: empCode,
      type: formState.type,
      startDate: formState.startDate,
      endDate: formState.endDate,
      days: requestedDays,
      reason: formState.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'leaves'), newRequest);
      
      // Auto add notification
      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title: isRTL ? 'طلب إجازة جديد سنوي للموافقة' : 'New Leave Request Awaiting Action',
        message: isRTL 
          ? `قدم ${empName} طلباً لإجازة مدتها ${requestedDays} أيام.` 
          : `${empName} requested a leave of ${requestedDays} days.`,
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString(),
      });

      if (user) {
        logActivity(
          user as any,
          'CREATE_LEAVE_REQUEST',
          `Created leave request of ${requestedDays} days for ${empName}`,
          ActivityType.CREATE,
          'leaves'
        );
      }

      setIsModalOpen(false);
      setFormState({
        employeeId: '',
        type: 'annual',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
      });
    } catch (err) {
      console.error('Failed to submit leave:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (reqId: string, newStatus: 'approved' | 'rejected') => {
    const targetReq = leaves.find(l => l.id === reqId);
    if (!targetReq) return;

    try {
      const updatePayload: any = { status: newStatus };
      if (newStatus === 'approved') {
        updatePayload.approvedBy = user?.displayName || user?.email || 'Admin';
      }

      // 1. Update status in DB
      await updateDoc(doc(db, 'leaves', reqId), updatePayload);

      // 2. If approved and leave type is annual, deduct from employee's leave balance
      if (newStatus === 'approved') {
        const empIdObj = targetReq.employeeId;
        const leaveDays = targetReq.days || 1;

        // Try to locate employee doc in db
        if (empIdObj) {
          const empDocRef = doc(db, 'employees', empIdObj);
          const empSnap = await getDoc(empDocRef);
          if (empSnap.exists()) {
            const currentBal = empSnap.data().leaveBalance !== undefined ? empSnap.data().leaveBalance : 30;
            const newBal = Math.max(0, currentBal - leaveDays);
            await updateDoc(empDocRef, { leaveBalance: newBal });
          }
        }

        // Send Success notification
        await addDoc(collection(db, 'notifications'), {
          userId: 'all',
          title: isRTL ? 'تمت الموافقة على إجازة' : 'Leave Request Approved',
          message: isRTL 
            ? `تمت الموافقة على إجازة ${targetReq.employeeName} لمدة ${leaveDays} أيام.` 
            : `${targetReq.employeeName}'s leave of ${leaveDays} days has been approved.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      if (user) {
        logActivity(
          user as any,
          'UPDATE_LEAVE_STATUS',
          `Set leave status to ${newStatus} for ${targetReq.employeeName}`,
          ActivityType.UPDATE,
          'leaves'
        );
      }
    } catch (err) {
      console.error('Failed to update leave status:', err);
    }
  };

  const pendingRequests = leaves.filter(r => r.status === 'pending' || r.status === 'Pending').length;
  const approvedCount = leaves.filter(r => r.status === 'approved' || r.status === 'Approved').length;
  const leavesNow = leaves.filter(r => {
    if (r.status !== 'approved' && r.status !== 'Approved') return false;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return todayStr >= r.startDate && todayStr <= r.endDate;
  }).length;
  const sickLeaves = leaves.filter(r => r.type === 'sick' || r.type === 'Sick').length;

  const filteredRequests = leaves.filter(request => {
    const matchesSearch = (request.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (request.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة الإجازات والأرصدة' : 'Time Off & Leaves'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'تتبع طلبات الإجازات، الرصيد المتبقي والموافقات السريعة مع خصم تلقائي للميزانية' : 'Track leave requests, balances, and manager fast-tracked approvals'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-3xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{isRTL ? 'تقديم طلب إجازة' : 'Request Leave'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: isRTL ? 'طلبات قيد المراجعة' : 'Pending Requests', val: pendingRequests.toString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
           { label: isRTL ? 'الطلبات المعتمدة' : 'Approved Requests', val: approvedCount.toString(), icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
           { label: isRTL ? 'إجمالي المجازين حالياً' : 'On Leave Currently', val: leavesNow.toString(), icon: User, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
           { label: isRTL ? 'إجازة مرضية كلي' : 'Total Sick Leaves', val: sickLeaves.toString(), icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20' },
         ].map((stat, index) => (
           <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between select-none">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</dt>
                <dd className="text-3xl font-black text-slate-850 dark:text-white mt-1 italic">{stat.val}</dd>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6 stroke-[2.2]" />
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={isRTL ? 'بحث بالاسم أو السبب...' : 'Search leave requests...'}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950/20 outline-none transition-all placeholder:text-slate-400 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-xs font-bold text-slate-500">{isRTL ? 'جارٍ تحميل طلبات الإجازات من النظام...' : 'Syncing leave requests from database...'}</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-20 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-500">{isRTL ? 'لم يتم العثور على طلبات إجازة' : 'No leave requests found.'}</p>
            </div>
          ) : (
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] font-black tracking-widest text-slate-400">
                  <th className="px-8 py-5 text-right font-black">{isRTL ? 'الموظف' : 'Employee'}</th>
                  <th className="px-8 py-5 text-right font-black">{isRTL ? 'نوع الإجازة' : 'Type'}</th>
                  <th className="px-8 py-5 text-right font-black">{isRTL ? 'رصيد الموظف الفعلي' : 'Current Leave Balance'}</th>
                  <th className="px-8 py-5 text-right font-black">{isRTL ? 'الفترة الزمنية' : 'Period'}</th>
                  <th className="px-8 py-5 text-right font-black">{isRTL ? 'المدة بالأيام' : 'Days'}</th>
                  <th className="px-8 py-5 text-right font-black">{isRTL ? 'السبب' : 'Reason'}</th>
                  <th className="px-8 py-5 text-right font-black">{isRTL ? 'الحالة والموافق' : 'Status & Approver'}</th>
                  <th className="px-8 py-5 text-right font-black"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredRequests.map((request) => {
                  const empObj = employees.find(e => e.id === request.employeeId);
                  const remainingBalance = empObj?.leaveBalance !== undefined ? empObj.leaveBalance : 30;

                  return (
                    <tr key={request.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-all group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3 justify-start flex-row">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                            {request.employeeName?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">{request.employeeName}</span>
                            <span className="text-[10px] font-bold text-slate-400">{request.employeeCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-lg uppercase">
                          {request.type === 'annual' ? (isRTL ? 'سنوية' : 'Annual') : 
                           request.type === 'sick' ? (isRTL ? 'مرضية' : 'Sick') : 
                           request.type === 'unpaid' ? (isRTL ? 'غير مدفوعة' : 'Unpaid') : 
                           request.type === 'maternity' ? (isRTL ? 'أمومة' : 'Maternity') : 
                           (isRTL ? 'حالة طارئة' : 'Emergency')}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-start font-bold">
                          <span className="text-slate-800 dark:text-white font-black">{remainingBalance}</span>
                          <span className="text-slate-400 text-xs">{isRTL ? 'يوم متبقي' : 'days left'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                           {request.startDate} → {request.endDate}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="font-black text-indigo-600 dark:text-indigo-400 italic">#{request.days} {isRTL ? 'أيام' : 'days'}</span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs text-slate-500 font-bold max-w-xs truncate leading-relaxed">{request.reason || '--'}</p>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(request.status)}`}>
                            {request.status === 'approved' ? (isRTL ? 'معتمد' : 'Approved') :
                             request.status === 'rejected' ? (isRTL ? 'مرفوض' : 'Rejected') :
                             (isRTL ? 'معلق' : 'Pending')}
                          </span>
                          {request.approvedBy && (
                            <span className="text-[9px] text-slate-400 font-bold">{isRTL ? `بواسطة: ${request.approvedBy}` : `By: ${request.approvedBy}`}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        {(request.status === 'pending' || request.status === 'Pending') && (
                          <div className="flex justify-end gap-2 xl:opacity-0 group-hover:opacity-100 transition-all">
                             <button 
                               onClick={() => handleStatusUpdate(request.id, 'approved')}
                               className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl transition-all shadow-lg shadow-emerald-100/10 cursor-pointer"
                               title={isRTL ? 'اعتماد الإجازة' : 'Approve Leave'}
                             >
                                <Check className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleStatusUpdate(request.id, 'rejected')}
                               className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-950/20 dark:text-rose-400 rounded-xl transition-all shadow-lg shadow-rose-100/10 cursor-pointer"
                               title={isRTL ? 'ارفض الطلب' : 'Reject Leave'}
                             >
                                <X className="w-4 h-4" />
                             </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {isRTL ? 'تقديم طلب إجازة جديد' : 'Submit Leave Request'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isRTL ? 'يرجى تسجيل بيانات الإجازة والتواريخ بدقة للخصم التلقائي' : 'Set the dates and leave spec options correctly'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="grid gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block">
                  {isRTL ? 'اختر الموظف المعني' : 'Target Employee'}
                </label>
                <select
                  required
                  value={formState.employeeId}
                  onChange={(e) => setFormState({ ...formState, employeeId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-150 font-bold dark:text-white"
                >
                  <option value="">{isRTL ? '-- اختر الموظف من القائمة --' : '-- Choose Employee --'}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block">
                    {isRTL ? 'نوع الإجازة المطلوبة' : 'Type of Time Off'}
                  </label>
                  <select
                    value={formState.type}
                    onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-150 font-bold dark:text-white"
                  >
                    <option value="annual">{isRTL ? 'إجازة سنوية اعتيادية' : 'Annual'}</option>
                    <option value="sick">{isRTL ? 'إجازة مرضية طبية' : 'Sick Leave'}</option>
                    <option value="unpaid">{isRTL ? 'إجازة بدون راتب' : 'Unpaid'}</option>
                    <option value="maternity">{isRTL ? 'إجازة أمومة' : 'Maternity'}</option>
                    <option value="emergency">{isRTL ? 'حالة طارئة عاجلة' : 'Emergency'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-1">
                    {isRTL ? 'تنبيه الأرصدة التلقائية' : 'Leave Balance note'}
                  </span>
                  <div className="p-3 bg-blue-50/50 dark:bg-indigo-950/20 border border-blue-100 dark:border-indigo-900 rounded-xl text-[11px] font-bold text-blue-800 dark:text-indigo-400 block leading-tight">
                    <Info className="w-3.5 h-3.5 inline text-blue-600 mr-1" />
                    {isRTL 
                      ? 'الاعتماد يخصم الرصيد تلقائياً من الملف الفردي للموظف.' 
                      : 'Approval deducts the duration automatically from the employee balance.'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block">
                    {isRTL ? 'تاريخ البدء' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.startDate}
                    onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-150 font-bold dark:text-white dark:bg-slate-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block">
                    {isRTL ? 'تاريخ الانتهاء' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.endDate}
                    onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-150 font-bold dark:text-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block">
                  {isRTL ? 'سبب الإجازة والتفاصيل' : 'Reason / Note'}
                </label>
                <textarea
                  value={formState.reason}
                  onChange={(e) => setFormState({ ...formState, reason: e.target.value })}
                  placeholder={isRTL ? 'مثال: السفر للبلد لقضاء العطلة الصيفية السنوية مع العائلة...' : 'Summer vacation details...'}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-150 text-xs font-bold dark:text-white dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-8 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100/50 cursor-pointer flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isRTL ? 'إرسال طلب الإجازة' : 'Submit Leave'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
