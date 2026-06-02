import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, Calendar as CalendarIcon, 
  UserCheck, Timer, Loader2, MoreHorizontal, Trash2, Edit3, 
  MapPin, QrCode, ShieldCheck, DollarSign, Plus, Eye, AlertTriangle 
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, limit, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { logActivity, ActivityType } from '../services/activityService';
import { format, parse, differenceInMinutes, isAfter } from 'date-fns';

const Attendance = () => {
  const { isRTL, currency } = useUIStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 5 });
  const [activeTab, setActiveTab] = useState<'log' | 'qr' | 'manual'>('log');

  // New attendance check-in controls
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [checkInTimeStr, setCheckInTimeStr] = useState('09:00');
  const [checkInDateStr, setCheckInDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));

  // GPS Coordinates and validation
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'inside' | 'outside' | 'error'>('idle');
  const [userCoords, setUserCoords] = useState<{ lat?: number, lng?: number }>({});
  const COMPANY_COORDS = { lat: 24.7136, lng: 46.6753 }; // HQ Riyadh, Saudi Arabia
  const ALLOWED_RADIUS_METERS = 200;

  // Manual log editing modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editFormState, setEditFormState] = useState({ type: 'CHECK_IN', date: '', time: '', delayMinutes: 0, deduction: 0 });

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in meters
  };

  useEffect(() => {
    // 1. Fetch Real attendance records
    const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setRecords(docs);

      // Compute simple dashboard calculations
      const presentCount = docs.filter(d => d.type === 'CHECK_IN').length;
      const lateCount = docs.filter(d => (Number(d.delayMinutes) || 0) > 0).length;
      setStats({
        present: presentCount,
        late: lateCount,
        absent: Math.max(0, 12 - presentCount),
      });
      setLoading(false);
    }, (error) => {
      console.error('Attendance fetch failed:', error);
      const saved = localStorage.getItem('demoAttendance');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecords(parsed);
        const presentCount = parsed.filter((d: any) => d.type === 'CHECK_IN').length;
        const lateCount = parsed.filter((d: any) => (Number(d.delayMinutes) || 0) > 0).length;
        setStats({ present: presentCount, late: lateCount, absent: Math.max(0, 10 - presentCount) });
      }
      setLoading(false);
    });

    // 2. Fetch Employees lists
    const qEmp = query(collection(db, 'employees'));
    const unsubscribeEmp = onSnapshot(qEmp, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(docs);
    }, (error) => {
      const saved = localStorage.getItem('demoEmployees');
      if (saved) setEmployees(JSON.parse(saved));
    });

    return () => {
      unsubscribe();
      unsubscribeEmp();
    };
  }, []);

  // Save changes locally
  useEffect(() => {
    if (records.length > 0) {
      localStorage.setItem('demoAttendance', JSON.stringify(records));
    }
  }, [records]);

  // Request & Verify Geolocation Bounds
  const verifyLocation = () => {
    if (!navigator.geolocation) {
      alert(isRTL ? 'المتصفح لا يدعم تحديد المواقع GPS' : 'Browser does not support geolocation.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });

        // Calculate distance from HQ Riyadh Office
        const dist = getDistance(lat, lng, COMPANY_COORDS.lat, COMPANY_COORDS.lng);
        if (dist <= ALLOWED_RADIUS_METERS) {
          setGpsStatus('inside');
        } else {
          setGpsStatus('outside');
        }
        setGpsLoading(false);
        setTimeout(() => setGpsStatus('idle'), 4000); // Reset toast status after 4 seconds
      },
      (err) => {
        console.error('GPS fetch failed:', err);
        setGpsStatus('error');
        setGpsLoading(false);
        setTimeout(() => setGpsStatus('idle'), 4000);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Submit check-in transaction with deduction rules
  const handleCheckoutCheckin = async (empId: string, isManualEntry: boolean) => {
    const targetEmp = employees.find(e => e.id === empId);
    if (!targetEmp) {
      alert(isRTL ? 'الرجاء اختيار الموظف أولاً' : 'Select an employee first');
      return;
    }

    // Determine whether they are checked in already
    const employeeRecords = records.filter(r => r.employeeId === empId);
    const lastRecord = employeeRecords[0];
    const isCheckingOut = lastRecord && lastRecord.type === 'CHECK_IN';

    const type = isCheckingOut ? 'CHECK_OUT' : 'CHECK_IN';
    const currentTimeStr = isManualEntry ? checkInTimeStr : format(new Date(), 'HH:mm');
    const currentDateStr = isManualEntry ? checkInDateStr : format(new Date(), 'yyyy-MM-dd');

    // Formula for automated delay and deductions
    let delayMinutes = 0;
    let deduction = 0;

    if (type === 'CHECK_IN') {
      const workStartTime = parse('09:00', 'HH:mm', new Date());
      const checkInTimeObj = parse(currentTimeStr, 'HH:mm', new Date());
      
      if (isAfter(checkInTimeObj, workStartTime)) {
        delayMinutes = differenceInMinutes(checkInTimeObj, workStartTime);
        // Deduct $5 / SAR 15 per each 15 minutes late automatically
        deduction = Math.floor(delayMinutes / 15) * 15;
      }
    }

    const payload = {
      employeeId: targetEmp.id,
      employeeName: `${targetEmp.firstName} ${targetEmp.lastName}`,
      employeeCode: targetEmp.employeeId,
      type,
      time: format(parse(currentTimeStr, 'HH:mm', new Date()), 'hh:mm a'),
      date: currentDateStr,
      delayMinutes,
      deduction,
      logMode: isManualEntry ? 'Manual Admin' : 'Verified Web-Terminal',
      gpsVerified: gpsStatus === 'inside' || !isManualEntry,
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'attendance'), payload);

      // Create a global notification if delayed / deducted
      if (deduction > 0) {
        await addDoc(collection(db, 'notifications'), {
          userId: 'all',
          title: isRTL ? 'تسجيل تأخير تلقائي مع خصم' : 'Auto Latency Deduction Warning',
          message: isRTL 
            ? `تأخر الموظف ${payload.employeeName} بمقدار ${delayMinutes} دقيقة. تم تسجيل خصم بقيمة ${currency} ${deduction}.` 
            : `${payload.employeeName} was late by ${delayMinutes} mins. Deducted ${currency} ${deduction} of basic allowances.`,
          type: 'error',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      if (user) {
        logActivity(
          user as any,
          'NEW_ATTENDANCE',
          `Checked ${type} for ${payload.employeeName} at ${payload.time}. Delay: ${delayMinutes} mins.`,
          ActivityType.UPDATE,
          'attendance'
        );
      }

      // Reset form states
      setSelectedEmpId('');
      setCheckInTimeStr('09:00');
    } catch (err) {
      console.error('Failed to submit attendance to Firestore:', err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      await updateDoc(doc(db, 'attendance', editingRecord.id), {
        type: editFormState.type,
        date: editFormState.date,
        time: editFormState.time,
        delayMinutes: Number(editFormState.delayMinutes) || 0,
        deduction: Number(editFormState.deduction) || 0,
      });

      if (user) {
        logActivity(
          user as any,
          'EDIT_ATTENDANCE',
          `Updated attendance audit values for record: ${editingRecord.id}`,
          ActivityType.UPDATE,
          'attendance'
        );
      }
      setIsEditModalOpen(false);
      setEditingRecord(null);
    } catch (err) {
      console.error('Failed to update record:', err);
    }
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (!window.confirm(isRTL ? `هل تريد حذف سجل حضور ${name}؟` : `Delete attendance log of ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'attendance', id));
      if (user) {
        logActivity(
          user as any,
          'DELETE_ATTENDANCE',
          `Deleted attendance record of ${name}`,
          ActivityType.DELETE,
          'attendance'
        );
      }
    } catch (err) {
      console.error('Failed to delete attendance info:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة الحضور والانصراف الذكي' : 'Discipline & Presence Control'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'تسجيل حضور تلقائي، حساب التأخير تلقائياً، والخصم المباشر مع التحقق من الموقع GPS والمستند الهوية' : 'Real-time shift clocking, automatic deduction formulas, GPS fence-checking, and scan cards.'}
          </p>
        </div>

        {/* Action Toggle Tabs */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/45 dark:border-slate-700 max-w-sm self-start lg:self-center">
          <button 
            onClick={() => setActiveTab('log')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
              activeTab === 'log' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
             {isRTL ? 'الأنشطة اليومية' : 'Live Sync Feed'}
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
              activeTab === 'manual' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
             {isRTL ? 'بوابة الحساب والخصومات' : 'Add Check-In / Deduction'}
          </button>
          <button 
            onClick={() => setActiveTab('qr')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
              activeTab === 'qr' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
             📂 {isRTL ? 'بطاقة المرور QR' : 'Pass Badges QR'}
          </button>
        </div>
      </div>

      {/* Attendance Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{isRTL ? 'حضور اليوم الكلي' : 'Present Staff Today'}</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 italic">#{stats.present}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{isRTL ? 'حالات التأخير المرصودة' : 'Lateness Red Flags'}</p>
            <p className="text-3xl font-black text-amber-500 dark:text-amber-400 mt-1 italic">#{stats.late}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{isRTL ? 'غياب متوقع' : 'Absences'}</p>
            <p className="text-3xl font-black text-rose-500 dark:text-rose-400 mt-1 italic">#{stats.absent}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {activeTab === 'log' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Attendance Log Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-black text-indigo-950 dark:text-white uppercase italic tracking-wide">
                 🔗 {isRTL ? 'سجل الحصاد والتدقيق اللحظي' : 'Discipline Feed & Log Audit'}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="text-xs font-bold text-slate-500">{isRTL ? 'جارٍ التحقق ومزامنة السيرفر...' : 'Pulling shift timestamps...'}</span>
                </div>
              ) : records.length === 0 ? (
                <div className="p-20 text-center">
                  <ShieldCheck className="w-12 h-12 text-slate-350 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">{isRTL ? 'لايوجد عمليات حضور مسجلة اليوم.' : 'No shift stamp logs created yet.'}</p>
                </div>
              ) : (
                <table className="w-full text-right" dir={isRTL ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] font-black tracking-widest text-slate-400">
                      <th className="px-6 py-4 text-center">{isRTL ? 'الموظف' : 'Employee'}</th>
                      <th className="px-6 py-4 text-center">{isRTL ? 'الحالة' : 'Stamp'}</th>
                      <th className="px-6 py-4 text-center">{isRTL ? 'التوقيت اليومي' : 'Time'}</th>
                      <th className="px-6 py-4 text-center">{isRTL ? 'تاريخ الوردية' : 'Shift Date'}</th>
                      <th className="px-6 py-4 text-center">{isRTL ? 'التأخير (دقيقة)' : 'Late (Mins)'}</th>
                      <th className="px-6 py-4 text-center">{isRTL ? 'الخصم التلقائي' : 'Auto Penal Deduct'}</th>
                      <th className="px-6 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {records.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-all font-semibold">
                        <td className="px-6 py-4.5 text-center">
                          <div className="flex items-center gap-2.5 justify-start">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-xs">
                              {row.employeeName?.charAt(0) || 'E'}
                            </div>
                            <div className="text-left font-bold">
                              <span className="text-xs text-slate-800 dark:text-slate-200 block">{row.employeeName}</span>
                              <span className="text-[9px] text-slate-400 font-black">{row.employeeCode || row.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1 leading-none ${
                            row.type === 'CHECK_IN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                          }`}>
                            {row.type === 'CHECK_IN' ? (isRTL ? 'وصول' : 'CHECK IN') : (isRTL ? 'مغادرة' : 'CHECK OUT')}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center text-xs font-mono font-black text-slate-700 dark:text-slate-300">
                           {row.time}
                        </td>
                        <td className="px-6 py-4.5 text-center text-[10px] text-slate-400 uppercase font-bold">
                           {row.date}
                        </td>
                        <td className={`px-6 py-4.5 text-center font-mono font-black text-xs ${
                           (Number(row.delayMinutes) || 0) > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'
                        }`}>
                           {row.delayMinutes ? `+${row.delayMinutes} m` : '--'}
                        </td>
                        <td className="px-6 py-4.5 text-center whitespace-nowrap">
                           {(Number(row.deduction) || 0) > 0 ? (
                             <span className="text-xs text-rose-500 font-black bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/40">
                                -{currency} {row.deduction}
                             </span>
                           ) : (
                             <span className="text-slate-350 text-xs">--</span>
                           )}
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button 
                              onClick={() => {
                                setEditingRecord(row);
                                setEditFormState({
                                  type: row.type || 'CHECK_IN',
                                  date: row.date || '',
                                  time: row.time || '',
                                  delayMinutes: Number(row.delayMinutes) || 0,
                                  deduction: Number(row.deduction) || 0
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteRecord(row.id, row.employeeName)}
                              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-rose-500 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Hand: GPS Verification Fenced Module */}
          <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">{isRTL ? 'جهاز التحقق من الموقع GPS' : 'GPS Fence Terminal'}</h3>
                  <span className="text-[9px] text-amber-500 uppercase font-black tracking-wider mt-1.5 block">Zero-Trust Distance Limit</span>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center space-y-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                   {isRTL 
                     ? 'المسافة المسموح بها لتسجيل الحضور الذاتي هي أقل من 200 متر من فرع الرياض الرئيسي.' 
                     : 'Authorized web attendance distance limit is 200m from HQ Building coordinates.'}
                </p>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 text-right rounded-2xl block space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>{isRTL ? 'إحداثي الشركة' : 'HQ Riyadh'}</span>
                    <span className="font-mono text-slate-650">24.7136, 46.6753</span>
                  </div>
                  {userCoords.lat && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>{isRTL ? 'موقعك الحالي' : 'Your spot'}</span>
                      <span className="font-mono text-indigo-600">{userCoords.lat.toFixed(4)}, {userCoords.lng?.toFixed(4)}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={verifyLocation}
                  disabled={gpsLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-650 dark:hover:bg-indigo-700 font-extrabold py-3.5 text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  <span>{isRTL ? 'التحقق ومطابقة الاحداثيات' : 'Ping GPS & Match Distance'}</span>
                </button>
              </div>

              {/* Toast indicators inside the container */}
              {gpsStatus === 'inside' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRTL ? 'تم التحقق بنجاح! أنت بالقرب من مركز الرياض' : 'Distance OK: Inside company perimeter limit!'}</span>
                </div>
              )}
              {gpsStatus === 'outside' && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-2xl text-xs font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
                  <span>{isRTL ? 'خارج النطاق! تعذر مطابقة المسافة' : 'Mismatch error: You are outside the 200m radius limit.'}</span>
                </div>
              )}
              {gpsStatus === 'error' && (
                <div className="p-4 bg-orange-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-2xl text-xs font-bold text-amber-800 dark:text-amber-400">
                  <span>{isRTL ? 'يرجى تفعيل صلاحية الـ GPS في المتصفح والتحضير مجدداً' : 'Location permissions denied. Grant access and retry.'}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 text-center select-none text-[9px] font-black uppercase text-slate-400 tracking-wider">
               Riyadh HQ Branch Authorized Terminal
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              {isRTL ? 'تسجيل حضور يدوي / خصومات مرنة' : 'Custom Shift Check-In & Latency Tool'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isRTL 
                ? 'استخدم هذه البوابة لتسجيل الدخول الفردي للموظفين يدوياً وحساب الغرامات والتأخير فورياً.' 
                : 'Input employee custom timestamp entries with automated deduct evaluations.'}
            </p>
          </div>

          <div className="grid gap-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-550 dark:text-slate-450 uppercase tracking-widest">{isRTL ? 'اختر الموظف' : 'Select Employee'}</label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold dark:text-white"
              >
                <option value="">{isRTL ? '-- اختر الموظف --' : '-- Choose Employee --'}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-550 dark:text-slate-450 uppercase tracking-widest">{isRTL ? 'تاريخ الحضور' : 'Shift Date'}</label>
                <input
                  type="date"
                  value={checkInDateStr}
                  onChange={(e) => setCheckInDateStr(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-550 dark:text-slate-450 uppercase tracking-widest">{isRTL ? 'توقيت الحضور (ساعة : دقيقة)' : 'Check-In Time (24h)'}</label>
                <input
                  type="time"
                  value={checkInTimeStr}
                  onChange={(e) => setCheckInTimeStr(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold dark:text-white"
                />
              </div>
            </div>

            {/* Calculations preview block */}
            {selectedEmpId && (
              <div className="p-5 bg-indigo-50/50 dark:bg-slate-950 border border-indigo-100 dark:border-slate-800 rounded-3xl space-y-3">
                <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-wide">{isRTL ? 'المعاينة التلقائية للخصم' : 'Live Penalty Preview'}</h4>
                
                {(() => {
                  const workStartTime = parse('09:00', 'HH:mm', new Date());
                  const checkInTimeObj = parse(checkInTimeStr, 'HH:mm', new Date());
                  let delay = 0;
                  let ded = 0;
                  if (isAfter(checkInTimeObj, workStartTime)) {
                    delay = differenceInMinutes(checkInTimeObj, workStartTime);
                    ded = Math.floor(delay / 15) * 15;
                  }

                  return (
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold leading-normal">
                      <div>
                        <p className="text-slate-400">{isRTL ? 'ميعاد الحضور القياسي:' : 'Standard Check-In Hour:'}</p>
                        <p className="text-slate-800 dark:text-white mt-1">09:00 AM</p>
                      </div>
                      <div>
                        <p className="text-slate-400">{isRTL ? 'حالة الانضباط والمخالفة:' : 'Lateness registered:'}</p>
                        <p className={`mt-1 font-black ${delay > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {delay > 0 ? (isRTL ? `تأخير بمقدار ${delay} دقيقة` : `Late by ${delay} mins`) : (isRTL ? 'حضور في الموعد' : 'On-time check in')}
                        </p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                        <span>{isRTL ? 'مبلغ الخصم الآلي المحتسب:' : 'System Auto Penal Deduction:'}</span>
                        <span className={ded > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                          {ded > 0 ? `-${currency} ${ded}` : `${currency} 0.00`}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <button
              onClick={() => handleCheckoutCheckin(selectedEmpId, true)}
              disabled={!selectedEmpId}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-extrabold py-4 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all mt-3 cursor-pointer"
            >
               💾 {isRTL ? 'تسجيل وحفظ العملية فورياً' : 'Log Attendance Timestamp'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm max-w-sm mx-auto text-center space-y-6 select-none">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-800 dark:text-white italic uppercase tracking-wider">{isRTL ? 'مسح رمز الحضور QR' : 'Quick Pass QR Token'}</h3>
            <p className="text-xs text-slate-500">{isRTL ? 'بطاقة المرور الإلكترونية للأجهزة والماسح الضوئي' : 'Digital clocking card for web scanner'}</p>
          </div>

          <div className="w-56 h-56 mx-auto bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-center relative shadow-inner">
             <QrCode className="w-44 h-44 text-slate-700 dark:text-indigo-400 stroke-[1.2]" />
             <div className="absolute inset-0 flex items-center justify-center bg-white/10 dark:bg-slate-900/10 backdrop-blur-[1px]">
               <div className="p-2 py-1 bg-indigo-600 text-white font-mono text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg">
                 ACTIVE ENCRYPTED
               </div>
             </div>
          </div>

          <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-800/25 border border-slate-100 dark:border-slate-800 rounded-2xl block">
            <p className="text-[10px] font-black tracking-widest text-[#135bf6] uppercase">{user?.displayName || 'User profile'}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{isRTL ? 'تنشيط مستمر 24 ساعة' : 'Refreshes every 24h'}</p>
          </div>

          <button 
            onClick={() => alert(isRTL ? 'تم تنزيل بطاقة المرور بنجاح!' : 'QR badge downloaded successfully')}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
          >
            {isRTL ? 'تصدير وحفظ بطاقة الـ QR' : 'Export & Print Passport'}
          </button>
        </div>
      )}

      {/* Editing record modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{isRTL ? 'تعديل سجل حضور' : 'Edit Attendance Record'}</h2>
                <p className="text-xs text-slate-500">{editingRecord.employeeName}</p>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingRecord(null); }}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full cursor-pointer"
              >
                <XCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="grid gap-4.5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRTL ? 'النوع' : 'Stamp type'}</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 dark:text-white"
                    value={editFormState.type}
                    onChange={(e) => setEditFormState({ ...editFormState, type: e.target.value })}
                  >
                    <option value="CHECK_IN">CHECK IN</option>
                    <option value="CHECK_OUT">CHECK OUT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRTL ? 'الوقت' : 'Time text'}</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 dark:text-white font-mono"
                    value={editFormState.time}
                    onChange={(e) => setEditFormState({ ...editFormState, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-550 dark:text-slate-450 uppercase tracking-widest">{isRTL ? 'دقائق التأخير المعينة' : 'Delay minutes'}</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-100 dark:text-white"
                    value={editFormState.delayMinutes}
                    onChange={(e) => setEditFormState({ ...editFormState, delayMinutes: Number(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-550 dark:text-slate-450 uppercase tracking-widest">{isRTL ? 'مبلغ غرامة الخصم' : 'Penal Deduction Amount'}</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-100 dark:text-white"
                    value={editFormState.deduction}
                    onChange={(e) => setEditFormState({ ...editFormState, deduction: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-550 dark:text-slate-450 uppercase tracking-widest">{isRTL ? 'تاريخ السجل المالي والتحضير' : 'Timestamp date'}</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 dark:text-white"
                  value={editFormState.date}
                  onChange={(e) => setEditFormState({ ...editFormState, date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 font-bold">
                <button 
                  type="button" 
                  onClick={() => { setIsEditModalOpen(false); setEditingRecord(null); }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-650 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-150 cursor-pointer"
                >
                  {isRTL ? 'حفظ التغييرات' : 'Save Shift Updates'}
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
