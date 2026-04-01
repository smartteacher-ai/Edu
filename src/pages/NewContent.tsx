import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, ContentType } from '../store/useStore';
import { extractTextFromMedia } from '../services/ai';
import { UploadCloud, FileText, Mic, FileType2, Loader2, Square, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function NewContent() {
  const navigate = useNavigate();
  const { addContent, customApiKey } = useStore();
  
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [type, setType] = useState<ContentType>('Text');
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `Recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`, { type: 'audio/webm' });
        await processFile(file);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const processFile = async (file: File) => {
    // Check file size (limit to 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error("File is too large. Please upload a file smaller than 500MB.");
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
      setUploadProgress(0);
      
      try {
        // @ts-ignore
        const defaultKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '';
        const apiKey = customApiKey || defaultKey;
        
        if (!apiKey) {
          throw new Error("API Key is missing. Please add it in Settings.");
        }

        const extractedText = await extractTextFromMedia(file, apiKey, (progress) => {
          setUploadProgress(progress);
        });
        setRawText(extractedText);
        toast.success("Text extracted successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to extract text from file.");
        setRawText("");
      } finally {
        setIsExtracting(false);
        setUploadProgress(0);
      }
    } else {
      toast.error("Unsupported file type. Please upload TXT, PDF, or Audio files.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">New Upload</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Upload a file, record audio, or paste raw text to extract content.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Biology Chapter 4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Upload and Record Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer flex flex-col items-center justify-center h-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.pdf,.doc,.docx,audio/*"
                onChange={handleFileUpload}
              />
              <div className="flex justify-center gap-2 md:gap-4 mb-4 flex-wrap">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><UploadCloud className="w-5 h-5 md:w-6 md:h-6" /></div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><FileText className="w-5 h-5 md:w-6 md:h-6" /></div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-full"><FileType2 className="w-5 h-5 md:w-6 md:h-6" /></div>
              </div>
              <h3 className="text-base md:text-lg font-medium text-gray-900">Click to upload or drag and drop</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">TXT, PDF, Word, or Audio (Max 500MB)</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-4">
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Record Audio Directly</h3>
              {isRecording ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-red-500 font-mono font-medium animate-pulse">
                    Recording... {formatDuration(recordingDuration)}
                  </span>
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Square className="w-4 h-4 fill-current" /> Stop Recording
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" /> Start Recording
                </button>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {isExtracting && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> 
                  {uploadProgress < 100 ? 'Uploading & Processing...' : 'Extracting Text...'}
                </span>
                <span className="text-sm font-bold text-indigo-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-indigo-600 mt-2">
                {uploadProgress < 100 
                  ? 'Large files may take a few moments to upload securely.' 
                  : 'Analyzing content with AI. This might take a minute depending on file size.'}
              </p>
            </div>
          )}

          {/* Text Extraction UI */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Extracted Text</label>
            </div>
            <textarea 
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (type !== 'Text') setType('Text');
              }}
              dir="auto"
              placeholder="Paste your raw text here or upload/record a file above..."
              className="w-full h-48 md:h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm resize-y"
            />
            <p className="text-xs text-gray-500 mt-2">Review and edit the extracted text for accuracy before generating AI content.</p>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
          <button 
            onClick={() => navigate('/content')}
            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!rawText.trim() || isExtracting || isRecording}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm w-full sm:w-auto"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
