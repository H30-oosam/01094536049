import React, { useState } from 'react';
import { 
  Map as MapIcon, Search, Filter, 
  MapPin, Navigation, Layers, 
  Plus, Users, Building2
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const Map = () => {
  const { isRTL } = useUIStore();
  const [activePin, setActivePin] = useState<any>(null);

  const locations = [
    { id: 1, name: 'Main Office - Cairo', type: 'hq', x: 45, y: 35, staff: 120, status: 'operational' },
    { id: 2, name: 'Alexandria Branch', type: 'branch', x: 38, y: 22, staff: 45, status: 'operational' },
    { id: 3, name: 'Giza Hub', type: 'warehouse', x: 44, y: 38, staff: 30, status: 'warning' },
    { id: 4, name: 'Tanta Sales Point', type: 'pos', x: 42, y: 28, staff: 12, status: 'operational' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'الخريطة التفاعلية' : 'Interactive Location Map'}
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            {isRTL ? 'توزيع الموظفين والمواقع جغرافياً' : 'Geographic distribution of staff and locations'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Layers className="w-4 h-4" /> {isRTL ? 'الطبقات' : 'Layers'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Plus className="w-4 h-4" /> {isRTL ? 'إضافة نقطة' : 'Add Point'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Map Visualization */}
        <div className="flex-1 bg-slate-50 rounded-5xl border border-slate-200 shadow-inner relative overflow-hidden group min-h-75">
          {/* Mock Map Grid */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>

          {/* Abstract Map Regions */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M10,20 Q30,10 50,20 T90,20 L90,80 Q70,90 50,80 T10,80 Z" fill="#6366f1" />
            <path d="M70,30 Q80,40 70,50 T70,70" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>

          {/* Location Pins */}
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setActivePin(loc)}
              className="absolute group/pin transition-all hover:scale-125 z-10"
              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            >
              <div className={`relative flex flex-col items-center`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  activePin?.id === loc.id ? 'bg-indigo-600 ring-4 ring-indigo-100 animate-pulse' : 'bg-white'
                }`}>
                  <MapPin className={`w-4 h-4 ${activePin?.id === loc.id ? 'text-white' : 'text-indigo-600'}`} />
                </div>
                {activePin?.id === loc.id && (
                  <div className="absolute bottom-full mb-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <span className="text-[10px] font-black uppercase text-indigo-600">{loc.name}</span>
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* Map Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">+</button>
            <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">-</button>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 space-y-4 flex flex-col min-h-0 overflow-y-auto custom-scrollbar no-scrollbar lg:pr-2">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 p-6 shadow-xl shadow-indigo-100/20">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              {isRTL ? 'إحصائيات المواقع' : 'Location Stats'}
            </h3>
            <div className="space-y-3">
              {locations.map(loc => (
                <div 
                  key={loc.id}
                  onClick={() => setActivePin(loc)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    activePin?.id === loc.id ? 'bg-indigo-50 border-indigo-100' : 'bg-white/40 border-transparent hover:bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">{loc.name}</span>
                    <span className={`w-2 h-2 rounded-full ${loc.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase">
                      <Users className="w-3 h-3" /> {loc.staff} staff
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {activePin && (
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 animate-in slide-in-from-right-4 transition-all">
              <h4 className="text-lg font-bold mb-1">{activePin.name}</h4>
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-4">Location ID: #LC-{activePin.id}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-[8px] font-black uppercase opacity-60">Status</p>
                  <p className="text-xs font-bold capitalize">{activePin.status}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-[8px] font-black uppercase opacity-60">Staff</p>
                  <p className="text-xs font-bold">{activePin.staff}</p>
                </div>
              </div>

              <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-sm font-black transition-transform active:scale-95">
                {isRTL ? 'عرض التفاصيل' : 'View Full Details'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
