export type UserRole = 'super-admin' | 'admin' | 'hr' | 'manager' | 'employee';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id?: string;
  userId?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  position: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'on_leave' | 'terminated';
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Department {
  id?: string;
  name: string;
  managerId?: string;
  description?: string;
}

export interface Attendance {
  id?: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

export interface LeaveRequest {
  id?: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

export interface Payroll {
  id?: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'paid';
}

export interface JobPost {
  id?: string;
  title: string;
  departmentId: string;
  description: string;
  requirements: string;
  status: 'open' | 'closed' | 'draft';
  createdAt: string;
}

export interface Candidate {
  id?: string;
  jobPostId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeURL?: string;
  status: 'applied' | 'screening' | 'interview' | 'offered' | 'hired' | 'rejected';
  appliedAt: string;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}
