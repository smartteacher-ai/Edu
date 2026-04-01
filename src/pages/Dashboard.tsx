import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileUp, FileOutput, BrainCircuit, Plus } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const { contents, outputs } = useStore();

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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back to EduGenius AI.</p>
        </div>
        <Link 
          to="/content/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Upload
        </Link>
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
