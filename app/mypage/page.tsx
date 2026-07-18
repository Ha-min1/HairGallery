'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  User, Phone, Calendar as CalendarIcon, Clock, Settings, AlertCircle, 
  CheckCircle2, ArrowLeft, History, Sparkles, LogOut, Loader2, Undo2, Check, ShieldAlert,
  Bell
} from 'lucide-react';
import { TRANSLATIONS } from '@/lib/i18n';
import { getSupabaseClient } from '@/lib/supabase';

export default function MyPage() {
  const [lang, setLangState] = useState<'ko' | 'en'>('ko');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Non-member inputs
  const [nonMemberName, setNonMemberName] = useState<string>('');
  const [nonMemberPhone, setNonMemberPhone] = useState<string>('');
  const [nonMemberPassword, setNonMemberPassword] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Member profile edit states
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string>('');

  // Reservations list
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const supabase = getSupabaseClient();
  const hasLoadedInitialReservations = useRef<boolean>(false);

  // Notification dropdown state
  const [isNotiOpen, setIsNotiOpen] = useState<boolean>(false);
  const notiRef = useRef<HTMLDivElement>(null);
  const [mobileOptimized, setMobileOptimized] = useState<boolean>(true);

  // Format Korean mobile number (010-XXXX-XXXX)
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setIsNotiOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem('tg_lang') as 'ko' | 'en';
    if (savedLang === 'ko' || savedLang === 'en') {
      setLangState(savedLang);
    }

    // Check current auth status
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Sync with public.users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            setCurrentUser(profile);
            setEditName(profile.name || '');
            setEditPhone(profile.phone || '');
            
            // Sync mobile optimization state
            if (profile.mobile_optimized !== undefined && profile.mobile_optimized !== null) {
              setMobileOptimized(profile.mobile_optimized);
            } else {
              const localOpt = localStorage.getItem('tg_mobile_optimized');
              if (localOpt !== null) {
                setMobileOptimized(localOpt === 'true');
              }
            }
            
            // Automatically load member's reservations
            await fetchMemberReservations(session.access_token, profile.role);
          }
        }
      } catch (err) {
        console.error('Error fetching user session:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          setCurrentUser(profile);
          setEditName(profile.name || '');
          setEditPhone(profile.phone || '');
          if (profile.mobile_optimized !== undefined && profile.mobile_optimized !== null) {
            setMobileOptimized(profile.mobile_optimized);
          }
          if (!hasLoadedInitialReservations.current) {
            await fetchMemberReservations(session.access_token, profile.role);
          }
        }
      } else {
        setCurrentUser(null);
        setReservations([]);
        hasLoadedInitialReservations.current = false;
      }
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setLang = (newLang: 'ko' | 'en') => {
    setLangState(newLang);
    localStorage.setItem('tg_lang', newLang);
  };

  // Fetch reservations for signed-in member or admin
  const fetchMemberReservations = async (token: string, userRole?: string) => {
    setIsLoadingReservations(true);
    hasLoadedInitialReservations.current = true;
    try {
      const endpoint = userRole === 'ADMIN' ? '/api/admin/reservations' : '/api/bookings/my';
      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
      } else {
        console.error('Failed to load reservations');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingReservations(false);
    }
  };

  // Fetch reservations for non-member using name & phone
  const handleNonMemberSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!nonMemberName.trim() || !nonMemberPhone.trim() || !nonMemberPassword.trim()) {
      setActionError(lang === 'ko' ? '이름, 전화번호, 비밀번호를 모두 입력해 주세요.' : 'Please enter name, phone number, and password.');
      return;
    }

    setIsSearching(true);
    setIsLoadingReservations(true);
    try {
      const res = await fetch(`/api/bookings/my?name=${encodeURIComponent(nonMemberName.trim())}&phone=${encodeURIComponent(nonMemberPhone.trim())}&password=${encodeURIComponent(nonMemberPassword.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
        if ((data.reservations || []).length === 0) {
          setActionError(lang === 'ko' ? '입력하신 정보와 일치하는 예약 내역이 없습니다.' : 'No reservation history found matching the details provided.');
        }
      } else {
        const errData = await res.json();
        setActionError(errData.error || (lang === 'ko' ? '예약 내역 조회 중 오류가 발생했습니다.' : 'An error occurred while fetching reservations.'));
      }
    } catch (err: any) {
      setActionError(err.message || 'Server error.');
    } finally {
      setIsSearching(false);
      setIsLoadingReservations(false);
    }
  };

  // Update member profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setActionError('');

    if (!editName.trim() || !editPhone.trim()) {
      setActionError(lang === 'ko' ? '이름과 연락처를 모두 입력해 주세요.' : 'Please enter both name and phone number.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editName.trim(),
          phone: editPhone.trim()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update local state
      setCurrentUser((prev: any) => ({
        ...prev,
        name: editName.trim(),
        phone: editPhone.trim()
      }));

      setProfileSuccessMsg(TRANSLATIONS[lang].profileUpdateSuccess);
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      setActionError(err.message || (lang === 'ko' ? '회원 정보 수정 중 오류가 발생했습니다.' : 'An error occurred while updating profile.'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Cancel reservation (Authenticated & Non-authenticated)
  const handleCancelReservation = async (reservationId: string) => {
    setActionError('');
    setActionSuccess('');

    const confirmMsg = TRANSLATIONS[lang].cancelConfirmMsg;
    if (!confirm(confirmMsg)) return;

    setCancellingId(reservationId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const payload: any = { reservationId };
      const headers: any = { 'Content-Type': 'application/json' };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        payload.name = nonMemberName.trim();
        payload.phone = nonMemberPhone.trim();
        payload.password = nonMemberPassword.trim();
      }

      const res = await fetch('/api/bookings/my', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to cancel reservation.');
      }

      setActionSuccess(TRANSLATIONS[lang].cancelSuccessMsg);
      
      // Update local state (mark as Cancelled)
      setReservations(prev => 
        prev.map(resv => resv.id === reservationId ? { ...resv, status: 'Cancelled' } : resv)
      );

      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.message || (lang === 'ko' ? '예약 취소 중 오류가 발생했습니다.' : 'Failed to cancel reservation.'));
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setReservations([]);
  };

  const handleToggleMobileOptimized = async () => {
    const nextVal = !mobileOptimized;
    setMobileOptimized(nextVal);
    localStorage.setItem('tg_mobile_optimized', nextVal ? 'true' : 'false');

    if (currentUser) {
      try {
        await supabase
          .from('users')
          .update({ mobile_optimized: nextVal })
          .eq('id', currentUser.id);
        
        setCurrentUser((prev: any) => ({ ...prev, mobile_optimized: nextVal }));
      } catch (err) {
        console.error('Failed to update mobile optimization in DB:', err);
      }
    }
  };

  const t = TRANSLATIONS[lang];

  // Filter reservations for the notification badge
  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const targetAlertStatus = isAdmin ? 'Pending' : 'Confirmed';
  const notificationReservations = reservations.filter(resv => resv.status === targetAlertStatus);
  const notificationCount = notificationReservations.length;

  // Helper to translate status labels & colors
  const getStatusBadge = (status: string) => {
    let label = '';
    let style = '';

    switch (status) {
      case 'Pending':
        label = t.statusPending || '접수대기';
        style = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Confirmed':
        label = t.statusConfirmed || '예약확정';
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Completed':
        label = t.statusCompleted || '시술완료';
        style = 'bg-stone-100 text-stone-600 border-stone-200';
        break;
      case 'Cancelled':
        label = t.statusCancelled || '예약취소';
        style = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      default:
        label = status;
        style = 'bg-stone-50 text-stone-500 border-stone-200';
    }

    return (
      <span className={`px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold tracking-wide rounded-full border ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 antialiased flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg transition-transform group-hover:scale-105 overflow-hidden shrink-0 shadow-sm">
              <img src="/hair_gallery_logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={`font-serif font-bold tracking-tight text-stone-900 shrink-0 ${
              mobileOptimized ? 'text-[11px] sm:text-lg whitespace-nowrap' : 'text-sm sm:text-lg'
            }`}>THE HAIR GALLERY</span>
          </Link>

          <div className={`flex items-center ${mobileOptimized ? 'gap-1.5 sm:gap-3 flex-wrap sm:flex-nowrap justify-end' : 'gap-3'}`}>
            {/* Mobile Optimization Toggle */}
            <button
              onClick={handleToggleMobileOptimized}
              className={`text-[9px] sm:text-[10px] font-mono font-bold tracking-wider px-2 py-1.5 rounded-lg border transition-all active:scale-[0.98] flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap ${
                mobileOptimized 
                  ? 'border-stone-900 bg-stone-900 text-white shadow-sm' 
                  : 'border-stone-200 bg-white text-stone-600 hover:text-stone-900'
              }`}
              title={lang === 'ko' ? '모바일 화면 최적화 토글' : 'Toggle Mobile Optimization'}
            >
              <span>📱</span>
              <span className="hidden sm:inline">{lang === 'ko' ? '모바일 최적화' : 'Mobile Opt'}</span>
              <span className="inline sm:hidden">{lang === 'ko' ? '최적화' : 'Opt'}</span>
            </button>

            <Link 
              href="/" 
              className={`font-mono font-bold tracking-wider text-stone-700 hover:text-stone-950 flex items-center gap-1 border border-stone-200 hover:border-stone-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer bg-white shrink-0 whitespace-nowrap ${
                mobileOptimized ? 'text-[9px] sm:text-xs px-2 py-1.5' : 'text-[10px] sm:text-xs'
              }`}
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>{t.backToHome}</span>
            </Link>

            {/* Language Selector */}
            <div className="flex items-center gap-0.5 border border-stone-200 p-0.5 rounded-lg bg-stone-50 text-[9px] sm:text-[10px] font-mono font-bold shrink-0 whitespace-nowrap">
              <button
                onClick={() => setLang('ko')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  lang === 'ko' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                KO
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        {/* Banner Announcement */}
        <section className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 blur-sm pointer-events-none">
            <Sparkles className="w-64 h-64 text-gold-500" />
          </div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 bg-gold-500/10 border border-gold-500/30 text-gold-500 rounded-xl shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-bold font-serif text-gold-400 tracking-wide uppercase">
                {t.noticeTitle}
              </h2>
              <p className="text-xs text-stone-300 leading-relaxed font-light font-sans max-w-3xl">
                {t.noticeContent}
              </p>
            </div>
          </div>
        </section>

        {/* System Alerts */}
        {actionError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-medium">{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-start gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
        )}

        {isAuthLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
            <p className="text-xs text-stone-400 font-mono tracking-wider">LOADING USER SESSION...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Auth Check & Profile / Form */}
            <div className="lg:col-span-5 space-y-6">
              {currentUser ? (
                // LOGGED-IN: Profile Management Card
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-stone-900 text-gold-500 flex items-center justify-center font-bold border border-stone-850">
                        {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-stone-900">{t.memberProfileTitle}</h3>
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">{currentUser.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className={`font-mono font-bold text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors cursor-pointer bg-white shrink-0 whitespace-nowrap ${
                        mobileOptimized ? 'text-[9px] px-2 py-1' : 'text-[10px] px-2 py-1.5'
                      }`}
                    >
                      <LogOut className="h-3 w-3 inline mr-1" />
                      {t.logout}
                    </button>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold block">{t.fullName}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:bg-white focus:border-stone-400 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold block">{t.contactNumber}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                        <input
                          type="tel"
                          required
                          value={editPhone}
                          onChange={e => setEditPhone(formatPhoneNumber(e.target.value))}
                          placeholder="010-0000-0000"
                          className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:bg-white focus:border-stone-400 transition-all font-sans font-mono"
                        />
                      </div>
                    </div>

                    {profileSuccessMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] rounded-lg flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{profileSuccessMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full py-2.5 bg-stone-900 hover:bg-stone-850 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>UPDATING...</span>
                        </>
                      ) : (
                        <span>{t.editProfileBtn}</span>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                // NON-MEMBER: Booking Query Form
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                  <div className="border-b border-stone-100 pb-3">
                    <h3 className="font-serif text-sm font-semibold text-stone-900">{t.nonMemberVerifyTitle}</h3>
                    <p className="text-[10px] text-stone-400 mt-1 leading-normal font-sans">
                      {t.nonMemberVerifyDesc}
                    </p>
                  </div>

                  <form onSubmit={handleNonMemberSearch} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold block">{t.fullName}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                        <input
                          type="text"
                          required
                          value={nonMemberName}
                          onChange={e => setNonMemberName(e.target.value)}
                          placeholder={lang === 'ko' ? '예: 홍길동' : 'e.g. John Doe'}
                          className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:bg-white focus:border-stone-400 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold block">{t.contactNumber}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                        <input
                          type="tel"
                          required
                          value={nonMemberPhone}
                          onChange={e => setNonMemberPhone(formatPhoneNumber(e.target.value))}
                          placeholder="010-0000-0000"
                          className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:bg-white focus:border-stone-400 transition-all font-sans font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-stone-400 font-bold block">
                        {lang === 'ko' ? '비회원 예약 비밀번호 (4자리)' : 'Query Password (4 Digits)'}
                      </label>
                      <div className="relative">
                        <ShieldAlert className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                        <input
                          type="password"
                          required
                          maxLength={4}
                          pattern="\d{4}"
                          value={nonMemberPassword}
                          onChange={e => setNonMemberPassword(e.target.value.replace(/\D/g, ''))}
                          placeholder={lang === 'ko' ? '예: 1234' : 'e.g. 1234'}
                          className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:bg-white focus:border-stone-400 transition-all font-sans font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSearching}
                      className="w-full py-2.5 bg-stone-900 hover:bg-stone-850 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>SEARCHING...</span>
                        </>
                      ) : (
                        <span>{t.searchBtn}</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right Column: Reservations List */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6 min-h-[300px]">
                <h3 className="font-serif text-sm font-semibold text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
                  <History className="h-4.5 w-4.5 text-gold-600" />
                  {t.reservationListTitle}
                  {reservations.length > 0 && (
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full font-bold">
                      {reservations.length}
                    </span>
                  )}
                </h3>

                {isLoadingReservations ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-2">
                    <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
                    <p className="text-[10px] text-stone-400 font-mono tracking-wider">RETRIEVING RESERVATIONS...</p>
                  </div>
                ) : reservations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-stone-400" />
                    </div>
                    <p className="text-xs text-stone-400 leading-normal max-w-[260px] font-sans">
                      {t.noReservationsFound}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((resv) => {
                      const service = resv.services;
                      const dateObj = new Date(resv.date);
                      const formattedDate = dateObj.toLocaleDateString(
                        lang === 'ko' ? 'ko-KR' : 'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }
                      );
                      
                      const canCancel = resv.status !== 'Cancelled' && resv.status !== 'Completed';

                      return (
                        <div 
                          key={resv.id}
                          className="group border border-stone-100 hover:border-stone-200 rounded-xl p-4.5 bg-stone-50/50 hover:bg-white transition-all space-y-3.5 relative shadow-sm hover:shadow-md"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-[9px] font-mono bg-stone-900 text-gold-500 font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                  {lang === 'ko' ? '시술' : 'HAIR'}
                                </span>
                                {getStatusBadge(resv.status)}
                              </div>
                              <h4 className="text-xs font-bold text-stone-900">{service?.name || 'Custom Styling Service'}</h4>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold font-serif block">
                                {resv.price !== null && resv.price !== undefined 
                                  ? `₩${resv.price.toLocaleString()}` 
                                  : service?.price !== null && service?.price !== undefined
                                  ? `₩${service.price.toLocaleString()}`
                                  : (lang === 'ko' ? '가격 문의' : 'Inquiry')}
                              </span>
                              <span className="text-[9px] text-stone-400 font-mono">
                                {(service?.duration_minutes || 60) + (lang === 'ko' ? '분' : 'm')}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100/60">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="h-3.5 w-3.5 text-stone-400" />
                              <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-stone-400" />
                              <span>{resv.time}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 flex-wrap gap-2 text-[9px] text-stone-400 font-mono">
                            <div>
                              <span>Customer: {resv.customer_name}</span>
                              <span className="mx-1">|</span>
                              <span>{resv.customer_phone}</span>
                            </div>

                            {canCancel && (
                              <button
                                onClick={() => handleCancelReservation(resv.id)}
                                disabled={cancellingId === resv.id}
                                className="px-2.5 py-1 text-[10px] font-semibold text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 bg-white hover:bg-rose-600 rounded transition duration-200 disabled:opacity-50 cursor-pointer"
                              >
                                {cancellingId === resv.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                                ) : null}
                                {t.cancelReservationBtn}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-300 py-12 border-t border-stone-850 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <div className="text-sm font-mono tracking-widest text-gold-500 uppercase font-bold">
            THE HAIR GALLERY
          </div>
          <div className="text-xs text-stone-400 space-y-1">
            <p className="font-light">
              {lang === 'ko' 
                ? '주소: 경기도 김포시 북변동 806번지 상가동 103호 풍년마을삼성3단지아파트' 
                : 'Address: Room 103, Commercial Bldg, Pungnyeon Maeul Samsung 3-danji Apt, 806, Bukbyeon-dong, Gimpo-si, Gyeonggi-do, KR'}
            </p>
          </div>
          <div className="text-[10px] text-stone-500 pt-4 border-t border-stone-900 font-mono">
            &copy; {new Date().getFullYear()} THE HAIR GALLERY. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ClockIcon component (not imported but used)
function ClockIcon() {
  return (
    <Clock className="h-4.5 w-4.5 text-gold-600" />
  );
}
