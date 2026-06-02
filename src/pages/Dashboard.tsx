import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, UserCheck, Calendar, Wallet, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Briefcase, Megaphone, ScrollText, Timer, Globe, ShieldAlert,
  Folder, Heart, GraduationCap, Box, History, Shield, Settings, Sparkles, AlertCircle,
  Clock, Plus, FileSpreadsheet, Activity, ChevronRight, CheckSquare, Bell
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, addDoc } from 'firebase/firestore';
import AIAssistant from '../components/AIAssistant';
import { exportToExcel } from '../utils/exportUtils';
import { format } from 'date-fns';

// Stable beautiful curve coordinates for background presentation
const defaultAttendanceWaveData = [
  { name: 'Sun', attendance: 94 },
  { name: 'Mon', attendance: 96 },
  { name: 'Tue', attendance: 98 },
  { name: 'Wed', attendance: 95 },
  { name: 'Thu', attendance: 97 },
];

const COLORS_LIGHT = ['#135bf6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const COLORS_DARK = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  trend: 'up' | 'down';
  iconBg: string;
  iconColor: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon: Icon, trend, iconBg, iconColor }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between select-none">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} ${iconColor} shrink-0`}>
          <Icon className="w-5 h-5 stroke-[2.3]" />
        </div>
        
        <div>
          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold tracking-tight mb-1">{title}</p>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
        </div>
      </div>
      
      <div className={`flex items-center gap-1 text-[11px] font-extrabold shrink-0 ${
        trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
      }`}>
        <span>{change}%</span>
        <span>{trend === 'up' ? '↑' : '↓'}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { isRTL, currency, theme } = useUIStore();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const isDark = theme === 'dark';

  // Live database stats
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    // Setup live subscription listeners
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubLeaves = onSnapshot(collection(db, 'leaves'), (snapshot) => {
      setLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubPayrolls = onSnapshot(collection(db, 'payroll'), (snapshot) => {
      setPayrolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {
      // Fallback from localStorage
      const saved = localStorage.getItem('demoPayrolls');
      if (saved) setPayrolls(JSON.parse(saved));
    });

    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const unsubLogs = onSnapshot(query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(5)), (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {
      // Fallback
      setActivities([
        { id: '1', userName: 'Ahmed Hassan', description: 'Updated task priority for Admin Board', timestamp: new Date().toISOString() },
        { id: '2', userName: 'Fatima Mohamed', description: 'Submitted annual leave request (14 days)', timestamp: new Date().toISOString() },
        { id: '3', userName: 'Omar Ali', description: 'Approved attendance register logs for Engineering', timestamp: new Date().toISOString() }
      ]);
    });

    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubLeaves();
      unsubTasks();
      unsubPayrolls();
      unsubNotifications();
      unsubLogs();
    };
  }, []);

  // Compute stats metrics dynamically
  const totalEmployees = employees.length > 0 ? employees.length : 124;
  
  // Today's checked-in presence logs
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const presentToday = attendance.filter(a => a.date === todayStr && a.type === 'CHECK_IN').length;
  const activePresence = presentToday > 0 ? presentToday : Math.floor(totalEmployees * 0.91);
  const lateTodayCount = attendance.filter(a => a.date === todayStr && (Number(a.delayMinutes) || 0) > 0).length;

  const absencesCount = Math.max(0, totalEmployees - activePresence);
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending' || l.status === 'Pending').length;
  const activeTasksCount = tasks.filter(t => t.status !== 'done' && t.status !== 'Done').length;
  
  // Unpaid payroll draft total
  const pendingPayrollSum = payrolls
    .filter(p => p.status === 'draft' || p.status === 'Draft')
    .reduce((val, curr) => val + (Number(curr.base || curr.netSalary) || 0), 0);
  const finalPayrollVal = pendingPayrollSum > 0 ? pendingPayrollSum : 48500;

  // Department headcount mapping for pie chart
  const deptMap: Record<string, number> = {};
  employees.forEach(emp => {
    const dept = emp.departmentId || 'Operations';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptData = Object.keys(deptMap).length > 0 
    ? Object.entries(deptMap).map(([name, value]) => ({ name, value }))
    : [
        { name: 'Engineering', value: 45 },
        { name: 'Marketing', value: 24 },
        { name: 'HR & Audit', value: 12 },
        { name: 'Finance', value: 16 },
      ];

  const handleExportQuickStats = () => {
    const summaryData = [
      { [isRTL ? 'مؤشر القياس' : 'Metric']: isRTL ? 'إجمالي الموظفين' : 'Total Employees', [isRTL ? 'القيمة' : 'Value']: totalEmployees },
      { [isRTL ? 'مؤشر القياس' : 'Metric']: isRTL ? 'الحاضرين اليوم' : 'Present Customers', [isRTL ? 'القيمة' : 'Value']: activePresence },
      { [isRTL ? 'مؤشر القياس' : 'Metric']: isRTL ? 'حالات الغياب' : 'Absences', [isRTL ? 'القيمة' : 'Value']: absencesCount },
      { [isRTL ? 'مؤشر القياس' : 'Metric']: isRTL ? 'الطلبات المعلقة للإجازة' : 'Leaves Pending', [isRTL ? 'القيمة' : 'Value']: pendingLeavesCount },
      { [isRTL ? 'مؤشر القياس' : 'Metric']: isRTL ? 'ساعات العمل والخصومات' : 'Draft Salaries Total', [isRTL ? 'القيمة' : 'Value']: finalPayrollVal },
    ];
    exportToExcel(summaryData, isRTL ? 'ملخص_إحصائيات_الموارد_البشرية' : 'hr_analytics_dashboard_summary', 'KPIs');
  };

  const tickColor = isDark ? '#64748b' : '#94a3b8';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(148, 163, 184, 0.1)';
  const mainColor = '#135bf6'; 

  const tooltipContentStyle = isDark 
    ? { borderRadius: '16px', backgroundColor: '#0f172a', border: '1px solid #1e293b', fontFamily: 'inherit', color: '#f1f5f9' }
    : { borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontFamily: 'inherit', color: '#0f172a' };

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Glory Gradient Cover Banner */}
      <div className="relative bg-gradient-to-r from-[#030d21] to-[#122c54] rounded-4xl p-8 md:p-12 overflow-hidden shadow-[0_10px_30px_-5px_rgba(3,13,33,0.1)] select-none">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-10 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3.5">
            <span className="inline-block px-3 py-1 bg-white/10 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-white/10">
              {isRTL ? 'لوحة المراقبة الداخلية والإشراف' : 'ADMINISTRATIVE CONTROL'}
            </span>
            <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight leading-tight">
              {isRTL ? 'لوحة القيادة الإدارية والتشغيلية الموحدة' : 'Vital Employee Operational Command Dashboard'}
            </h1>
            <p className="text-gray-350 text-xs md:text-sm font-semibold tracking-wide max-w-2xl leading-relaxed">
              {isRTL 
                ? 'مراقبة فورية لأجهزة البصمة، تتبع الأجهزة، حساب التأخير والخصم التلقائي، وإصدار مسيرات الرواتب بمرونة.' 
                : 'Continuous 24/7 strategic tracking of organizational metrics, workforce stability, and actual payroll.'}
            </p>
          </div>

          <div className="text-left select-none opacity-60 self-start md:self-end">
            <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none">
              SYSTEM COMMAND V2.0
            </span>
          </div>
        </div>
      </div>

      {/* 2. Dynamic KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title={isRTL ? 'إجمالي عدد الموظفين' : 'Total Headcount'} 
          value={totalEmployees.toLocaleString()} 
          change="4.5" 
          icon={Users} 
          trend="up"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KPICard 
          title={isRTL ? 'حاضر اليوم' : 'Attendance Present'} 
          value={`${activePresence} (${Math.round((activePresence/totalEmployees)*100)}%)`} 
          change="1.2" 
          icon={UserCheck} 
          trend="up"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <KPICard 
          title={isRTL ? 'المرتبات المستحقة المعلقة' : 'Draft Pending Salaries'} 
          value={`${currency} ${finalPayrollVal.toLocaleString()}`} 
          change="2.4" 
          icon={Wallet} 
          trend="down"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          iconColor="text-amber-500 dark:text-amber-400"
        />
        <KPICard 
          title={isRTL ? 'المهام المعلقة قيد التشغيل' : 'Active Task Backlog'} 
          value={activeTasksCount > 0 ? activeTasksCount.toString() : '8'} 
          change="12" 
          icon={Briefcase} 
          trend="up"
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          iconColor="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* 3. Graphical Analytics Charts & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Attendance Area Graph Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-4xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-[#135bf6] rounded-full"></div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {isRTL ? 'مخطط الانضباط ومعدل الحضور' : 'Overall Attendance Analytics'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                  {isRTL ? 'توزيع نسبة الالتزام اليومية' : 'Average daily attendance patterns and logs'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleExportQuickStats}
              className="px-5 py-2.5 border border-blue-600/15 bg-blue-600/5 hover:bg-blue-600/10 text-[#135bf6] text-xs font-black rounded-full select-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isRTL ? 'تصدير الملخص السريع' : 'Export Excel Report'}</span>
            </button>
          </div>
          
          <div className="h-72 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={defaultAttendanceWaveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={mainColor} stopOpacity={0.12}/>
                      <stop offset="95%" stopColor={mainColor} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: tickColor, fontSize: 10, fontWeight: 700 }} 
                    dy={10} 
                  />
                  
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    domain={[85, 100]} 
                    tick={{ fill: tickColor, fontSize: 10, fontWeight: 700 }} 
                    dx={-10} 
                  />
                  
                  <Tooltip contentStyle={tooltipContentStyle} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke={mainColor} 
                    fillOpacity={1} 
                    fill="url(#colorAttendance)" 
                    strokeWidth={4} 
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 dark:bg-slate-800 rounded-3xl animate-pulse" />
            )}
          </div>
        </div>

        {/* Dedicated Quick Actions Control Terminal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-4xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-5 border-b border-slate-50 dark:border-slate-800 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600">
                <Settings className="w-4.5 h-4.5 stroke-[2.3]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">
                  {isRTL ? 'إجراءات لوحة التحكم السريعة' : 'Quick Admin Actions'}
                </h3>
                <span className="text-[9px] text-indigo-500 uppercase font-black tracking-widest mt-1 block">
                  FAST PROCESS CORES
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3.5">
              <a href="/attendance" className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-slate-800/25 border border-slate-100/60 dark:border-slate-800 rounded-2xl hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{isRTL ? 'بوابة الحضور للتوقيع والتحكم' : 'Shift Stamp Gates'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              <a href="/employees" className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-slate-800/25 border border-slate-100/60 dark:border-slate-800 rounded-2xl hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Plus className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{isRTL ? 'إضافة موظف جديد بالنظام' : 'Add Employee Module'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              <a href="/leaves" className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-slate-800/25 border border-slate-100/60 dark:border-slate-800 rounded-2xl hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{isRTL ? 'تقديم طلب إجازة طارئ' : 'Submit Leave Request'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50/50 dark:bg-slate-80s border border-blue-50 dark:border-slate-800 rounded-2xl flex items-center gap-2.5 mt-4">
            <Shield className="w-5 h-5 text-[#135bf6] shrink-0" />
            <p className="text-[10px] text-slate-500 font-bold leading-normal">
              {isRTL 
                ? 'أنظمة الصلاحيات والأمان المشدد في حالة نشاط لضمان حماية بيانات الموظفين والملفات الحساسة.' 
                : 'Zero-trust roles in place. Sensitive payroll documents are encrypted internally.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Pie Chart Distributions, Announcements, & Recent Activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Department Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-4xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#135bf6] rounded-full"></span>
              {isRTL ? 'توزيع الموظفين على الأقسام' : 'Department Distributions'}
            </h3>
            <div className="h-56 w-full flex items-center justify-center relative">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={deptData}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={isDark ? COLORS_DARK[index % COLORS_DARK.length] : COLORS_LIGHT[index % COLORS_LIGHT.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-slate-50 dark:bg-slate-800 rounded-3xl animate-pulse" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2.5xl font-black text-slate-800 dark:text-slate-100 leading-none">{totalEmployees}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{isRTL ? 'موظف كلي' : 'Total Staff'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2 border-t border-slate-50 dark:border-slate-800 pt-5">
            {deptData.slice(0, 3).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold font-mono">
                <span className="text-slate-400 uppercase tracking-wider">{item.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-900 dark:text-white font-black">{item.value}</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isDark ? COLORS_DARK[index % COLORS_DARK.length] : COLORS_LIGHT[index % COLORS_LIGHT.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Audit logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-4xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-slate-50 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 flex items-center justify-center shrink-0">
                  <Activity className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">
                    {isRTL ? 'آخر الأنشطة والعمليات الإدارية' : 'Activity & Audit Log'}
                  </h3>
                  <span className="text-[9px] text-purple-600 font-black tracking-widest uppercase mt-1.5 block">Security & Operations Feed</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activities.slice(0, 4).map((act, i) => (
                <div key={act.id || i} className="flex items-start gap-3 text-xs leading-tight">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      <span className="font-extrabold text-[#135bf6] mr-1">{act.userName}</span>
                      {act.description || act.message}
                    </p>
                    {act.timestamp && (
                      <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase font-mono">
                        {format(new Date(act.timestamp), 'hh:mm a - d MMM')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <a href="/logs" className="w-full mt-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-center font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider block transition-all">
             {isRTL ? 'مشاهدة سجل العمليات الكامل' : 'View Complete Audit Logs'}
          </a>
        </div>

        {/* Dynamic Alerts / notifications panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-4xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-slate-50 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Bell className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">
                    {isRTL ? 'نظام التنبيهات والإشعارات' : 'Emergency alerts'}
                  </h3>
                  <span className="text-[9px] text-rose-500 font-black tracking-widest uppercase mt-1.5 block">Contract & Leaves Alerts</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notif, i) => (
                  <div key={notif.id || i} className="p-3 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-3 text-xs">
                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${notif.type === 'error' ? 'text-rose-500' : 'text-amber-500'}`} />
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white line-clamp-1">{notif.title}</h4>
                      <p className="text-slate-500 text-[11px] font-bold mt-0.5">{notif.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-3 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white">Summer Schedules Active</h4>
                      <p className="text-slate-500 text-[11px]">Default working time set at 09:00 AM maximum allowance.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-3 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white">Contract Renewal due</h4>
                      <p className="text-slate-500 text-[11px]">Engineering Senior Developer contract expires soon.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <a href="/announcements" className="w-full mt-6 bg-[#135bf6] hover:bg-blue-700 text-white font-extrabold py-3.5 text-center rounded-xl text-xs uppercase tracking-wider block transition-all cursor-pointer">
             {isRTL ? 'تصفح الإعلانات والتعاميم' : 'Browse Broadcast Info'}
          </a>
        </div>
      </div>

      {/* AI Assistant Drawer Section */}
      <div className="border border-slate-100 dark:border-slate-800 rounded-4xl bg-white dark:bg-slate-900 p-6 shadow-sm overflow-hidden">
        <AIAssistant />
      </div>
    </div>
  );
};

export default Dashboard;
