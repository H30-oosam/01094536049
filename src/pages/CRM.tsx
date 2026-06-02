import React, { useState } from 'react';
import { 
  Heart, MessageSquare, Award, AlertCircle, 
  Search, Filter, Plus, Calendar, Star,
  User, CheckCircle2, TrendingUp
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const CRM = () => {
  const { isRTL } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  const interactions = [
    { id: 1, employee: 'Alice Freeman', type: 'feedback', content: 'Exceeded project milestones for Q2. High quality of code.', date: '2024-05-10', sentiment: 'positive', score: 95 },
    { id: 2, employee: 'Zaid Al-Harbi', type: 'meeting', content: 'Monthly 1:1. Discussed career path and interest in leadership.', date: '2024-05-09', sentiment: 'neutral', score: 70 },
    { id: 3, employee: 'Sarah Chen', type: 'award', content: 'Employee of the Month for outstanding teamwork.', date: '2024-05-01', sentiment: 'positive', score: 100 },
    { id: 4, employee: 'Omar Farooq', type: 'warning', content: 'Late arrival for the third time this week without notice.', date: '2024-04-28', sentiment: 'negative', score: 30 },
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-600 bg-emerald-50';
      case 'negative': return 'text-rose-600 bg-rose-50';
      default: return 'text-amber-600 bg-amber-50';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة علاقات الموظفين' : 'Employee CRM (ERM)'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'تتبع التفاعلات، الملاحظات، والمكافآت لتعزيز تجربة الموظف' : 'Track interactions, feedback, and rewards to boost employee experience'}
          </p>
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          <span>{isRTL ? 'تسجيل تفاعل جديد' : 'Log New Interaction'}</span>
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-5xl border border-white/80 shadow-2xl shadow-indigo-100/20">
          <Heart className="w-8 h-8 text-rose-500 mb-4" />
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">94%</h3>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{isRTL ? 'مؤشر الرضا' : 'Satisfaction Index'}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-5xl border border-white/80 shadow-2xl shadow-indigo-100/20">
          <Award className="w-8 h-8 text-amber-500 mb-4" />
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">12</h3>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{isRTL ? 'جوائز نشطة' : 'Active Awards'}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-5xl border border-white/80 shadow-2xl shadow-indigo-100/20">
          <TrendingUp className="w-8 h-8 text-indigo-500 mb-4" />
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">+15%</h3>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{isRTL ? 'نمو المشاركة' : 'Engagement Growth'}</p>
        </div>
      </div>

      {/* Engagement Hub & Pulse Surveys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-6xl p-10 text-white shadow-2xl shadow-indigo-200">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                 <Star className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                 <h3 className="text-2xl font-black italic tracking-tighter uppercase">{isRTL ? 'المهام المقترحة' : 'Action Hub'}</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'توصيات الذكاء الاصطناعي' : 'AI-Driven Engagement Suggestions'}</p>
              </div>
           </div>
           
           <div className="space-y-4">
              {[
                 { title: 'Celebrate 5th Work Anniversary', user: 'Zaid Al-Harbi', type: 'celebration' },
                 { title: 'Check-in on Wellness', user: 'Alice Freeman', type: 'health' },
                 { title: 'Assign Leadership Training', user: 'Sarah Chen', type: 'growth' }
              ].map((action, i) => (
                 <div key={i} className="group cursor-pointer flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center font-black text-xs">
                          {action.user.charAt(0)}
                       </div>
                       <div>
                          <div className="text-sm font-bold">{action.title}</div>
                          <div className="text-[10px] font-black text-slate-500 uppercase">{action.user}</div>
                       </div>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase group-hover:bg-amber-400 group-hover:text-amber-950 transition-all">
                       {isRTL ? 'تنفيذ' : 'Execute'}
                    </button>
                 </div>
              ))}
           </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-6xl border border-white/80 p-10 shadow-2xl shadow-indigo-200/20">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">{isRTL ? 'نتائج استطلاعات الرأي' : 'Pulse Insights'}</h3>
              <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-400 select-none">Live Data</div>
           </div>

           <div className="space-y-6">
              {[
                 { label: 'Work-Life Balance', value: 85, color: '#6366f1' },
                 { label: 'Team Collaboration', value: 92, color: '#10b981' },
                 { label: 'Management Support', value: 78, color: '#f59e0b' },
                 { label: 'Growth Opportunities', value: 88, color: '#a855f7' }
              ].map((pulse, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                       <span>{pulse.label}</span>
                       <span>{pulse.value}%</span>
                    </div>
                    <div className="h-4 bg-white rounded-full p-1 border border-slate-100">
                       <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${pulse.value}%`, backgroundColor: pulse.color }}
                       ></div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Timeline of Interactions */}
      <div className="bg-white/60 backdrop-blur-xl rounded-6xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="p-8 border-b border-white/40 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={isRTL ? 'البحث في السجلات...' : 'Search records...'}
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/80 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Filter className="w-5 h-5 text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors" />
        </div>

        <div className="p-8 space-y-6">
          {interactions.map((item) => (
            <div key={item.id} className="group relative pl-8 border-l-2 border-indigo-100 last:border-0 pb-6 last:pb-0">
               <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-indigo-400 rounded-full group-hover:bg-indigo-400 transition-colors"></div>
               
               <div className="bg-white/80 rounded-4xl p-6 border border-white shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-100 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                        {item.employee.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{item.employee}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getSentimentColor(item.sentiment)}`}>
                            {item.sentiment}
                          </span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.date}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'نقاط التقييم' : 'Impact Score'}</div>
                          <div className="text-lg font-black text-indigo-600 italic">#{item.score}</div>
                       </div>
                       <div className="h-8 w-px bg-slate-100"></div>
                       <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-all">
                          <MessageSquare className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {item.content}
                  </p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CRM;
