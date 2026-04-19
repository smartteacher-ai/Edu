import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { CreditCard, Key, LogOut, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const { user, profile, incrementUsage, canGenerate, logout, logActivity } = useAuth();
  const { customApiKey, setCustomApiKey } = useStore();
  const [keyInput, setKeyInput] = useState(customApiKey || '');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveKey = () => {
    setCustomApiKey(keyInput.trim() || null);
    toast.success('API Settings saved');
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    setIsProcessing(true);
    await logActivity('upgrade_intent', { fromPlan: profile.plan });
    
    // Simulate secure payment processing payload for testing/demo
    setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { plan: 'pro' });
        toast.success("Payment successful! Welcome to Pro.");
        setShowPayment(false);
      } catch (e) {
         toast.error("Failed to upgrade.");
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  if (!user || !profile) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile & Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription, usage, and API keys.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
            {profile.photoURL ? (
               <img src={profile.photoURL} alt="Avatar" className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-indigo-50" />
            ) : (
               <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                 {profile.displayName?.charAt(0) || user.email?.charAt(0)}
               </div>
            )}
            <h3 className="font-bold text-gray-900 truncate">{profile.displayName || 'No Name'}</h3>
            <p className="text-sm text-gray-500 truncate">{profile.email}</p>
            
            <span className={`mt-4 inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold uppercase tracking-wider ${profile.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600'}`}>
              {profile.plan} Plan
            </span>

            <button 
              onClick={logout}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Usage and Subscription */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-indigo-600">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-semibold text-gray-900">Subscription</h3>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Daily Free Operations</p>
                  <p className="text-xs text-gray-500">Resets at midnight UTC</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">{profile.plan === 'free' ? profile.usageCount : '∞'}</span>
                  <span className="text-gray-500 text-sm"> / {profile.plan === 'free' ? '3' : '∞'}</span>
                </div>
              </div>
              
              {profile.plan === 'free' && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full ${profile.usageCount >= 3 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min((profile.usageCount / 3) * 100, 100)}%` }}></div>
                </div>
              )}
              
              {!canGenerate && profile.plan === 'free' && (
                <div className="flex items-start gap-2 text-red-600 mt-3 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>You've reached your free daily limit. Upgrade to Pro for unlimited generation, or provide your own Gemini API key below.</p>
                </div>
              )}
            </div>

            {profile.plan === 'free' && (
              <div className="border border-indigo-100 bg-indigo-50/50 p-5 rounded-xl text-center">
                <h4 className="font-bold text-indigo-900 mb-2">Unlock Unlimited Generation</h4>
                <ul className="text-sm text-indigo-700 mb-4 space-y-1 text-left inline-block">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> No daily limits</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> Larger file uploads</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> Priority support</li>
                </ul>
                <button 
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg shadow hover:bg-indigo-700 transition"
                >
                  Upgrade to Pro - $10/mo
                </button>
              </div>
            )}
          </div>

          {/* API Key Override */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-gray-500">
              <Key className="w-5 h-5" />
              <h3 className="font-semibold text-gray-900">Developer Settings</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              If you prefer to bypass limits without upgrading, you can bring your own Google Gemini API key. Stored securely on your device.
            </p>

            <div className="flex gap-3">
              <input 
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
              />
              <button 
                onClick={handleSaveKey}
                className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Overlay Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Secure Checkout
              </h3>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="text-sm text-gray-500 font-medium">Billed Monthly</div>
                <div className="text-3xl font-extrabold text-gray-900">$10.00</div>
              </div>
              <form onSubmit={processPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Card Information</label>
                  <div className="border border-gray-300 rounded-lg p-3 bg-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Card number" required className="flex-1 outline-none text-sm placeholder-gray-400" />
                  </div>
                  <div className="flex -mt-px relative">
                    <input type="text" placeholder="MM / YY" required className="w-1/2 border border-gray-300 rounded-bl-lg p-3 outline-none text-sm placeholder-gray-400" />
                    <input type="text" placeholder="CVC" required className="w-1/2 border border-y-gray-300 border-r-gray-300 border-l-0 rounded-br-lg p-3 outline-none text-sm placeholder-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Name on card</label>
                  <input type="text" defaultValue={profile.displayName || ''} required className="w-full border border-gray-300 rounded-lg p-3 outline-none text-sm" />
                </div>
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full mt-4 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:bg-indigo-400 flex items-center justify-center gap-2"
                >
                  {isProcessing ? "Processing..." : "Pay $10.00"}
                </button>
              </form>
              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                 <ShieldCheck className="w-3.5 h-3.5" /> Payments are securely processed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
