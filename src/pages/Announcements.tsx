import React, { useState } from 'react';
import { 
  Megaphone, Plus, Bell, Calendar, 
  MessageSquare, User, Eye, Trash2,
  Clock, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const Announcements = () => {
  const { isRTL } = useUIStore();
  const [activeTab, setActiveTab] = useState('all');

  const news = [
    { id: 1, title: 'Summer Working Hours Update', titleAr: 'تحديث ساعات العمل الصيفية', date: '2024-05-12', category: 'Policy', priority: 'high', content: 'Starting June 1st, working hours will shift to 8 AM - 4 PM for all departments.' },
    { id: 2, title: 'Welcome Our New Team Members', titleAr: 'رحبوا بزملائنا الجدد', date: '2024-05-10', category: 'Team', priority: 'medium', content: 'We are excited to welcome 5 new developers to the IT department this week.' },
    { id: 3, title: 'Annual Team Building Event', titleAr: 'فعالية بناء الفريق السنوية', date: '2024-05-08', category: 'Events', priority: 'low', content: 'Save the date! Our annual retreat is scheduled for July 15th.' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'الإعلانات والتعاميم' : 'Company News & Hub'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'التواصل الداخلي وإعلانات الشركة الهامة' : 'Internal communication and important company announcements'}
          </p>
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          <span>{isRTL ? 'إعلان جديد' : 'New Post'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
           {news.map((item) => (
             <div key={item.id} className="bg-white/60 backdrop-blur-xl rounded-6xl border border-white/80 p-8 shadow-2xl shadow-indigo-100/10 group hover:shadow-indigo-200/20 transition-all overflow-hidden relative">
                {item.priority === 'high' && (
                   <div className="absolute top-0 right-0 py-2 px-12 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rotate-45 translate-x-10 -translate-y-2">
                       URGENT
                   </div>
                )}
                
                <div className="flex items-start justify-between mb-6">
                   <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                         item.category === 'Policy' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                         <Megaphone className="w-7 h-7" />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                           {isRTL ? item.titleAr : item.title}
                         </h3>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.category}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-all">
                         <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 hover:bg-rose-50 text-rose-400 rounded-xl transition-all">
                         <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>

                <p className="text-slate-600 leading-relaxed font-medium mb-8">
                   {item.content}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-white/40">
                   <div className="flex items-center -space-x-2">
                      {[1, 2, 3].map(i => (
                         <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                            {i}
                         </div>
                      ))}
                      <span className="pl-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seen by 124 people</span>
                   </div>
                   <button className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all">
                      <MessageSquare className="w-4 h-4" />
                      <span>{isRTL ? 'إضافة تعليق' : 'Add Comment'}</span>
                   </button>
                </div>
             </div>
           ))}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-5xl p-8 text-white shadow-2xl shadow-indigo-200">
              <Sparkles className="w-10 h-10 mb-4 text-indigo-200" />
              <h3 className="text-xl font-bold mb-2">{isRTL ? 'مؤشر التفاعل' : 'Engagement'}</h3>
              <div className="text-4xl font-black italic mb-4">88%</div>
              <p className="text-indigo-100 text-xs leading-relaxed font-bold">
                 {isRTL ? 'معدل قراءة التعاميم مرتفع جداً هذا الشهر.' : 'Announcement readership is exceptionally high this month.'}
              </p>
           </div>

           <div className="bg-white/60 backdrop-blur-xl rounded-5xl p-8 border border-white/80 shadow-2xl shadow-indigo-100/20">
              <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <Bell className="w-5 h-5 text-amber-500" />
                 <span>{isRTL ? 'تذكيرات عاجلة' : 'Quick Reminders'}</span>
              </h4>
              <div className="space-y-4">
                 {[
                   { task: 'Submit Monthly Expenses', time: '2 days left' },
                   { task: 'Annual Policy Review', time: 'Today' },
                   { task: 'Meeting with IT', time: '3:00 PM' },
                 ].map((t, i) => (
                   <div key={i} className="group cursor-pointer">
                      <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{t.task}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t.time}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
