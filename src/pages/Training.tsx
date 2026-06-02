import React, { useState } from 'react';
import {
  PlayCircle,
  Clock,
  Search,
  Plus,
  Star,
  ArrowRight,
  GraduationCap,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

type Course = {
  id: number;
  title: string;
  duration: string;
  status: string;
  students: number;
  rating: number;
  youtubeUrl: string;
};

const defaultCourses: Course[] = [
  {
    id: 1,
    title: 'Strategic Leadership 2024',
    duration: '12 weeks',
    status: 'In Progress',
    students: 45,
    rating: 4.9,
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
  },
  {
    id: 2,
    title: 'Advanced Data Visualisation',
    duration: '4 weeks',
    status: 'Scheduled',
    students: 120,
    rating: 4.7,
    youtubeUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  },
  {
    id: 3,
    title: 'Soft Skills & Communication',
    duration: '2 weeks',
    status: 'Completed',
    students: 85,
    rating: 4.8,
    youtubeUrl: 'https://www.youtube.com/watch?v=5MgBikgcWnY',
  },
  {
    id: 4,
    title: 'Project Management Pro',
    duration: '8 weeks',
    status: 'In Progress',
    students: 30,
    rating: 4.6,
    youtubeUrl: 'https://www.youtube.com/watch?v=C0DPdy98e4c',
  },
];

const extractYouTubeId = (url: string) => {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/);
  return match ? match[1] : '';
};

const Training = () => {
  const { isRTL } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>(defaultCourses);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', duration: '', status: 'In Progress', students: '0', rating: '4.5', youtubeUrl: '' });

  const filteredCourses = courses.filter((course) => course.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const openForm = (course: Course | null = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        duration: course.duration,
        status: course.status,
        students: String(course.students),
        rating: String(course.rating),
        youtubeUrl: course.youtubeUrl,
      });
    } else {
      setEditingCourse(null);
      setFormData({ title: '', duration: '', status: 'In Progress', students: '0', rating: '4.5', youtubeUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذه الدورة التدريبية؟' : 'Delete this training course?')) return;
    setCourses((prev) => prev.filter((course) => course.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCourse: Course = {
      id: editingCourse ? editingCourse.id : Math.max(0, ...courses.map((course) => course.id)) + 1,
      title: formData.title,
      duration: formData.duration,
      status: formData.status,
      students: Number(formData.students) || 0,
      rating: Number(formData.rating) || 0,
      youtubeUrl: formData.youtubeUrl,
    };

    if (editingCourse) {
      setCourses((prev) => prev.map((course) => (course.id === editingCourse.id ? newCourse : course)));
    } else {
      setCourses((prev) => [newCourse, ...prev]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'التدريب والتطوير المهني' : 'Learning & Development'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {isRTL ? 'عرض دورات اليوتيوب مع إمكانية التعديل والحذف' : 'Browse YouTube courses with edit and delete functionality'}
          </p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          <span>{isRTL ? 'إضافة دورة' : 'Add Course'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: isRTL ? 'إجمالي الدورات' : 'Total Courses', value: courses.length, color: 'text-indigo-600' },
          { label: isRTL ? 'دورات نشطة' : 'Active Courses', value: courses.filter((course) => course.status === 'In Progress').length, color: 'text-emerald-600' },
          { label: isRTL ? 'قيد الجدولة' : 'Scheduled', value: courses.filter((course) => course.status === 'Scheduled').length, color: 'text-amber-600' },
        ].map((stat, index) => (
          <div key={index} className="bg-white/60 backdrop-blur-xl p-6 rounded-5xl border border-white/80 shadow-2xl shadow-indigo-100/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
              <div className={`text-3xl font-black ${stat.color} italic`}>{stat.value}</div>
            </div>
            <GraduationCap className={`w-8 h-8 ${stat.color}`} />
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-6xl border border-white/80 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="p-8 border-b border-white/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isRTL ? 'ابحث عن دورة تدريبية...' : 'Search for a course...'}
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/80 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-black uppercase tracking-widest text-slate-500">
            {isRTL ? 'دورات يمكنك تشغيلها من اليوتيوب مباشرة' : 'Courses you can play directly from YouTube'}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-8">
          {filteredCourses.map((course) => {
            const videoId = extractYouTubeId(course.youtubeUrl);
            const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';
            return (
              <div key={course.id} className="group bg-white rounded-5xl border border-slate-200 shadow-xl shadow-indigo-100/20 overflow-hidden">
                <div className="relative">
                  {embedUrl ? (
                    <div className="relative aspect-video bg-slate-900">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`${embedUrl}?rel=0&modestbranding=1`}
                        title={course.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-950 flex items-center justify-center text-white text-lg font-black">{isRTL ? 'رابط يوتيوب غير صالح' : 'Invalid YouTube link'}</div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    {course.status}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{course.title}</h3>
                      <p className="text-sm text-slate-500 mt-2">{course.duration}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openForm(course)} className="p-2 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all" title={isRTL ? 'تعديل الدورة' : 'Edit course'}>
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(course.id)} className="p-2 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all" title={isRTL ? 'حذف الدورة' : 'Delete course'}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500 font-black">
                    <span>{course.students} {isRTL ? 'مشترك' : 'Learners'}</span>
                    <span className="px-3 py-2 bg-slate-100 rounded-full">{course.rating} ★</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-slate-500 text-sm">{isRTL ? 'رابط يوتيوب:' : 'YouTube link:'}</span>
                    <a href={course.youtubeUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">
                      {isRTL ? 'فتح في اليوتيوب' : 'Open on YouTube'}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-5xl bg-white shadow-2xl p-8 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-all">
              <X className="w-5 h-5 text-slate-700" />
            </button>
            <h2 className="text-2xl font-black text-slate-950 mb-4">{editingCourse ? (isRTL ? 'تعديل الدورة' : 'Edit Course') : (isRTL ? 'إضافة دورة جديدة' : 'Add New Course')}</h2>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'اسم الدورة' : 'Course Title'}</span>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'المدة' : 'Duration'}</span>
                  <input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'الحالة' : 'Status'}</span>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <option>In Progress</option>
                    <option>Scheduled</option>
                    <option>Completed</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'عدد المتدربين' : 'Learners'}</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.students}
                    onChange={(e) => setFormData({ ...formData, students: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'التقييم' : 'Rating'}</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{isRTL ? 'رابط اليوتيوب' : 'YouTube URL'}</span>
                  <input
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl hover:bg-indigo-700 transition-all">
                  {editingCourse ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'إضافة الدورة' : 'Add Course')}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-4xl font-bold hover:bg-slate-200 transition-all">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
