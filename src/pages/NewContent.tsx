import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, ContentType } from '../store/useStore';
import { extractTextFromMedia } from '../services/ai';
import { UploadCloud, FileText, Mic, FileType2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewContent() {
  const navigate = useNavigate();
  const { addContent, customApiKey } = useStore();
  
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [type, setType] = useState<ContentType>('Text');
  const [isExtracting, setIsExtracting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 15MB for base64 inline data)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File is too large. Please upload a file smaller than 15MB.");
      return;
    }

    setTitle(file.name.replace(/\.[^/.]+$/, ""));
    
    if (file.type === 'text/plain') {
      setType('Text');
      const reader = new FileReader();
      reader.onload = (e) => setRawText(e.target?.result as string);
      reader.readAsText(file);
    } else if (file.type === 'application/pdf' || file.type.startsWith('audio/')) {
      setType(file.type === 'application/pdf' ? 'PDF' : 'Audio');
      setIsExtracting(true);
      
      try {
        // @ts-ignore
        const defaultKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '';
        const apiKey = customApiKey || defaultKey;
        
        if (!apiKey) {
          throw new Error("API Key is missing. Please add it in Settings.");
        }

        const extractedText = await extractTextFromMedia(file, apiKey);
        setRawText(extractedText);
        toast.success("Text extracted successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to extract text from file.");
        setRawText("");
      } finally {
        setIsExtracting(false);
      }
    } else {
      toast.error("Unsupported file type. Please upload TXT, PDF, or Audio files.");
    }
  };

  const handleSave = () => {
    if (!rawText.trim()) {
      toast.error('Please enter some text or upload a file to extract content.');
      return;
    }
    
    const finalTitle = title.trim() || (rawText.trim().substring(0, 25) + '...') || 'Untitled Document';
    
    const newContent = {
      id: crypto.randomUUID(),
      title: finalTitle,
      type,
      rawText,
      extractedAt: new Date().toISOString(),
    };
    
    addContent(newContent);
    toast.success('Content saved successfully!');
    navigate(`/content/${newContent.id}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Upload</h1>
        <p className="text-gray-500 mt-1">Upload a file or paste raw text to extract content.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Biology Chapter 4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".txt,.pdf,.doc,.docx,audio/*"
              onChange={handleFileUpload}
            />
            <div className="flex justify-center gap-4 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><UploadCloud className="w-6 h-6" /></div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><FileText className="w-6 h-6" /></div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full"><Mic className="w-6 h-6" /></div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-full"><FileType2 className="w-6 h-6" /></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Click to upload or drag and drop</h3>
            <p className="text-sm text-gray-500 mt-1">TXT, PDF, Word, or Audio (Max 10MB)</p>
          </div>

          {/* Text Extraction UI */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Extracted Text</label>
              {isExtracting && (
                <span className="text-sm text-indigo-600 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Extracting...
                </span>
              )}
            </div>
            <textarea 
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (type !== 'Text') setType('Text');
              }}
              dir="auto"
              placeholder="Paste your raw text here or upload a file above..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm resize-y"
            />
            <p className="text-xs text-gray-500 mt-2">Review and edit the extracted text for accuracy before generating AI content.</p>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={() => navigate('/content')}
            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!rawText.trim() || isExtracting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
