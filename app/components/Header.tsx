'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Scissors, 
  MapPin, 
  Calendar, 
  MessageSquarePlus, 
  Download, 
  User, 
  LayoutDashboard, 
  Bell, 
  History, 
  Menu, 
  X,
  Sparkles,
  ChevronRight,
  Globe,
  Tag
} from 'lucide-react';

interface HeaderProps {
  lang: 'ko' | 'en';
  setLang: (lang: 'ko' | 'en') => void;
  currentUser: any | null;
  notificationCount: number;
  notificationReservations: any[];
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenInquiryModal: () => void;
  onOpenInstallModal: () => void;
  onOpenPriceModal?: () => void;
}

export default function Header({
  lang,
  setLang,
  currentUser,
  notificationCount,
  notificationReservations,
  onOpenAuthModal,
  onLogout,
  onOpenInquiryModal,
  onOpenInstallModal,
  onOpenPriceModal
}: HeaderProps) {
  const [isNotiOpen, setIsNotiOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const notiRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'ADMIN' || 
      currentUser.is_admin === true || 
      currentUser.is_admin === 'true' || 
      currentUser.is_admin === 1
    )
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setIsNotiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 shadow-lg text-stone-100 transition-all">
      {/* ================= TOP ROW ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-stone-800 border border-stone-700/80 overflow-hidden shadow-md group-hover:scale-105 transition-transform">
            <img src="/hair_gallery_logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-sm sm:text-lg font-bold tracking-tight text-white group-hover:text-gold-400 transition-colors">
              THE HAIR GALLERY
            </span>
            <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase hidden xs:block">
              Premium Soho Salon
            </span>
          </div>
        </Link>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Link (Desktop/Tablet) */}
          {isAdmin && (
            <Link 
              href="/admin/dashboard" 
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-950/90 via-gold-950/95 to-amber-950/90 hover:from-amber-900/90 hover:to-gold-900/90 text-gold-300 border border-gold-500/70 rounded-xl text-xs font-mono font-bold transition-all shadow-md hover:shadow-gold-500/20 group cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4 text-gold-400 group-hover:rotate-12 transition-transform shrink-0" />
              <span>{lang === 'ko' ? '⚙️ 관리자 대시보드' : '⚙️ Admin Dashboard'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            </Link>
          )}



          {/* Notification Bell (If Logged In) */}
          {currentUser && (
            <div className="relative" ref={notiRef}>
              <button
                onClick={() => setIsNotiOpen(!isNotiOpen)}
                className="relative p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-full transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white border border-stone-900">
                      {notificationCount}
                    </span>
                  </>
                )}
              </button>

              {/* Notification Menu Dropdown */}
              {isNotiOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-stone-100 animate-fadeIn">
                  <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5 font-serif">
                      <Bell className="h-4 w-4 text-gold-400" />
                      {lang === 'ko' ? '알림 센터' : 'Notifications'}
                    </span>
                    {notificationCount > 0 && (
                      <span className="text-[10px] bg-red-950 border border-red-800 text-red-300 px-2 py-0.5 rounded-full font-bold">
                        {notificationCount}
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-stone-800/60">
                    {notificationCount === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-500 font-light">
                        {isAdmin 
                          ? (lang === 'ko' ? '새로운 예약 신청 내역이 없습니다.' : 'No new booking requests.')
                          : (lang === 'ko' ? '확정된 예약 알림이 없습니다.' : 'No confirmed reservation alerts.')}
                      </div>
                    ) : (
                      notificationReservations.map((resv) => {
                        const dateObj = new Date(resv.date);
                        const formattedDate = dateObj.toLocaleDateString(
                          lang === 'ko' ? 'ko-KR' : 'en-US',
                          { month: 'short', day: 'numeric', weekday: 'short' }
                        );
                        const customerName = resv.customer_name || resv.customerName || '';
                        const serviceName = resv.services?.name || resv.serviceName || 'Custom Styling';
                        
                        return (
                          <div key={resv.id} className="p-3.5 hover:bg-stone-800/50 transition-colors text-xs space-y-1 text-left">
                            <div className="flex justify-between items-center">
                              <span className={`font-bold font-mono text-[10px] px-2 py-0.5 rounded border ${
                                isAdmin 
                                  ? 'text-amber-300 bg-amber-950/60 border-amber-800/60' 
                                  : 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60'
                              }`}>
                                {isAdmin 
                                  ? (lang === 'ko' ? '신규 예약' : 'New Request')
                                  : (lang === 'ko' ? '예약 확정' : 'Confirmed')}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {formattedDate} {resv.time}
                              </span>
                            </div>
                            <p className="text-stone-300 font-medium mt-1">
                              {serviceName} <span className="text-stone-400">({customerName})</span>
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Account / MyPage */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <Link 
                href="/mypage" 
                className="hidden sm:flex items-center gap-1.5 text-xs font-mono bg-stone-800 hover:bg-stone-750 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 transition-colors cursor-pointer"
              >
                <User className="h-3.5 w-3.5 text-gold-400" />
                <span className="max-w-[90px] truncate font-medium">{currentUser.name}</span>
              </Link>
              <button 
                onClick={onLogout}
                className="hidden sm:block text-xs font-mono text-stone-400 hover:text-rose-400 px-2 py-1.5 transition-colors cursor-pointer"
              >
                {lang === 'ko' ? '로그아웃' : 'Logout'}
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuthModal}
              className="text-xs font-mono font-semibold text-stone-900 bg-gold-500 hover:bg-gold-400 px-3.5 py-1.5 sm:py-2 rounded-lg transition-all shadow-md shadow-gold-500/10 cursor-pointer"
            >
              {lang === 'ko' ? '로그인' : 'Login'}
            </button>
          )}

          {/* Language Selector (KR / EN) */}
          <div className="flex items-center p-0.5 bg-stone-950 border border-stone-800 rounded-lg text-[10px] font-mono font-bold">
            <button
              onClick={() => setLang('ko')}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                lang === 'ko' ? 'bg-stone-800 text-gold-400 font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              KR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                lang === 'en' ? 'bg-stone-800 text-gold-400 font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              EN
            </button>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ================= BOTTOM ROW (NAVBAR / CHIP BAR) ================= */}
      <div className="bg-stone-950/80 border-t border-stone-800/80 px-4 sm:px-6 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center gap-2 min-w-max">
          {/* Install App Guide Modal Trigger Chip */}
          <button
            onClick={onOpenInstallModal}
            className="px-3.5 py-1.5 rounded-full bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs animate-pulse"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>{lang === 'ko' ? '📲 앱 추가 가이드' : '📲 Install App'}</span>
          </button>

          {/* Admin Quick Access Chip (1-Touch) */}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-950 via-gold-950/90 to-amber-950 border border-gold-500/70 text-gold-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md ring-1 ring-gold-500/40 hover:scale-105"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-gold-400" />
              <span>{lang === 'ko' ? '⚙️ 관리자 대시보드' : '⚙️ Admin Dashboard'}</span>
              <span className="px-1.5 py-0.2 bg-gold-500/20 text-gold-300 text-[9px] rounded font-mono border border-gold-500/40 uppercase font-bold">Quick</span>
            </Link>
          )}

          {/* Price Guide Chip */}
          {onOpenPriceModal ? (
            <button
              type="button"
              onClick={onOpenPriceModal}
              className="px-3.5 py-1.5 rounded-full bg-amber-950/40 hover:bg-amber-900/60 border border-gold-500/60 text-gold-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
            >
              <Tag className="h-3.5 w-3.5 text-gold-400" />
              <span>{lang === 'ko' ? '🏷️ 시술 가격안내' : '🏷️ Price Guide'}</span>
            </button>
          ) : (
            <Link
              href="/price"
              className="px-3.5 py-1.5 rounded-full bg-amber-950/40 hover:bg-amber-900/60 border border-gold-500/60 text-gold-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
            >
              <Tag className="h-3.5 w-3.5 text-gold-400" />
              <span>{lang === 'ko' ? '🏷️ 시술 가격안내' : '🏷️ Price Guide'}</span>
            </Link>
          )}

          {/* Board Chip */}
          <a
            href="#board"
            className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700/80 hover:border-gold-500/50 text-stone-200 hover:text-gold-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <Scissors className="h-3.5 w-3.5 text-gold-400" />
            <span>{lang === 'ko' ? '게시판' : 'Board'}</span>
          </a>

          {/* Hair Portfolio Gallery Chip */}
          <a
            href="#portfolio-gallery"
            className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700/80 hover:border-gold-500/50 text-stone-200 hover:text-gold-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold-400" />
            <span>{lang === 'ko' ? '헤어 갤러리' : 'Hair Portfolio'}</span>
          </a>

          {/* Location Chip */}
          <a
            href="#store-location"
            className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700/80 hover:border-gold-500/50 text-stone-200 hover:text-gold-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            <span>{lang === 'ko' ? '위치/오시는 길' : 'Location'}</span>
          </a>

          {/* Booking Chip */}
          <a
            href="#booking-section"
            className="px-3.5 py-1.5 rounded-full bg-gold-600/20 hover:bg-gold-600/30 border border-gold-500/40 text-gold-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <Calendar className="h-3.5 w-3.5 text-gold-400" />
            <span>{lang === 'ko' ? '실시간 예약' : 'Book Appointment'}</span>
          </a>

          {/* Inquiry Modal Trigger Chip */}
          <button
            onClick={onOpenInquiryModal}
            className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700/80 hover:border-gold-500/50 text-stone-200 hover:text-gold-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-blue-400" />
            <span>{lang === 'ko' ? '일반 문의 및 컴포넌트 지정 문의' : 'General & Component Inquiry'}</span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE EXPANDABLE MENU DRAWER ================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-stone-950 border-b border-stone-800 px-5 py-4 space-y-3 animate-fadeIn">
          {currentUser ? (
            <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gold-400" />
                <span className="font-bold text-stone-200">{currentUser.name} ({currentUser.email || '회원'})</span>
              </div>
              <Link
                href="/mypage"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[11px] text-gold-400 hover:underline flex items-center gap-0.5"
              >
                마이페이지 <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAuthModal();
              }}
              className="w-full py-2.5 bg-gold-500 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <User className="h-4 w-4" />
              <span>로그인 / 회원가입 하러 가기</span>
            </button>
          )}

          <Link
            href="/price"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full py-2.5 bg-amber-950/60 text-gold-300 border border-gold-500/50 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2"
          >
            <Tag className="h-4 w-4 text-gold-400" />
            <span>{lang === 'ko' ? '🏷️ 시술별 상세 가격안내 바로가기' : '🏷️ View Price Guide Page'}</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 bg-stone-900 text-gold-400 border border-gold-500/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>관리자 대시보드 바로가기</span>
            </Link>
          )}

          {currentUser && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full py-2 bg-stone-900 text-rose-400 border border-rose-950 rounded-xl text-xs font-mono"
            >
              로그아웃
            </button>
          )}
        </div>
      )}
    </header>
  );
}
