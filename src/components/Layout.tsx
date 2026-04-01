import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Content', path: '/content', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-indigo-100 flex flex-col print:hidden">
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
      <main className="flex-1 overflow-auto print:overflow-visible print:w-full print:h-auto">
        <Outlet />
      </main>
    </div>
  );
}
