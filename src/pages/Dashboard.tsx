import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useStore, ContentSource, EducationalOutput } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileUp, FileOutput, BrainCircuit, Plus, Info, Star } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Dashboard() {
  const { language } = useStore();
  const { profile, user } = useAuth();
  const t = useTranslation(language);

  const [contents, setContents] = useState<ContentSource[]>([]);
  const [outputs, setOutputs] = useState<EducationalOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let pending = 2;
    const checkDone = () => {
      pending -= 1;
      if (pending === 0) setLoading(false);
    };

    const q1 = query(collection(db, 'contents'), where('userId', '==', user.uid));
    const unsub1 = onSnapshot(q1, (snap) => {
      const data: ContentSource[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as ContentSource));
      setContents(data);
      checkDone();
    });

    const q2 = query(collection(db, 'outputs'), where('userId', '==', user.uid));
    const unsub2 = onSnapshot(q2, (snap) => {
      const data: EducationalOutput[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as EducationalOutput));
      setOutputs(data);
      checkDone();
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
        </div>
        <div className="h-72 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {language === 'ar' ? `مرحباً، ${profile?.displayName?.split(' ')[0] || 'مبدع'}` : `Welcome back, ${profile?.displayName?.split(' ')[0] || 'Creator'}`}
          </h1>
          <p className="text-gray-500 mt-1">Here's an overview of your course creation progress.</p>
        </div>
        <Link 
          to="/app/content/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          {t('uploadNew')}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t('totalUploads')}</p>
            <p className="text-3xl font-bold text-gray-900">{totalUploads}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'الدروس المولدة' : 'Lessons Generated'}</p>
            <p className="text-3xl font-bold text-gray-900">{totalLessons}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <FileOutput className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'الاختبارات المنشأة' : 'Quizzes Created'}</p>
            <p className="text-3xl font-bold text-gray-900">{totalQuizzes}</p>
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      {(contents.some(c => c.isFavorite) || outputs.some(o => o.isFavorite)) && (
        <div className="bg-white p-8 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 relative">
             <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
             {language === 'ar' ? 'المفضلة' : 'Favorites'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
             {contents.filter(c => c.isFavorite).map(c => (
               <Link key={`c-${c.id}`} to={`/app/content/${c.id}`} className="group block border border-gray-100 p-4 rounded-xl hover:border-amber-200 hover:shadow-md transition-all bg-white">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                     <FileUp className="w-5 h-5" />
                   </div>
                   <div className="min-w-0">
                     <h3 className="font-bold text-gray-900 truncate">{c.title}</h3>
                     <p className="text-xs text-gray-500 mt-0.5">{language === 'ar' ? 'المصدر الأولي' : 'Source'} • {c.type}</p>
                   </div>
                 </div>
               </Link>
             ))}
             {outputs.filter(o => o.isFavorite).map(o => (
               <Link key={`o-${o.id}`} to={`/app/content/${o.sourceId}`} className="group block border border-gray-100 p-4 rounded-xl hover:border-amber-200 hover:shadow-md transition-all bg-white">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                     <BrainCircuit className="w-5 h-5" />
                   </div>
                   <div className="min-w-0">
                     <h3 className="font-bold text-gray-900 truncate">{contents.find(c => c.id === o.sourceId)?.title || 'Content'} ({o.type})</h3>
                     <p className="text-xs text-gray-500 mt-0.5">{language === 'ar' ? 'محتوى مولد' : 'Generated'} • {format(new Date(o.createdAt), 'MMM d, yyyy')}</p>
                   </div>
                 </div>
               </Link>
             ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{language === 'ar' ? 'عمليات التوليد (آخر 7 أيام)' : 'Output Generated (Last 7 Days)'}</h2>
        <div className="h-72 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="generations" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Mini banner */}
      {profile?.plan === 'free' && (
         <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
             <h3 className="text-xl font-bold mb-2">Ready to scale your production?</h3>
             <p className="text-indigo-200">Upgrade to Pro for unlimited course generation and priority processing.</p>
           </div>
           <Link to="/pricing" className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shrink-0">
             Upgrade to Pro
           </Link>
         </div>
      )}
    </div>
  );
}
