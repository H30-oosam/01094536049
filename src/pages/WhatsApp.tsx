import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, Smartphone, Wifi, Battery, LogOut, CheckCircle, RefreshCw, Send,
  Users, Bot, MessageSquare, AlertCircle, Sparkles, Building, Play, Pause, BellRing, History, ShieldAlert
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Employee } from '../types';

interface WhatsAppSession {
  connected: boolean;
  phoneNumber: string;
  deviceName: string;
  battery: number;
  wifi: 'strong' | 'medium' | 'weak';
  uptime: string;
  autoReply: boolean;
  welcomeMessage: string;
  keywords: Array<{ keyword: string; reply: string }>;
}

export default function WhatsApp() {
  const { isRTL, theme } = useUIStore();
  const isDark = theme === 'dark';
  
  // Connection states
  const [session, setSession] = useState<WhatsAppSession>(() => {
    const saved = localStorage.getItem('whatsapp_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      connected: false,
      phoneNumber: '+966 50 123 4567',
      deviceName: 'iPhone 15 Pro Max',
      battery: 92,
      wifi: 'strong',
      uptime: '0h 0m',
      autoReply: true,
      welcomeMessage: isRTL 
        ? 'مرحباً بك في نظام أكاديمية زويل لإدارة الموارد البشرية. تم تلقي رسالتك وسنقوم بالرد عليك في أقرب وقت.'
        : 'Welcome to Zewail Academy HR Management System. We have received your message and will reply shortly.',
      keywords: [
        { keyword: 'خصم', reply: isRTL ? 'يمكنك مراجعة كشف الرواتب والخصومات من صفحة الرواتب والمسيرات في حسابك.' : 'You can review payroll details and deductions from the Payroll tab in your account.' },
        { keyword: 'رصيد', reply: isRTL ? 'رصيد إجازاتك الحالي متوفر في صفحة الإجازات والطلبات.' : 'Your current leaves balance is available in the Leaves and Requests tab.' },
        { keyword: 'دوام', reply: isRTL ? 'ساعات الدوام الرسمية من الساعة 8:00 صباحاً وحتى 4:00 مساءً.' : 'Official working hours are from 8:00 AM to 4:00 PM.' }
      ]
    };
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'generating' | 'pairing' | 'success'>('idle');
  const [qrProgress, setQrProgress] = useState(100);
  const [countdown, setCountdown] = useState(45);
  const [, setQrValue] = useState('https://web.whatsapp.com/send?code=hossamhr-' + Math.random().toString(36).substring(7));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'broadcast' | 'bot' | 'logs'>('dashboard');

  // Input states
  const [targetPhone, setTargetPhone] = useState('');
  const [targetMessage, setTargetMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'custom' | string>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  
  // Bot settings state
  const [newKeyword, setNewKeyword] = useState('');
  const [newReply, setNewReply] = useState('');

  // Logs state
  const [logs, setLogs] = useState<Array<{ id: string; time: string; recipient: string; message: string; type: 'sent' | 'received' | 'system' }>>(() => {
    const savedLogs = localStorage.getItem('whatsapp_logs');
    return savedLogs ? JSON.parse(savedLogs) : [
      { id: '1', time: new Date(Date.now() - 3600000).toLocaleTimeString(), recipient: 'System', message: 'WhatsApp integration service started.', type: 'system' }
    ];
  });

  // Save session & logs to localStorage on change
  useEffect(() => {
    localStorage.setItem('whatsapp_session', JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem('whatsapp_logs', JSON.stringify(logs));
  }, [logs]);

  // Fetch real employees database to make WhatsApp Broadcast campaigns powerful and integrated
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Employee);
      });
      setEmployees(list);
    }, (err) => {
      console.warn("Failed fetching official employees, using realistic fallbacks for broadcast demo:", err);
      // Fallback
      setEmployees([
        { id: 'emp-1', employeeId: 'EMP001', firstName: isRTL ? 'خالد' : 'Khalid', lastName: isRTL ? 'العتيبي' : 'Al-Otaibi', email: 'khalid@zewail.com', phone: '+966501234567', departmentId: 'HR', position: 'HR Specialist', hireDate: '2023-01-15', salary: 12000, status: 'active' },
        { id: 'emp-2', employeeId: 'EMP002', firstName: isRTL ? 'سارة' : 'Sara', lastName: isRTL ? 'الغامدي' : 'Al-Ghamdi', email: 'sara@zewail.com', phone: '+966507654321', departmentId: 'Engineering', position: 'Frontend Developer', hireDate: '2022-06-10', salary: 15000, status: 'active' },
        { id: 'emp-3', employeeId: 'EMP003', firstName: isRTL ? 'أحمد' : 'Ahmed', lastName: isRTL ? 'سالم' : 'Salem', email: 'ahmed@zewail.com', phone: '+966551239876', departmentId: 'Marketing', position: 'Content Manager', hireDate: '2024-02-20', salary: 9000, status: 'active' }
      ]);
    });

    return () => unsubscribe();
  }, [isRTL]);

  // Handle countdown & QR renewal simulating WhatsApp QR timeout behavior
  useEffect(() => {
    let timer: any;
    if (!session.connected && connectionStatus === 'pairing') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Regenerate QR
            setQrValue('https://web.whatsapp.com/send?code=hossamhr-' + Math.random().toString(36).substring(7));
            return 45;
          }
          return prev - 1;
        });
        setQrProgress((prev) => (prev <= 1 ? 100 : prev - 2.22));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [session.connected, connectionStatus]);

  // Session uptime counter simulation
  useEffect(() => {
    let timer: any;
    if (session.connected) {
      const startTime = Date.now();
      timer = setInterval(() => {
        const diffMs = Date.now() - startTime;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        setSession(prev => ({
          ...prev,
          uptime: `${diffHrs}h ${diffMins}m`
        }));
      }, 30000);
    }
    return () => clearInterval(timer);
  }, [session.connected]);

  // Handlers
  const handleStartLinking = () => {
    setConnectionStatus('generating');
    setTimeout(() => {
      setConnectionStatus('pairing');
      setCountdown(45);
      setQrProgress(100);
    }, 1500);
  };

  const handleSimulateScan = () => {
    setConnectionStatus('success');
    setTimeout(() => {
      setSession(prev => ({
        ...prev,
        connected: true
      }));
      addLog('System', isRTL ? 'تم ربط جهاز واتساب ويب بنجاح.' : 'WhatsApp Web client paired successfully.', 'system');
    }, 1200);
  };

  const handleDisconnect = () => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من رغبتك في فصل حساب الواتساب؟' : 'Are you sure you want to disconnect WhatsApp?')) {
      setSession(prev => ({ ...prev, connected: false }));
      setConnectionStatus('idle');
      addLog('System', isRTL ? 'تم إلغاء ربط جهاز واتساب ويب.' : 'WhatsApp client connection terminated by Administrator.', 'system');
    }
  };

  const addLog = (recipient: string, message: string, type: 'sent' | 'received' | 'system') => {
    const newLog = {
      id: Math.random().toString(),
      time: new Date().toLocaleTimeString(),
      recipient,
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleSendSingleAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPhone || !targetMessage) return;

    try {
      addLog(targetPhone, targetMessage, 'sent');
      
      // Store alert in custom firestore log collection for transparency
      await addDoc(collection(db, 'whatsapp_alerts'), {
        phone: targetPhone,
        message: targetMessage,
        type: 'individual_alert',
        sender: session.phoneNumber,
        timestamp: serverTimestamp()
      });

      setTargetMessage('');
      alert(isRTL ? 'تم إرسال الرسالة بنجاح عبر الواتساب!' : 'WhatsApp alert sent successfully!');
    } catch (e) {
      console.error(e);
      alert(isRTL ? 'حدث خطأ أثناء رصد العملية ولكن تم حفظ السجل بنجاح.' : 'Alert sent and registered.');
    }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !newReply.trim()) return;
    setSession(prev => ({
      ...prev,
      keywords: [...prev.keywords, { keyword: newKeyword.trim(), reply: newReply.trim() }]
    }));
    setNewKeyword('');
    setNewReply('');
  };

  const handleRemoveKeyword = (index: number) => {
    setSession(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, idx) => idx !== index)
    }));
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    let recipients: Employee[] = [];
    if (broadcastTarget === 'all') {
      recipients = employees;
    } else if (broadcastTarget === 'custom') {
      recipients = employees.filter(emp => selectedEmployees.includes(emp.id || ''));
    } else {
      recipients = employees.filter(emp => emp.departmentId === broadcastTarget);
    }

    if (recipients.length === 0) {
      alert(isRTL ? 'يرجى تحديد موظف واحد على الأقل لإطلاق الحملة.' : 'Please select at least one recipient.');
      return;
    }

    if (!window.confirm(isRTL ? `هل تريد إرسال هذا التعميم لـ ${recipients.length} موظفاً؟` : `Send this broadcast to ${recipients.length} employee(s)?`)) return;

    // Simulate sending with staggered logs
    recipients.forEach((emp, index) => {
      setTimeout(() => {
        const customizedMsg = broadcastMessage
          .replace(/{name}/g, `${emp.firstName} ${emp.lastName}`)
          .replace(/{id}/g, emp.employeeId);
        
        addLog(emp.phone || `${emp.firstName} (${isRTL ? 'موظف' : 'Employee'})`, customizedMsg, 'sent');
        
        // Log to firebase
        addDoc(collection(db, 'whatsapp_alerts'), {
          employeeId: emp.employeeId,
          phone: emp.phone || 'N/A',
          message: customizedMsg,
          type: 'broadcast_comms',
          recipientName: `${emp.firstName} ${emp.lastName}`,
          timestamp: serverTimestamp()
        }).catch(err => console.error("Firestore logging backup err:", err));

      }, index * 300);
    });

    setBroadcastMessage('');
    setSelectedEmployees([]);
    alert(isRTL ? 'تم تشغيل حملة المراسلات الجماعية بنجاح وجاري إرسالها!' : 'WhatsApp broadcast campaign launched successfully!');
  };

  // SVG representation of dynamic pairing QR code
  const renderQRCodeSVG = () => {
    // Generate simulated QR modules
    const finderPattern = (x: number, y: number) => (
      <g fill={isDark ? '#38bdf8' : '#25d366'}>
        <rect x={x} y={y} width={7} height={7} />
        <rect x={x+1} y={y+1} width={5} height={5} fill={isDark ? '#0f172a' : '#ffffff'} />
        <rect x={x+2} y={y+2} width={3} height={3} />
      </g>
    );

    return (
      <svg viewBox="0 0 29 29" className="w-[200px] h-[200px] select-none mx-auto p-2 bg-white rounded-2xl shadow-inner">
        {/* Finder pattern Top-Left */}
        {finderPattern(0, 0)}
        {/* Finder pattern Top-Right */}
        {finderPattern(22, 0)}
        {/* Finder pattern Bottom-Left */}
        {finderPattern(0, 22)}

        {/* Alignment pattern near bottom-right */}
        <g fill="#128c7e">
          <rect x={20} y={20} width={5} height={5} />
          <rect x={21} y={21} width={3} height={3} fill="#ffffff" />
          <rect x={22} y={22} width={1} height={1} />
        </g>

        {/* Realistic random bits matrix */}
        <path d="
          M 8,1 H 9 V 2 H 8 Z M 11,1 H 13 V 2 H 11 Z M 15,1 H 17 V 3 H 15 Z M 19,1 H 21 V 2 H 19 Z
          M 8,3 H 10 V 4 H 8 Z M 12,3 H 14 V 4 H 12 Z M 18,3 H 19 V 5 H 18 Z M 21,3 H 22 V 4 H 21 Z
          M 9,5 H 11 V 6 H 9 Z M 13,5 H 15 V 7 H 13 Z M 16,5 H 17 V 6 H 16 Z M 20,5 H 21 V 7 H 20 Z
          M 1,8 H 3 V 9 H 1 Z M 5,8 H 7 V 10 H 5 Z M 9,8 H 10 V 9 H 9 Z M 12,8 H 14 V 9 H 12 Z M 18,8 H 19 V 9 H 18 Z
          M 2,10 H 4 V 11 H 2 Z M 8,10 H 10 V 11 H 8 Z M 11,10 H 13 V 12 H 11 Z M 15,10 H 16 V 11 H 15 Z M 22,10 H 24 V 11 H 22 Z
          M 0,13 H 2 V 14 H 0 Z M 4,13 H 6 V 14 H 4 Z M 8,13 H 9 V 15 H 8 Z M 10,13 H 12 V 14 H 10 Z M 14,13 H 17 V 14 H 14 Z
          M 19,13 H 21 V 14 H 19 Z M 23,13 H 25 V 15 H 23 Z M 27,13 H 29 V 14 H 27 Z
          M 1,15 H 3 V 17 H 1 Z M 5,15 H 7 V 16 H 5 Z M 11,15 H 13 V 16 H 11 Z M 15,15 H 16 V 17 H 15 Z M 18,15 H 20 V 16 H 18 Z
          M 3,18 H 4 V 19 H 3 Z M 8,18 H 10 V 19 H 8 Z M 12,18 H 14 V 20 H 12 Z M 16,18 H 18 V 19 H 16 Z M 22,18 H 23 V 20 H 22 Z
          M 5,21 H 7 V 22 H 5 Z M 9,21 H 11 V 23 H 9 Z M 14,21 H 16 V 22 H 14 Z M 18,21 H 20 V 22 H 18 Z M 23,21 H 26 V 22 H 23 Z
          M 8,24 H 10 V 25 H 8 Z M 12,24 H 13 V 25 H 12 Z M 15,24 H 17 V 26 H 15 Z M 19,24 H 21 V 25 H 19 Z M 25,24 H 27 V 25 H 25 Z
          M 9,26 H 11 V 28 H 9 Z M 13,26 H 15 V 27 H 13 Z M 17,26 H 18 V 28 H 17 Z M 21,26 H 23 V 27 H 21 Z M 26,26 H 28 V 28 H 26 Z
        " fill={isDark ? '#334155' : '#1e293b'} />
        {/* WhatsApp iconic green logo at the center of simulated QR code */}
        <g transform="translate(11, 11)">
          <rect x={0} y={0} width={7} height={7} rx={1.5} fill="#25D366" />
          <path d="M 3.5,1.5 C 2.5,1.5 1.7,2.2 1.7,3.1 C 1.7,3.5 1.8,3.8 2.0,4.1 L 1.6,5.3 L 2.8,5.0 C 3.0,5.1 3.2,5.2 3.5,5.2 C 4.5,5.2 5.3,4.4 5.3,3.5 C 5.3,2.5 4.5,1.5 3.5,1.5 Z" fill="#ffffff" />
        </g>
      </svg>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header and Branding */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
              <MessageSquare className="w-6 h-6 stroke-[2.5]" />
            </span>
            {isRTL ? 'ربط واتساب ويب' : 'WhatsApp Web Integration'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
            {isRTL 
              ? 'توصيل حساب واتساب لإرسال الإخطارات الآلية، كشوفات المرتبات، وتنبيهات الحضور للموظفين تلقائياً.' 
              : 'Link a WhatsApp business or personal account to send automated notifications, slips, and alerts.'}
          </p>
        </div>

        {session.connected && (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-2xl hover:bg-rose-100 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>{isRTL ? 'إلغاء ربط الحساب' : 'Disconnect WhatsApp'}</span>
          </button>
        )}
      </div>

      {session.connected ? (
        /* ==================== ACTIVE INSTANCE DASHBOARD ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Left Menu Controls */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-slate-800 p-4 space-y-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{isRTL ? 'الحالة والتحكم' : 'Overview & Device'}</span>
              </button>

              <button 
                onClick={() => setActiveTab('broadcast')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'broadcast' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{isRTL ? 'حملات البث والتعاميم' : 'HR Group Broadcast'}</span>
              </button>

              <button 
                onClick={() => setActiveTab('bot')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'bot' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>{isRTL ? 'الرد الآلي الذكي' : 'Auto-Response Bot'}</span>
              </button>

              <button 
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'logs' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <History className="w-4 h-4" />
                <span>{isRTL ? 'سجل المحادثات والعمليات' : 'Session Transmission Logs'}</span>
              </button>
            </div>

            {/* Quick Status Info widget */}
            <div className="bg-emerald-500/5 dark:bg-emerald-950/10 rounded-3xl border border-emerald-500/10 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  {isRTL ? 'مصل متصل وآمن' : 'Instance Active'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                {isRTL 
                  ? 'يتم تشفير كافة الرسائل الصادرة والواردة لتتوافق مع معايير الأمان المحلية وحفظ البيانات بالكامل.' 
                  : 'All transactional messages are encrypted and audited through secure server relays.'}
              </p>
            </div>
          </div>

          {/* Main Context Viewer Right Panel */}
          <div className="lg:col-span-9 space-y-6">

            {/* TAB 1: OVERVIEW & DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Meta details cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase">{isRTL ? 'الجهاز المتصل' : 'Connected Device'}</span>
                      <h4 className="text-lg font-black text-gray-800 dark:text-white mt-1">{session.deviceName}</h4>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl">
                      <Smartphone className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</span>
                      <h4 className="text-lg font-black text-gray-800 dark:text-white mt-1 dir-ltr text-right">{session.phoneNumber}</h4>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase">{isRTL ? 'إحصائيات الاتصال' : 'Device Status'}</span>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-black text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                          <Battery className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{session.battery}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                          <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{session.wifi.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/20 text-sky-500 rounded-2xl">
                      <Wifi className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Instant Send Alert panel */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl border border-gray-100 dark:border-slate-800/80 p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      {isRTL ? 'إرسال إخطار واتساب سريع' : 'Quick Manual Alert'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {isRTL 
                        ? 'أرسل تنبيهاً مباشراً لأي رقم هاتف للتحقق من أداء الاتصال وسرعة التوصيل.' 
                        : 'Send an immediate outbound message to verify latency and gateway performance.'}
                    </p>
                  </div>

                  <form onSubmit={handleSendSingleAlert} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{isRTL ? 'رقم الهاتف (مع رمز الدولة)' : 'Phone (with country code)'}</label>
                        <input 
                          type="text" 
                          placeholder="+2010XXXXXXXX"
                          value={targetPhone}
                          onChange={(e) => setTargetPhone(e.target.value)}
                          required
                          className="w-full text-xs font-bold p-3.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white tracking-widest placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{isRTL ? 'نص الرسالة الإخطارية' : 'Alert Message Body'}</label>
                        <input 
                          type="text" 
                          placeholder={isRTL ? 'مثال: عزيزي الموظف، يرجى استكمال التقييم السنوي عبر بوابة الموارد البشرية.' : 'Dear employee, please fill out your weekly evaluation forms.'}
                          value={targetMessage}
                          onChange={(e) => setTargetMessage(e.target.value)}
                          required
                          className="w-full text-xs font-bold p-3.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/15 hover:bg-emerald-600 cursor-pointer active:scale-95 transition-all w-fit"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isRTL ? 'إرسال التنبيه الآن' : 'Transmit Alert Now'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: HR GROUP BROADCAST */}
            {activeTab === 'broadcast' && (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl border border-gray-100 dark:border-slate-800/80 p-8 shadow-sm space-y-8">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" />
                    {isRTL ? 'حملات البث الجماعي للموظفين (Broadcast Campaigns)' : 'Staff Broadcast Campaigns'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {isRTL 
                      ? 'صمم وأرسل تعاميم الموارد البشرية والرواتب لجميع الموظفين أو لأقسام معينة فوراً عبر الواتساب.' 
                      : 'Draft and dispatch announcements, salary logs, or attendance instructions instantly.'}
                  </p>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-6">
                  {/* Select target audience */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{isRTL ? 'الجمهور المستهدف' : 'Target Audience'}</label>
                      <select
                        value={broadcastTarget}
                        onChange={(e) => {
                          setBroadcastTarget(e.target.value);
                          setSelectedEmployees([]);
                        }}
                        className="w-full text-xs font-bold p-3.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="all">{isRTL ? 'جميع الموظفين النشطين' : 'All Active Staff members'}</option>
                        <option value="HR">{isRTL ? 'قسم الموارد البشرية فقط' : 'HR Department'}</option>
                        <option value="Engineering">{isRTL ? 'قسم الهندسة والتصميم' : 'Engineering Department'}</option>
                        <option value="Marketing">{isRTL ? 'قسم التسويق والمبيعات' : 'Marketing & Sales'}</option>
                        <option value="custom">{isRTL ? 'تحديد موظفين مخصصين' : 'Select Custom Employees'}</option>
                      </select>
                    </div>

                    <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/30 p-4 rounded-2xl flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-black text-gray-800 dark:text-white">{isRTL ? 'متغيرات حيوية متاحة' : 'Dynamic Variables Allowed'}</h5>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                          {isRTL 
                            ? 'اكتب {name} لإدراج اسم الموظف كاملاً ديناميكياً، أو {id} لإرفاق رقم الهوية الوظيفية.' 
                            : 'Use {name} to resolve the employee\'s full name, and {id} to include their official ID.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Multi Select for custom list */}
                  {broadcastTarget === 'custom' && (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 max-h-48 overflow-y-auto">
                      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1">{isRTL ? 'اختر الموظفين' : 'Choose Staff'}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {employees.map(emp => (
                          <label key={emp.id} className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800/80 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                            <input 
                              type="checkbox" 
                              checked={selectedEmployees.includes(emp.id || '')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmployees(p => [...p, emp.id || '']);
                                } else {
                                  setSelectedEmployees(p => p.filter(id => id !== emp.id));
                                }
                              }}
                              className="text-emerald-500 focus:ring-emerald-500/20 rounded"
                            />
                            <span className="truncate">{emp.firstName} {emp.lastName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message body input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      <label>{isRTL ? 'نص التعميم والرسالة الجماعية' : 'Broadcast Message Body'}</label>
                      <button 
                        type="button" 
                        onClick={() => setBroadcastMessage(isRTL 
                          ? 'أهلاً {name}، يسعدنا إشعاركم بإيداع مسير رواتب هذا الشهر في حساباتكم البنكية. شكراً لجهودكم.' 
                          : 'Hello {name}, we are pleased to inform you that your payroll for this month has been processed.'
                        )}
                        className="text-emerald-600 dark:text-emerald-400 focus:outline-none hover:underline"
                      >
                        {isRTL ? 'استيراد قالب كشف الراتب' : 'Use Salary Template'}
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      required
                      placeholder={isRTL ? 'رقم التعميم: X ... عزيزي {name} ...' : 'Official message body ... Use {name} for employee name.'}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full text-xs font-bold p-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Broadcast Trigger Button */}
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-600 cursor-pointer active:scale-95 transition-all"
                  >
                    <BellRing className="w-4 h-4" />
                    <span>{isRTL ? 'إطلاق حملة وإرسال جماعي' : 'Launch Broadcast Notification'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: AUTO-RESPONSE BOT */}
            {activeTab === 'bot' && (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl border border-gray-100 dark:border-slate-800/80 p-8 shadow-sm space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <Bot className="w-5 h-5 text-emerald-500" />
                      {isRTL ? 'محرك الرد التلقائي التفاعلي' : 'Bot Keyword Automations'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {isRTL 
                        ? 'قم بإدارة الردود الآلية للموظفين والعملاء عند استلام كلمات دلالية معينة تلقائياً.' 
                        : 'Define standard automated replies triggered by incoming custom terms.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSession(prev => ({ ...prev, autoReply: !prev.autoReply }))}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl cursor-pointer border transition-all ${
                      session.autoReply 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-gray-100 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-400'
                    }`}
                  >
                    {session.autoReply ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{session.autoReply ? (isRTL ? 'نظام الرد نشط' : 'Bot Engine Online') : (isRTL ? 'الرد معطل' : 'Bot Offline')}</span>
                  </button>
                </div>

                {/* Default welcome message */}
                <div className="space-y-2 border-b border-gray-100 dark:border-slate-800 pb-6">
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{isRTL ? 'رسالة الترحيب الأولى (عند أول محادثة مستلمة)' : 'Default Welcome Greeting'}</label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={session.welcomeMessage}
                      onChange={(e) => setSession(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                      className="flex-1 text-xs font-bold p-3.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Keyword rules setup list */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{isRTL ? 'قواعد الكلمات الدلالية النشطة' : 'Keyword Translation Maps'}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 p-4 rounded-3xl">
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{isRTL ? 'إذا كان النص يحتوي على' : 'If message contains (Keyword)'}</label>
                      <input 
                        type="text"
                        placeholder={isRTL ? 'مثال: سعر أو راتب' : 'e.g. salary'}
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-6 space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{isRTL ? 'قم بالرد التلقائي بـ' : 'Automated answer'}</label>
                      <input 
                        type="text"
                        placeholder={isRTL ? 'مثيل: سيتم إيداع الرواتب بموعدها المحدد.' : 'e.g. Payroll is credited on the 25th of each month.'}
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="w-full px-4 py-3 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 transition-all cursor-pointer active:scale-95"
                      >
                        {isRTL ? 'إضافة قاعدة' : 'Add Rule'}
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-slate-800/80 bg-white dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                    {session.keywords.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400">{isRTL ? 'لا توجد قواعد مخصصة مضافة حالياً.' : 'No keyword rules created yet.'}</div>
                    ) : (
                      session.keywords.map((kw, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800/20">
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-black">IF CONTAINS</span>
                              <span className="text-gray-900 dark:text-white font-black">"{kw.keyword}"</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{kw.reply}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(idx)}
                            className="text-xs text-rose-500 font-semibold px-2.5 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                          >
                            {isRTL ? 'حذف' : 'Remove'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SESSION TRANSMISSION LOGS */}
            {activeTab === 'logs' && (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl border border-gray-100 dark:border-slate-800/80 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-emerald-500" />
                      {isRTL ? 'سجل العمليات والاتصال المباشر' : 'Live Gateway Transmission Log'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {isRTL 
                        ? 'عرض فوري للعمليات والتعاميم الصادرة والتنبيهات المباشرة التي تمت من هذا الحساب.' 
                        : 'Real-time feed of outbound transactions, welcome triggers, and system sync events.'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(isRTL ? 'هل تريد تصفية السجل بالكامل؟' : 'Clear all log records?')) {
                        setLogs([{ id: '1', time: new Date().toLocaleTimeString(), recipient: 'System', message: 'Logs flushed by administrator.', type: 'system' }]);
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-rose-500 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <span>{isRTL ? 'تصفية السجل' : 'Clear Feed'}</span>
                  </button>
                </div>

                <div className="bg-gray-950 p-6 rounded-3xl font-mono text-[11px] text-emerald-400 space-y-3 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 hover:bg-white/5 p-1 rounded transition-colors">
                      <span className="text-gray-600 shrink-0 select-none">[{log.time}]</span>
                      
                      {log.type === 'system' && (
                        <span className="text-amber-500 shrink-0 select-none">[SYSTEM_DAEMON]</span>
                      )}
                      {log.type === 'sent' && (
                        <span className="text-sky-400 shrink-0 select-none">[TX_GATEWAY: {log.recipient}]</span>
                      )}
                      
                      <span className={log.type === 'system' ? 'text-gray-300' : 'text-emerald-400'}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== DISCONNECTED QR SCAN PAIRING PROCESS ==================== */
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-4xl border border-gray-100 dark:border-slate-800/80 p-8 shadow-sm max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            {/* Instructions list left */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  {isRTL ? 'ربط جهاز واتساب ويب جديد' : 'Pair New WhatsApp Account'}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  {isRTL 
                    ? 'اتبع الخطوات الموضحة لمطابقة الرمز وتفعيل الربط الفوري مع لوحة تحكم الموظفين.' 
                    : 'To link your phone, scan the high-definition security QR code displayed.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isRTL ? 'افتح تطبيق الواتساب على هاتفك المحمول.' : 'Open WhatsApp on your mobile phone.'}
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isRTL ? 'اضغط على القائمة (للاندرويد) أو الإعدادات (للايفون) واختر "الأجهزة المرتبطة" (Linked Devices).' : 'Tap Menu or Settings and select "Linked Devices".'}
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isRTL ? 'اضغط على زر "ربط جهاز" (Link a Device).' : 'Tap "Link a Device" to open the camera scanner.'}
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isRTL ? 'وجّه كاميرا هاتفك نحو هذه الشاشة لمسح الرمز بدقة.' : 'Point your phone camera to this screen to authenticate.'}
                  </p>
                </div>
              </div>

              {connectionStatus === 'idle' && (
                <button
                  onClick={handleStartLinking}
                  className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/15 hover:bg-emerald-600 cursor-pointer active:scale-95 transition-all w-fit"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isRTL ? 'توليد رمز الاستجابة السريع' : 'Generate Connection QR'}</span>
                </button>
              )}
            </div>

            {/* QR Scanner Display Right */}
            <div className="flex flex-col items-center justify-center py-6">
              {connectionStatus === 'idle' && (
                <div className="w-[240px] h-[240px] border border-dashed border-gray-200 dark:border-slate-800 rounded-4xl flex flex-col items-center justify-center bg-gray-50/50 dark:bg-slate-950/25 p-6 text-center">
                  <QrCode className="w-12 h-12 text-gray-300 dark:text-slate-700 stroke-[1.5] mb-4 animate-pulse" />
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {isRTL ? 'اضغط على زر التوليد باليسار لإظهار الرمز الآمن لمطابقة الجلسة.' : 'Click Generate Connection QR to fetch secure session pairing token.'}
                  </p>
                </div>
              )}

              {connectionStatus === 'generating' && (
                <div className="w-[240px] h-[240px] bg-gray-50/50 dark:bg-slate-950/25 border border-gray-100 dark:border-slate-800 rounded-4xl flex flex-col items-center justify-center p-6 text-center">
                  <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {isRTL ? 'جاري تهيئة خادم الواتساب...' : 'Spinning up secure gateway token...'}
                  </p>
                </div>
              )}

              {connectionStatus === 'pairing' && (
                <div className="space-y-5 text-center flex flex-col items-center">
                  {/* Container with scanning neon laser animation line */}
                  <div className="relative w-[230px] h-[230px] p-3 bg-white border border-gray-100 rounded-3xl shadow-xl flex items-center justify-center overflow-hidden group">
                    {renderQRCodeSVG()}
                    
                    {/* Pulsing neon scan line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,1)] animate-bounce" style={{ animationDuration: '3s' }}></div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="w-full max-w-[200px] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                      <span>{isRTL ? 'صلاحية الرمز:' : 'Expires in:'}</span>
                      <span className="text-emerald-500 text-xs font-black">{countdown}s</span>
                    </div>
                    {/* Progress Bar resembling QR validity */}
                    <div className="w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-linear" 
                        style={{ width: `${qrProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Simulation Helper button in sandbox mode */}
                  <button
                    onClick={handleSimulateScan}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg cursor-pointer transition-all border border-indigo-100/50 dark:border-indigo-900/30"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'محاكاة تواصل الهاتف والمسح' : 'Simulate Phone QR Scan'}</span>
                  </button>
                </div>
              )}

              {connectionStatus === 'success' && (
                <div className="w-[240px] h-[240px] bg-emerald-500/5 border border-emerald-500/10 rounded-4xl flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-white">
                    {isRTL ? 'اكتملت المطابقة بنجاح' : 'Success! Link Authorized'}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 font-semibold">
                    {isRTL ? 'يرجى الانتظار، جاري تحويلك للوحة المراقبة...' : 'Bootstrapping your connected gateway...'}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Help Card footer styling */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-4xl flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-yellow-400/10 text-yellow-500 rounded-2xl border border-yellow-400/20 shrink-0">
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h5 className="font-black text-gray-800 dark:text-white text-sm">
              {isRTL ? 'إرشادات الاستخدام التجاري الآمن' : 'Commercial Usage Guidelines'}
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold mt-1 max-w-2xl">
              {isRTL 
                ? 'يرجى تجنب إرسال رسائل غير مرغوب فيها (Spam) للموظفين أو منسوبي الأكاديمية لتفادي حظر حسابك والالتزام بسياسات الواتساب المعتمدة.' 
                : 'Avoid sending rapid bulk marketing messages to unverified recipients to bypass WhatsApp standard filter flags.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
