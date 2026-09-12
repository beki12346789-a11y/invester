'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import TelegramPopup from './TelegramPopup';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const userNav = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: '📊' },
    { name: 'Deposit', href: '/deposit', icon: '💰' },
    { name: t('navigation.packages'), href: '/packages', icon: '📦' },
    { name: t('navigation.investments'), href: '/investments', icon: '📈' },
    { name: t('navigation.withdrawals'), href: '/withdrawals', icon: '💸' },
    { name: t('navigation.transactions'), href: '/transactions', icon: '📝' },
  ];

  const adminNav = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Today', href: '/admin/today', icon: '📅' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Deposits', href: '/admin/deposits', icon: '💰' },
    { name: 'Products', href: '/admin/products', icon: '🏷️' },
    { name: 'Trading', href: '/admin/trading', icon: '💹' },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: '💸' },
  ];

  const navigation = isAdmin ? adminNav : userNav;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Telegram Popup */}
      <TelegramPopup />
      
      {/* Mobile-First Header */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link 
              href={isAdmin ? '/admin' : '/dashboard'} 
              className="text-lg sm:text-xl font-bold text-primary-600 truncate"
            >
              {t('app.title')}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageToggle />
              
              {/* User Info - Hidden on small mobile */}
              <div className="hidden sm:flex items-center">
                <span className="text-xs sm:text-sm text-gray-700 mr-2 sm:mr-3 truncate max-w-[120px]">
                  {user?.full_name}
                </span>
                {isAdmin && (
                  <span className="hidden md:inline-block mr-2 badge badge-info text-xs">Admin</span>
                )}
              </div>

              {/* Logout Button - Desktop */}
              <button 
                onClick={logout} 
                className="hidden sm:block btn btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
              >
                {t('common.logout')}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-3 space-y-1">
              {/* User Info Mobile */}
              <div className="px-3 py-2 bg-gray-50 rounded-lg mb-2">
                <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                <div className="text-xs text-gray-500">{user?.phone_number}</div>
                {isAdmin && <span className="inline-block mt-1 badge badge-info text-xs">Admin</span>}
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                    pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  {item.name}
                </Link>
              ))}

              {/* Logout Button Mobile */}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-2 btn btn-danger text-base py-2.5"
              >
                🚪 {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content with Mobile-First Padding */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>

      {/* Bottom Navigation for Mobile - 2 Rows, Cleaner Design */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40">
        <div className="grid grid-cols-3 gap-0">
          {navigation.slice(0, 6).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-3 px-2 border-r border-b border-gray-100 transition-all ${
                pathname === item.href
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-semibold text-center leading-tight">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Add padding to bottom of page for mobile nav */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
}
