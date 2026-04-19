import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { useTranslation } from '../lib/i18n';
import { Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  action: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const { language } = useStore();
  const t = useTranslation(language);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'activity_logs'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const fetchedLogs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ActivityLog[];
        setLogs(fetchedLogs);
      } catch (err) {
        console.error('Error fetching activity logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold dark:text-gray-100">{language === 'ar' ? 'سجل النشاط' : 'Activity Log'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'ar' ? 'اعرض أنشطتك الأخيرة داخل التطبيق.' : 'View your recent activities within the application.'}
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {language === 'ar' ? 'لا توجد نشاطات مسجلة بعد.' : 'No activities logged yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{log.action}</p>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <pre className="text-xs text-gray-500 dark:text-gray-400 mt-2 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
