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
import { seedFirestoreDatabase } from './utils/dbSeeder';

// Components & Pages
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingPage from './components/LoadingPage';

// Lazy loaded page components for optimal performance and speed
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Employees = React.lazy(() => import('./pages/Employees'));
const Recruitment = React.lazy(() => import('./pages/Recruitment'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Leaves = React.lazy(() => import('./pages/Leaves'));
const Payroll = React.lazy(() => import('./pages/Payroll'));
const Candidates = React.lazy(() => import('./pages/Candidates'));
const Performance = React.lazy(() => import('./pages/Performance'));
const Training = React.lazy(() => import('./pages/Training'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));
const Projects = React.lazy(() => import('./pages/Projects'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Logs = React.lazy(() => import('./pages/Logs'));
const Map = React.lazy(() => import('./pages/Map'));
const Users = React.lazy(() => import('./pages/Users'));
const Files = React.lazy(() => import('./pages/Files'));
const CRM = React.lazy(() => import('./pages/CRM'));
const Assets = React.lazy(() => import('./pages/Assets'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Documents = React.lazy(() => import('./pages/Documents'));
const OrgChart = React.lazy(() => import('./pages/OrgChart'));
const Announcements = React.lazy(() => import('./pages/Announcements'));
const WhatsApp = React.lazy(() => import('./pages/WhatsApp'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Seed Firestore base tables if authenticated
          seedFirestoreDatabase();

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
        if (demoUser) {
          try {
            const parsed = JSON.parse(demoUser);
            if (parsed && parsed.uid && parsed.uid.startsWith('demo-')) {
              setUser(parsed);
            } else {
              setUser(null);
              localStorage.removeItem('demoUser');
            }
          } catch {
            setUser(null);
            localStorage.removeItem('demoUser');
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <ErrorBoundary>
      <Router>
        <React.Suspense fallback={<LoadingPage />}>
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

            {/* Fallback 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </Router>
    </ErrorBoundary>
  );
}


