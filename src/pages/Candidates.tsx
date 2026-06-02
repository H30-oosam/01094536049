import React, { useState } from 'react';
import { 
  UserPlus, Search, Filter, MoreVertical, Mail, Phone, 
  FileText, CheckCircle2, X, Briefcase, Calendar, 
  GraduationCap, User, MessageSquare, History, ExternalLink
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';

interface Candidate {
  id: string;
  name: string;
  role: string;
  status: string;
  score: number;
  applied: string;
  email: string;
  phone: string;
  avatar?: string;
  bio: string;
  experience: { company: string; role: string; period: string }[];
  education: { school: string; degree: string; year: string }[];
  notes: { date: string; author: string; content: string }[];
  history: { action: string; date: string }[];
}

const Candidates = () => {
  const { isRTL } = useUIStore();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const [candidates, setCandidates] = useState<Candidate[]>([
    { 
      id: '1', 
      name: 'Alice Freeman', 
      role: 'Fullstack Developer', 
      status: 'interview', 
      score: 88, 
      applied: '2 days ago',
      email: 'alice.f@example.com',
      phone: '+1 234 567 890',
      bio: 'Enthusiastic full-stack developer with 5 years of experience in React and Node.js. Passionate about building scalable web applications and improving team productivity.',
      experience: [
        { company: 'TechFlow', role: 'Senior Developer', period: '2021 - Present' },
        { company: 'WebCrafters', role: 'Fullstack Dev', period: '2018 - 2021' }
      ],
      education: [
        { school: 'MIT', degree: 'B.S. in Computer Science', year: '2018' }
      ],
      notes: [
        { date: '2024-05-10', author: 'HR Manager', content: 'Strong technical background, very communicative.' },
        { date: '2024-05-12', author: 'Lead Architect', content: 'Impressive system design skills during the whiteboard session.' }
      ],
      history: [
        { action: 'Applied', date: '2024-05-01' },
        { action: 'Phone Screen Passed', date: '2024-05-04' },
        { action: 'Technical Interview Scheduled', date: '2024-05-08' }
      ]
    },
    { 
      id: '2', 
      name: 'Omar Khalid', 
      role: 'UI Designer', 
      status: 'screening', 
      score: 92, 
      applied: '5 days ago',
      email: 'omar.k@example.com',
      phone: '+20 123 456 789',
      bio: 'Creative UI Designer focused on user-centered design and modern aesthetics. Expert in Figma and collaborative design systems.',
      experience: [
        { company: 'PixelPerfect', role: 'UI/UX Designer', period: '2020 - Present' },
        { company: 'Artia Studio', role: 'Junior Designer', period: '2019 - 2020' }
      ],
      education: [
        { school: 'Cairo University', degree: 'Fine Arts', year: '2019' }
      ],
      notes: [
        { date: '2024-05-08', author: 'Design Lead', content: 'Portfolio looks clean and modern. Good understanding of design tokens.' }
      ],
      history: [
        { action: 'Applied', date: '2024-05-08' },
        { action: 'Portfolio Review Passed', date: '2024-05-11' }
      ]
    },
    { 
      id: '3', 
      name: 'Sofia Ross', 
      role: 'DevOps Engineer', 
      status: 'offered', 
      score: 95, 
      applied: '1 week ago',
      email: 'sofia.r@example.com',
      phone: '+44 7700 900000',
      bio: 'Experienced DevOps Engineer specializing in AWS, Kubernetes, and CI/CD automation. Focused on infrastructure as code and system reliability.',
      experience: [
        { company: 'CloudScale', role: 'DevOps Specialist', period: '2019 - Present' },
        { company: 'SecureOps', role: 'Systems Admin', period: '2016 - 2019' }
      ],
      education: [
        { school: 'Stanford', degree: 'M.S. in Cloud Computing', year: '2016' }
      ],
      notes: [
        { date: '2024-05-05', author: 'CTO', content: 'Excellent knowledge of Kubernetes and Terraform. Perfect fit for our scaling needs.' }
      ],
      history: [
        { action: 'Applied', date: '2024-04-25' },
        { action: 'Final Interview Passed', date: '2024-05-04' },
        { action: 'Offer Sent', date: '2024-05-06' }
      ]
    },
  ]);

  const moveStage = (candidateId: string, direction: 'next' | 'prev') => {
    const stages = ['applied', 'screening', 'interview', 'offered', 'hired', 'rejected'];
    const currentCandidate = candidates.find(c => c.id === candidateId);
    if (!currentCandidate) return;
    
    const currentIndex = stages.indexOf(currentCandidate.status);
    let newIndex = currentIndex;
    
    if (direction === 'next' && currentIndex < stages.length - 1) newIndex++;
    if (direction === 'prev' && currentIndex > 0) newIndex--;
    
    const updatedStatus = stages[newIndex];
    setCandidates(candidates.map(c => c.id === candidateId ? { ...c, status: updatedStatus } : c));
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate({ ...selectedCandidate, status: updatedStatus });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'interview': return 'bg-indigo-50 text-indigo-600';
      case 'screening': return 'bg-blue-50 text-blue-600';
      case 'offered': return 'bg-emerald-50 text-emerald-600';
      case 'hired': return 'bg-teal-50 text-teal-600';
      case 'rejected': return 'bg-rose-50 text-rose-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRTL ? 'إدارة المرشحين' : 'Candidate Tracking'}
          </h1>
          <p className="text-gray-500 font-medium">
            {isRTL ? 'تتبع المتقدمين للوظائف ومسار التوظيف' : 'Track job applicants and recruitment pipeline'}
          </p>
        </div>

        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <UserPlus className="w-5 h-5" />
          <span className="font-bold">{isRTL ? 'إضافة مرشح' : 'Add Candidate'}</span>
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-5xl border border-white/80 p-8 shadow-2xl shadow-indigo-200/20 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isRTL ? 'بحث عن مرشح...' : 'Search candidates...'}
              className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-white/80 rounded-xl text-xs font-bold text-slate-600 hover:bg-white/80 transition-all">
              <Filter className="w-4 h-4" /> {isRTL ? 'تصفية' : 'Filters'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {candidates.map(candidate => (
            <div 
              key={candidate.id} 
              onClick={() => setSelectedCandidate(candidate)}
              className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-white/50 border border-white/80 rounded-4xl hover:bg-white transition-all shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-bold text-xl">
                  {candidate.name.charAt(0)}
                </div>
                <div>
                   <h4 className="text-lg font-bold text-gray-900">{candidate.name}</h4>
                   <p className="text-sm text-slate-500 font-medium">{candidate.role}</p>
                </div>
              </div>

              <div className="mt-4 lg:mt-0 flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isRTL ? 'التقييم' : 'Score'}</p>
                  <p className="text-sm font-bold text-indigo-600">{candidate.score}/100</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isRTL ? 'الحالة' : 'Status'}</p>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    candidate.status === 'offered' ? 'bg-emerald-50 text-emerald-600' :
                    candidate.status === 'interview' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {candidate.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* Email action */ }}
                    className="p-2 bg-white rounded-lg border border-slate-100 hover:bg-indigo-50 text-indigo-600 transition-colors shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* Resume/Files action */ }}
                    className="p-2 bg-white rounded-lg border border-slate-100 hover:bg-indigo-50 text-indigo-600 transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* More action */ }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Details Side Panel */}
      {selectedCandidate && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-80"
            onClick={() => setSelectedCandidate(null)}
          ></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-90 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                  {selectedCandidate.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCandidate.name}</h2>
                  <p className="text-sm text-slate-500 font-medium">{selectedCandidate.role}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Profile Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">{isRTL ? 'التقييم' : 'Score'}</p>
                  <p className="text-lg font-black text-indigo-700">{selectedCandidate.score}%</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl">
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">{isRTL ? 'الحالة' : 'Status'}</p>
                  <p className="text-sm font-black text-emerald-700 uppercase">{selectedCandidate.status}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl col-span-2">
                  <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-1">{isRTL ? 'تاريخ التقديم' : 'Applied On'}</p>
                  <p className="text-sm font-black text-amber-700 uppercase">{selectedCandidate.applied}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  {isRTL ? 'معلومات الاتصال' : 'Contact Information'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">{selectedCandidate.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">{selectedCandidate.phone}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  {isRTL ? 'نبذة عن المرشح' : 'About Candidate'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-4xl border border-slate-100">
                  {selectedCandidate.bio}
                </p>
              </div>

              {/* Experience */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  {isRTL ? 'الخبرة العملية' : 'Work Experience'}
                </h3>
                <div className="space-y-3">
                  {selectedCandidate.experience.map((exp, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                      <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{exp.role}</h4>
                        <p className="text-xs text-slate-500 font-medium">{exp.company} • {exp.period}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  {isRTL ? 'التعليم' : 'Education'}
                </h3>
                <div className="space-y-3">
                  {selectedCandidate.education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{selectedCandidate.education[0].degree}</h4>
                        <p className="text-xs text-slate-500 font-medium">{edu.school} • {edu.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interview Notes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    {isRTL ? 'ملاحظات المقابلة' : 'Interview Notes'}
                  </h3>
                  <button className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter hover:underline">
                    {isRTL ? 'إضافة ملاحظة' : 'Add Note'}
                  </button>
                </div>
                <div className="space-y-4">
                  {selectedCandidate.notes.map((note, i) => (
                    <div key={i} className="p-6 bg-indigo-50/50 rounded-4xl border border-indigo-100/50">
                      <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest">
                        <span className="text-indigo-600">{note.author}</span>
                        <span className="text-slate-400">{note.date}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic">"{note.content}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  {isRTL ? 'سجل العمليات' : 'Application History'}
                </h3>
                <div className="relative space-y-6 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  {selectedCandidate.history.map((item, i) => (
                    <div key={i} className="relative flex items-center gap-6 pl-10">
                      <div className="absolute left-0 w-9 h-9 bg-white border-4 border-slate-50 ring-2 ring-slate-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{item.action}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-4 pt-8 border-t">
                <button 
                  onClick={() => moveStage(selectedCandidate.id, 'next')}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-3xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                   {isRTL ? 'تحريك للمرحلة التالية' : 'Move to Next Stage'}
                   <ExternalLink className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedCandidate(null)}
                  className="px-6 py-4 bg-rose-50 text-rose-600 rounded-3xl font-bold hover:bg-rose-100 transition-all"
                >
                   {isRTL ? 'إيقاف التقديم' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Candidates;
