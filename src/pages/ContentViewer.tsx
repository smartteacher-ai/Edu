import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { generateEducationalContent } from '../services/ai';
import { FileText, Sparkles, Loader2, Download, Trash2, ArrowLeft, KeyRound, Printer, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function ContentViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contents, outputs, addOutput, deleteOutput, customApiKey, canUseDefaultKey, incrementUsage } = useStore();
  
  const content = contents.find(c => c.id === id);
  const relatedOutputs = outputs.filter(o => o.sourceId === id);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw' | string>('raw');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('Arabic');
  const [isCopied, setIsCopied] = useState(false);

  if (!content) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Content not found</h2>
        <Link to="/content" className="text-indigo-600 mt-4 inline-block">Back to My Content</Link>
      </div>
    );
  }

  const handleGenerate = async (type: 'Summary' | 'LessonPlan' | 'Quiz' | 'CourseOutline') => {
    setError(null);
    
    // Check API limits
    if (!customApiKey && !canUseDefaultKey()) {
      const msg = 'You have reached your daily limit of 3 free generations. Please add your own API key in Settings for unlimited use.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsGenerating(true);
    try {
      // Safely access the injected API key or use the custom one
      // @ts-ignore
      const defaultKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '';
      const apiKey = customApiKey || defaultKey;
      
      if (!apiKey) {
        throw new Error('API Key is missing. Please add your Gemini API key in Settings.');
      }

      const generatedText = await generateEducationalContent(content.rawText, type, apiKey, language);
      
      if (!customApiKey) {
        incrementUsage();
      }

      const newOutput = {
        id: crypto.randomUUID(),
        sourceId: content.id,
        type,
        content: generatedText,
        createdAt: new Date().toISOString(),
      };
      
      addOutput(newOutput);
      setActiveTab(newOutput.id);
      toast.success(`${type} generated successfully!`);
    } catch (err: any) {
      console.error("Generation failed:", err);
      const errorMessage = err.message || 'Failed to generate content. Please try again.';
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
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy text.');
    }
  };

  const activeOutput = relatedOutputs.find(o => o.id === activeTab);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none">
      <div className="flex items-center gap-3 md:gap-4 mb-2 print:hidden">
        <Link to="/content" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">{content.title}</h1>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mt-1 flex-wrap">
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">{content.type}</span>
            <span>Extracted on {new Date(content.extractedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3 print:hidden">
          <div className="flex-1 text-sm">{error}</div>
          {error.includes('Settings') && (
            <Link to="/settings" className="flex items-center gap-1 text-sm font-medium bg-red-100 px-3 py-1.5 rounded hover:bg-red-200 transition-colors shrink-0">
              <KeyRound className="w-4 h-4" /> Go to Settings
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 print:block">
        {/* Sidebar Actions */}
        <div className="space-y-4 print:hidden">
          <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Generation
            </h3>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Output Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Arabic">Arabic (العربية)</option>
                <option value="English">English</option>
                <option value="French">French (Français)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="German">German (Deutsch)</option>
              </select>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => handleGenerate('Summary')}
                disabled={isGenerating}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50"
              >
                Generate Summary
              </button>
              <button 
                onClick={() => handleGenerate('LessonPlan')}
                disabled={isGenerating}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50"
              >
                Create Lesson Plan
              </button>
              <button 
                onClick={() => handleGenerate('Quiz')}
                disabled={isGenerating}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50"
              >
                Generate Quiz
              </button>
              <button 
                onClick={() => handleGenerate('CourseOutline')}
                disabled={isGenerating}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-50"
              >
                Build Full Course
              </button>
            </div>
          </div>
        </div>

        {/* Main Viewer */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px] md:h-[700px] print:h-auto print:border-none print:shadow-none print:block">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50 print:hidden scrollbar-hide">
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 md:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'raw' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Raw Text
            </button>
            {relatedOutputs.map(output => (
              <div key={output.id} className="flex items-center group shrink-0">
                <button
                  onClick={() => setActiveTab(output.id)}
                  className={`px-3 md:px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === output.id ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {output.type}
                </button>
                <button 
                  onClick={() => {
                    deleteOutput(output.id);
                    if (activeTab === output.id) setActiveTab('raw');
                  }}
                  className="px-2 py-3 border-b-2 border-transparent text-gray-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-red-600 transition-all"
                  aria-label="Delete output"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
            {isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 print:hidden">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="font-medium animate-pulse text-center px-4">Synthesizing educational content...</p>
              </div>
            )}
            
            {!isGenerating && activeTab === 'raw' && (
              <div className="prose prose-indigo max-w-none" dir="auto">
                <div className="whitespace-pre-wrap font-mono text-xs md:text-sm text-gray-700 bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-100 print:border-none print:bg-white print:p-0">
                  {content.rawText}
                </div>
              </div>
            )}

            {!isGenerating && activeOutput && (
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4 md:absolute md:top-0 md:right-0 md:mb-0 print:hidden">
                  <button 
                    onClick={() => handleCopy(activeOutput.content)}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />} 
                    {isCopied ? 'Copied' : 'Copy'}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button 
                    onClick={() => handleExport(activeOutput.content, `${content.title}-${activeOutput.type}`)}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Export MD
                  </button>
                </div>
                <div className="markdown-body prose prose-indigo max-w-none md:mt-12 print:mt-0" dir="auto">
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
