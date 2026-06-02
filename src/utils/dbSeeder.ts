import { doc, getDoc, setDoc, writeBatch, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';

// Stable starting datasets for the HR Platform
export const DEPARTMENTS_SEED = [
  { id: 'dept-eng', name: 'Engineering', description: 'Software engineering, development and infrastructure.' },
  { id: 'dept-mgmt', name: 'Management', description: 'Executive leadership, strategy, and administrative management.' },
  { id: 'dept-design', name: 'Design', description: 'Product UI/UX design, visuals and user experience research.' },
  { id: 'dept-hr', name: 'Human Resources', description: 'Talent recruitment, employee relations and workforce training.' },
  { id: 'dept-qa', name: 'Quality Assurance', description: 'Product testing, quality engineering and continuous delivery.' },
  { id: 'dept-mktg', name: 'Marketing', description: 'Brand advertising, user acquisition and social media.' }
];

export const EMPLOYEES_SEED = [
  {
    id: 'emp-1',
    firstName: 'احمد',
    lastName: 'حسن',
    email: 'ahmed.hassan@company.com',
    phone: '+20 100 123 4567',
    position: 'Senior Developer',
    departmentId: 'dept-eng',
    status: 'active',
    employeeId: 'EMP-001',
    hireDate: '2022-03-15',
    salary: 8500,
    photoURL: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'emp-2',
    firstName: 'فاطمة',
    lastName: 'محمد',
    email: 'fatima.mohamed@company.com',
    phone: '+20 100 234 5678',
    position: 'Project Manager',
    departmentId: 'dept-mgmt',
    status: 'active',
    employeeId: 'EMP-002',
    hireDate: '2021-06-20',
    salary: 7500,
    photoURL: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'emp-3',
    firstName: 'عمر',
    lastName: 'علي',
    email: 'omar.ali@company.com',
    phone: '+20 100 345 6789',
    position: 'UI/UX Designer',
    departmentId: 'dept-design',
    status: 'active',
    employeeId: 'EMP-003',
    hireDate: '2023-01-10',
    salary: 6500,
    photoURL: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'emp-4',
    firstName: 'ليلى',
    lastName: 'ابراهيم',
    email: 'layla.ibrahim@company.com',
    phone: '+20 100 456 7890',
    position: 'HR Specialist',
    departmentId: 'dept-hr',
    status: 'active',
    employeeId: 'EMP-004',
    hireDate: '2021-11-05',
    salary: 5500,
    photoURL: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'emp-5',
    firstName: 'كريم',
    lastName: 'نور',
    email: 'karim.nour@company.com',
    phone: '+20 100 567 8901',
    position: 'QA Engineer',
    departmentId: 'dept-qa',
    status: 'active',
    employeeId: 'EMP-005',
    hireDate: '2022-08-30',
    salary: 6000,
    photoURL: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'emp-6',
    firstName: 'نور',
    lastName: 'سمير',
    email: 'noor.samir@company.com',
    phone: '+20 100 678 9012',
    position: 'Marketing Manager',
    departmentId: 'dept-mktg',
    status: 'active',
    employeeId: 'EMP-006',
    hireDate: '2020-05-12',
    salary: 7000,
    photoURL: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const ATTENDANCE_SEED = [
  { id: 'att-1', employeeId: 'emp-1', userName: 'احمد حسن', type: 'CHECK_IN', date: '2026-06-02', time: '08:15 AM' },
  { id: 'att-2', employeeId: 'emp-2', userName: 'فاطمة محمد', type: 'CHECK_IN', date: '2026-06-02', time: '08:30 AM' },
  { id: 'att-3', employeeId: 'emp-3', userName: 'عمر علي', type: 'CHECK_IN', date: '2026-06-02', time: '08:45 AM' },
  { id: 'att-4', employeeId: 'emp-4', userName: 'ليلى ابراهيم', type: 'CHECK_IN', date: '2026-06-02', time: '08:55 AM' },
  { id: 'att-5', employeeId: 'emp-5', userName: 'كريم نور', type: 'CHECK_IN', date: '2026-06-02', time: '09:05 AM' }
];

export const PROJECTS_SEED = [
  { id: 'proj-1', name: 'نظام الموارد البشرية السحابي', description: 'تطوير المنصة المتكاملة للموارد البشرية والرواتب والتعاميم الفورية لمجموعة حسام الورداني.', status: 'active', budget: 150000, startDate: '2026-01-10', endDate: '2026-10-30', createdAt: new Date().toISOString() },
  { id: 'proj-2', name: 'أتمتة الفواتير وبصمة الحضور', description: 'تكامل أجهزة البصمة البيومترية مع بوابة الموظفين وخدمات الرواتب لربط الغياب تلقائياً.', status: 'planning', budget: 45000, startDate: '2026-04-15', endDate: '2026-08-20', createdAt: new Date().toISOString() },
  { id: 'proj-3', name: 'بوابة دعم الموظف والتواصل الذكي', description: 'تصميم البوت والاتصال مع واتساب لإرسال إشعارات مسيرات الرواتب لحظة اعتمادها.', status: 'completed', budget: 75000, startDate: '2025-09-01', endDate: '2026-02-15', createdAt: new Date().toISOString() }
];

export const TASKS_SEED = [
  { id: 'task-1', title: 'مراجعة أرقام مسيرات الرواتب لشهر مايو', priority: 'high', status: 'todo', dueDate: '2026-06-05', assignedTo: 'emp-4', createdAt: new Date().toISOString() },
  { id: 'task-2', title: 'برمجة وتكامل API الواتساب مع النظام المالي', priority: 'high', status: 'in_progress', dueDate: '2026-06-12', assignedTo: 'emp-1', createdAt: new Date().toISOString() },
  { id: 'task-3', title: 'تحديث تصاميم ملفات الموظفين وتعديل القوالب', priority: 'low', status: 'done', dueDate: '2026-05-28', assignedTo: 'emp-3', createdAt: new Date().toISOString() },
  { id: 'task-4', title: 'فحص جودة نظام رفع الفواتير وضمان حماية الهوية', priority: 'medium', status: 'in_progress', dueDate: '2026-06-08', assignedTo: 'emp-5', createdAt: new Date().toISOString() }
];

/**
 * Checks if the Firestore database has been seeded. If not, seeds all main collections.
 * Uses setDoc with stable IDs to prevent duplicate inserts.
 */
export async function seedFirestoreDatabase() {
  try {
    const isAlreadySeeded = localStorage.getItem('firestore_db_seeded_done');
    if (isAlreadySeeded === 'true') {
      return;
    }

    // Double check collections via single quick check on employees
    const employeesSnap = await getDocs(query(collection(db, 'employees'), limit(1)));
    if (!employeesSnap.empty) {
      console.log('Database already has content, skipping seeding routine.');
      localStorage.setItem('firestore_db_seeded_done', 'true');
      return;
    }

    console.log('Starting full database seed routine onto Firestore database...');

    // 1. Departments Seeding
    for (const item of DEPARTMENTS_SEED) {
      await setDoc(doc(db, 'departments', item.id), item);
    }

    // 2. Employees Seeding
    for (const item of EMPLOYEES_SEED) {
      await setDoc(doc(db, 'employees', item.id), item);
    }

    // 3. Attendance Seeding
    for (const item of ATTENDANCE_SEED) {
      await setDoc(doc(db, 'attendance', item.id), {
        ...item,
        timestamp: new Date()
      });
    }

    // 4. Projects Seeding
    for (const item of PROJECTS_SEED) {
      await setDoc(doc(db, 'projects', item.id), item);
    }

    // 5. Tasks Seeding
    for (const item of TASKS_SEED) {
      await setDoc(doc(db, 'tasks', item.id), item);
    }

    console.log('Firestore Database Seeded Successfully!');
    localStorage.setItem('firestore_db_seeded_done', 'true');
  } catch (err) {
    console.warn('Silent notice: Firestore database seeder experienced exception:', err);
  }
}
