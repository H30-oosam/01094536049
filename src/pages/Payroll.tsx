import React, { useState } from 'react';
import { Wallet, Download, CreditCard, PieChart as PieChartIcon, TrendingUp, User, Plus, Search, Filter, Upload, FileSpreadsheet, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { logActivity, ActivityType } from '../services/activityService';
import * as XLSX from 'xlsx';

const data = [
  { name: 'Jan', amount: 45000 },
  { name: 'Feb', amount: 46200 },
  { name: 'Mar', amount: 45800 },
  { name: 'Apr', amount: 48000 },
  { name: 'May', amount: 47500 },
];

const Payroll = () => {
  const { isRTL, currency } = useUIStore();
  const { user } = useAuthStore();
  
  // Load from localStorage so bulk uploads persist
  const [payrollList, setPayrollList] = useState(() => {
    const saved = localStorage.getItem('demoPayrolls');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore fallback
      }
    }
    return [
      { id: '1', name: 'Alice Freeman', month: 'May 2024', base: 4500, allowances: 1200, deductions: 500, netSalary: `${currency} 5,200`, status: 'paid' },
      { id: '2', name: 'Zaid Al-Harbi', month: 'May 2024', base: 4000, allowances: 1000, deductions: 200, netSalary: `${currency} 4,800`, status: 'paid' },
      { id: '3', name: 'Sarah Chen', month: 'May 2024', base: 5500, allowances: 1500, deductions: 900, netSalary: `${currency} 6,100`, status: 'draft' },
    ];
  });

  const savePayrollsToLocalStorage = (list: any[]) => {
    localStorage.setItem('demoPayrolls', JSON.stringify(list));
  };

  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', month: 'June 2024', base: '', allowances: '', deductions: '' });

  // Bulk Upload Flow state variables
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPreviewList, setBulkPreviewList] = useState<any[]>([]);
  const [bulkFileName, setBulkFileName] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bulkSuccessToast, setBulkSuccessToast] = useState(false);
  const [bulkSuccessCount, setBulkSuccessCount] = useState(0);

  const handleAddPayroll = () => {
    if (newEntry.name && newEntry.base) {
      const base = parseFloat(newEntry.base);
      const allow = parseFloat(newEntry.allowances || '0');
      const deduct = parseFloat(newEntry.deductions || '0');
      const net = base + allow - deduct;

      const entry = {
        id: Math.random().toString(36).substr(2, 9),
        name: newEntry.name,
        month: newEntry.month,
        base,
        allowances: allow,
        deductions: deduct,
        netSalary: `${currency} ${net.toLocaleString()}`,
        status: 'draft'
      };

      const updated = [entry, ...payrollList];
      setPayrollList(updated);
      savePayrollsToLocalStorage(updated);
      setShowModal(false);
      setNewEntry({ name: '', month: 'June 2024', base: '', allowances: '', deductions: '' });
      
      if (user) {
        logActivity(user as any, 'CREATE_PAYROLL', `Issued payroll for ${newEntry.name}`, ActivityType.CREATE, 'payroll');
      }
    }
  };

  const downloadTemplate = () => {
    const csvContent = isRTL 
      ? "الاسم,الشهر,الأساسي,البدلات,الاستقطاعات\nأحمد محمد,June 2024,5000,1200,400\nحسام الورداني,June 2024,12000,3000,500\nرنا علي,June 2024,4200,800,200"
      : "Name,Month,Base,Allowances,Deductions\nJohn Doe,June 2024,4500,1000,300\nHossam Elwardany,June 2024,12000,3000,500\nJane Smith,June 2024,5200,1200,400";
    
    // Support UTF-8 BOM so Excel opens Arabic correctly
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", isRTL ? "نموذج_رواتب_خدمات_حسام_الورداني.csv" : "hossam_elwardany_hr_payroll_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseAndPreviewFile(file);
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseAndPreviewFile(file);
    }
  };

  const parseAndPreviewFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setBulkError(isRTL ? 'الملف فارغ أو لا يحتوي على صفوف بيانات كافية' : 'The file is empty or does not have enough rows.');
          return;
        }

        const rawHeaders: any[] = jsonData[0] || [];
        const rows = jsonData.slice(1);

        const headerIndices = {
          name: -1,
          month: -1,
          base: -1,
          allowances: -1,
          deductions: -1
        };

        rawHeaders.forEach((h: any, index: number) => {
          if (!h) return;
          const label = h.toString().toLowerCase().trim();
          if (label.includes('name') || label.includes('employee') || label.includes('الموظف') || label.includes('الاسم') || label.includes('اسم')) {
            headerIndices.name = index;
          } else if (label.includes('month') || label.includes('الشهر') || label.includes('تاريخ') || label.includes('date')) {
            headerIndices.month = index;
          } else if (label.includes('base') || label.includes('الأساسي') || label.includes('اساسي') || label.includes('الراتب')) {
            headerIndices.base = index;
          } else if (label.includes('allow') || label.includes('بدل') || label.includes('البدلات') || label.includes('الحوافز') || label.includes('incentive')) {
            headerIndices.allowances = index;
          } else if (label.includes('deduct') || label.includes('خصم') || label.includes('الخصومات') || label.includes('الاستقطاعات')) {
            headerIndices.deductions = index;
          }
        });

        // Fallbacks based on typical positions
        if (headerIndices.name === -1) headerIndices.name = 0;
        if (headerIndices.month === -1) headerIndices.month = 1;
        if (headerIndices.base === -1) headerIndices.base = 2;
        if (headerIndices.allowances === -1) headerIndices.allowances = 3;
        if (headerIndices.deductions === -1) headerIndices.deductions = 4;

        const parsedEntries: any[] = [];
        rows.forEach((row: any[], rIdx: number) => {
          if (!row || row.length === 0 || row.every(cell => cell === undefined || cell === null || cell === '')) {
            return;
          }

          const rawName = row[headerIndices.name];
          const rawMonth = row[headerIndices.month];
          const rawBase = row[headerIndices.base];
          const rawAllow = row[headerIndices.allowances];
          const rawDeduct = row[headerIndices.deductions];

          const nameString = rawName ? rawName.toString().trim() : '';
          const monthString = rawMonth ? rawMonth.toString().trim() : 'June 2024';
          
          let baseVal = parseFloat(rawBase);
          if (isNaN(baseVal)) baseVal = 0;

          let allowVal = parseFloat(rawAllow);
          if (isNaN(allowVal)) allowVal = 0;

          let deductVal = parseFloat(rawDeduct);
          if (isNaN(deductVal)) deductVal = 0;

          const isValid = !!nameString && baseVal > 0;

          const entry = {
            id: `bulk-${Date.now()}-${rIdx}-${Math.random().toString(36).substr(2, 4)}`,
            name: nameString || (isRTL ? 'موظف غير معروف' : 'Unknown Employee'),
            month: monthString,
            base: baseVal,
            allowances: allowVal,
            deductions: deductVal,
            isValid,
            netSalaryNum: baseVal + allowVal - deductVal
          };

          parsedEntries.push(entry);
        });

        setBulkPreviewList(parsedEntries);
        setBulkFileName(file.name);
        setBulkError(null);
      } catch (err) {
        setBulkError(isRTL ? 'حدث خطأ أثناء معالجة الملف. يرجى التحقق من صياغته.' : 'Error processing file. Please ensure it is a valid Excel or CSV.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemovePreviewItem = (id: string) => {
    setBulkPreviewList(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdatePreviewItem = (id: string, field: string, value: string) => {
    setBulkPreviewList(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      
      const baseNum = parseFloat(field === 'base' ? value : updated.base.toString()) || 0;
      const allowNum = parseFloat(field === 'allowances' ? value : updated.allowances.toString()) || 0;
      const deductNum = parseFloat(field === 'deductions' ? value : updated.deductions.toString()) || 0;

      updated.isValid = !!updated.name.trim() && baseNum > 0;
      updated.netSalaryNum = baseNum + allowNum - deductNum;
      return updated;
    }));
  };

  const handleProcessBulkImport = () => {
    const validEntries = bulkPreviewList.filter(item => item.isValid);
    if (validEntries.length === 0) {
      setBulkError(isRTL ? 'لا توجد سجلات صالحة للاستيراد!' : 'No valid records to import!');
      return;
    }

    const newPayrolls = validEntries.map(entry => ({
      id: Math.random().toString(36).substr(2, 9),
      name: entry.name,
      month: entry.month,
      base: entry.base,
      allowances: entry.allowances,
      deductions: entry.deductions,
      netSalary: `${currency} ${entry.netSalaryNum.toLocaleString()}`,
      status: 'draft'
    }));

    const updatedList = [...newPayrolls, ...payrollList];
    setPayrollList(updatedList);
    savePayrollsToLocalStorage(updatedList);
    
    // Log activity
    if (user) {
      logActivity(user as any, 'BULK_UPLOAD_PAYROLL', `Imported ${newPayrolls.length} payroll records via file ${bulkFileName || ''}`, ActivityType.CREATE, 'payroll');
    }

    // Triggers success states
    setBulkSuccessCount(newPayrolls.length);
    setBulkSuccessToast(true);
    setTimeout(() => setBulkSuccessToast(false), 5000);

    // Reset modals
    setShowBulkModal(false);
    setBulkPreviewList([]);
    setBulkFileName(null);
    setBulkError(null);
  };

  function format(date: Date, fmt: string) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  return (
    <div className="space-y-8 relative">
      {/* Toast Alert Banner */}
      {bulkSuccessToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-100 w-full max-w-md p-5 bg-emerald-500 text-white rounded-3xl shadow-2xl flex items-center justify-between border border-emerald-400/40 animate-bounce">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-white" />
            <div>
              <p className="font-extrabold text-sm">{isRTL ? 'تم الاستيراد بنجاح!' : 'Import Successful!'}</p>
              <p className="text-xs opacity-90">
                {isRTL 
                  ? `تمت معالجة وإضافة ${bulkSuccessCount} كشف راتب جديد بنجاح إلى النظام.` 
                  : `Successfully processed and added ${bulkSuccessCount} new payroll records.`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'إدارة الرواتب والتعويضات' : 'Payroll Engine Pro'}
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            {isRTL ? 'إدارة كشوف المرتبات والمدفوعات والضرائب' : 'Precision payroll processing with automated tax & deduction calculations'}
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-950 border-2 border-slate-200 hover:border-indigo-400 rounded-2xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Upload className="w-5 h-5 text-indigo-600" />
            <span>{isRTL ? 'رفع جماعي' : 'Bulk Upload'}</span>
          </button>

          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{isRTL ? 'إصدار مسير' : 'Issue Payroll'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-indigo-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-4xl rounded-5xl p-6 md:p-10 border border-white/80 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-widest mb-1.5 inline-block">
                  {isRTL ? 'مركز استيراد البيانات' : 'DATA IMPORT CENTER'}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {isRTL ? 'رفع كشوف الرواتب جماعياً' : 'Bulk Import Employee Salary Records'}
                </h2>
                <p className="text-xs text-gray-400 mt-1 pb-1">
                  {isRTL 
                    ? 'قم بتحميل ملف Excel أو CSV لجميع كشوف رواتب الموظفين لتوفير الوقت ومعالجة المئات بنقرة واحدة.' 
                    : 'Upload an Excel or CSV file of salary records to process dozens of payouts instantly.'}
                </p>
              </div>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#002D62]/5 hover:bg-[#002D62]/10 text-[#002D62] text-xs font-extrabold rounded-xl transition-all border border-[#002D62]/10 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isRTL ? 'تحميل كشف النموذج' : 'Download Template'}</span>
              </button>
            </div>

            {bulkError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 animate-pulse" />
                <span>{bulkError}</span>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-10 border-3 border-dashed rounded-4xl text-center transition-all ${
                isDragging 
                  ? 'border-indigo-600 bg-indigo-50/40 scale-98 shadow-inner' 
                  : bulkFileName 
                    ? 'border-emerald-400 bg-emerald-50/10' 
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-indigo-300'
              }`}
            >
              <input 
                type="file" 
                id="bulk-file-input" 
                accept=".csv, .xlsx, .xls, .xlsm"
                className="hidden" 
                onChange={handleBulkFileChange}
              />
              <label htmlFor="bulk-file-input" className="cursor-pointer block">
                {bulkFileName ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                    <div>
                      <p className="text-sm font-black text-slate-900">{bulkFileName}</p>
                      <p className="text-xs text-emerald-600 font-extrabold mt-1">
                        {isRTL ? 'تم قراءة الملف بنجاح! راجع البيانات أدناه' : 'File parsed successfully! See preview below'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-indigo-400 mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {isRTL ? 'اسحب ملف كشف رواتبك إلى هنا أو انقر للتصفح' : 'Drag & drop payroll spreadsheet file here or click to browse'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                        Excellent Support for EXCEL (.xlsx, .xls) & CSV formats
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Interactive Preview Table */}
            {bulkPreviewList.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>
                      {isRTL 
                        ? `معاينة السجلات قبل الاستيراد (${bulkPreviewList.length} سجل)` 
                        : `Preview Records before Import (${bulkPreviewList.length} entries)`}
                    </span>
                  </h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full">
                      {isRTL ? `جاهز: ${bulkPreviewList.filter(x=>x.isValid).length}` : `Valid: ${bulkPreviewList.filter(x=>x.isValid).length}`}
                    </span>
                    {bulkPreviewList.some(x=>!x.isValid) && (
                      <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full animate-pulse">
                        {isRTL ? `أخطاء صياغة: ${bulkPreviewList.filter(x=>!x.isValid).length}` : `Errors: ${bulkPreviewList.filter(x=>!x.isValid).length}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-64 overflow-y-auto shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/60 sticky top-0">
                        <th className="p-3 font-bold text-slate-400 uppercase text-[10px]">{isRTL ? 'اسم الموظف' : 'Employee Name'}</th>
                        <th className="p-3 font-bold text-slate-400 uppercase text-[10px]">{isRTL ? 'الشهر' : 'Month'}</th>
                        <th className="p-3 font-bold text-slate-400 uppercase text-[10px]">{isRTL ? 'الأساسي' : 'Base'}</th>
                        <th className="p-3 font-bold text-slate-400 uppercase text-[10px]">{isRTL ? 'البدلات' : 'Allow.'}</th>
                        <th className="p-3 font-bold text-slate-400 uppercase text-[10px]">{isRTL ? 'الخصومات' : 'Deduc.'}</th>
                        <th className="p-3 font-bold text-slate-400 uppercase text-[10px]">{isRTL ? 'الصافي' : 'Net Salary'}</th>
                        <th className="p-3 font-bold text-slate-400 uppercase text-[10px] text-center">{isRTL ? 'الإجراء' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {bulkPreviewList.map((item) => (
                        <tr key={item.id} className={`hover:bg-slate-50/50 ${!item.isValid ? 'bg-rose-50/30' : ''}`}>
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={item.name}
                              onChange={(e) => handleUpdatePreviewItem(item.id, 'name', e.target.value)}
                              className="w-full bg-transparent px-2 py-1 font-bold rounded border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-400 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={item.month}
                              onChange={(e) => handleUpdatePreviewItem(item.id, 'month', e.target.value)}
                              className="w-full bg-transparent px-2 py-1 font-semibold rounded border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-400 outline-none text-xs text-gray-500"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              value={item.base}
                              onChange={(e) => handleUpdatePreviewItem(item.id, 'base', e.target.value)}
                              className="w-20 bg-transparent px-2 py-1 font-bold rounded border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-400 outline-none text-xs text-indigo-950"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              value={item.allowances}
                              onChange={(e) => handleUpdatePreviewItem(item.id, 'allowances', e.target.value)}
                              className="w-20 bg-transparent px-2 py-1 font-bold rounded border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-400 outline-none text-xs text-emerald-600"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              value={item.deductions}
                              onChange={(e) => handleUpdatePreviewItem(item.id, 'deductions', e.target.value)}
                              className="w-20 bg-transparent px-2 py-1 font-bold rounded border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-400 outline-none text-xs text-rose-600"
                            />
                          </td>
                          <td className="p-3 font-black text-indigo-600">
                            {currency} {item.netSalaryNum.toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!item.isValid && (
                                <span className="p-1 text-rose-500 hover:text-rose-600" title="Incomplete name or 0 base salary">
                                  <AlertCircle className="w-4 h-4" />
                                </span>
                              )}
                              <button 
                                onClick={() => handleRemovePreviewItem(item.id)}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-extrabold text-[10px] rounded cursor-pointer"
                              >
                                {isRTL ? 'حذف' : 'Remove'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 border border-slate-100">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? 'إجمالي الاستيراد' : 'Import Count'}</p>
                      <p className="text-lg font-black text-slate-800">{bulkPreviewList.filter(x=>x.isValid).length} / {bulkPreviewList.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? 'صافي المبالغ التقريبي' : 'Approximate Net Payout'}</p>
                      <p className="text-lg font-black text-indigo-600">
                        {currency} {bulkPreviewList.filter(x=>x.isValid).reduce((acc, curr) => acc + curr.netSalaryNum, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {bulkPreviewList.some(x=>!x.isValid) && (
                    <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 px-3 rounded-xl animate-pulse">
                      * {isRTL ? 'سيتم تجاهل السجلات التي تحتوي على أخطاء تلقائياً ما لم تصححها.' : 'Records with errors will be skipped automatically unless corrected.'}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
              <button 
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkPreviewList([]);
                  setBulkFileName(null);
                  setBulkError(null);
                }}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all text-center cursor-pointer"
              >
                {isRTL ? 'إلغاء وإغلاق' : 'Cancel & Close'}
              </button>
              <button 
                onClick={handleProcessBulkImport}
                disabled={bulkPreviewList.length === 0 || !bulkPreviewList.some(x=>x.isValid)}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-100/50 active:scale-95 transition-all text-center cursor-pointer"
              >
                {isRTL ? 'تأكيد المعالجة والاستيراد' : 'Confirm & Process Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Integration */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-950/20 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-6xl p-10 border border-white shadow-2xl shadow-indigo-200 animate-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase mb-6">
                {isRTL ? 'بيانات المسير الجديد' : 'New Payroll Entry'}
              </h2>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-1 block">{isRTL ? 'الموظف' : 'Employee'}</label>
                    <input 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      value={newEntry.name}
                      onChange={e => setNewEntry({...newEntry, name: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-1 block">{isRTL ? 'الأساسي' : 'Base'}</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                          value={newEntry.base}
                          onChange={e => setNewEntry({...newEntry, base: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-1 block">{isRTL ? 'البدلات' : 'Allowances'}</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                          value={newEntry.allowances}
                          onChange={e => setNewEntry({...newEntry, allowances: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-1 block">{isRTL ? 'الاستقطاعات' : 'Deductions'}</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                          value={newEntry.deductions}
                          onChange={e => setNewEntry({...newEntry, deductions: e.target.value})}
                        />
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 mt-10">
                 <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-sm active:scale-95 transition-transform"
                 >
                   {isRTL ? 'إلغاء' : 'Cancel'}
                 </button>
                 <button 
                  onClick={handleAddPayroll}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-transform"
                 >
                   {isRTL ? 'حفظ' : 'Process'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-linear-to-br from-indigo-600 to-indigo-800 p-8 rounded-5xl text-white shadow-2xl shadow-indigo-200">
              <div className="flex justify-between items-start mb-10">
                <Wallet className="w-10 h-10 opacity-50" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">{isRTL ? 'إجمالي الصرف' : 'Total Payout'}</span>
              </div>
              <h2 className="text-4xl font-bold mb-2">{currency} 1,284,500</h2>
              <p className="text-sm text-indigo-100">+{isRTL ? '4.2% من الشهر الماضي' : '4.2% from last month'}</p>
           </div>

           <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 p-8 shadow-2xl shadow-indigo-200/20">
              <h3 className="text-lg font-bold text-gray-900 mb-6">{isRTL ? 'اتجاهات الميزانية' : 'Budget Trends'}</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={data}>
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 p-8 shadow-2xl shadow-indigo-200/20 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{isRTL ? 'كشوف المرتبات الأخيرة' : 'Recent Payrolls'}</h3>
              <button className="text-indigo-600 font-bold text-sm hover:underline">{isRTL ? 'عرض الكل' : 'View All'}</button>
            </div>
            <div className="space-y-4">
              {payrollList.map(item => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/50 border border-white/80 rounded-4xl hover:bg-white transition-all shadow-sm group">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black shadow-sm group-hover:scale-110 transition-transform">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.month}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 flex-1 px-8">
                     <div className="text-center">
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{isRTL ? 'الأساسي' : 'Base'}</div>
                        <div className="text-sm font-bold text-slate-600">{(item as any).base ? `${currency} ${(item as any).base}` : '-'}</div>
                     </div>
                     <div className="text-center">
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{isRTL ? 'بدلات' : 'Allow.'}</div>
                        <div className="text-sm font-bold text-emerald-600">{(item as any).allowances ? `+${currency} ${(item as any).allowances}` : '-'}</div>
                     </div>
                     <div className="text-center">
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{isRTL ? 'خصومات' : 'Deduc.'}</div>
                        <div className="text-sm font-bold text-rose-600">{(item as any).deductions ? `-${currency} ${(item as any).deductions}` : '-'}</div>
                     </div>
                     <div className="text-center">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? 'الصافي' : 'Net Salary'}</div>
                        <div className="text-sm font-black text-indigo-600 italic underline decoration-indigo-100">{item.netSalary}</div>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      item.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {item.status}
                    </span>
                    <button className="p-2.5 bg-white text-indigo-600 border border-slate-100 rounded-xl hover:shadow-lg transition-all active:scale-95 shadow-sm">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
