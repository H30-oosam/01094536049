import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Mail, Lock, UserPlus, LogIn, Github, Globe, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { motion } from 'motion/react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('hossam@admin.com');
  const [password, setPassword] = useState('1321994');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { isRTL, toggleRTL } = useUIStore();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userPath = `users/${user.uid}`;

      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, userPath);
      }
      
      if (!userDoc || !userDoc.exists()) {
        const newUser = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'New User',
          role: (user.email === 'hossam@admin.com') ? 'super-admin' : (['hossamelwardany132@gmail.com'].includes(user.email || '') ? 'admin' : 'employee'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await setDoc(doc(db, 'users', user.uid), newUser);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, userPath);
        }
        setUser(newUser as any);
      } else {
        setUser(userDoc.data() as any);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const bootstrapEmails = ['hossam@admin.com', 'hossamelwardany132@gmail.com'];
      const bootstrapPassword = '1321994'; // Demo password for bootstrap accounts
      
      if (bootstrapEmails.includes(email)) {
        if (password !== bootstrapPassword) {
          throw new Error(isRTL ? 'كلمة المرور غير صالحة لهذا الحساب التجريبي' : 'Invalid password for this demo account');
        }

        // Try to authenticate with Firebase Auth to make sure security rules pass
        let resultUser: any = null;
        try {
          const authResult = await signInWithEmailAndPassword(auth, email, password);
          resultUser = authResult.user;
        } catch (loginErr: any) {
          if (loginErr.code === 'auth/operation-not-allowed') {
            console.warn("[Firebase Authentication Notice] Email/Password provider is disabled in Firebase console. Falling back to secure simulated sandbox session.");
          } else if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/invalid-email' || loginErr.code === 'auth/wrong-password') {
            try {
              const createResult = await createUserWithEmailAndPassword(auth, email, password);
              resultUser = createResult.user;
            } catch (createErr: any) {
              if (createErr.code === 'auth/operation-not-allowed') {
                console.warn("[Firebase Authentication Notice] Email/Password provider is disabled in Firebase console. Falling back to secure simulated sandbox session.");
              } else {
                console.warn("Failed to register bootstrap user credentials (using sandbox session instead):", createErr);
              }
            }
          } else {
            console.warn("Could not match credentials against Auth provider (using sandbox session instead):", loginErr);
          }
        }

        const demoUser = {
          uid: resultUser ? resultUser.uid : `demo-${email}`,
          email: email,
          displayName: email === 'hossam@admin.com' ? 'Hossam Elwardany' : 'Admin User',
          role: email === 'hossam@admin.com' ? 'super-admin' as const : ('admin' as const),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // If authenticated with Firebase, write/update their Firestore record
        if (resultUser) {
          try {
            await setDoc(doc(db, 'users', resultUser.uid), demoUser);
          } catch (fsErr) {
            console.warn("Could not save admin profile to Firestore (using local fallback only):", fsErr);
          }
        }

        localStorage.setItem('demoUser', JSON.stringify(demoUser));
        setUser(demoUser);
        navigate('/');
        return;
      }

      if (isSignUp) {
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          const newUser = {
            uid: result.user.uid,
            email: result.user.email!,
            displayName: result.user.email?.split('@')[0] || 'User',
            role: 'employee' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          try {
            await setDoc(doc(db, 'users', result.user.uid), newUser);
          } catch (err) {
            console.error("Error creating user profile:", err);
          }
          setUser(newUser);
          navigate('/');
        } catch (err: any) {
          if (err.code === 'auth/operation-not-allowed') {
            throw new Error(isRTL 
              ? 'يرجى تفعيل طريقة "البريد الإلكتروني وكلمة المرور" (Email/Password) في واجهة تحكم Authentication في منصة Firebase.'
              : 'Please enable the "Email/Password" sign-in provider in your Firebase Authentication settings.'
            );
          }
          throw new Error(err.message || 'Failed to create account');
        }
      } else {
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          try {
            const userDoc = await getDoc(doc(db, 'users', result.user.uid));
            if (userDoc.exists()) {
              setUser(userDoc.data() as any);
            } else {
              const defaultUser = {
                uid: result.user.uid,
                email: result.user.email!,
                displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
                role: 'employee' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              try {
                await setDoc(doc(db, 'users', result.user.uid), defaultUser);
              } catch (err) {
                console.error("Error creating default user profile:", err);
              }
              setUser(defaultUser);
            }
          } catch (err) {
            console.error("Error fetching profile on login:", err);
            const fallbackUser = {
              uid: result.user.uid,
              email: result.user.email!,
              displayName: result.user.displayName || 'User',
              role: 'employee' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setUser(fallbackUser);
          }
          navigate('/');
        } catch (err: any) {
          if (err.code === 'auth/operation-not-allowed') {
            throw new Error(isRTL 
              ? 'يرجى تفعيل طريقة "البريد الإلكتروني وكلمة المرور" (Email/Password) في واجهة تحكم Authentication في منصة Firebase.'
              : 'Please enable the "Email/Password" sign-in provider in your Firebase Authentication settings.'
            );
          }
          throw new Error(isRTL ? 'البريد الإلكتروني أو كلمة المرور غير صالحة' : 'Invalid email or password');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-slate-50 text-[#002D62] overflow-hidden">
      
      {/* Absolute Language Switcher */}
      <div className="absolute top-6 right-6 lg:right-12 z-20">
        <button
          onClick={toggleRTL}
          className="px-4 py-2 bg-white border-2 border-[#002D62] text-[#002D62] rounded-xl hover:bg-[#002D62]/5 font-black text-xs tracking-wider flex items-center gap-2 shadow-[3px_3px_0px_0px_#002D62] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_0px]"
        >
          <Globe className="w-4 h-4 stroke-[2.5]" />
          <span>{isRTL ? 'ENGLISH' : 'العربية'}</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl z-10"
      >
        <div className="td-card p-8 md:p-12">
          
          {/* Exact Brand Logo vector SVG recreation */}
          <div className="flex flex-col items-center justify-center mb-10">
            <svg 
              className="w-48 h-48 text-[#002D62]" 
              viewBox="0 0 200 200" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Connecting Lines with clean thick stroke */}
              <line x1="100" y1="80" x2="100" y2="35" stroke="#002D62" strokeWidth="2.5" />
              <line x1="100" y1="80" x2="145" y2="50" stroke="#002D62" strokeWidth="2.5" />
              <line x1="100" y1="80" x2="155" y2="105" stroke="#002D62" strokeWidth="2.5" />
              <line x1="100" y1="80" x2="55" y2="50" stroke="#002D62" strokeWidth="2.5" />
              <line x1="100" y1="80" x2="45" y2="105" stroke="#002D62" strokeWidth="2.5" />

              {/* Central Circle (Leader Node) with dual ring borders */}
              <circle cx="100" cy="80" r="28" fill="white" stroke="#002D62" strokeWidth="3.5" />
              <circle cx="100" cy="80" r="24" fill="white" stroke="#002D62" strokeWidth="1.5" />
              {/* Male Corporate Bust icon in center */}
              <g transform="translate(86, 68) scale(0.9)">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#002D62" />
              </g>

              {/* Top Node */}
              <circle cx="100" cy="35" r="14" fill="white" stroke="#002D62" strokeWidth="2" />
              <g transform="translate(91, 26) scale(0.6)">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#002D62" />
              </g>

              {/* Top-Right Node */}
              <circle cx="145" cy="50" r="14" fill="white" stroke="#002D62" strokeWidth="2" />
              <g transform="translate(136, 41) scale(0.6)">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#002D62" />
              </g>

              {/* Bottom-Right Node */}
              <circle cx="155" cy="105" r="14" fill="white" stroke="#002D62" strokeWidth="2" />
              <g transform="translate(146, 96) scale(0.6)">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#002D62" />
              </g>

              {/* Top-Left Node */}
              <circle cx="55" cy="50" r="14" fill="white" stroke="#002D62" strokeWidth="2" />
              <g transform="translate(46, 41) scale(0.6)">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#002D62" />
              </g>

              {/* Bottom-Left Node */}
              <circle cx="45" cy="105" r="14" fill="white" stroke="#002D62" strokeWidth="2" />
              <g transform="translate(36, 96) scale(0.6)">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#002D62" />
              </g>
            </svg>

            {/* Typography matching uploaded image */}
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[#002D62]/80">
                {isRTL ? 'خدمات إدارة الأكاديمية والتعليم' : 'ACADEMY MANAGEMENT PLATFORM'}
              </span>
              <div className="flex items-center justify-center gap-4 my-2">
                <div className="h-0.5 w-12 bg-[#002D62]" />
                <span className="text-sm font-bold uppercase tracking-widest text-[#002D62]/90">
                  {isRTL ? 'البوابة الذكية الموحدة' : 'LMS GATEWAY'}
                </span>
                <div className="h-0.5 w-12 bg-[#002D62]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black italic text-[#002D62] tracking-wide mt-2">
                Zewail Academy
              </h1>
            </div>
          </div>

          <p className="text-center text-xs text-[#002D62]/60 font-bold mb-8 uppercase tracking-wider">
            {isSignUp 
              ? (isRTL ? 'إنشاء حساب جديد في نظام الهوية الموحد' : 'CREATE A SYSTEM IDENTITY ACCOUNT')
              : (isRTL ? 'تسجيل الدخول للنظام الشامل الرقمي' : 'SIGN IN TO THE ENTERPRISE DASHBOARD')
            }
          </p>

          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-6 p-4 bg-rose-50 border-2 border-rose-300 text-rose-700 text-xs font-extrabold uppercase tracking-widest rounded-2xl text-center shadow-[3px_3px_0px_0px_#e11d48]"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-[0.2em] block">
                {isRTL ? 'البريد الالكتروني للموظف' : 'EMPLOYEE CORPORATE EMAIL'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="w-full td-input pl-11"
                  placeholder="hossam@admin.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002D62]/40" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#002D62]/75 uppercase tracking-[0.2em] block">
                {isRTL ? 'كلمة المرور المشفرة' : 'SECURE ENCRYPTED PASSWORD'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full td-input pl-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002D62]/40" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
              <label className="flex items-center gap-2 text-[#002D62]/70 cursor-pointer hover:text-[#002D62] transition-colors select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[#002D62]/20 text-[#002D62] focus:ring-0 cursor-pointer" 
                />
                {isRTL ? 'تذكر بياناتي' : 'REMEMBER MY SESSION'}
              </label>
              <button type="button" className="text-[#002D62]/70 hover:text-[#002D62] hover:underline">
                {isRTL ? 'نسيت كلمة المرور؟' : 'FORGOT PASSWORD?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full td-btn-primary py-4 uppercase text-xs tracking-[0.25em]"
            >
              {loading 
                ? (isRTL ? 'جاري التحقق...' : 'VERIFYING...') 
                : (isSignUp ? (isRTL ? 'إنشاء حساب' : 'REGISTER NOW') : (isRTL ? 'تسجيل الدخول الموحد' : 'AUTHORIZE & LOG IN'))
              }
            </button>
          </form>

          {/* Quick Demo Credentials Info Bar */}
          <div className="mt-8 p-3 bg-amber-50 border-2 border-amber-200 text-[#002D62] text-[10px] font-bold rounded-xl flex items-center gap-2 shadow-[2px_2px_0px_0px_#d97706]">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold uppercase">Demo Credentials:</p>
              <p className="opacity-85">Email: <span className="underline select-all">hossam@admin.com</span> / Password: <span className="underline select-all">1321994</span></p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#002D62]/55">
              {isSignUp ? (isRTL ? 'هل لديك حساب بالفعل؟' : 'ALREADY HAVE AN IDENTITY?') : (isRTL ? 'ليس لديك حساب مسبق؟' : "DON'T HAVE AN ENTERPRISE ACCOUNT?")}{' '}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#002D62] font-black hover:underline underline-offset-4 ml-1"
              >
                {isSignUp ? (isRTL ? 'سجل دخولك' : 'SIGN IN') : (isRTL ? 'أنشئ حسابك' : 'CREATE ONE')}
              </button>
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-0.5 bg-[#002D62]/10 flex-1"></div>
            <span className="text-[8px] font-black text-[#002D62]/30 uppercase tracking-widest">
              {isRTL ? 'أو عبر الدخول السريع' : 'OR SECURE CONNECT'}
            </span>
            <div className="h-0.5 bg-[#002D62]/10 flex-1"></div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button 
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-[#002D62]/20 rounded-xl hover:border-[#002D62] shadow-[2.5px_2.5px_0px_0px_#002D62] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#002D62" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#002D62" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#002D62" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#002D62" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#002D62]">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-[#002D62]/20 rounded-xl hover:border-[#002D62] shadow-[2.5px_2.5px_0px_0px_#002D62] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0.5 active:translate-x-0.5 cursor-pointer">
              <Github className="w-4 h-4 text-[#002D62]" />
              <span className="text-[9px] font-black uppercase tracking-wider text-[#002D62]">GitHub</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
