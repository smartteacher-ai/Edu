import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, BookOpen, Menu, X, Star, HelpCircle, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { Joyride, EventData, STATUS, Step } from 'react-joyride';
import { useTranslation } from '../lib/i18n';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const { addFeedback, hasSeenTutorial, setHasSeenTutorial, language, setLanguage } = useStore();
  const t = useTranslation(language);

  const [runTutorial, setRunTutorial] = useState(false);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!hasSeenTutorial) {
      setRunTutorial(true);
    }
  }, [hasSeenTutorial]);

  const tutorialSteps: Step[] = [
    {
      target: 'body',
      content: t('tutWelcome'),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: '.nav-dashboard',
      content: t('tutDashboard'),
      placement: language === 'ar' ? 'left' : 'right',
    },
    {
      target: '.nav-content',
      content: t('tutContent'),
      placement: language === 'ar' ? 'left' : 'right',
    },
    {
      target: '.nav-settings',
      content: t('tutSettings'),
      placement: language === 'ar' ? 'left' : 'right',
    },
    {
      target: '.nav-rate',
      content: t('tutRate'),
      placement: language === 'ar' ? 'left' : 'right',
    },
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTutorial(false);
      setHasSeenTutorial(true);
    }
  };

  const startTutorial = () => {
    setRunTutorial(true);
    if (isMobileMenuOpen) closeMenu();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const navItems = [
    { name: t('dashboard'), path: '/', icon: LayoutDashboard, className: 'nav-dashboard' },
    { name: t('myContent'), path: '/content', icon: FileText, className: 'nav-content' },
    { name: t('settings'), path: '/settings', icon: Settings, className: 'nav-settings' },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error(language === 'ar' ? 'الرجاء اختيار تقييم' : 'Please select a rating');
      return;
    }
    
    addFeedback({
      id: crypto.randomUUID(),
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });
    
    toast.success(language === 'ar' ? 'شكراً على ملاحظاتك!' : 'Thank you for your feedback!');
    setIsFeedbackOpen(false);
    setRating(0);
    setComment('');
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Joyride
        steps={tutorialSteps}
        run={runTutorial}
        continuous
        options={{
          primaryColor: '#4f46e5', // indigo-600
          zIndex: 10000,
          showProgress: true,
        }}
        onEvent={handleJoyrideCallback}
        locale={{
          back: language === 'ar' ? 'السابق' : 'Back',
          close: language === 'ar' ? 'إغلاق' : 'Close',
          last: language === 'ar' ? 'إنهاء' : 'Last',
          next: language === 'ar' ? 'التالي' : 'Next',
          skip: language === 'ar' ? 'تخطي' : 'Skip',
        }}
      />

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-indigo-900 text-white p-4 print:hidden w-full absolute top-0 z-40">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-300" />
          <span className="text-lg font-bold tracking-tight">EduGenius AI</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden print:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 z-50 w-64 bg-indigo-900 text-indigo-100 flex flex-col transition-transform duration-300 ease-in-out print:hidden",
        language === 'ar' ? "right-0" : "left-0",
        "md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : (language === 'ar' ? "translate-x-full" : "-translate-x-full")
      )}>
        <div className="p-6 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-300" />
          <span className="text-xl font-bold text-white tracking-tight">EduGenius AI</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  item.className,
                  isActive ? "bg-indigo-800 text-white font-medium" : "hover:bg-indigo-800/50 text-indigo-200"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 mt-auto space-y-2">
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center justify-center gap-2 bg-indigo-800/30 hover:bg-indigo-800/60 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            <Globe className="w-4 h-4 text-indigo-300" />
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
          <button 
            onClick={startTutorial}
            className="w-full flex items-center justify-center gap-2 bg-indigo-800/50 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            <HelpCircle className="w-4 h-4 text-indigo-300" />
            {t('showTutorial')}
          </button>
          <button 
            onClick={() => {
              setIsFeedbackOpen(true);
              closeMenu();
            }}
            className="nav-rate w-full flex items-center justify-center gap-2 bg-indigo-800 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            {t('rateApp')}
          </button>
          <div className="mt-4 text-xs text-indigo-400 text-center">
            EduGenius AI Phase 1
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto print:overflow-visible print:w-full print:h-auto w-full pt-16 md:pt-0">
        <Outlet />
      </main>

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('rateTitle')}</h2>
              <button onClick={() => setIsFeedbackOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="flex justify-center gap-2 py-4" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      className={cn(
                        "w-8 h-8 transition-colors",
                        (hoveredRating ? star <= hoveredRating : star <= rating)
                          ? "text-yellow-400 fill-yellow-400" 
                          : "text-gray-200"
                      )} 
                    />
                  </button>
                ))}
              </div>
              
              <div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('commentPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {t('submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
