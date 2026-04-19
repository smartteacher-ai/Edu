import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore, ContentSource } from '../store/useStore';
import { FileText, Trash2, Plus, Clock, ChevronRight, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../lib/i18n';
import { deleteContentFromDB } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const ITEMS_PER_PAGE = 20;

export default function ContentList() {
  const { language } = useStore();
  const { user } = useAuth();
  const t = useTranslation(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [contents, setContents] = useState<ContentSource[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive all available tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contents.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [contents]);

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1); // reset page on filter change
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'contents'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data: ContentSource[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as ContentSource));
      setContents(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد أنك تريد حذف هذا المحتوى؟' : 'Are you sure you want to delete this content?')) {
      setDeletingId(id);
      try {
        await deleteContentFromDB(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredContents = useMemo(() => {
    let result = contents.filter(item => {
      const matchesSearch = !searchQuery.trim() || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.rawText.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => item.tags?.includes(tag));
      
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && new Date(item.extractedAt) >= new Date(dateFrom);
      }
      if (dateTo) {
        const toD = new Date(dateTo);
        toD.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(item.extractedAt) <= toD;
      }

      return matchesSearch && matchesType && matchesTags && matchesDate;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'title_asc') return a.title.localeCompare(b.title);
      if (sortOrder === 'title_desc') return b.title.localeCompare(a.title);
      if (sortOrder === 'date_asc') return new Date(a.extractedAt).getTime() - new Date(b.extractedAt).getTime();
      return new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime(); // date_desc
    });

    return result;
  }, [contents, searchQuery, typeFilter, dateFrom, dateTo, selectedTags, sortOrder]);

  const paginatedContents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredContents, currentPage]);

  const totalPages = Math.ceil(filteredContents.length / ITEMS_PER_PAGE);

  // Reset pagination if search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
        <div className="h-20 bg-gray-200 rounded-xl"></div>
        <div className="h-96 bg-gray-200 rounded-xl shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('myContent')}</h1>
          <p className="text-gray-500 mt-1">{language === 'ar' ? 'إدارة ملفاتك المرفوعة والنصوص الخام.' : 'Manage your uploaded files and raw text.'}</p>
        </div>
        <Link 
          to="/app/content/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          {t('uploadNew')}
        </Link>
      </div>

      {/* Search and Filters */}
      {contents.length > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <div className={language === 'ar' ? "absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none" : "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"}>
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('searchPlaceholder') || "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={language === 'ar' ? "block w-full pr-10 pl-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow shadow-sm" : "block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow shadow-sm"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{language === 'ar' ? 'النوع' : 'Type'}</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                <option value="All">{language === 'ar' ? 'الكل' : 'All'}</option>
                <option value="Text">Text</option>
                <option value="Audio">Audio</option>
                <option value="PDF">PDF</option>
                <option value="Word">Word</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{language === 'ar' ? 'الترتيب' : 'Sort By'}</label>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                <option value="date_desc">{language === 'ar' ? 'الأحدث أولاً' : 'Newest First'}</option>
                <option value="date_asc">{language === 'ar' ? 'الأقدم أولاً' : 'Oldest First'}</option>
                <option value="title_asc">{language === 'ar' ? 'العنوان (أ-ي)' : 'Title (A-Z)'}</option>
                <option value="title_desc">{language === 'ar' ? 'العنوان (ي-أ)' : 'Title (Z-A)'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{language === 'ar' ? 'من تاريخ' : 'Date From'}</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{language === 'ar' ? 'إلى تاريخ' : 'Date To'}</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full text-sm border-gray-300 rounded-lg p-2 border focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            {allTags.length > 0 && (
              <div className="md:col-span-5 pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-gray-500 py-1.5">{language === 'ar' ? 'تصفية بالوسوم:' : 'Filter by Tags:'}</span>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      selectedTags.includes(tag) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
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
            to="/app/content/new" 
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            {language === 'ar' ? 'ارفع ملفك الأول' : 'Upload your first file'} &rarr;
          </Link>
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-500">{t('noContentFound') || "No content found."}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <ul className="space-y-2">
            {paginatedContents.map((item) => (
              <li key={item.id} className="bg-white hover:bg-gray-50 hover:scale-[1.01] transition-all group relative rounded-xl border border-gray-100 shadow-sm hover:shadow-md z-0 hover:z-10">
                {/* TOOLTIP */}
                <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 left-1/2 -translate-x-1/2 bottom-[90%] mb-2 w-72 bg-gray-900 text-white text-xs rounded-xl p-4 shadow-xl pointer-events-none">
                  <p className="line-clamp-4 leading-relaxed font-mono">{item.rawText}</p>
                  <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                </div>

                <div className="flex items-center justify-between p-4 sm:px-6">
                  <Link to={`/app/content/${item.id}`} className="flex-1 flex items-center gap-4">
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
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1 ml-2">
                             {item.tags.slice(0,2).map(t => <span key={t} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{t}</span>)}
                             {item.tags.length > 2 && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">+{item.tags.length - 2}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className={language === 'ar' ? "flex items-center gap-2 md:gap-4 mr-4 shrink-0" : "flex items-center gap-2 md:gap-4 ml-4 shrink-0"}>
                    <button 
                      disabled={deletingId === item.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(item.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title={t('delete')}
                    >
                      {deletingId === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                    <Link to={`/app/content/${item.id}`} className="p-2 text-gray-400 group-hover:text-indigo-600 transition-colors hidden md:block">
                      <ChevronRight className={language === 'ar' ? "w-5 h-5 rotate-180" : "w-5 h-5"} />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 p-4">
               {Array.from({ length: totalPages }).map((_, i) => (
                 <button
                   key={i}
                   onClick={() => setCurrentPage(i + 1)}
                   className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                     currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                   }`}
                 >
                   {i + 1}
                 </button>
               ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
