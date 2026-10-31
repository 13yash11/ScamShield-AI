import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
    { label: 'New Scan', to: '/scan', icon: PlusCircle, end: false },
    { label: 'Scan History', to: '/history', icon: History, end: false },
    { label: 'Account Settings', to: '/settings', icon: Settings, end: false },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-border shrink-0 py-4 px-3 md:py-6 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="px-3 hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Workspace
          </p>
          <p className="text-sm font-semibold text-text-primary mt-1 truncate">
            {user?.fullName || 'Security Analyst'}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {user?.email || 'Active Session'}
          </p>
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0" aria-label="Dashboard Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Admin Center</span>
            </NavLink>
          )}
        </nav>
      </div>

      <div className="pt-4 border-t border-border mt-4 hidden md:block">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-status-danger hover:bg-status-danger-bg rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
