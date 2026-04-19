import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingLayout() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async () => {
    try {
      if (user) {
        navigate('/app');
      } else {
        await signInWithGoogle();
        navigate('/app');
      }
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        console.error('Authentication error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white group-hover:bg-indigo-700 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">CourseCraft<span className="text-indigo-600">.ai</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
            <Link to="/#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
            <Link to="/#faq" className="hover:text-indigo-600 transition-colors">FAQ</Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAuth}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {user ? 'Go to Dashboard' : 'Log in'}
            </button>
            {!user && (
              <button 
                onClick={handleAuth}
                className="hidden md:inline-flex bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Get Started Free
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12 pb-24 md:pb-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-lg tracking-tight text-gray-900">CourseCraft<span className="text-indigo-600">.ai</span></span>
              </Link>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Transform raw knowledge into profitable educational products in seconds. Build your online coaching business faster.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/#features" className="hover:text-indigo-600 transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link></li>
                <li><Link to="/#testimonials" className="hover:text-indigo-600 transition-colors">Wall of Love</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
                <li><Link to="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-400 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} CourseCraft AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
