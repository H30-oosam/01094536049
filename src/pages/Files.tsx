import React, { useState } from 'react';
import { 
  File, Folder, Search, Upload, Plus, 
  MoreVertical, Download, Trash2, FileText, 
  Image as ImageIcon, FileCode, Archive
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const Files = () => {
  const { isRTL } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  const mockFiles = [
    { id: 1, name: 'Employee_Contracts_2024.zip', size: '4.2 MB', type: 'archive', date: '2024-05-10', owner: 'HR Dept' },
    { id: 2, name: 'Quarterly_Report_Q1.pdf', size: '1.8 MB', type: 'pdf', date: '2024-04-15', owner: 'Finance' },
    { id: 3, name: 'Logo_Pack_Final.ai', size: '12.5 MB', type: 'image', date: '2024-05-01', owner: 'Design' },
    { id: 4, name: 'Onboarding_Guidelines.docx', size: '850 KB', type: 'doc', date: '2024-05-12', owner: 'HR Dept' },
    { id: 5, name: 'Site_Map_Expansion.png', size: '2.1 MB', type: 'image', date: '2024-05-05', owner: 'Ops' },
  ];

  const filteredFiles = mockFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'archive': return <Archive className="w-5 h-5 text-amber-500" />;
      case 'pdf': return <FileText className="w-5 h-5 text-rose-500" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-indigo-500" />;
      default: return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة الملفات والأرشيف' : 'File & Archive Manager'}
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            {isRTL ? 'تخزين ومشاركة ملفات الشركة والمستندات الهامة' : 'Store and share company files and critical documents'}
          </p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-bold group">
             <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
             <span>{isRTL ? 'رفع ملف' : 'Upload'}</span>
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-xl shadow-indigo-100">
             <Plus className="w-5 h-5" />
             <span>{isRTL ? 'مجلد جديد' : 'New Folder'}</span>
           </button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="p-6 border-b border-white/40 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isRTL ? 'بحث في الملفات...' : 'Search files...'}
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/80 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
            <span>{filteredFiles.length} {isRTL ? 'ملف' : 'files'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الملف' : 'Name'}</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الحجم' : 'Size'}</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'المالك' : 'Owner'}</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'التاريخ' : 'Date'}</th>
                <th className="px-8 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-white transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      {getFileIcon(file.type)}
                      <span className="text-sm font-bold text-slate-800">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-slate-500">
                    {file.size}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase">
                      {file.owner}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-slate-400 uppercase">
                    {file.date}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
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

export default Files;
