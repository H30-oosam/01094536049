/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';

// Components & Pages
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Recruitment from './pages/Recruitment';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Candidates from './pages/Candidates';
import Performance from './pages/Performance';
import Training from './pages/Training';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Logs from './pages/Logs';
import Map from './pages/Map';
import Users from './pages/Users';
import Files from './pages/Files';
import CRM from './pages/CRM';
import Assets from './pages/Assets';
import Onboarding from './pages/Onboarding';
import Documents from './pages/Documents';
import OrgChart from './pages/OrgChart';
import Announcements from './pages/Announcements';
import WhatsApp from './pages/WhatsApp';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  const { setUser, setLoading } = useAuthStore();
  const { isRTL } = useUIStore();

  useEffect(() => {
    if (isRTL) {
      document.title = 'خدمات حسام الورداني للموارد البشرية | Hossam Elwardany HR Services';
    } else {
      document.title = 'Hossam Elwardany HR Services';
    }
  }, [isRTL]);

  useEffect(() => {
    // Check for demo user in localStorage first to keep the UI smooth and avoid login flickers
    const demoUserStr = localStorage.getItem('demoUser');
    if (demoUserStr) {
      try {
        const demoUser = JSON.parse(demoUserStr);
        setUser(demoUser);
      } catch (err) {
        console.error("Error parsing demo user from localStorage:", err);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as any;
            setUser(userData);
            localStorage.setItem('demoUser', JSON.stringify(userData));
          } else {
            // Check bootstrap admins
            const bootstrapEmails = ['hossamelwardany132@gmail.com', 'hossam@admin.com'];
            if (bootstrapEmails.includes(firebaseUser.email || '')) {
              const newUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin',
                role: firebaseUser.email === 'hossam@admin.com' ? 'super-admin' : 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              setUser(newUser as any);
              localStorage.setItem('demoUser', JSON.stringify(newUser));
            } else {
              setUser(null);
              localStorage.removeItem('demoUser');
            }
          }
        } catch (err: any) {
          console.error("Error fetching user profile:", err);
          if (!localStorage.getItem('demoUser')) {
            setUser(null);
          }
        }
      } else {
        // Safe check for offline / persistent guest role state
        const demoUser = localStorage.getItem('demoUser');
        if (demoUser && JSON.parse(demoUser).uid.startsWith('demo-')) {
          // Keep the offline demo session alive
        } else {
          setUser(null);
          localStorage.removeItem('demoUser');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/employees" element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        } />

        <Route path="/projects" element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } />

        <Route path="/tasks" element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        } />

        <Route path="/map" element={
          <ProtectedRoute>
            <Map />
          </ProtectedRoute>
        } />

        <Route path="/logs" element={
          <ProtectedRoute>
            <Logs />
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } />

        <Route path="/files" element={
          <ProtectedRoute>
            <Files />
          </ProtectedRoute>
        } />

        <Route path="/crm" element={
          <ProtectedRoute>
            <CRM />
          </ProtectedRoute>
        } />

        <Route path="/documents" element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } />

        <Route path="/org-chart" element={
          <ProtectedRoute>
            <OrgChart />
          </ProtectedRoute>
        } />

        <Route path="/announcements" element={
          <ProtectedRoute>
            <Announcements />
          </ProtectedRoute>
        } />

        <Route path="/assets" element={
          <ProtectedRoute>
            <Assets />
          </ProtectedRoute>
        } />

        <Route path="/leaves" element={
          <ProtectedRoute>
            <Leaves />
          </ProtectedRoute>
        } />

        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />

        <Route path="/performance" element={
          <ProtectedRoute>
            <Performance />
          </ProtectedRoute>
        } />

        <Route path="/training" element={
          <ProtectedRoute>
            <Training />
          </ProtectedRoute>
        } />

        <Route path="/attendance" element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        } />

        <Route path="/payroll" element={
          <ProtectedRoute>
            <Payroll />
          </ProtectedRoute>
        } />

        <Route path="/recruitment" element={
          <ProtectedRoute>
            <Recruitment />
          </ProtectedRoute>
        } />

        <Route path="/candidates" element={
          <ProtectedRoute>
            <Candidates />
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/whatsapp" element={
          <ProtectedRoute>
            <WhatsApp />
          </ProtectedRoute>
        } />

        {/* Fallback for other routes */}
        <Route path="*" element={
          <ProtectedRoute>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl text-gray-400">🏗️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Under Construction</h2>
              <p className="text-gray-500 max-w-sm">
                We're building this module specifically for Hossam HR. Check back soon for the full experience.
              </p>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}


