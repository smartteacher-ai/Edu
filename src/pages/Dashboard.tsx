import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileUp, FileOutput, BrainCircuit, Plus, Info, Languages } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const { contents, outputs } = useStore();
  const [aboutLang, setAboutLang] = useState<'en' | 'ar'>('ar');

  const totalUploads = contents.length;
  const totalLessons = outputs.filter(o => o.type === 'LessonPlan').length;
  const totalQuizzes = outputs.filter(o => o.type === 'Quiz').length;

  // Generate chart data for last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const displayDate = format(d, 'MMM dd');
    
    const count = outputs.filter(o => o.createdAt.startsWith(dateStr)).length;
    return { name: displayDate, generations: count };
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back to EduGenius AI.</p>
        </div>
        <Link 
          to="/content/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          New Upload
        </Link>
      </div>

      {/* About App Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button 
            onClick={() => setAboutLang(aboutLang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors shadow-sm"
          >
            <Languages className="w-4 h-4" />
            {aboutLang === 'en' ? 'عربي' : 'English'}
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {aboutLang === 'en' ? 'About EduGenius AI' : 'نبذة عن التطبيق (EduGenius AI)'}
          </h2>
        </div>

        {aboutLang === 'en' ? (
          <div className="space-y-3 text-gray-700 text-sm md:text-base leading-relaxed">
            <p><strong>EduGenius AI</strong> is your ultimate educational content synthesizer, designed to help educators, trainers, and students save time and enhance learning.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Upload:</strong> Support for large files up to 500MB including Audio recordings, PDFs, Word documents, and raw text.</li>
              <li><strong>Extract:</strong> Automatically transcribe and extract text with high accuracy. Fully supports complex Arabic texts, including Quranic verses with diacritics (Tashkeel) and colloquial dialects.</li>
              <li><strong>Generate:</strong> Transform your raw text into structured Lesson Plans, Summaries, Quizzes, and full Course Outlines in multiple languages.</li>
              <li><strong>Export:</strong> Print your generated materials directly or export them to Markdown for easy sharing and formatting.</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3 text-gray-700 text-sm md:text-base leading-relaxed" dir="rtl">
            <p><strong>EduGenius AI</strong> هو مساعدك الذكي لتلخيص وصناعة المحتوى التعليمي، أو تفريغ محاضرات صوتية وتحويلها إلى نص مكتوب وطباعته، التطبيق مصمم لمساعدة المعلمين والمدربين والطلاب على توفير الوقت وتحسين جودة التعليم.</p>
            <ul className="list-disc pr-5 space-y-1">
              <li><strong>الرفع:</strong> يدعم رفع الملفات الكبيرة حتى 500 ميجابايت، بما في ذلك التسجيلات الصوتية، ملفات PDF، مستندات Word، والنصوص.</li>
              <li><strong>الاستخراج:</strong> تفريغ واستخراج النصوص بدقة متناهية. يدعم اللغة العربية بشكل كامل، الفصحى، والعامية.</li>
              <li><strong>التوليد:</strong> حوّل نصوصك الخام إلى خطط دروس منظمة، ملخصات، اختبارات، ومسارات تدريبية كاملة بلغات متعددة.</li>
              <li><strong>التصدير:</strong> يمكنك طباعة المحتوى المولد مباشرة أو تصديره كملف نصي (Markdown) لمشاركته وتنسيقه بسهولة.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Files</p>
            <p className="text-2xl font-bold text-gray-900">{totalUploads}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Lessons Generated</p>
            <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-lg">
            <FileOutput className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Quizzes Created</p>
            <p className="text-2xl font-bold text-gray-900">{totalQuizzes}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Generations (Last 7 Days)</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="generations" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
