import React, { useState } from 'react';
import { 
  Rocket, ClipboardList, UserPlus, CheckCircle2,
  Search, Plus, Clock, Filter, MousePointer2,
  Layout, Briefcase, GraduationCap, ChevronRight
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const Onboarding = () => {
  const { isRTL } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  const candidates = [
    { id: 1, name: 'John Peterson', role: 'UX Designer', joinDate: '2024-05-20', progress: 85, mentor: 'Sarah C.' },
    { id: 2, name: 'Laila Mahmoud', role: 'HR specialist', joinDate: '2024-05-25', progress: 40, mentor: 'Hassan R.' },
    { id: 3, name: 'Robert Fox', role: 'Cloud Engineer', joinDate: '2024-06-01', progress: 10, mentor: 'Chris T.' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إعداد الموظفين الجدد' : 'Employee Onboarding'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'متابعة رحلة الموظف الجديد وضمان جاهزيته للعمل' : 'Monitor new hire journeys and ensure operational readiness'}
          </p>
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Rocket className="w-5 h-5" />
          <span>{isRTL ? 'بدء رحلة جديدة' : 'Launch New Journey'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Journeys */}
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-500" />
              <span>{isRTL ? 'الرحلات النشطة' : 'Active Onboarding Sessions'}</span>
           </h3>
           
           <div className="grid gap-4">
              {candidates.map((person) => (
                <div key={person.id} className="bg-white/60 backdrop-blur-xl p-8 rounded-6xl border border-white/80 shadow-2xl shadow-indigo-100/10 hover:shadow-indigo-100/20 transition-all group">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-200">
                            {person.name.charAt(0)}
                         </div>
                         <div>
                            <h4 className="text-lg font-bold text-slate-900">{person.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{person.role} • {isRTL ? 'تاريخ البدء' : 'Start'}: {person.joinDate}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-3xl font-black text-indigo-600 italic">%{person.progress}</span>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'مكتمل' : 'Completed'}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                         <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                            style={{ width: `${person.progress}%` }}
                         ></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <GraduationCap className="w-4 h-4" />
                            <span>Mentor: {person.mentor}</span>
                         </div>
                         <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:translate-x-1 transition-transform">
                            <span>{isRTL ? 'عرض الجدول' : 'View Schedule'}</span>
                            <ChevronRight className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Sidebar Checklist Preview */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-6xl p-8 text-white shadow-2xl shadow-slate-200">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <ClipboardList className="w-6 h-6 text-indigo-400" />
                 <span>{isRTL ? 'قائمة التحقق' : 'Global Checklist'}</span>
              </h3>
              
              <div className="space-y-4">
                 {[
                   { task: 'Account Setup & Access', done: true },
                   { task: 'Welcome Package Sent', done: true },
                   { task: 'Mentor Assigned', done: true },
                   { task: 'Initial 1:1 Meeting', done: false },
                   { task: 'IT Equipment Issued', done: false },
                   { task: 'Security Guidelines Signed', done: false },
                 ].map((t, i) => (
                   <div key={i} className="flex items-center gap-3 group cursor-pointer">
                      <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                        t.done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700 hover:border-indigo-400'
                      }`}>
                         {t.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm font-bold ${t.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                        {t.task}
                      </span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-indigo-50 rounded-6xl p-8 border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4">{isRTL ? 'إحصائيات الشهر' : 'Month Summary'}</h3>
              <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-indigo-600">12</span>
                 <span className="text-xs font-black text-indigo-400 uppercase pb-1">{isRTL ? 'موظفين جدد' : 'New Hires'}</span>
              </div>
              <p className="text-xs text-indigo-600/60 mt-4 leading-relaxed font-bold">
                {isRTL ? 'تم تحسين معدل الجاهزية بنسبة ٢٢٪ عن الشهر الماضي.' : 'Readiness rate improved by 22% compared to last month.'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
