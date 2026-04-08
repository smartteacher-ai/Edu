import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileUp, FileOutput, BrainCircuit, Plus, Info } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useTranslation } from '../lib/i18n';

export default function Dashboard() {
  const { contents, outputs, language } = useStore();
  const t = useTranslation(language);

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
          <p className="text-gray-500 mt-1">{t('welcomeBack')}</p>
        </div>
        <Link 
          to="/content/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          {t('uploadNew')}
        </Link>
      </div>

      {/* About App Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {t('aboutApp')}
          </h2>
        </div>

        <div className="space-y-3 text-gray-700 text-sm md:text-base leading-relaxed">
          <p><strong>EduGenius AI</strong> {t('aboutDesc').replace('EduGenius AI ', '')}</p>
          <p className="font-semibold mt-2">{t('features')}</p>
          <ul className={language === 'ar' ? "list-disc pr-5 space-y-1" : "list-disc pl-5 space-y-1"}>
            <li>{t('featUpload')}</li>
            <li>{t('featExtract')}</li>
            <li>{t('featGenerate')}</li>
            <li>{t('featExport')}</li>
          </ul>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t('totalUploads')}</p>
            <p className="text-2xl font-bold text-gray-900">{totalUploads}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'الدروس المولدة' : 'Lessons Generated'}</p>
            <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-lg">
            <FileOutput className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'الاختبارات المنشأة' : 'Quizzes Created'}</p>
            <p className="text-2xl font-bold text-gray-900">{totalQuizzes}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{language === 'ar' ? 'عمليات التوليد (آخر 7 أيام)' : 'Generations (Last 7 Days)'}</h2>
        <div className="h-72 w-full" dir="ltr">
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
