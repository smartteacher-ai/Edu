import { useState } from 'react';
import { useStore } from '../store/useStore';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { customApiKey, setCustomApiKey, usage } = useStore();
  const [inputKey, setInputKey] = useState(customApiKey || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setCustomApiKey(inputKey.trim() || null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your application preferences and API limits.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            API Configuration
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-indigo-900">Usage Limits</h3>
              <p className="text-sm text-indigo-700 mt-1">
                The default API key allows for <strong>3 generations per day</strong>. 
                Today's usage: <span className="font-semibold">{usage.count}/3</span>.
              </p>
              <p className="text-sm text-indigo-700 mt-2">
                For unlimited usage, please provide your own free Google Gemini API key.
              </p>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
              >
                Get your free API key here &rarr;
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Gemini API Key</label>
            <div className="flex gap-3">
              <input 
                type="password" 
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
              />
              <button 
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                Save Key
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Your key is stored locally in your browser and never sent to our servers.</p>
          </div>

          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
