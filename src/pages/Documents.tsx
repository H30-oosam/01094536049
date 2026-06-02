import React, { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  Plus,
  FileCheck,
  FileWarning,
  BadgeCheck,
  Briefcase,
  ShieldAlert,
  ScrollText,
  Printer,
  Share2,
  Eye,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

type DocumentTemplate = {
  id: number;
  title: string;
  titleAr: string;
  category: string;
  categoryAr: string;
  icon: React.ElementType;
  type: string;
  size: string;
};

const initialDocuments: DocumentTemplate[] = [
  { id: 1, title: 'Standard Employment Contract', titleAr: 'عقد عمل قياسي', category: 'Contracts', categoryAr: 'عقود', icon: FileCheck, type: 'DOCX', size: '45 KB' },
  { id: 2, title: 'Non-Disclosure Agreement (NDA)', titleAr: 'اتفاقية عدم الإفصاح', category: 'Legal', categoryAr: 'قانوني', icon: ShieldAlert, type: 'PDF', size: '120 KB' },
  { id: 3, title: 'Offer Letter Template', titleAr: 'نموذج عرض وظيفي', category: 'Recruitment', categoryAr: 'توظيف', icon: Briefcase, type: 'DOCX', size: '32 KB' },
  { id: 4, title: 'Termination Notice', titleAr: 'إشعار إنهاء الخدمة', category: 'HR Policy', categoryAr: 'سياسات', icon: FileWarning, type: 'PDF', size: '88 KB' },
  { id: 5, title: 'Experience Certificate', titleAr: 'شهادة خبرة', category: 'Certificates', categoryAr: 'شهادات', icon: BadgeCheck, type: 'DOCX', size: '28 KB' },
  { id: 6, title: 'Salary Certificate', titleAr: 'شهادة راتب', category: 'Financial', categoryAr: 'مالي', icon: ScrollText, type: 'PDF', size: '54 KB' },
  { id: 7, title: 'Employee Performance Warning', titleAr: 'إنذار أداء موظف', category: 'HR Policy', categoryAr: 'سياسات', icon: ShieldAlert, type: 'DOCX', size: '40 KB' },
  { id: 8, title: 'Loan Request Form', titleAr: 'نموذج طلب سلفة', category: 'Financial', categoryAr: 'مالي', icon: ScrollText, type: 'PDF', size: '65 KB' },
];

const Documents = () => {
  const { isRTL } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<DocumentTemplate[]>(initialDocuments);
  const [selectedDoc, setSelectedDoc] = useState<DocumentTemplate | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', titleAr: '', category: 'Contracts', categoryAr: 'عقود', type: 'DOCX', size: '45 KB' });

  const filteredDocs = documents.filter((doc) => {
    const current = isRTL ? doc.titleAr : doc.title;
    return current.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const categories = [
    { label: isRTL ? 'العقود' : 'Contracts', count: documents.filter((doc) => doc.category === 'Contracts').length, icon: FileCheck, color: 'text-indigo-600' },
    { label: isRTL ? 'السياسات' : 'Policies', count: documents.filter((doc) => doc.category === 'HR Policy').length, icon: ShieldAlert, color: 'text-amber-600' },
    { label: isRTL ? 'الشهادات' : 'Certificates', count: documents.filter((doc) => doc.category === 'Certificates').length, icon: BadgeCheck, color: 'text-emerald-600' },
    { label: isRTL ? 'عام' : 'General', count: documents.filter((doc) => ['Legal', 'Recruitment', 'Financial'].includes(doc.category)).length, icon: FileText, color: 'text-slate-600' },
  ];

  const openForm = (doc: DocumentTemplate | null = null) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        title: doc.title,
        titleAr: doc.titleAr,
        category: doc.category,
        categoryAr: doc.categoryAr,
        type: doc.type,
        size: doc.size,
      });
    } else {
      setEditingDoc(null);
      setFormData({ title: '', titleAr: '', category: 'Contracts', categoryAr: 'عقود', type: 'DOCX', size: '45 KB' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoc) {
      setDocuments((prev) => prev.map((doc) => (doc.id === editingDoc.id ? { ...doc, ...formData } : doc)));
      setSelectedDoc(null);
    } else {
      const nextId = documents.length ? Math.max(...documents.map((doc) => doc.id)) + 1 : 1;
      const newDocument: DocumentTemplate = {
        id: nextId,
        title: formData.title,
        titleAr: formData.titleAr,
        category: formData.category,
        categoryAr: formData.categoryAr,
        icon: formData.category === 'Contracts' ? FileCheck : formData.category === 'Legal' ? ShieldAlert : formData.category === 'Certificates' ? BadgeCheck : formData.category === 'Recruitment' ? Briefcase : ScrollText,
        type: formData.type,
        size: formData.size,
      };
      setDocuments((prev) => [newDocument, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذا النموذج؟' : 'Delete this document?')) return;
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    if (selectedDoc?.id === id) setSelectedDoc(null);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'مكتبة العقود والنماذج' : 'Contract & Document Library'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'عرض وتحرير وحذف نماذج العقود بسهولة' : 'View, edit, and delete contract templates efficiently'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-4xl font-bold shadow-xl shadow-indigo-100/10 hover:bg-slate-50 transition-all active:scale-95">
            <Printer className="w-5 h-5" />
            <span>{isRTL ? 'طباعة الكل' : 'Print All'}</span>
          </button>
          <button onClick={() => openForm()} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            <span>{isRTL ? 'إضافة نموذج' : 'Add Template'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-xl p-6 rounded-5xl border border-white/80 shadow-2xl shadow-indigo-100/10 flex items-center justify-between group cursor-pointer hover:scale-105 transition-transform">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.label}</div>
              <div className="text-xl font-black text-slate-800 italic">{cat.count}</div>
            </div>
            <cat.icon className={`w-8 h-8 ${cat.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-6xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="p-8 border-b border-white/40 flex items-center justify-between flex-wrap gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isRTL ? 'بحث عن نموذج أو وثيقة...' : 'Search for a template...'}
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/80 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'تصفية حسب:' : 'Filter By:'}</span>
            <select className="bg-white/50 border border-white/80 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all">
              <option>{isRTL ? 'جميع الأنواع' : 'All Types'}</option>
              <option>Word (DOCX)</option>
              <option>PDF</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/40">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="p-8 bg-white/60 hover:bg-white transition-all group flex items-center justify-between border-b border-white/40 md:border-e md:even:border-e-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform relative overflow-hidden">
                  <doc.icon className="w-7 h-7 relative z-10" />
                  <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {isRTL ? doc.titleAr : doc.title}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black text-slate-400 rounded-lg uppercase tracking-widest">
                      {isRTL ? doc.categoryAr : doc.category}
                    </span>
                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                    <span className="text-[9px] font-black text-indigo-500 uppercase">{doc.type} • {doc.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setSelectedDoc(doc)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all" title={isRTL ? 'عرض' : 'View'}>
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => openForm(doc)} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all" title={isRTL ? 'تعديل' : 'Edit'}>
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(doc.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all" title={isRTL ? 'حذف' : 'Delete'}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-5xl bg-white shadow-2xl p-8 relative">
            <button onClick={() => setSelectedDoc(null)} className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-all">
              <X className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center gap-4">
              <selectedDoc.icon className="w-10 h-10 text-indigo-600" />
              <div>
                <h2 className="text-2xl font-black text-slate-950">{isRTL ? selectedDoc.titleAr : selectedDoc.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{isRTL ? selectedDoc.categoryAr : selectedDoc.category} • {selectedDoc.type} • {selectedDoc.size}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 text-sm text-slate-600">
              <p>{isRTL ? 'هذا العرض يوضح تفاصيل النموذج ويمكن تنزيله أو تعديله وحذفه.' : 'This view shows the document details and lets you download, edit, or delete the template.'}</p>
              <p className="font-semibold">{isRTL ? 'اضغط على تعديل لتحديث النموذج أو حذف لإزالته نهائياً.' : 'Click edit to update the template or delete to remove it permanently.'}</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (selectedDoc) {
                    openForm(selectedDoc);
                    setSelectedDoc(null);
                  }
                }}
                className="flex-1 py-3 bg-amber-50 text-amber-700 rounded-3xl font-bold hover:bg-amber-600 hover:text-white transition-all"
              >
                {isRTL ? 'تعديل النموذج' : 'Edit Template'}
              </button>
              <button
                onClick={() => {
                  if (selectedDoc) {
                    handleDelete(selectedDoc.id);
                    setSelectedDoc(null);
                  }
                }}
                className="flex-1 py-3 bg-rose-50 text-rose-700 rounded-3xl font-bold hover:bg-rose-600 hover:text-white transition-all"
              >
                {isRTL ? 'حذف النموذج' : 'Delete Template'}
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-3xl font-bold hover:bg-slate-200 transition-all"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-5xl bg-white shadow-2xl p-8 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-all">
              <X className="w-5 h-5 text-slate-700" />
            </button>
            <h2 className="text-2xl font-black text-slate-950 mb-4">{editingDoc ? (isRTL ? 'تعديل النموذج' : 'Edit Template') : (isRTL ? 'إضافة نموذج جديد' : 'Add New Template')}</h2>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'العنوان (عربي)' : 'Title (Arabic)'}</span>
                  <input
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'العنوان' : 'Title'}</span>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'الفئة' : 'Category'}</span>
                  <input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'الفئة (عربي)' : 'Category (Arabic)'}</span>
                  <input
                    value={formData.categoryAr}
                    onChange={(e) => setFormData({ ...formData, categoryAr: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'النوع' : 'Type'}</span>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <option>DOCX</option>
                    <option>PDF</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'الحجم' : 'Size'}</span>
                  <input
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl hover:bg-indigo-700 transition-all">
                  {editingDoc ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'إضافة النموذج' : 'Add Template')}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-4xl font-bold hover:bg-slate-200 transition-all">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
