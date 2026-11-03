import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { FormError } from '../common/FormError';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, error } = useAuth();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Scan', path: '/scan' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
      {user && error && <FormError message={error} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm p-1"
            aria-label="ScamShield AI Homepage"
          >
            <div className="w-8 h-8 rounded-md bg-brand flex items-center justify-center text-white shadow-subtle">
              <Shield className="w-5 h-5 fill-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none text-text-primary">
                ScamShield<span className="text-brand ml-0.5">AI</span>
              </span>
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                Threat Defense
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.path)
                    ? 'text-brand bg-brand-subtle font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth & CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                    isActive('/dashboard') || isActive('/history') || isActive('/settings') || isActive('/admin')
                      ? 'text-brand bg-brand-subtle font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  leftIcon={<LogOut className="w-4 h-4" />}
                  aria-label="Log out"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/scan">
                  <Button variant="primary" size="sm">
                    Analyze a Message
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'text-brand bg-brand-subtle font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-border space-y-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="secondary" className="w-full">
                    User Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="secondary" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="primary" className="w-full">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
