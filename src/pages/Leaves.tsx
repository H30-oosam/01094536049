import React, { useState } from 'react';
import { 
  Calendar, Check, X, Search, Plus, 
  User, Clock, Filter, FileText,
  AlertCircle, Briefcase, Zap
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const Leaves = () => {
  const { isRTL } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  const leaveRequests = [
    { id: 1, employee: 'Zaid Al-Harbi', type: 'Annual', start: '2024-06-01', end: '2024-06-15', days: 14, status: 'Pending', reason: 'Summer Vacation' },
    { id: 2, employee: 'Sarah Chen', type: 'Sick', start: '2024-05-12', end: '2024-05-13', days: 2, status: 'Approved', reason: 'Medical Checkup' },
    { id: 3, employee: 'David Miller', type: 'Unpaid', start: '2024-05-20', end: '2024-05-22', days: 3, status: 'Rejected', reason: 'Personal Conflict' },
    { id: 4, employee: 'Maria Garcia', type: 'Emergency', start: '2024-05-15', end: '2024-05-15', days: 1, status: 'Approved', reason: 'Family Emergency' },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة الإجازات والغياب' : 'Time Off & Leaves'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'تتبع طلبات الإجازات، الرصيد المتبقي والموافقات' : 'Track leave requests, balances, and manager approvals'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-4xl font-bold shadow-xl shadow-indigo-100/10 hover:bg-slate-50 transition-all active:scale-95">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>{isRTL ? 'رصيد الإجازات' : 'Balance Calc'}</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            <span>{isRTL ? 'طلب إجازة' : 'Request Leave'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {[
           { label: isRTL ? 'بانتظار الموافقة' : 'Pending Requests', val: '14', icon: Clock, color: 'text-amber-500' },
           { label: isRTL ? 'تمت الموافقة اليوم' : 'Approved Today', val: '8', icon: Check, color: 'text-emerald-500' },
           { label: isRTL ? 'موظفين في إجازة' : 'On Leave Now', val: '12', icon: User, color: 'text-indigo-500' },
           { label: isRTL ? 'إجازة مرضية' : 'Sick Leaves', val: '3', icon: AlertCircle, color: 'text-rose-500' },
         ].map((stat, index) => (
           <div key={index} className="bg-white/60 backdrop-blur-xl p-8 rounded-6xl border border-white/80 shadow-2xl shadow-indigo-100/20">
              <stat.icon className={`w-8 h-8 ${stat.color} mb-4`} />
              <div className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter mb-1">{stat.val}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
           </div>
         ))}
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-6xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="p-8 border-b border-white/40 flex items-center justify-between">
           <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={isRTL ? 'بحث عن طلب...' : 'Search requests...'}
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/80 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Filter className="w-5 h-5 text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الموظف' : 'Employee'}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'النوع' : 'Type'}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الفترة' : 'Period'}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'أيام' : 'Days'}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الحالة' : 'Status'}</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {leaveRequests.map((request) => (
                <tr key={request.id} className="hover:bg-white/40 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                        {request.employee.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{request.employee}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">
                      {request.type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {request.start} → {request.end}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-indigo-600 italic">#{request.days}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-100">
                          <Check className="w-5 h-5" />
                       </button>
                       <button className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-lg shadow-rose-100">
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaves;
