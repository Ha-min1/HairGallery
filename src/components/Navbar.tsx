import React from 'react';
import { Scissors, Calendar, User, LogOut, Lock, LayoutDashboard } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  currentView: 'LANDING' | 'BOOKING' | 'CLIENT_DASHBOARD' | 'ADMIN_DASHBOARD' | 'AUTH';
  setView: (view: 'LANDING' | 'BOOKING' | 'CLIENT_DASHBOARD' | 'ADMIN_DASHBOARD' | 'AUTH') => void;
  onLogout: () => void;
  lang: 'ko' | 'en';
  setLang: (lang: 'ko' | 'en') => void;
}

export default function Navbar({ currentUser, currentView, setView, onLogout, lang, setLang }: NavbarProps) {
  const isKo = lang === 'ko';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200 text-stone-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => setView('LANDING')}
            className="flex items-center gap-3 group focus:outline-none cursor-pointer"
            id="nav-logo"
          >
            <div className="w-10 h-10 bg-[#1A1A1A] flex items-center justify-center rounded-sm">
              <span className="text-[#BFA181] font-serif text-2xl font-bold italic">G</span>
            </div>
            <div className="text-left">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1A1A1A] block">THE HAIR GALLERY</span>
              <span className="font-mono text-[9px] tracking-widest text-[#BFA181] uppercase -mt-0.5 block font-semibold">
                {isKo ? '오뜨 꾸뛰르 & 살롱' : 'Haute Coiffure & Salon'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest">
            <button
              onClick={() => setView('LANDING')}
              className={`pb-1 transition-all duration-200 cursor-pointer border-b-2 ${
                currentView === 'LANDING' ? 'text-[#1A1A1A] border-[#BFA181]' : 'text-stone-400 border-transparent hover:text-[#1A1A1A]'
              }`}
              id="nav-landing"
            >
              {isKo ? '갤러리 & 메뉴' : 'Gallery & Menu'}
            </button>

            <button
              onClick={() => setView('BOOKING')}
              className={`pb-1 transition-all duration-200 cursor-pointer border-b-2 ${
                currentView === 'BOOKING' ? 'text-[#1A1A1A] border-[#BFA181]' : 'text-stone-400 border-transparent hover:text-[#1A1A1A]'
              }`}
              id="nav-booking"
            >
              {isKo ? '실시간 예약' : 'Book Reservation'}
            </button>

            {currentUser && currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setView('ADMIN_DASHBOARD')}
                className={`pb-1 transition-all duration-200 cursor-pointer border-b-2 ${
                  currentView === 'ADMIN_DASHBOARD' ? 'text-[#1A1A1A] border-[#BFA181]' : 'text-stone-400 border-transparent hover:text-[#1A1A1A]'
                }`}
                id="nav-admin"
              >
                {isKo ? '관리자 콘솔' : 'Admin Console'}
              </button>
            )}

            {currentUser && currentUser.role === 'USER' && (
              <button
                onClick={() => setView('CLIENT_DASHBOARD')}
                className={`pb-1 transition-all duration-200 cursor-pointer border-b-2 ${
                  currentView === 'CLIENT_DASHBOARD' ? 'text-[#1A1A1A] border-[#BFA181]' : 'text-stone-400 border-transparent hover:text-[#1A1A1A]'
                }`}
                id="nav-client"
              >
                {isKo ? '마이 페이지' : 'My Account'}
              </button>
            )}
          </nav>

          {/* User Auth Info & Language toggle */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center gap-1 border border-stone-200 p-0.5 rounded bg-stone-50 text-[9px] font-mono font-bold">
              <button
                onClick={() => setLang('ko')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  isKo ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                KO
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  !isKo ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                EN
              </button>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#1A1A1A]">{currentUser.name}</span>
                  <span className="text-[10px] text-stone-400 font-mono capitalize">
                    {currentUser.role === 'ADMIN'
                      ? (isKo ? '수석 관리자' : 'Senior Administrator')
                      : (isKo ? '소중한 회원' : 'Valued Guest')}
                  </span>
                </div>
                
                {/* Profile Circle */}
                <div className="h-10 w-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[#BFA181] font-serif font-bold shadow-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-stone-100 transition-all duration-200 cursor-pointer"
                  title={isKo ? '로그아웃' : 'Sign Out'}
                  id="nav-logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView('AUTH')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-widest rounded transition-all duration-200 cursor-pointer"
                id="nav-signin"
              >
                <User className="h-4 w-4 text-[#BFA181]" />
                {isKo ? '로그인' : 'Sign In'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Indicators */}
        <div className="flex md:hidden items-center justify-around border-t border-stone-100 py-2 text-[9px] font-bold uppercase tracking-wider text-stone-500 bg-white">
          <button
            onClick={() => setView('LANDING')}
            className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${currentView === 'LANDING' ? 'text-[#BFA181]' : 'text-stone-400'}`}
          >
            <Scissors className="h-4 w-4" />
            <span>{isKo ? '살롱' : 'Salon'}</span>
          </button>
          
          <button
            onClick={() => setView('BOOKING')}
            className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${currentView === 'BOOKING' ? 'text-[#BFA181]' : 'text-stone-400'}`}
          >
            <Calendar className="h-4 w-4" />
            <span>{isKo ? '예약' : 'Book'}</span>
          </button>

          {currentUser && currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setView('ADMIN_DASHBOARD')}
              className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${currentView === 'ADMIN_DASHBOARD' ? 'text-[#BFA181]' : 'text-stone-400'}`}
            >
              <Lock className="h-4 w-4" />
              <span>{isKo ? '관리' : 'Admin'}</span>
            </button>
          )}

          {currentUser && currentUser.role === 'USER' && (
            <button
              onClick={() => setView('CLIENT_DASHBOARD')}
              className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${currentView === 'CLIENT_DASHBOARD' ? 'text-[#BFA181]' : 'text-stone-400'}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{isKo ? '계정' : 'Account'}</span>
            </button>
          )}

          {!currentUser && (
            <button
              onClick={() => setView('AUTH')}
              className={`flex flex-col items-center gap-1 py-1 cursor-pointer ${currentView === 'AUTH' ? 'text-[#BFA181]' : 'text-stone-400'}`}
            >
              <User className="h-4 w-4" />
              <span>{isKo ? '로그인' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
