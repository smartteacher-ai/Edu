import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore, ContentSource, EducationalOutput } from '../store/useStore';
import { generateEducationalContent } from '../services/ai';
import { FileText, Sparkles, Loader2, Download, Trash2, ArrowLeft, KeyRound, Printer, Copy, Check, Share2, Star, Minus, Plus, Type, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useTranslation } from '../lib/i18n';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { saveOutputToDB, deleteOutputFromDB, toggleContentFavoriteDB, toggleOutputFavoriteDB, updateContentTagsDB, updateContentRawTextDB } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

  export default function ContentViewer() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { customApiKey, language, globalFontSize, setGlobalFontSize } = useStore();
    const { user, profile, incrementUsage, canGenerate, logActivity } = useAuth();
    const t = useTranslation(language);
  
  const [content, setContent] = useState<ContentSource | null>(null);
  const [relatedOutputs, setRelatedOutputs] = useState<EducationalOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw' | string>('raw');
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState(language === 'ar' ? 'Arabic' : 'English');
  const [isCopied, setIsCopied] = useState(false);
  
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    
    // Fetch parent content
    const fetchContent = async () => {
      const docRef = doc(db, 'contents', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        setContent({ id: docSnap.id, ...docSnap.data() } as ContentSource);
      } else {
        toast.error('Content not found or access denied');
      }
      setIsLoading(false);
    };
    fetchContent();

    // Listen to outputs
    const q = query(collection(db, 'outputs'), where('sourceId', '==', id), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data: EducationalOutput[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as EducationalOutput));
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRelatedOutputs(data);
    });

    return () => unsub();
  }, [user, id]);

  const handleDeleteOutput = async (outputId: string) => {
     await deleteOutputFromDB(outputId);
     if (activeTab === outputId) setActiveTab('raw');
  };

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;
  }

  if (!content) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{language === 'ar' ? 'المحتوى غير موجود' : 'Content not found'}</h2>
        <Link to="/app/content" className="text-indigo-600 mt-4 inline-block">{language === 'ar' ? 'العودة إلى المحتوى الخاص بي' : 'Back to My Content'}</Link>
      </div>
    );
  }

  const handleGenerate = async (type: 'Summary' | 'LessonPlan' | 'Quiz' | 'CourseOutline') => {
    setError(null);
    
    if (!customApiKey && !canGenerate) {
      const msg = language === 'ar' ? 'لقد وصلت إلى الحد اليومي المسموح به. يرجى الترقية إلى Pro أو إضافة مفتاح API الخاص بك.' : 'You have reached your daily limit. Please upgrade to Pro or add your own API key.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsGenerating(true);
    try {
      // safely get api key
      // @ts-ignore
      const defaultKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '';
      const apiKey = customApiKey || defaultKey;
      
      if (!apiKey) {
        throw new Error(language === 'ar' ? 'مفتاح API مفقود. يرجى إضافته في الإعدادات.' : 'API Key is missing. Please add it in Profile settings.');
      }

      const generatedText = await generateEducationalContent(content.rawText, type, apiKey, targetLang);
      
      if (!customApiKey) {
        const success = await incrementUsage();
         if (!success) throw new Error('Usage limit reached during generation');
      }

      if (!user) throw new Error("Authentication required");

      const newOutputId = crypto.randomUUID();
      const newOutput: EducationalOutput = {
        id: newOutputId,
        sourceId: content.id,
        type,
        content: generatedText,
        createdAt: new Date().toISOString(),
      };
      
      await saveOutputToDB(newOutput, user.uid);
      await logActivity('generated_content', { outputId: newOutput.id, type, sourceId: content.id });
      setActiveTab(newOutput.id);
      toast.success(language === 'ar' ? `تم توليد ${type} بنجاح!` : `${type} generated successfully!`);
    } catch (err: any) {
      console.error("Generation failed:", err);
      const errorMessage = err.message || (language === 'ar' ? 'فشل في توليد المحتوى. يرجى المحاولة مرة أخرى.' : 'Failed to generate content. Please try again.');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (text: string, title: string) => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success(t('copied'));
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error(language === 'ar' ? 'فشل في نسخ النص.' : 'Failed to copy text.');
    }
  };

  const handleShare = async (text: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - CourseCraft AI`,
          text: text,
        });
        toast.success(language === 'ar' ? 'تمت المشاركة بنجاح!' : 'Shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error(language === 'ar' ? 'فشل في المشاركة.' : 'Failed to share.');
        }
      }
    } else {
      handleCopy(text);
      toast.info(language === 'ar' ? 'تم نسخ النص (المشاركة غير مدعومة في متصفحك).' : 'Text copied (Share not supported on your browser).');
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !content) return;
    const currentTags = content.tags || [];
    if (currentTags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }
    const updatedTags = [...currentTags, newTag.trim()];
    setContent(prev => prev ? { ...prev, tags: updatedTags } : prev);
    await updateContentTagsDB(content.id, updatedTags);
    setNewTag('');
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!content) return;
    const updatedTags = (content.tags || []).filter(t => t !== tagToRemove);
    setContent(prev => prev ? { ...prev, tags: updatedTags } : prev);
    await updateContentTagsDB(content.id, updatedTags);
  };

  const activeOutput = relatedOutputs.find(o => o.id === activeTab);

  const toggleSourceFavorite = async () => {
    if (!content) return;
    try {
      await toggleContentFavoriteDB(content.id, !content.isFavorite);
      setContent({ ...content, isFavorite: !content.isFavorite });
    } catch {
      toast.error('Failed to update favorite status');
    }
  };

  const toggleOutputFavorite = async () => {
    if (!activeOutput) return;
    try {
      await toggleOutputFavoriteDB(activeOutput.id, !activeOutput.isFavorite);
    } catch {
      toast.error('Failed to update favorite status');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none">
      <div className="flex items-center gap-3 md:gap-4 mb-2 print:hidden">
        <Link to="/app/content" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 shrink-0">
          <ArrowLeft className={language === 'ar' ? "w-5 h-5 rotate-180" : "w-5 h-5"} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate flex flex-wrap items-center gap-3">
            {content.title}
            <button onClick={toggleSourceFavorite} className={`focus:outline-none transition-colors ${content.isFavorite ? 'text-amber-400 hover:text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}>
              <Star className="w-6 h-6" fill={content.isFavorite ? 'currentColor' : 'none'} />
            </button>
          </h1>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mt-1 flex-wrap">
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">{content.type}</span>
            <span>{language === 'ar' ? 'تم الاستخراج في' : 'Extracted on'} {new Date(content.extractedAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Tag className="w-4 h-4 text-gray-400" />
            {(content.tags || []).map(tag => (
               <span key={tag} className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                 {tag}
                 <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 rounded-full focus:outline-none p-0.5">×</button>
               </span>
            ))}
            <input 
              type="text" 
              placeholder={language === 'ar' ? "إضافة وسم..." : "Add tag..."}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
              className="text-xs bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none w-24 px-1 py-0.5"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3 print:hidden">
          <div className="flex-1 text-sm">{error}</div>
          {error.includes('Pro') || error.includes('API') ? (
            <Link to="/app/profile" className="flex items-center gap-1 text-sm font-medium bg-red-100 px-3 py-1.5 rounded hover:bg-red-200 transition-colors shrink-0">
              <KeyRound className="w-4 h-4" /> {language === 'ar' ? 'الذهاب إلى الملف الشخصي' : 'Go to Profile'}
            </Link>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 print:block">
        {/* Sidebar Actions */}
        <div className="space-y-4 print:hidden">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              {language === 'ar' ? 'التوليد بالذكاء الاصطناعي' : 'AI Generation'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">{t('targetLanguage')}</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700"
              >
                <option value="Arabic">{t('arabic')}</option>
                <option value="English">{t('english')}</option>
                <option value="French">{t('french')}</option>
                <option value="Spanish">{t('spanish')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => handleGenerate('Summary')}
                disabled={isGenerating}
                className={language === 'ar' ? "w-full text-right px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50" : "w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50"}
              >
                {language === 'ar' ? 'توليد ملخص' : 'Generate Summary'}
              </button>
              <button 
                onClick={() => handleGenerate('LessonPlan')}
                disabled={isGenerating}
                className={language === 'ar' ? "w-full text-right px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50" : "w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50"}
              >
                {language === 'ar' ? 'إنشاء خطة درس' : 'Create Lesson Plan'}
              </button>
              <button 
                onClick={() => handleGenerate('Quiz')}
                disabled={isGenerating}
                className={language === 'ar' ? "w-full text-right px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50" : "w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50"}
              >
                {language === 'ar' ? 'توليد اختبار' : 'Generate Quiz'}
              </button>
              <button 
                onClick={() => handleGenerate('CourseOutline')}
                disabled={isGenerating}
                className={language === 'ar' ? "w-full text-right px-4 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50" : "w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50"}
              >
                {language === 'ar' ? 'بناء مسار تدريبي كامل' : 'Build Full Course'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Viewer */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px] md:h-[700px] print:h-auto print:border-none print:shadow-none print:block">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50 print:hidden scrollbar-hide">
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 md:px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'raw' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {t('rawText')}
            </button>
            {relatedOutputs.map(output => (
              <div key={output.id} className="flex items-center group shrink-0">
                <button
                  onClick={() => setActiveTab(output.id)}
                  className={`px-3 md:px-4 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === output.id ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {output.type}
                </button>
                <button 
                  onClick={() => handleDeleteOutput(output.id)}
                  className="px-2 py-4 border-b-2 border-transparent text-gray-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-red-600 transition-all"
                  aria-label={t('delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible relative group/content">
            
            {/* Font Size Controls */}
            <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} hidden md:flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm p-1 opacity-0 group-hover/content:opacity-100 transition-opacity z-10 print:hidden`}>
              <button onClick={() => setGlobalFontSize(Math.max(10, globalFontSize - 2))} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Decrease Font">
                <Minus className="w-4 h-4" />
              </button>
              <Type className="w-4 h-4 text-gray-400" />
              <button onClick={() => setGlobalFontSize(Math.min(30, globalFontSize + 2))} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Increase Font">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isGenerating && (
              <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-gray-500 space-y-4 print:hidden">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="font-bold animate-pulse text-center px-4">{language === 'ar' ? 'جاري توليد المحتوى التعليمي...' : 'Synthesizing educational content...'}</p>
              </div>
            )}
            
            {!isGenerating && activeTab === 'raw' && (
              <div className="prose prose-indigo max-w-none" dir="auto">
                <div className="flex gap-1.5 mb-3 print:hidden">
                  <button onClick={() => document.execCommand('bold', false, '')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm text-gray-700 border border-gray-200 shadow-sm transition-colors">B</button>
                  <button onClick={() => document.execCommand('italic', false, '')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded italic text-sm text-gray-700 border border-gray-200 shadow-sm transition-colors">I</button>
                  <button onClick={() => document.execCommand('underline', false, '')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded underline text-sm text-gray-700 border border-gray-200 shadow-sm transition-colors">U</button>
                </div>
                <div 
                  className="whitespace-pre-wrap font-mono text-gray-800 bg-gray-50 p-6 md:p-8 rounded-xl border border-gray-100 print:border-none print:bg-white print:p-0 leading-relaxed tracking-tight outline-none focus:ring-2 focus:ring-indigo-100 relative min-h-[200px]"
                  style={{ fontSize: `${globalFontSize}px` }}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const newText = e.currentTarget.innerHTML;
                    if(content.rawText !== newText) {
                      setContent(prev => prev ? {...prev, rawText: newText} : prev);
                      updateContentRawTextDB(content.id, newText);
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: content.rawText }}
                />
              </div>
            )}

            {!isGenerating && activeOutput && (
              <div className="relative">
                <div className={language === 'ar' ? "flex flex-wrap items-center gap-2 mb-4 md:absolute md:top-0 md:left-0 md:mb-0 print:hidden pr-24" : "flex flex-wrap items-center gap-2 mb-4 md:absolute md:top-0 md:right-0 md:mb-0 print:hidden pl-24"}>
                  <button 
                    onClick={toggleOutputFavorite}
                    className={`flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${activeOutput.isFavorite ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Star className="w-4 h-4" fill={activeOutput.isFavorite ? 'currentColor' : 'none'} /> {t('favorite') || 'Favorite'}
                  </button>
                  <button 
                    onClick={() => handleShare(activeOutput.content, content.title)}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Share2 className="w-4 h-4" /> {t('share')}
                  </button>
                  <button 
                    onClick={() => handleCopy(activeOutput.content)}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />} 
                    {isCopied ? t('copied') : t('copy')}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> {t('print')}
                  </button>
                  <button 
                    onClick={() => handleExport(activeOutput.content, `${content.title}-${activeOutput.type}`)}
                    className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Export MD
                  </button>
                </div>
                <div className="markdown-body prose prose-indigo max-w-none md:mt-12 print:mt-0 font-medium text-gray-800" dir="auto" style={{ fontSize: `${globalFontSize}px` }}>
                  <ReactMarkdown>{activeOutput.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
