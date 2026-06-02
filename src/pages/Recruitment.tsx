import React, { useState } from 'react';
import { 
  Briefcase, Plus, Filter, Search, MoreVertical, 
  Sparkles, Loader2, Wand2, CheckCircle2 
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { analyzeJobDescription } from '../services/geminiService';
import Markdown from 'react-markdown';

const Recruitment = () => {
  const { isRTL } = useUIStore();
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeJobDescription(jobDescription);
      setAnalysis(result || 'No analysis feedback available.');
    } catch (error) {
      setAnalysis('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const mockJobs = [
    { id: '1', title: 'Senior React Developer', dept: 'Engineering', status: 'open', applicants: 45 },
    { id: '2', title: 'HR Specialist', dept: 'HR', status: 'open', applicants: 12 },
    { id: '3', title: 'Marketing Lead', dept: 'Marketing', status: 'closed', applicants: 89 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 tracking-tighter uppercase italic">
            {isRTL ? 'التوظيف و ATS' : 'Talent Command'}
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            {isRTL ? 'إدارة الوظائف الشاغرة وطلبات التقديم' : 'Global recruitment engine and candidate pipeline'}
          </p>
        </div>

        <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-4xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          <span className="font-bold">{isRTL ? 'نشر وظيفة جديدة' : 'Post New Opening'}</span>
        </button>
      </div>

      {/* Recruitment Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
         {[
            { label: 'Applied', count: 450, color: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
            { label: 'Screening', count: 120, color: 'bg-blue-50 border-blue-100 text-blue-600' },
            { label: 'Interview', count: 45, color: 'bg-amber-50 border-amber-100 text-amber-600' },
            { label: 'Offered', count: 12, color: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
            { label: 'Hired', count: 8, color: 'bg-teal-50 border-teal-100 text-teal-600' }
         ].map((stage, i) => (
            <div key={i} className={`p-6 rounded-4xl border ${stage.color} flex flex-col items-center justify-center text-center transition-transform hover:translate-y-[-4px] cursor-pointer`}>
               <span className="text-[10px] font-black uppercase tracking-widest mb-1">{stage.label}</span>
               <span className="text-3xl font-black italic tracking-tighter">{stage.count}</span>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Jobs List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 p-8 shadow-2xl shadow-indigo-200/20">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{isRTL ? 'الوظائف النشطة' : 'Active Job Openings'}</h3>
            <div className="space-y-4">
              {mockJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-white/50 border border-white/80 rounded-2xl transition-all hover:bg-white/80 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                      {job.title.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{job.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{job.dept} • {job.applicants} {isRTL ? 'متقدم' : 'Applicants'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      job.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {job.status}
                    </span>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Job Description Enhancer */}
        <div className="lg:col-span-1">
          <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-5xl p-8 text-white shadow-2xl shadow-indigo-200/40 relative overflow-hidden h-full">
            <div className="relative z-10 space-y-6 flex flex-col h-full">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-lg font-bold">{isRTL ? 'مساعد صياغة الوظائف' : 'Job Post Enhancer'}</h3>
              </div>
              <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                {isRTL ? 'الصق وصف وظيفتك هنا وسيقوم الذكاء الاصطناعي بمراجعته' : 'Paste your job description and let AI optimize it for clarity and impact.'}
              </p>
              
              <div className="relative">
                <textarea
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30 h-48 resize-none transition-all"
                  placeholder={isRTL ? 'الصق وصف الوظيفة هنا...' : 'Paste job description here...'}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                ></textarea>
                {jobDescription && (
                  <button 
                    onClick={() => { setJobDescription(''); setAnalysis(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-white/60 transition-colors"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !jobDescription}
                className="w-full py-4 bg-white text-indigo-700 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all disabled:opacity-50 shadow-xl shadow-black/10"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span>{isRTL ? 'تحليل ذكي بالذكاء الاصطناعي' : 'AI Analysis & Suggestions'}</span>
              </button>

              {analysis && (
                <div className="bg-white/10 border border-white/20 rounded-2xl p-5 text-sm overflow-y-auto max-h-[32rem] custom-scrollbar animate-in fade-in slide-in-from-top-4 duration-500">
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2 text-indigo-100 font-black uppercase tracking-widest text-[10px]">
                       <CheckCircle2 className="w-3 h-3" /> {isRTL ? 'توصيات الجودة' : 'Quality Recommendations'}
                     </div>
                     <button 
                       onClick={() => navigator.clipboard.writeText(analysis)}
                       className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md font-bold uppercase tracking-wider"
                     >
                       {isRTL ? 'نسخ' : 'Copy'}
                     </button>
                   </div>
                   <div className="prose prose-invert prose-sm text-indigo-50 max-w-none">
                     <Markdown>{analysis}</Markdown>
                   </div>
                </div>
              )}
            </div>
            
            {/* Decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recruitment;
