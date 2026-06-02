import React, { useState } from 'react';
import { 
  BarChart3, Target, Zap, Clock, Search,
  TrendingUp, TrendingDown, Star, User,
  CheckCircle2, Plus, ArrowUpRight, Award
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const Performance = () => {
  const { isRTL } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  const performanceMetrics = [
    { id: 1, employee: 'Sarah Chen', rating: 4.8, status: 'Peak Performer', kpi: '98%', trend: 'up' },
    { id: 2, employee: 'James Wilson', rating: 3.2, status: 'Improvement Needed', kpi: '74%', trend: 'down' },
    { id: 3, employee: 'David Miller', rating: 4.2, status: 'Strong Performer', kpi: '88%', trend: 'up' },
    { id: 4, employee: 'Maria Garcia', rating: 4.5, status: 'Top Talent', kpi: '92%', trend: 'up' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة الأداء والتقييم' : 'Performance & KPIs'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'مراقبة أداء الموظفين وتحقيق الأهداف الاستراتيجية' : 'Monitor employee performance and strategic goal achievement'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-4xl font-bold shadow-xl shadow-indigo-100/10 hover:bg-slate-50 transition-all active:scale-95">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>{isRTL ? 'تحديد أهداف' : 'Set OKRs'}</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            <span>{isRTL ? 'تقييم جديد' : 'New Review'}</span>
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white/60 backdrop-blur-xl rounded-6xl border border-white/80 p-8 shadow-2xl shadow-indigo-200/20">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">{isRTL ? 'متصدرين الأداء' : 'Top Performers'}</h3>
              <TrendingUp className="w-6 h-6 text-emerald-500" />
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="text-left border-b border-slate-100">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الموظف' : 'Employee'}</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'التقييم' : 'Rating'}</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الحالة' : 'Status'}</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">KPI</th>
                    <th className="pb-4"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {performanceMetrics.map((item) => (
                   <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                     <td className="py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                             {item.employee.charAt(0)}
                           </div>
                           <span className="font-bold text-slate-700">{item.employee}</span>
                        </div>
                     </td>
                     <td className="py-4">
                        <div className="flex items-center gap-1">
                           <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                           <span className="font-black text-slate-600">{item.rating}</span>
                        </div>
                     </td>
                     <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                          item.status.includes('Peak') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {item.status}
                        </span>
                     </td>
                     <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800">{item.kpi}</span>
                          {item.trend === 'up' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                        </div>
                     </td>
                     <td className="py-4 text-right">
                        <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                           <ArrowUpRight className="w-4 h-4" />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-5xl p-8 text-white shadow-2xl shadow-indigo-200">
              <Zap className="w-10 h-10 mb-4 text-indigo-200" />
              <h3 className="text-xl font-bold mb-2">{isRTL ? 'إحصائيات فورية' : 'Instant Insights'}</h3>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                {isRTL ? 'تم الانتهاء من ٨٥٪ من تقييمات الربع الثاني حتى الآن.' : '85% of Q2 reviews are finalized as of today.'}
              </p>
              <div className="h-2 bg-indigo-500/50 rounded-full overflow-hidden">
                 <div className="h-full bg-white w-4/5"></div>
              </div>
           </div>

           <div className="bg-white/60 backdrop-blur-xl rounded-5xl p-8 border border-white/80 shadow-2xl shadow-indigo-100/20">
              <div className="flex items-center gap-3 mb-6">
                 <Award className="w-5 h-5 text-amber-500" />
                 <h3 className="font-bold text-slate-900">{isRTL ? 'المهارات المطلوبة' : 'Skills Needed'}</h3>
              </div>
              <div className="space-y-4">
                 {['React Native', 'Leadership', 'Data Analytics'].map((skill, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <span className="text-sm font-bold text-slate-600">{skill}</span>
                       <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">{isRTL ? 'فجوة' : 'Gap'}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
