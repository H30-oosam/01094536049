import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, UserCheck, Calendar, Wallet, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Briefcase, Megaphone, ScrollText, Timer, Globe, ShieldAlert,
  Folder, Heart, GraduationCap, Box, History, Shield, Settings, Sparkles, AlertCircle
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { auth } from '../firebase';
import AIAssistant from '../components/AIAssistant';

// Exact attendance dataset for a beautiful flowing smooth wave line
const attendanceWaveData = [
  { name: '1', attendance: 94 },
  { name: '3', attendance: 95 },
  { name: '5', attendance: 97 },
  { name: '7', attendance: 93 },
  { name: '9', attendance: 98 },
  { name: '11', attendance: 97 },
  { name: '13', attendance: 99 },
  { name: '15', attendance: 94 },
  { name: '17', attendance: 98 },
  { name: '19', attendance: 96 },
  { name: '21', attendance: 98 },
  { name: '23', attendance: 96 },
  { name: '25', attendance: 94 },
  { name: '27', attendance: 98 },
  { name: '29', attendance: 97 },
];

const recruitmentData = [
  { name: 'Applied', value: 450 },
  { name: 'Screening', value: 120 },
  { name: 'Interview', value: 45 },
  { name: 'Offered', value: 12 },
];

const COLORS_LIGHT = ['#135bf6', '#10b981', '#f59e0b', '#ef4444'];
const COLORS_DARK = ['#38bdf8', '#34d399', '#fbbf24', '#f87171'];

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
        {/* Curved Icon Square matches screenshot */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} ${iconColor} shrink-0`}>
          <Icon className="w-5 h-5 stroke-[2.3]" />
        </div>
        
        <div className="text-right">
          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold tracking-tight mb-1">{title}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
        </div>
      </div>
      
      {/* Small clean trend badge */}
      <div className={`flex items-center gap-1 text-[11px] font-extrabold ${
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
  const [mounted, setMounted] = useState(false);
  const isDark = theme === 'dark';
  const [stats, setStats] = useState({
    employees: 1284,
    attendance: '98.2%',
    payroll: '1.2M',
    projects: 24
  });

  useEffect(() => {
    setMounted(true);

    const fetchStats = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/stats/summary', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setStats(prev => ({
              ...prev,
              employees: data.employees || prev.employees,
              projects: data.departments || prev.projects
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching stats summary:", err);
      }
    };

    fetchStats();
  }, []);

  const tickColor = isDark ? '#64748b' : '#94a3b8';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(148, 163, 184, 0.1)';
  const mainColor = '#135bf6'; // Matches customer beautiful blue style!

  const tooltipContentStyle = isDark 
    ? { 
        borderRadius: '16px', 
        backgroundColor: '#0f172a', 
        border: '1px solid #1e293b', 
        fontFamily: 'inherit', 
        color: '#f1f5f9' 
      }
    : { 
        borderRadius: '16px', 
        backgroundColor: '#ffffff',
        border: '1px solid #f1f5f9', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
        fontFamily: 'inherit', 
        color: '#0f172a' 
      };

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Glory Gradient Cover Banner - Perfectly matches upload screenshot */}
      <div className="relative bg-gradient-to-r from-[#030d21] to-[#122c54] rounded-4xl p-8 md:p-12 overflow-hidden shadow-[0_10px_30px_-5px_rgba(3,13,33,0.1)] select-none">
        {/* Smooth ambient lights */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-10 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3.5">
            <span className="inline-block px-3 py-1 bg-white/10 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-white/10">
              {isRTL ? 'خدمات الموارد البشرية' : 'HR SERVICES'}
            </span>
            <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight leading-tight">
              {isRTL ? 'لوحة قيادة إدارة الموظفين الحيوية' : 'Vital Employee Management Command Dashboard'}
            </h1>
            <p className="text-gray-300 text-xs md:text-sm font-semibold tracking-wide max-w-2xl leading-relaxed">
              {isRTL 
                ? 'المراقبة المستمرة لمؤشرات القوى العاملة ومسيرات الرواتب على مدار الساعة' 
                : 'Continuous 24/7 strategic tracking of organizational metrics, workforce stability, and payroll.'}
            </p>
          </div>

          <div className="text-left select-none opacity-60 self-start md:self-end">
            <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none">
              HOSSAMELWARDANY V1.0
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sleek KPI Grid - ordered right to left to render elegantly in RTL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title={isRTL ? 'إجمالي عدد الموظفين' : 'Total Headcount'} 
          value={stats.employees.toLocaleString()} 
          change="4.2" 
          icon={Users} 
          trend="up"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KPICard 
          title={isRTL ? 'نسبة الحضور والانضباط' : 'Attendance & Discipline'} 
          value={stats.attendance} 
          change="1.5" 
          icon={UserCheck} 
          trend="up"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <KPICard 
          title={isRTL ? 'مسيرات الرواتب البشرية' : 'Workforce Payroll'} 
          value={`${currency} ${stats.payroll}`} 
          change="2.4" 
          icon={Wallet} 
          trend="down"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          iconColor="text-amber-500 dark:text-amber-400"
        />
        <KPICard 
          title={isRTL ? 'المشاريع والعمليات القائمة' : 'Active Projects & Operations'} 
          value={stats.projects.toString()} 
          change="12" 
          icon={Briefcase} 
          trend="up"
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          iconColor="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* 3. Analytics Graph & Company Announcements Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Attendance Area Graph Card wrapper */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-4xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-[#135bf6] rounded-full"></div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {isRTL ? 'مخطط الحضور الكلي' : 'Overall Attendance Analytics'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                  {isRTL ? 'معدل الحضور على مدار الـ 30 يوماً الماضية' : 'Average daily attendance log patterns'}
                </p>
              </div>
            </div>
            
            {/* Outline Button matching screenshot */}
            <button className="px-5 py-2.5 border border-blue-600/15 bg-blue-600/5 hover:bg-blue-600/10 text-[#135bf6] text-xs font-black rounded-full select-none transition-all cursor-pointer">
              {isRTL ? 'تصدير التقارير الكلية' : 'Export All Reports'}
            </button>
          </div>
          
          <div className="h-72 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={attendanceWaveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={mainColor} stopOpacity={0.12}/>
                      <stop offset="95%" stopColor={mainColor} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  
                  {/* Clean thin matrix grids */}
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
                    domain={[82, 100]} 
                    ticks={[82, 84, 86, 88, 90, 92, 94, 96, 98, 100]}
                    tick={{ fill: tickColor, fontSize: 10, fontWeight: 700 }} 
                    dx={-10} 
                  />
                  
                  <Tooltip contentStyle={tooltipContentStyle} />
                  
                  {/* Smooth wavy path spline */}
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

        {/* Strategic broadcast / announcement card wrapper */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-4xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-slate-50 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-500">
                  <Megaphone className="w-4.5 h-4.5 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">
                    {isRTL ? 'إعلانات الشركة والتعاميم' : 'Company Broadcast'}
                  </h3>
                  <span className="text-[9px] text-orange-500 uppercase font-black tracking-widest mt-1 block">
                    Strategic Broadcast
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { 
                  title: isRTL ? 'مواعيد الدوام الصيفية الجديدة' : 'New Summer Working Schedule Hours', 
                  date: isRTL ? 'الأسبوع القادم' : 'Next Week', 
                  icon: Timer,
                  bg: 'bg-amber-50 text-amber-500',
                },
                { 
                  title: isRTL ? 'تحديث لائحة العمل والعمل الذكي' : 'Updated Smart Workforce Regulations', 
                  date: isRTL ? 'منذ يومين' : '2 days ago', 
                  icon: ScrollText,
                  bg: 'bg-blue-50 text-blue-500',
                },
                { 
                  title: isRTL ? 'المرحلة السنوية الكبرى للموظفين' : 'Major Annual Employees Gala', 
                  date: isRTL ? '15 يوليو' : 'July 15', 
                  icon: Calendar,
                  bg: 'bg-emerald-50 text-emerald-500',
                }
              ].map((ann, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-slate-800/25 border border-slate-100/60 dark:border-slate-800 rounded-2xl hover:border-slate-200 dark:hover:border-slate-700 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ann.bg}`}>
                      <ann.icon className="w-4.5 h-4.5 stroke-[2.3]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight line-clamp-1">
                        {ann.title}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {ann.date}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button className="w-full mt-6 bg-[#135bf6] hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transform active:scale-[0.98] transition-all cursor-pointer">
             {isRTL ? 'مشاهدة كافة الإعلانات' : 'View Global Broadcast'}
          </button>
        </div>
      </div>

      {/* 4. Recruitment Funnel Pipeline & Advanced AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recruitment pipeline overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-4xl p-8 shadow-sm">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#135bf6] rounded-full"></span>
            {isRTL ? 'قنوات استقطاب الكفاءات' : 'Recruitment Pipeline Analytics'}
          </h3>
          <div className="h-56 w-full flex items-center justify-center relative">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={recruitmentData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {recruitmentData.map((entry, index) => (
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
              <span className="text-2.5xl font-black text-slate-800 dark:text-slate-100 leading-none">630</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Candidates</span>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            {recruitmentData.map((item, index) => (
              <div 
                key={item.name} 
                className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl"
                dir="ltr"
              >
                <span className="text-xs font-black text-slate-800 dark:text-white font-mono">
                  {item.value}
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {item.name}
                  </span>
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: isDark ? COLORS_DARK[index % COLORS_DARK.length] : COLORS_LIGHT[index % COLORS_LIGHT.length] }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant container */}
        <div className="lg:col-span-2">
           <AIAssistant />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
