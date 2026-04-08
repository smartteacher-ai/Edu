import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { FileText, Trash2, Plus, Clock, ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../lib/i18n';

export default function ContentList() {
  const { contents, deleteContent, language } = useStore();
  const t = useTranslation(language);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContents = useMemo(() => {
    if (!searchQuery.trim()) return contents;
    const lowerQuery = searchQuery.toLowerCase();
    return contents.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.rawText.toLowerCase().includes(lowerQuery)
    );
  }, [contents, searchQuery]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('myContent')}</h1>
          <p className="text-gray-500 mt-1">{language === 'ar' ? 'إدارة ملفاتك المرفوعة والنصوص الخام.' : 'Manage your uploaded files and raw text.'}</p>
        </div>
        <Link 
          to="/content/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          {t('uploadNew')}
        </Link>
      </div>

      {/* Search Bar */}
      {contents.length > 0 && (
        <div className="relative">
          <div className={language === 'ar' ? "absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none" : "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"}>
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={language === 'ar' ? "block w-full pr-10 pl-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow shadow-sm" : "block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow shadow-sm"}
          />
        </div>
      )}

      {contents.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 md:p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noContentYet')}</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">{language === 'ar' ? 'ارفع مستنداً أو الصق بعض النص للبدء في توليد المواد التعليمية.' : 'Upload a document or paste some text to start generating educational materials.'}</p>
          <Link 
            to="/content/new" 
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            {language === 'ar' ? 'ارفع ملفك الأول' : 'Upload your first file'} &rarr;
          </Link>
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-500">{t('noContentFound')}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filteredContents.map((item) => (
              <li key={item.id} className="hover:bg-gray-50 transition-colors group">
                <div className="flex items-center justify-between p-4 sm:px-6">
                  <Link to={`/content/${item.id}`} className="flex-1 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs md:text-sm text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                          {item.type}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(item.extractedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className={language === 'ar' ? "flex items-center gap-2 md:gap-4 mr-4 shrink-0" : "flex items-center gap-2 md:gap-4 ml-4 shrink-0"}>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(language === 'ar' ? 'هل أنت متأكد أنك تريد حذف هذا المحتوى؟' : 'Are you sure you want to delete this content?')) {
                          deleteContent(item.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <Link to={`/content/${item.id}`} className="p-2 text-gray-400 group-hover:text-indigo-600 transition-colors hidden md:block">
                      <ChevronRight className={language === 'ar' ? "w-5 h-5 rotate-180" : "w-5 h-5"} />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
