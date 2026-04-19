import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, CheckCircle2, Zap, Play, LayoutDashboard, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleStart = async () => {
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
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-white to-white -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold tracking-wide mb-6 border border-indigo-100/50">
            <Sparkles className="w-4 h-4" />
            <span>CourseCraft 2.0 is live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-[1.1]">
            Turn scattered notes into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">premium courses</span> in 5 seconds.
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload PDFs, audio recordings, or raw text. Our AI instantly extracts, structures, and generates professional lesson plans, quizzes, and course outlines.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg hover:bg-gray-800 hover:-translate-y-0.5 transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-2 group"
            >
              Start for free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#demo" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-semibold text-lg hover:border-gray-300 transition-colors flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> Watch demo
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-4">No credit card required. 3 free generations.</p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm font-medium text-gray-400">
          <p className="mb-6 uppercase tracking-widest text-xs">Trusted by 10,000+ course creators and educators</p>
          <div className="flex justify-center gap-8 md:gap-16 opacity-50 grayscale flex-wrap">
            {/* Logos replace with simple text for now */}
            <span className="text-xl font-bold font-serif">Harvard</span>
            <span className="text-xl font-bold font-sans">Udemy</span>
            <span className="text-xl font-bold font-mono">Skillshare</span>
            <span className="text-xl font-bold font-sans tracking-tight">Coursera</span>
          </div>
        </div>
      </section>

      {/* Benefits / Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Everything you need to launch.</h2>
            <p className="text-lg text-gray-500">Stop wasting weeks creating materials. CourseCraft automates the grunt work so you can focus on teaching.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-indigo-600" />}
              title="Instant Extraction"
              desc="Upload hours of audio or 100-page PDFs. We transcribe and extract cleanly."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="w-6 h-6 text-purple-600" />}
              title="Structured Outlines"
              desc="Convert raw knowledge into modular, logical course structures."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-amber-500" />}
              title="Quizzes & Summaries"
              desc="Generate multiple-choice tests, essays, and concise summaries automatically."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-900 text-white text-center px-4">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to monetize your knowledge?</h2>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Join thousands of creators building their automated course empires.</p>
        <button 
          onClick={handleStart}
          className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl"
        >
          Create your first course now
        </button>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
