import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  Info, 
  Trash2, 
  Sparkles,
  Inbox,
  UserPlus,
  Briefcase,
  Wallet,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { Notification } from '../types';

export default function NotificationCenter() {
  const { isRTL } = useUIStore();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // Default starting notifications for a premium onboarding experience if none exist
  const getDemoNotifications = (): Notification[] => [
    {
      id: 'demo-1',
      userId: user?.uid || 'guest',
      title: isRTL ? 'مرحباً بك في نظام الموارد البشرية' : 'Welcome to the HR System',
      message: isRTL 
        ? 'تم إعداد حسابك وتهيئته بنجاح للعمل على الإصدار الجديد ذو الطابع الاحترافي المطور.'
        : 'Your account has been set up and initialized successfully for the new professional high-performance edition.',
      type: 'success',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
    },
    {
      id: 'demo-2',
      userId: user?.uid || 'guest',
      title: isRTL ? 'تحديث مسيرات الرواتب لشهر مايو' : 'May Payroll Updates',
      message: isRTL
        ? 'تم تدقيق كشوفات الرواتب واعتمادها بواسطة الإدارة المالية لتصبح جاهزة للمرسلات.'
        : 'Payroll sheets have been audited and approved by financial management for transmission.',
      type: 'info',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hrs ago
    },
    {
      id: 'demo-3',
      userId: user?.uid || 'guest',
      title: isRTL ? 'مراجعة أداء النصف السنوي' : 'Mid-Year Performance Review',
      message: isRTL
        ? 'يرجى مراجعة وتجهيز تقرير تقييم الأداء قبل نهاية الأسبوع الحالي.'
        : 'Please review and prepare your performance appraisal report before the end of the current week.',
      type: 'warning',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString() // 1 day ago
    }
  ];

  // Close the notifications modal on click-away
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Real-time Firestore sync with local fallback
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(40)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Notification[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Notification);
        });

        if (list.length === 0) {
          // If Firestore collection is empty, load demo notifications from localStorage or generate defaults
          const localStr = localStorage.getItem(`notifications_${user.uid}`);
          if (localStr) {
            setNotifications(JSON.parse(localStr));
          } else {
            const defaults = getDemoNotifications();
            setNotifications(defaults);
            localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(defaults));
          }
        } else {
          setNotifications(list);
          localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(list));
        }
        setLoading(false);
      }, (error) => {
        console.warn('Firestore Notifications subscription error, using local fallback:', error);
        // Fallback to local storage if permission is denied / firebase offline
        const localStr = localStorage.getItem(`notifications_${user.uid}`);
        if (localStr) {
          setNotifications(JSON.parse(localStr));
        } else {
          const defaults = getDemoNotifications();
          setNotifications(defaults);
          localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(defaults));
        }
        setLoading(false);
      });
    } catch (err) {
      console.error('Error starting notifications stream:', err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user?.uid, isRTL]);

  // Mark specific notification as read
  const markAsRead = async (notifId: string) => {
    if (!user?.uid) return;
    
    // Update locally
    const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(updated));

    // Update on Firestore
    if (!notifId.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'notifications', notifId), { read: true });
      } catch (err) {
        console.error('Could not update Firestore notification read status:', err);
      }
    }
  };

  // Mark all notifications as read
  const markAllRead = async () => {
    if (!user?.uid) return;

    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(updated));

    // Bulk update Firestore
    const unreadFirestore = notifications.filter(n => !n.read && !n.id?.startsWith('demo-'));
    for (const notif of unreadFirestore) {
      if (notif.id) {
        try {
          await updateDoc(doc(db, 'notifications', notif.id), { read: true });
        } catch (err) {
          console.warn('Update read state failed:', err);
        }
      }
    }
  };

  // Delete individual notification
  const deleteNotification = async (notifId: string) => {
    if (!user?.uid) return;

    const updated = notifications.filter(n => n.id !== notifId);
    setNotifications(updated);
    localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(updated));

    if (!notifId.startsWith('demo-')) {
      try {
        await deleteDoc(doc(db, 'notifications', notifId));
      } catch (err) {
        console.error('Could not delete notification from Firestore:', err);
      }
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    if (!user?.uid) return;

    setNotifications([]);
    localStorage.setItem(`notifications_${user.uid}`, JSON.stringify([]));

    // Delete non-demo ones
    const toDelete = notifications.filter(n => !n.id?.startsWith('demo-'));
    for (const notif of toDelete) {
      if (notif.id) {
        try {
          await deleteDoc(doc(db, 'notifications', notif.id));
        } catch (err) {
          console.warn('Failed to delete from Firestore:', err);
        }
      }
    }
  };

  // High quality sample notification templates for previewing
  const demoTemplates = [
    {
      titleEn: 'New Task Assigned',
      titleAr: 'تخصيص مهمة جديدة لك',
      msgEn: 'You have been assigned the "Implement Dark Mode Testing" task by management.',
      msgAr: 'تم تخصيص مهمة "تطبيق واختبار المظهر الداكن" لك من قبل الإدارة.',
      type: 'info' as const,
      icon: Briefcase
    },
    {
      titleEn: 'Bonus Approved',
      titleAr: 'تمت الموافقة على مكافأة مالية',
      msgEn: 'An outstanding performance bonus has been credited to your digital wallet.',
      msgAr: 'تم إضافة مكافأة تميز في الأداء التشغيلي إلى محفظتك الرقمية الخاصة بالرواتب.',
      type: 'success' as const,
      icon: Wallet
    },
    {
      titleEn: 'Attendance Reminder',
      titleAr: 'تذكير بتسجيل الحضور',
      msgEn: 'System noticed you missed checking out yesterday. Please revise your logging.',
      msgAr: 'يرجى العلم بأنه تم اكتشاف عدم تسجيل انصراف بالأمس، راجع تبويب الحضور والغياب لتعديله.',
      type: 'warning' as const,
      icon: AlertCircle
    },
    {
      titleEn: 'Corporate News Update',
      titleAr: 'تحديث النشرة الإخبارية',
      msgEn: 'A new general administrative circular was published on the announcements section.',
      msgAr: 'تم تعميم قرار إداري عام مهم وجديد بقسم الإعلانات والنشرات بالشركة.',
      type: 'info' as const,
      icon: Megaphone
    }
  ];

  // Helper function to dynamically add a custom notification
  const handleAddSampleNotification = async () => {
    if (!user?.uid) return;

    // Pic a template randomly
    const tempIndex = Math.floor(Math.random() * demoTemplates.length);
    const temp = demoTemplates[tempIndex];

    const newNotif: Omit<Notification, 'id'> = {
      userId: user.uid,
      title: isRTL ? temp.titleAr : temp.titleEn,
      message: isRTL ? temp.msgAr : temp.msgEn,
      type: temp.type,
      read: false,
      createdAt: new Date().toISOString()
    };

    try {
      // Always write to Firestore to demonstrate firebase synchronization
      const docRef = await addDoc(collection(db, 'notifications'), newNotif);
      
      // Update local storage instantly to reflect changes in UI
      const enriched: Notification = { id: docRef.id, ...newNotif };
      const updated = [enriched, ...notifications];
      setNotifications(updated);
      localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not write notification to firestore (probably safe local fallback):', err);
      // Fallback
      const enriched: Notification = { id: 'demo-' + Date.now(), ...newNotif };
      const updated = [enriched, ...notifications];
      setNotifications(updated);
      localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(updated));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Target Trigger with 3D tactile theme */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-white border-2 border-[#002D62] text-[#002D62] dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-500/10 rounded-xl hover:bg-[#002D62]/5 transition-all shadow-[2px_2px_0px_0px_#002D62] dark:shadow-[2px_2px_0px_0px_#38bdf8] relative active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px]"
        aria-label="Notification Center"
      >
        <Bell className="w-4 h-4 stroke-[2.5]" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-rose-500 text-white font-extrabold text-[10px] rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-bounce shadow">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className={`absolute top-14 ${isRTL ? 'left-0 md:-left-2' : 'right-0 md:-right-2'} w-[calc(100vw-32px)] sm:w-96 max-h-[520px] bg-white dark:bg-slate-900 border-2 border-[#002D62] dark:border-sky-400 rounded-2xl shadow-[6px_6px_0px_0px_#002D62] dark:shadow-[6px_6px_0px_0px_#38bdf8] overflow-hidden z-50 flex flex-col`}
          >
            {/* Header */}
            <div className="p-4 border-b-2 border-[#002D62]/10 dark:border-sky-500/20 bg-[#002D62]/5 dark:bg-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#002D62] dark:text-sky-400 stroke-[2.5]" />
                <h3 className="text-sm font-black text-[#002D62] dark:text-slate-100 uppercase tracking-wider">
                  {isRTL ? 'إشعارات النظام' : 'System Notifications'}
                </h3>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Generate test notification */}
                <button
                  onClick={handleAddSampleNotification}
                  className="p-1.5 bg-indigo-50 dark:bg-sky-500/10 hover:bg-indigo-100 text-indigo-700 dark:text-sky-400 border border-indigo-200 dark:border-sky-400/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                  title={isRTL ? 'إشهار تجريبي سريع' : 'Quick Demo Notif'}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isRTL ? 'تجربة' : 'Demo'}</span>
                </button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-[#002D62]/10 dark:border-sky-500/10 flex items-center justify-between text-xs">
                <button 
                  onClick={markAllRead}
                  className="text-[#002D62] dark:text-sky-400 font-extrabold hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {isRTL ? 'تعيين الكل كمقروء' : 'Mark all read'}
                </button>

                <button 
                  onClick={clearAll}
                  className="text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isRTL ? 'حذف الكل' : 'Clear all'}
                </button>
              </div>
            )}

            {/* Content body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 max-h-[340px] bg-slate-50/50 dark:bg-slate-950/40">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-[#002D62]/20 border-t-[#002D62] dark:border-sky-400/20 dark:border-t-sky-400 rounded-full animate-spin mb-3"></div>
                  <span className="text-xs font-semibold">{isRTL ? 'جاري تحميل الإشعارات...' : 'Loading Notifications...'}</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-700">
                    <Inbox className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'صندوق الوارد فارغ' : 'Inbox is empty'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-[240px]">
                    {isRTL 
                      ? 'لا توجد إشعارات معلقة حالياً. انقر على زر تجربة لتوليد إشعار فوري!' 
                      : 'You have no pending notifications. Click the Demo button to generate one instantly!'}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => {
                    const isRead = notif.read;
                    const typeColors = {
                      success: {
                        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                        border: 'border-emerald-200 dark:border-emerald-500/20',
                        icon: 'text-emerald-600 dark:text-emerald-400',
                        dot: 'bg-emerald-500'
                      },
                      warning: {
                        bg: 'bg-amber-50 dark:bg-amber-500/10',
                        border: 'border-amber-200 dark:border-amber-500/20',
                        icon: 'text-amber-600 dark:text-amber-400',
                        dot: 'bg-amber-500'
                      },
                      error: {
                        bg: 'bg-rose-50 dark:bg-rose-500/10',
                        border: 'border-rose-200 dark:border-rose-500/20',
                        icon: 'text-rose-600 dark:text-rose-400',
                        dot: 'bg-rose-500'
                      },
                      info: {
                        bg: 'bg-indigo-50 dark:bg-sky-500/10',
                        border: 'border-indigo-100 dark:border-sky-500/20',
                        icon: 'text-indigo-600 dark:text-sky-400',
                        dot: 'bg-sky-500'
                      }
                    }[notif.type || 'info'];

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, margin: 0, padding: 0 }}
                        className={`p-3 rounded-xl border-2 ${typeColors.border} ${typeColors.bg} transition-all relative flex gap-3 group/item ${
                          isRead ? 'opacity-70 saturate-75' : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]'
                        }`}
                      >
                        {/* Status indicators */}
                        <div className="flex flex-col items-center mt-0.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${typeColors.dot} ${!isRead && 'animate-pulse'} mb-1`}></div>
                          <div className={`p-1 rounded-lg bg-white dark:bg-slate-900 border border-[#002D62]/10 dark:border-slate-800`}>
                            {notif.type === 'success' && <Check className={`w-3.5 h-3.5 ${typeColors.icon}`} />}
                            {notif.type === 'warning' && <AlertCircle className={`w-3.5 h-3.5 ${typeColors.icon}`} />}
                            {notif.type === 'error' && <X className={`w-3.5 h-3.5 ${typeColors.icon}`} />}
                            {notif.type === 'info' && <Info className={`w-3.5 h-3.5 ${typeColors.icon}`} />}
                          </div>
                        </div>

                        {/* Title & Message details */}
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-[11px] font-black text-[#002D62] dark:text-slate-100 truncate leading-tight uppercase tracking-wide">
                              {notif.title}
                            </h4>
                            <span className="text-[9px] text-[#002D62]/40 dark:text-slate-400 font-mono shrink-0">
                              {formatTimestamp(notif.createdAt)}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-normal line-clamp-2">
                            {notif.message}
                          </p>
                        </div>

                        {/* Dropdown action controls */}
                        <div className="absolute top-2.5 right-2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          {!isRead && (
                            <button
                              onClick={() => markAsRead(notif.id || '')}
                              className="p-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#002D62] dark:text-sky-400 border border-[#002D62]/25 dark:border-sky-400/30 rounded-lg transition-colors"
                              title={isRTL ? 'تعيين كمقروء' : 'Mark read'}
                            >
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id || '')}
                            className="p-1 bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-slate-800 dark:hover:bg-rose-500/20 rounded-lg transition-colors"
                            title={isRTL ? 'حذف الإشعار' : 'Delete'}
                          >
                            <Trash2 className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t-2 border-[#002D62]/10 dark:border-sky-500/15 text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#002D62]/55 dark:text-sky-400/60 leading-none">
                Hossam Elwardany HR Notification Service
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility function to format relative times nicely in Arabic or English
function formatTimestamp(isoString: string): string {
  try {
    const elapsed = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(elapsed / 60000);
    const hrs = Math.floor(mins / 60);

    // Is current html document set to Arabic RTL
    const isAr = document.documentElement.dir === 'rtl';

    if (mins < 1) return isAr ? 'الآن' : 'Just now';
    if (mins < 60) return isAr ? `قبل ${mins} د` : `${mins}m ago`;
    if (hrs < 24) return isAr ? `قبل ${hrs} س` : `${hrs}h ago`;
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Date(isoString).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', options);
  } catch (err) {
    return '';
  }
}
