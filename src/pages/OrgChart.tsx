import React, { useState, useEffect } from 'react';
import { 
  Users, User, ChevronRight, ChevronDown, 
  Search, ZoomIn, ZoomOut, Maximize2,
  Building2, Briefcase, Mail, Phone, Edit2, Trash2, Plus, X, ShieldAlert, BadgeCheck
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useUIStore } from '../store/uiStore';
import { Employee } from '../types';

const OrgChart = () => {
  const { isRTL } = useUIStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    status: 'active' | 'on_leave' | 'terminated';
    employeeId: string;
    hireDate: string;
    salary: number;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    status: 'active',
    employeeId: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: 0,
  });

  const localStorageKey = 'demoOrgEmployees';

  const saveEmployeesToLocalStorage = (items: Employee[]) => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(items));
    } catch {
      // ignore storage failures
    }
  };

  const loadEmployeesFromLocalStorage = (): Employee[] | null => {
    try {
      const data = localStorage.getItem(localStorageKey);
      return data ? (JSON.parse(data) as Employee[]) : null;
    } catch {
      return null;
    }
  };

  const addLocalEmployee = (employee: Employee) => {
    setEmployees(prev => {
      const next = [...prev, employee];
      saveEmployeesToLocalStorage(next);
      return next;
    });
  };

  const updateLocalEmployee = (employee: Employee) => {
    setEmployees(prev => {
      const next = prev.map(item => item.id === employee.id ? employee : item);
      saveEmployeesToLocalStorage(next);
      return next;
    });
  };

  const removeLocalEmployee = (id: string) => {
    setEmployees(prev => {
      const next = prev.filter(item => item.id !== id);
      saveEmployeesToLocalStorage(next);
      return next;
    });
  };

  const defaultEmployees: Employee[] = [
    {
      id: '1',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      email: 'ahmed.hassan@company.com',
      phone: '+20 100 123 4567',
      position: 'Senior Developer',
      departmentId: 'Engineering',
      status: 'active',
      employeeId: 'EMP-001',
      hireDate: '2022-03-15',
      salary: 8500,
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      firstName: 'Fatima',
      lastName: 'Mohamed',
      email: 'fatima.mohamed@company.com',
      phone: '+20 100 234 5678',
      position: 'Project Manager',
      departmentId: 'Management',
      status: 'active',
      employeeId: 'EMP-002',
      hireDate: '2021-06-20',
      salary: 7500,
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      firstName: 'Omar',
      lastName: 'Ali',
      email: 'omar.ali@company.com',
      phone: '+20 100 345 6789',
      position: 'UI/UX Designer',
      departmentId: 'Design',
      status: 'active',
      employeeId: 'EMP-003',
      hireDate: '2023-01-10',
      salary: 6500,
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      firstName: 'Layla',
      lastName: 'Ibrahim',
      email: 'layla.ibrahim@company.com',
      phone: '+20 100 456 7890',
      position: 'HR Specialist',
      departmentId: 'Human Resources',
      status: 'active',
      employeeId: 'EMP-004',
      hireDate: '2021-11-05',
      salary: 5500,
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '5',
      firstName: 'Karim',
      lastName: 'Nour',
      email: 'karim.nour@company.com',
      phone: '+20 100 567 8901',
      position: 'QA Engineer',
      departmentId: 'Quality Assurance',
      status: 'on_leave',
      employeeId: 'EMP-005',
      hireDate: '2022-08-30',
      salary: 6000,
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '6',
      firstName: 'Noor',
      lastName: 'Samir',
      email: 'noor.samir@company.com',
      phone: '+20 100 678 9012',
      position: 'Marketing Manager',
      departmentId: 'Marketing',
      status: 'active',
      employeeId: 'EMP-006',
      hireDate: '2020-05-12',
      salary: 7000,
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    const stored = loadEmployeesFromLocalStorage();
    if (stored?.length) {
      setEmployees(stored);
      setLoading(false);
    }

    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        const fallback = stored?.length ? stored : defaultEmployees;
        setEmployees(fallback);
        saveEmployeesToLocalStorage(fallback);
      } else {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        setEmployees(docs);
        saveEmployeesToLocalStorage(docs);
      }
      setLoading(false);
    }, (error) => {
      console.error('OrgChart Firestore error:', error);
      const fallback = stored?.length ? stored : defaultEmployees;
      setEmployees(fallback);
      saveEmployeesToLocalStorage(fallback);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.departmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.departmentId || '',
      status: employee.status || 'active',
      employeeId: employee.employeeId || '',
      hireDate: employee.hireDate || new Date().toISOString().split('T')[0],
      salary: employee.salary || 0,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      status: 'active',
      employeeId: '',
      hireDate: new Date().toISOString().split('T')[0],
      salary: 0,
    });
    setEditingEmployee(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employeeData: Employee = {
      id: editingEmployee?.id ?? `local-${Date.now()}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      position: formData.position,
      departmentId: formData.department,
      status: formData.status,
      employeeId: formData.employeeId,
      hireDate: formData.hireDate,
      salary: formData.salary,
      photoURL: '',
      createdAt: editingEmployee?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', editingEmployee.id!), {
          ...employeeData,
          updatedAt: serverTimestamp(),
        });
        updateLocalEmployee(employeeData);
      } else {
        await addDoc(collection(db, 'employees'), {
          ...employeeData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addLocalEmployee(employeeData);
      }
    } catch (error) {
      console.error('OrgChart Firestore save failed, using local fallback:', error);
      if (editingEmployee) {
        updateLocalEmployee(employeeData);
      } else {
        addLocalEmployee(employeeData);
      }
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'employees', id));
      removeLocalEmployee(id);
    } catch (error) {
      console.error('OrgChart Firestore delete failed, using local fallback:', error);
      removeLocalEmployee(id);
    }
  };

  const departments = Array.from(new Set(filteredEmployees.map(e => e.departmentId || 'Unassigned')));

  const toggleDept = (dept: string) => {
    setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  return (
    <div className="space-y-8 pb-12 text-[#002D62]">
      
      {/* Title block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b-2 border-[#002D62]/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="td-badge">{isRTL ? 'التسلسل الهيكلي والمناصب' : 'CORPORATE HIERARCHY'}</span>
          </div>
          <h1 className="text-3xl font-black text-[#002D62] tracking-tight">
            {isRTL ? 'الهيكل التنظيمي التفاعلي' : 'Interactive Organizational Chart'}
          </h1>
          <p className="text-[#002D62]/60 font-semibold text-xs mt-1">
            {isRTL ? 'تصفح التسلسل الإداري وتوزيع القوى العاملة بالشركة' : 'Visualize structural administrative workflow and staff allocation'}
          </p>
        </div>
        
        {/* Dynamic Controls */}
        <div className="flex flex-wrap items-center gap-3">
           <button onClick={handleAdd} className="td-btn-primary flex items-center gap-2 text-xs py-3">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isRTL ? 'إضافة كادر جديد' : 'Add Employee'}</span>
           </button>
           <button className="p-3 bg-white border-2 border-[#002D62]/20 rounded-xl text-[#002D62] hover:border-[#002D62] transition-colors shadow-[2px_2px_0px_0px_rgba(0,45,98,0.06)]">
              <ZoomIn className="w-4.5 h-4.5 stroke-[2.2]" />
           </button>
           <button className="p-3 bg-white border-2 border-[#002D62]/20 rounded-xl text-[#002D62] hover:border-[#002D62] transition-colors shadow-[2px_2px_0px_0px_rgba(0,45,98,0.06)]">
              <ZoomOut className="w-4.5 h-4.5 stroke-[2.2]" />
           </button>
           <div className="h-6 w-0.5 bg-[#002D62]/12 mx-1"></div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002D62]/40" />
              <input 
                type="text"
                placeholder={isRTL ? 'البحث عن موظف...' : 'Find employee...'}
                className="w-full bg-white border-2 border-[#002D62]/15 text-[#002D62] font-semibold rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-[#002D62] focus:shadow-[2px_2px_0px_0px_#002D62] transition-all placeholder:text-[#002D62]/30 min-w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* 3D Structural Canvas background layout */}
      <div className="td-card p-8 md:p-12 min-h-[500px]">
         <div className="flex flex-col items-center">
            
            {/* CEO Node - Hossam Elwardany - High Level Golden-Blue Tactile Panel */}
            <div className="mb-14 relative">
               <div className="bg-gradient-to-br from-[#002D62] to-[#1e3a8a] p-1 rounded-3xl shadow-[6px_6px_0px_0px_#002D62] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#002D62] transition-all duration-300">
                  <div className="bg-white rounded-[1.3rem] p-5.5 flex items-center gap-5 min-w-[310px]">
                     <div className="w-16 h-16 bg-[#002D62]/5 border-2 border-[#002D62] rounded-2xl flex items-center justify-center text-[#002D62] text-2xl font-black shadow-[3px_3px_0px_0px_#002D62]">
                        H
                     </div>
                     <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-md font-black italic tracking-wide font-serif text-[#002D62]">Hossam Elwardany</h2>
                          <BadgeCheck className="w-4.5 h-4.5 text-blue-600 fill-blue-50" />
                        </div>
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-0.5">{isRTL ? 'المؤسس والمدير العام' : 'Founder & CEO'}</p>
                        
                        <div className="flex gap-2 mt-2">
                           <a href="mailto:hossam.elwardany@company.com" className="w-7 h-7 rounded-lg border border-[#002D62]/20 bg-[#002D62]/5 flex items-center justify-center text-[#002D62] hover:bg-[#002D62] hover:text-white transition-all">
                              <Mail className="w-3.5 h-3.5" />
                           </a>
                           <a href="tel:+201001234567" className="w-7 h-7 rounded-lg border border-[#002D62]/20 bg-[#002D62]/5 flex items-center justify-center text-[#002D62] hover:bg-[#002D62] hover:text-white transition-all">
                              <Phone className="w-3.5 h-3.5" />
                           </a>
                        </div>
                     </div>
                  </div>
               </div>
               
               {/* 3D Solid Wire Line Down */}
               <div className="absolute left-1/2 -bottom-14 w-1 h-14 bg-[#002D62] -translate-x-1/2"></div>
            </div>

            {/* Department Level physical rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full mt-2">
               {departments.map((dept) => (
                  <div key={dept} className="relative pt-6">
                     {/* Horizontal wire connector */}
                     <div className="absolute top-0 left-0 right-0 h-1 bg-[#002D62]/20"></div>
                     <div className="absolute top-0 left-1/2 w-1 h-6 bg-[#002D62]/20 -translate-x-1/2"></div>
                     
                     <div 
                        onClick={() => toggleDept(dept)}
                        className="cursor-pointer bg-white border-2 border-[#002D62]/15 rounded-2xl p-5 shadow-[4px_4px_0px_0px_#002D62] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#002D62] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#002D62] transition-all group"
                     >
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-[#002D62]/5 border-2 border-[#002D62]/20 rounded-xl flex items-center justify-center text-[#002D62] group-hover:bg-[#002D62] group-hover:text-white transition-colors duration-200">
                                 <Building2 className="w-4.5 h-4.5 stroke-[2.2]" />
                              </div>
                              <div>
                                 <h4 className="font-extrabold text-xs text-[#002D62] tracking-tight group-hover:underline underline-offset-2">{dept}</h4>
                                 <span className="text-[8px] font-black text-[#002D62]/55 uppercase tracking-wider">
                                    {filteredEmployees.filter(e => e.departmentId === dept).length} {isRTL ? 'موظفين' : 'Members'}
                                 </span>
                              </div>
                           </div>
                           {expandedDepts[dept] ? <ChevronDown className="w-4 h-4 text-[#002D62]/30" /> : <ChevronRight className="w-4 h-4 text-[#002D62]/30" />}
                        </div>

                        {/* Dropdown Employee Nodes with Solid Bevel */}
                        {expandedDepts[dept] && (
                           <div className="mt-4 space-y-2 pt-4 border-t-2 border-[#002D62]/10">
                              {filteredEmployees
                                 .filter(e => e.departmentId === dept)
                                 .map((emp) => (
                                    <div 
                                      key={emp.id} 
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border-2 border-[#002D62]/5 rounded-xl hover:border-[#002D62] hover:bg-white transition-all duration-150"
                                    >
                                       <div className="flex items-center gap-2.5">
                                          <div className="w-7 h-7 rounded-lg bg-[#002D62] text-white flex items-center justify-center text-[10px] font-black shadow-[1.5px_1.5px_0px_0px_#1e3a8a]">
                                             {emp.firstName.charAt(0)}
                                          </div>
                                          <div>
                                             <div className="text-[10px] font-bold text-[#002D62]">{emp.firstName} {emp.lastName}</div>
                                             <div className="text-[8px] font-black text-[#002D62]/50 uppercase tracking-tighter mt-0.5">{emp.position}</div>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-1">
                                          <button onClick={() => handleEdit(emp)} className="p-1.5 bg-white rounded-lg border border-[#002D62]/20 text-blue-900 hover:bg-[#002D62]/5 transition-colors">
                                             <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button onClick={() => emp.id && handleDelete(emp.id)} className="p-1.5 bg-white rounded-lg border-2 border-rose-600/20 text-rose-600 hover:bg-rose-50 transition-colors">
                                             <Trash2 className="w-3 h-3" />
                                          </button>
                                       </div>
                                    </div>
                                 ))
                              }
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* 3D Tactile Add / Edit Modal Dial */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002D62]/15 backdrop-blur-sm animate-fade-in">
               <div className="w-full max-w-xl bg-white border-2 border-[#002D62] rounded-3xl shadow-[8px_8px_0px_0px_#002D62] overflow-hidden">
                  <div className="flex items-center justify-between p-5.5 border-b-2 border-[#002D62]/10 bg-slate-50">
                     <div>
                        <h2 className="text-md font-black text-[#002D62] uppercase tracking-wide">
                          {editingEmployee ? (isRTL ? 'تحديث السجل الإداري' : 'Update Roster Details') : (isRTL ? 'إضافة موظف للهيكل' : 'Instate New Personnel')}
                        </h2>
                     </div>
                     <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 border-2 border-[#002D62]/20 text-[#002D62] hover:border-[#002D62] rounded-lg transition-colors bg-white">
                        <X className="w-4.5 h-4.5 stroke-[2.5]" />
                     </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 grid gap-4 md:grid-cols-2">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'الاسم الأول' : 'First Name'}</label>
                        <input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required className="w-full td-input py-2 text-xs" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'اسم العائلة' : 'Last Name'}</label>
                        <input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required className="w-full td-input py-2 text-xs" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full td-input py-2 text-xs" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'رقم الهاتف' : 'Contact Phone'}</label>
                        <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full td-input py-2 text-xs" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'المسمى الوظيفي' : 'Administrative Role'}</label>
                        <input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} required className="w-full td-input py-2 text-xs" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'القسم التنظيمي' : 'Department/Branch'}</label>
                        <input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required className="w-full td-input py-2 text-xs" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'حالة التعيين' : 'Status'}</label>
                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} required className="w-full td-input py-2 text-xs bg-white">
                           <option value="active">{isRTL ? 'مداوم نشط' : 'Active Duty'}</option>
                           <option value="on_leave">{isRTL ? 'في إجازة رسمية' : 'On Leave'}</option>
                           <option value="terminated">{isRTL ? 'منفصل' : 'Terminated'}</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'الرقم الوظيفي الكود' : 'Employee ID Key'}</label>
                        <input value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} required className="w-full td-input py-2 text-xs" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'تاريخ التعيين' : 'Hire Date'}</label>
                        <input type="date" value={formData.hireDate} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} required className="w-full td-input py-2 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#002D62]/80 uppercase tracking-wider">{isRTL ? 'الراتب المستحق' : 'Salary Payout'}</label>
                        <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} required className="w-full td-input py-2 text-xs" />
                      </div>
                      
                      <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t-2 border-[#002D62]/10 mt-2">
                         <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="td-btn-secondary py-2 px-5 text-xs">
                           {isRTL ? 'إلغاء' : 'Cancel'}
                         </button>
                         <button type="submit" className="td-btn-primary py-2 px-6 text-xs">
                           {editingEmployee ? (isRTL ? 'تحديث السجل' : 'Instate') : (isRTL ? 'حفظ وإدراج' : 'Instate')}
                         </button>
                      </div>
                  </form>
               </div>
            </div>
         )}

         {loading && (
            <div className="h-60 flex items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002D62]"></div>
            </div>
         )}
      </div>
    </div>
  );
};

export default OrgChart;
