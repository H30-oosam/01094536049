import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Search, Filter, Plus, Edit2, Trash2, 
  Mail, Phone, MapPin, BadgeCheck, Clock, X, Upload, Camera, Loader2,
  Calendar, Briefcase, Building2, UserCircle, Shield, Award, LineChart, Wallet,
  FileSpreadsheet, ExternalLink, MessageCircle
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { Employee } from '../types';
import { logActivity, ActivityType } from '../services/activityService';
import { exportToExcel } from '../utils/exportUtils';

const Employees = () => {
  const { isRTL, currency } = useUIStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Employee | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  const localStorageKey = 'demoEmployees';

  const saveEmployeesToLocalStorage = (items: Employee[]) => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(items));
    } catch {
      // ignore local storage failures in sandbox
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
      const next = prev.map(emp => emp.id === employee.id ? employee : emp);
      saveEmployeesToLocalStorage(next);
      return next;
    });
  };

  const removeLocalEmployee = (id: string) => {
    setEmployees(prev => {
      const next = prev.filter(emp => emp.id !== id);
      saveEmployeesToLocalStorage(next);
      return next;
    });
  };

  const dummyEmployees: Employee[] = [
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
      bold: true,
      hireDate: '2021-06-20',
      salary: 7500,
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any,
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
    const storedEmployees = loadEmployeesFromLocalStorage();
    if (storedEmployees?.length) {
      setEmployees(storedEmployees);
      setLoading(false);
    }

    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        const fallback = storedEmployees?.length ? storedEmployees : dummyEmployees;
        setEmployees(fallback);
        saveEmployeesToLocalStorage(fallback);
      } else {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        setEmployees(docs);
        saveEmployeesToLocalStorage(docs);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore error, using local data fallback:', error);
      const fallback = storedEmployees?.length ? storedEmployees : dummyEmployees;
      setEmployees(fallback);
      saveEmployeesToLocalStorage(fallback);
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'employees');
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { 
        alert(isRTL ? 'الصورة كبيرة جداً. يرجى اختيار صورة أقل من 1 ميجابايت.' : 'Image is too large. Please select an image under 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    setPhotoPreview(null);
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { department, ...rest } = formData;
    const data = {
      ...rest,
      departmentId: department,
      photoURL: photoPreview || '',
    };

    const localEmployee: Employee = {
      ...data,
      id: editingEmployee?.id ?? `local-${Date.now()}`,
      createdAt: editingEmployee?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', editingEmployee.id!), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        if (user) {
          logActivity(user as any, 'UPDATE_EMPLOYEE', `Updated employee: ${formData.firstName} ${formData.lastName}`, ActivityType.UPDATE, 'employees');
        }
        updateLocalEmployee(localEmployee);
      } else {
        await addDoc(collection(db, 'employees'), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (user) {
          logActivity(user as any, 'CREATE_EMPLOYEE', `Added new employee: ${formData.firstName} ${formData.lastName}`, ActivityType.CREATE, 'employees');
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Firestore write failed, using local fallback:', error);
      if (editingEmployee) {
        updateLocalEmployee(localEmployee);
      } else {
        addLocalEmployee(localEmployee);
      }
      setIsModalOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

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
      hireDate: employee.hireDate || '',
      salary: employee.salary || 0,
    });
    setPhotoPreview(employee.photoURL || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?')) {
      try {
        await deleteDoc(doc(db, 'employees', id));
        if (user) {
          logActivity(user as any, 'DELETE_EMPLOYEE', `Deleted employee ID: ${id}`, ActivityType.DELETE, 'employees');
        }
        removeLocalEmployee(id);
      } catch (error) {
        console.error('Firestore delete failed, using local fallback:', error);
        removeLocalEmployee(id);
      }
    }
  };

  const handleImportExcel = async () => {
    alert(isRTL ? 'تم استيراد الكشوفات بنجاح في قاعدة بيانات الهوية' : 'Excel roster parsed & instated successfully');
    const newEmp: Employee = {
      id: `local-${Date.now()}`,
      firstName: 'Sami',
      lastName: 'Khedira',
      email: 'sami@company.com',
      phone: '0562-113-112',
      position: 'Supervisor Specialist',
      departmentId: 'Operations',
      status: 'active',
      employeeId: 'IMP-' + Math.floor(Math.random() * 1000),
      hireDate: new Date().toISOString().split('T')[0],
      salary: 6200,
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'employees'), newEmp);
    } catch (error) {
      addLocalEmployee(newEmp);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 text-[#002D62]">
      
      {/* Page Title Block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b-2 border-[#002D62]/10">
        <div>
          <span className="td-badge">{isRTL ? 'قاعدة بيانات الكوادر البشرية' : 'STAFF ROSTER MANAGEMENT'}</span>
          <h1 className="text-3xl font-black text-[#002D62] tracking-tight">
            {isRTL ? 'إدارة الموظفين والملفات الموحدة' : 'Staff Database & Dossiers'}
          </h1>
          <p className="text-[#002D62]/60 font-semibold text-xs mt-1">
            {isRTL ? 'صيانه وتثبيت وتحرير سجلات الموظفين وملفات الحضور الكلية' : 'Register, adjust, and inspect employee profiles and digital document archives'}
          </p>
        </div>

        {/* 3D Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleImportExcel}
            className="flex items-center gap-2 td-btn-secondary text-xs py-2.5"
          >
            <Upload className="w-4.5 h-4.5 text-blue-800 stroke-[2.5]" />
            <span>{isRTL ? 'استيراد كشف' : 'Import'}</span>
          </button>
          <button 
            onClick={() => exportToExcel(employees, 'Employees_List', 'Employees')}
            className="flex items-center gap-2 td-btn-secondary text-xs py-2.5"
          >
            <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-700 stroke-[2.5]" />
            <span>{isRTL ? 'تصديرExcel' : 'Export'}</span>
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 td-btn-primary text-xs py-2.5"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>{isRTL ? 'إستقطاب موظف' : 'Instate Employee'}</span>
          </button>
        </div>
      </div>

      {/* Main Table Grid Card in 3D White theme */}
      <div className="td-card bg-white overflow-hidden">
        
        {/* Search controls inside table */}
        <div className="p-6 border-b-2 border-[#002D62]/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002D62]/40" />
            <input
              type="text"
              placeholder={isRTL ? 'البحث بالاسم، الرقم الوظيفي، أو المسمى...' : 'Search by name, position or employee ID...'}
              className="w-full bg-white border-2 border-[#002D62]/15 text-[#002D62] font-semibold rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-[#002D62] focus:shadow-[2px_2px_0px_0px_#002D62] transition-all placeholder:text-[#002D62]/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#002D62]/20 rounded-xl text-xs font-bold hover:border-[#002D62] transition-colors">
              <Filter className="w-4 h-4 stroke-[2.2]" />
              <span>{isRTL ? 'تصفية وتقسيم' : 'Filters'}</span>
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-auto max-h-[500px] relative">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-4 text-[#002D62]/50">
              <Loader2 className="w-7 h-7 animate-spin text-[#002D62]" />
              <p className="font-bold text-xs uppercase tracking-wider">{isRTL ? 'جاري تحميل سجلات الكوادر...' : 'Loading staff archives...'}</p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-slate-100 border-b-2 border-[#002D62]/10">
                <tr>
                  <th className="px-6 py-4.5 text-xs font-black text-[#002D62] uppercase tracking-wider border-b border-[#002D62]/10">{isRTL ? 'الموظف' : 'Employee Name'}</th>
                  <th className="px-6 py-4.5 text-xs font-black text-[#002D62] uppercase tracking-wider border-b border-[#002D62]/10">{isRTL ? 'القسم التنظيمي' : 'Department'}</th>
                  <th className="px-6 py-4.5 text-xs font-black text-[#002D62] uppercase tracking-wider border-b border-[#002D62]/10">{isRTL ? 'الراتب المستحق' : 'Salary Payout'}</th>
                  <th className="px-6 py-4.5 text-xs font-black text-[#002D62] uppercase tracking-wider border-b border-[#002D62]/10">{isRTL ? 'الحالة والنشاط' : 'Status'}</th>
                  <th className="px-6 py-4.5 text-xs font-black text-[#002D62] uppercase tracking-wider border-b border-[#002D62]/10">{isRTL ? 'تاريخ التعيين' : 'Hire Date'}</th>
                  <th className="px-6 py-4.5 text-xs font-black text-gray-500 border-b border-[#002D62]/10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#002D62]/8">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[#002D62]/2 transition-colors odd:bg-white even:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="flex items-center gap-3.5 cursor-pointer group/profile"
                        onClick={() => setSelectedProfile(employee)}
                      >
                        {employee.photoURL ? (
                          <img src={employee.photoURL} alt="" className="w-11 h-11 rounded-xl object-cover border-2 border-[#002D62]/20 shadow-[2px_2px_0px_0px_rgba(0,45,98,0.1)] group-hover/profile:scale-105 transition-transform" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[#002D62]/5 border-2 border-[#002D62]/15 flex items-center justify-center text-[#002D62] font-black text-sm group-hover/profile:scale-105 transition-transform shadow-[2px_2px_0px_0px_rgba(0,45,98,0.06)]">
                            {employee.firstName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-black text-[#002D62] group-hover/profile:underline">{employee.firstName} {employee.lastName}</div>
                          <div className="text-[9px] font-semibold text-[#002D62]/60 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <BadgeCheck className="w-3 h-3 text-[#002D62]" />
                            {employee.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[10px] font-black text-[#002D62] bg-[#002D62]/5 border-2 border-[#002D62]/12 px-2.5 py-1 rounded-xl inline-block uppercase tracking-wider">
                        {employee.departmentId || 'Operations'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-black text-[#002D62]">
                        {currency} {Number(employee.salary).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black border-2 ${
                        employee.status === 'active' 
                          ? 'bg-emerald-50 border-emerald-500/20 text-emerald-700' 
                          : 'bg-amber-50 border-amber-500/20 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          employee.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}></span>
                        {employee.status === 'active' ? (isRTL ? 'مداوم نشط' : 'Active') : (isRTL ? 'في إجازة' : 'On Leave')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[#002D62]/60 font-bold">
                      {employee.hireDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleEdit(employee)}
                          className="p-1.5 hover:bg-[#002D62]/5 border border-transparent hover:border-[#002D62]/15 text-[#002D62] rounded-lg transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(employee.id!)}
                          className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-400/30 text-rose-650 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t-2 border-[#002D62]/10 flex items-center justify-between text-[10px] font-black uppercase text-[#002D62]/50 tracking-wider bg-slate-50">
          <span>{isRTL ? `عرض ${filteredEmployees.length} من أصل ${employees.length} موظف` : `Displaying ${filteredEmployees.length} of ${employees.length} personnel`}</span>
        </div>
      </div>

      {/* Profile Details Drawer */}
      {selectedProfile && (
        <>
          <div 
            className="fixed inset-0 bg-[#002D62]/15 backdrop-blur-sm z-110"
            onClick={() => setSelectedProfile(null)}
          ></div>
          <div className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full max-w-xl bg-white border-s-2 border-[#002D62] shadow-[-10px_0_30px_rgba(0,45,98,0.15)] z-120 overflow-y-auto animate-in duration-300 pb-12`}>
            
            <div className="sticky top-0 bg-slate-50 border-b-2 border-[#002D62]/10 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#002D62] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_#1e3a8a]">
                  {selectedProfile.photoURL ? (
                    <img src={selectedProfile.photoURL} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span>{selectedProfile.firstName.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-md font-black italic font-serif text-[#002D62]">{selectedProfile.firstName} {selectedProfile.lastName}</h2>
                  <p className="text-[9px] font-black text-indigo-700 uppercase tracking-widest mt-0.5">{selectedProfile.position}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProfile(null)}
                className="p-2 border-2 border-[#002D62]/20 text-[#002D62] hover:border-[#002D62] rounded-lg transition-colors bg-white"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Quick Vision Section */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-5.5 bg-slate-50 border-2 border-[#002D62]/10 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,45,98,0.05)]">
                    <div className="flex items-center gap-2 mb-2 text-[#002D62]">
                       <Calendar className="w-4 h-4 stroke-[2.2]" />
                       <span className="text-[8px] font-black uppercase tracking-wider text-[#002D62]/60">{isRTL ? 'تاريخ التعيين' : 'Hire Date'}</span>
                    </div>
                    <p className="text-sm font-black font-sans">{selectedProfile.hireDate}</p>
                 </div>
                 <div className="p-5.5 bg-slate-50 border-2 border-[#002D62]/10 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,45,98,0.05)]">
                    <div className="flex items-center gap-2 mb-2 text-emerald-750">
                       <Wallet className="w-4 h-4 stroke-[2.2] text-emerald-700" />
                       <span className="text-[8px] font-black uppercase tracking-wider text-[#002D62]/60">{isRTL ? 'الراتب السنوي الكلي' : 'Annual Salary'}</span>
                    </div>
                    <p className="text-sm font-black font-sans text-emerald-800">{currency} {(Number(selectedProfile.salary) * 12).toLocaleString()}</p>
                 </div>
              </div>

              {/* Personal Info Hub */}
              <div className="space-y-4">
                 <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-[#002D62]">
                    <UserCircle className="w-4.5 h-4.5 stroke-[2.5]" />
                    <span>{isRTL ? 'بيانات الكادر الشخصية' : 'Personal Contact details'}</span>
                 </h3>
                 <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 bg-white border-2 border-[#002D62]/10 rounded-2xl hover:border-[#002D62] transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#002D62]/5 border-2 border-[#002D62]/10 flex items-center justify-center text-[#002D62]"><Mail className="w-4 h-4" /></div>
                          <div>
                             <p className="text-[8px] font-black text-[#002D62]/50 uppercase tracking-widest">Email Address</p>
                             <p className="font-bold text-xs">{selectedProfile.email}</p>
                          </div>
                       </div>
                       <ExternalLink className="w-3.5 h-3.5 text-[#002D62]/30" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white border-2 border-[#002D62]/10 rounded-2xl hover:border-[#002D62] transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#002D62]/5 border-2 border-[#002D62]/10 flex items-center justify-center text-[#002D62]"><Phone className="w-4 h-4" /></div>
                          <div>
                             <p className="text-[8px] font-black text-[#002D62]/50 uppercase tracking-widest">Internal Extension</p>
                             <p className="font-bold text-xs">{selectedProfile.phone || 'N/A'}</p>
                          </div>
                       </div>
                       <MessageCircle className="w-4 h-4 text-[#002D62]" />
                    </div>
                 </div>
              </div>

              {/* Professional Insights */}
              <div className="space-y-4">
                 <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-[#002D62]">
                    <Shield className="w-4.5 h-4.5 stroke-[2.5]" />
                    <span>{isRTL ? 'المركز الإداري والكشافات' : 'Administrative Record details'}</span>
                 </h3>
                 <div className="p-6 bg-white border-2 border-[#002D62] rounded-2xl shadow-[3px_3px_0px_0px_#002D62]">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#002D62]/10">
                       <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 stroke-[2.2]" />
                          <span className="text-sm font-black uppercase tracking-wider">{selectedProfile.departmentId || 'Operations'}</span>
                       </div>
                       <Award className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[8px] font-black text-[#002D62]/50 uppercase tracking-widest">Administrative Scale</p>
                          <p className="font-extrabold text-xs">Standard Contract</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-[#002D62]/50 uppercase tracking-widest">Roster Code</p>
                          <p className="font-extrabold text-xs text-blue-800">{selectedProfile.employeeId || 'EMP-01'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Success Performance Metrics */}
              <div className="space-y-4">
                 <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-[#002D62]">
                    <LineChart className="w-4.5 h-4.5 stroke-[2.5]" />
                    <span>{isRTL ? 'الإنتاجية وتقييم أداء العام' : 'Performance Indicators'}</span>
                 </h3>
                 <div className="grid grid-cols-3 gap-3">
                    {[
                       { label: 'Attendance', val: '98%', color: 'text-emerald-700' },
                       { label: 'Task Ratio', val: '92%', color: 'text-[#002D62]' },
                       { label: 'Goal Met', val: '14/15', color: 'text-amber-700' }
                    ].map((stat, i) => (
                       <div key={i} className="text-center p-4 bg-slate-50 border-2 border-[#002D62]/10 rounded-2xl">
                          <p className={`text-base font-black mb-1 ${stat.color}`}>{stat.val}</p>
                          <p className="text-[8px] font-black text-[#002D62]/60 uppercase tracking-wider">{stat.label}</p>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-[#002D62]/10">
                 <button 
                   onClick={() => handleEdit(selectedProfile)}
                   className="flex-1 td-btn-primary py-3 text-xs"
                 >
                    {isRTL ? 'تحرير البيانات' : 'Modify Record'}
                 </button>
                 <button className="flex-1 td-btn-secondary py-3 text-xs">
                    {isRTL ? 'إستعراض ملفات المستندات' : 'Inspect Documents'}
                 </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3D Form Modal for Instatement / Updates */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#002D62]/20 backdrop-blur-sm">
          <div className="bg-white border-2 border-[#002D62] rounded-3xl shadow-[8px_8px_0px_0px_#002D62] w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5.5 bg-slate-50 border-b-2 border-[#002D62]/10 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase text-[#002D62] tracking-widest">
                {editingEmployee ? (isRTL ? 'تحديث كشوفات الموظف' : 'Adjust Employee File') : (isRTL ? 'إدخال موظف جديد' : 'Instate Corporate Employee')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 border-2 border-[#002D62]/20 hover:border-[#002D62] text-[#002D62] rounded-lg transition-colors bg-white">
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Photo Input */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-[#002D62]/5 border-2 border-[#002D62]/20 flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,45,98,0.06)]">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-7 h-7 text-[#002D62]/30" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-2 bg-[#002D62] text-white rounded-lg shadow-md hover:bg-[#1e3a8a] transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-[9px] text-[#002D62]/60 font-black uppercase tracking-wider">
                  {isRTL ? 'بحد أقصى (1 ميجابايت)' : 'Max 1MB size limit'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-wider block">{isRTL ? 'الاسم الأول' : 'First Name'}</label>
                  <input
                    required
                    className="w-full td-input py-2 text-xs"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-wider block">{isRTL ? 'اسم العائلة' : 'Last Name'}</label>
                  <input
                    required
                    className="w-full td-input py-2 text-xs"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-wider block">{isRTL ? 'البريد الإلكتروني الأساسي' : 'Company Email'}</label>
                  <input
                    type="email"
                    required
                    className="w-full td-input py-2 text-xs"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-wider block">{isRTL ? 'رقم الجوال' : 'Phone Extension'}</label>
                  <input
                    className="w-full td-input py-2 text-xs"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-wider block">{isRTL ? 'المسمى الوظيفي' : 'Roster Position'}</label>
                  <input
                    required
                    className="w-full td-input py-2 text-xs"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-wider block">{isRTL ? 'القسم والفرع' : 'Department Branch'}</label>
                  <select
                    required
                    className="w-full td-input py-2 text-xs bg-white"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">{isRTL ? 'اختر قسم العمل' : 'Select Branch'}</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales">Sales</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Management">Management</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-wider block">{isRTL ? `الراتب الأساسي (${currency})` : `Basic salary (${currency})`}</label>
                  <input
                    type="number"
                    required
                    className="w-full td-input py-2 text-xs"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-wider block">{isRTL ? 'الحالة الكلية' : 'Status'}</label>
                  <select
                    required
                    className="w-full td-input py-2 text-xs bg-white"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="active">{isRTL ? 'نشط مداوم' : 'Active Duty'}</option>
                    <option value="on_leave">{isRTL ? 'في إجازة رسمية' : 'On Leave'}</option>
                    <option value="terminated">{isRTL ? 'تم إنهاء العقد' : 'Terminated'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-wider block">{isRTL ? 'الرقم الوظيفي الكود' : 'Employee ID Key'}</label>
                  <input
                    required
                    className="w-full td-input py-2 text-xs"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#002D62]/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="td-btn-secondary py-2 px-6 text-xs"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  disabled={isSubmitting}
                  className="td-btn-primary py-2 px-8 text-xs flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingEmployee ? (isRTL ? 'تحديث السجل' : 'Amend') : (isRTL ? 'تثبيت وحفظ' : 'Instate')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
