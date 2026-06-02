import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Bot } from 'lucide-react';
import { generateHRAdvice } from '../services/geminiService';
import { useUIStore } from '../store/uiStore';
import Markdown from 'react-markdown';

const AIAssistant = () => {
  const { isRTL } = useUIStore();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResponse(null);
    try {
      const result = await generateHRAdvice(input);
      setResponse(result || 'No advice found.');
    } catch (error) {
      setResponse(isRTL ? 'عذراً، حدث خطأ أثناء الاتصال بالخادم الذكي. يرجى المحاولة لاحقاً.' : 'Sorry, I encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="td-card p-8 bg-white dark:bg-slate-900/80 text-[#002D62] dark:text-slate-100">
      <div className="flex items-center gap-3.5 mb-6 pb-4 border-b-2 border-[#002D62]/10 dark:border-sky-500/15">
        <div className="p-3 bg-[#002D62] dark:bg-sky-400 rounded-2xl text-white dark:text-slate-950 shadow-[2px_2px_0px_0px_#1e3a8a] dark:shadow-[2px_2px_0px_0px_#0284c7]">
          <Sparkles className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h3 className="text-md font-black tracking-tight leading-none text-[#002D62] dark:text-slate-50">
            {isRTL ? 'مستشار الموارد البشرية الذكي' : 'Strategic Engine Co-Pilot'}
          </h3>
          <p className="text-[8px] text-[#002D62]/60 dark:text-slate-400 font-black uppercase tracking-widest mt-1">
            {isRTL ? 'مدعوم بنظام غيميني الأصلي' : 'Powered by Gemini AI Enterprise'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {response && (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-2 border-[#002D62]/12 dark:border-sky-500/20 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,45,98,0.05)] dark:shadow-[3px_3px_0px_0px_rgba(56,189,248,0.05)] animate-in fade-in slide-in-from-bottom-2">
            <div className="flex gap-3">
              <Bot className="w-5 h-5 text-[#002D62] dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-[#002D62]/95 dark:text-slate-200 leading-relaxed prose prose-indigo dark:prose-invert max-w-none">
                <Markdown>{response}</Markdown>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleAsk} className="relative mt-2">
          <input
            type="text"
            className={`w-full td-input py-4 text-xs font-semibold ${isRTL ? 'pr-5 pl-14' : 'pl-5 pr-14'}`}
            placeholder={isRTL ? 'اسأل عن سياسات التوظيف، لوائح العمل، ميزانية الرواتب...' : 'Ask about HR policy templates, recruitment tips, active roster insights...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-2.5 bg-[#002D62] dark:bg-sky-400 text-white dark:text-slate-950 rounded-xl hover:bg-[#1e3a8a] dark:hover:bg-sky-300 transition-all shadow-[2px_2px_0px_0px_#1e3a8a] dark:shadow-[2px_2px_0px_0px_#0284c7] active:translate-y-0 active:translate-x-0 disabled:opacity-50 cursor-pointer`}
          >
            {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className={`w-4.5 h-4.5 stroke-[2.5] ${isRTL ? 'rotate-180' : ''}`} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
