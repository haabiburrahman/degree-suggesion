import React, { useState } from 'react';
import { BookOpen, ShieldAlert, LogIn, LogOut, User as UserIcon, Menu, X, Home, Settings, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActiveView } from '../types';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  resetNavigation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView, resetNavigation }) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: ActiveView) => {
    if (view === 'home') {
      resetNavigation();
    } else {
      setActiveView(view);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1B2A4A] text-white border-b-4 border-[#F2A93B] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Name */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative p-2 bg-[#FAF6EC] text-[#1B2A4A] rounded-xl border-2 border-[#F2A93B] shadow-inner transform group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-[#1B2A4A]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#F2A93B] rounded-full border-2 border-[#1B2A4A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-[#FAF6EC] group-hover:text-[#F2A93B] transition-colors">
                  ডিগ্রি সাজেশন ও উত্তর
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-[#F2A93B] text-[#1B2A4A] rounded-full">
                  PWA Platform
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-200/80 font-body">
                জাতীয় বিশ্ববিদ্যালয় ডিগ্রি পাশ কোর্স পরীক্ষার প্রস্তুতি
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                activeView === 'home'
                  ? 'bg-[#F2A93B] text-[#1B2A4A]'
                  : 'text-amber-100/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              হোম পেজ
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition border border-[#F2A93B]/40 ${
                  activeView === 'admin'
                    ? 'bg-[#F2A93B] text-[#1B2A4A]'
                    : 'bg-[#F2A93B]/10 text-[#F2A93B] hover:bg-[#F2A93B]/20'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-[#F2A93B]" />
                এডমিন ড্যাশবোর্ড
              </button>
            )}

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/20">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-semibold text-amber-100 truncate max-w-[140px]">
                    {profile?.email || user.email}
                  </p>
                  <span className="text-[10px] text-[#F2A93B] font-bold uppercase tracking-wider">
                    {profile?.role === 'admin' ? 'এডমিন (Admin)' : 'সাধারণ ইউজার'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-600/80 hover:bg-red-600 text-white transition shadow-sm"
                  title="লগআউট করুন"
                >
                  <LogOut className="w-4 h-4" />
                  লগআউট
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] transition shadow-md"
              >
                <LogIn className="w-4 h-4" />
                লগইন / সাইনআপ
              </button>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {user ? (
              <button
                onClick={() => handleNavClick('login')}
                className="p-2 bg-white/10 text-amber-200 rounded-lg text-xs font-semibold"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="px-3 py-1.5 bg-[#F2A93B] text-[#1B2A4A] font-bold text-xs rounded-lg"
              >
                লগইন
              </button>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1B2A4A] border-t border-amber-200/20 px-4 pt-3 pb-5 space-y-3">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
              activeView === 'home' ? 'bg-[#F2A93B] text-[#1B2A4A]' : 'text-amber-100 hover:bg-white/10'
            }`}
          >
            <Home className="w-5 h-5" />
            হোম পেজ
          </button>

          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
                activeView === 'admin' ? 'bg-[#F2A93B] text-[#1B2A4A]' : 'bg-[#F2A93B]/10 text-[#F2A93B]'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              এডমিন ড্যাশবোর্ড
            </button>
          )}

          {user ? (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="px-4 py-2 bg-white/5 rounded-lg">
                <p className="text-xs text-amber-200 font-semibold">{user.email}</p>
                <p className="text-[10px] text-[#F2A93B] font-bold">
                  রোল: {profile?.role === 'admin' ? 'এডমিন (Admin)' : 'ইউজার'}
                </p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600/90 text-white font-bold text-sm"
              >
                <LogOut className="w-5 h-5" />
                লগআউট করুন
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('login')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F2A93B] text-[#1B2A4A] font-bold text-sm"
            >
              <LogIn className="w-5 h-5" />
              লগইন বা একাউন্ট খুলুন
            </button>
          )}
        </div>
      )}
    </header>
  );
};
