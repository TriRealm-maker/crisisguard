import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  MapIcon, 
  ChartBarIcon, 
  HeartIcon, 
  BookOpenIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/map', label: 'Map', icon: MapIcon },
  { path: '/prediction', label: 'Prediction', icon: ChartBarIcon },
  { path: '/medical', label: 'Medical', icon: HeartIcon },
  { path: '/guides', label: 'Guides', icon: BookOpenIcon },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 fixed bottom-0 w-full md:top-0 md:bottom-auto z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CG</span>
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-white hidden md:block">
              CrisisGuard
            </span>
          </div>

          <div className="flex items-center space-x-1 md:space-x-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-2 md:px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-3">
            {user && (
              <>
                <span className="text-sm text-slate-600 dark:text-slate-300 hidden md:block">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
