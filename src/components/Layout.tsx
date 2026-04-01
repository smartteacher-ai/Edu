import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, BookOpen, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Content', path: '/content', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
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
        "fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 text-indigo-100 flex flex-col transition-transform duration-300 ease-in-out print:hidden",
        "md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
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
                  isActive ? "bg-indigo-800 text-white font-medium" : "hover:bg-indigo-800/50 text-indigo-200"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-indigo-400 text-center">
          EduGenius AI Phase 1
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto print:overflow-visible print:w-full print:h-auto w-full pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
