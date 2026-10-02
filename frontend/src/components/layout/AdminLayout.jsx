import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Armchair, Clock, BookOpen, Bell,
  Settings, LogOut, Menu, X, Sun, Moon, Monitor, ChevronDown,
  IndianRupee, Library
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/members', icon: Users, label: 'Members' },
  { to: '/admin/seats', icon: Armchair, label: 'Seats' },
  { to: '/admin/slots', icon: Clock, label: 'Slots' },
  { to: '/admin/fees', icon: IndianRupee, label: 'Fee Management' },
  { to: '/admin/notices', icon: Bell, label: 'Notices' },
  { to: '/admin/library', icon: Library, label: 'Library Settings' },
];

const ThemeToggle = ({ theme, setTheme }) => {
  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={`p-1.5 rounded-md transition-all ${theme === value
            ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
};

const AdminLayout = ({ children }) => {
  const { admin, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <BookOpen size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display leading-none">LibraryOS</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{admin?.name || "Owner"}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
        <div className="px-3">
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
            }`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
              {admin?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{admin?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{admin?.email}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center">
              <BookOpen size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">LibraryOS</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
