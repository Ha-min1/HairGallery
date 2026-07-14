'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Scissors, CheckCircle, Info, LayoutDashboard, ChevronLeft, ChevronRight, User, Key, ShieldCheck, History } from 'lucide-react';
import { TRANSLATIONS, getLocalizedServices } from '@/lib/i18n';
import { getSupabaseClient } from '@/lib/supabase';

const TIME_SLOTS_24H = [
  '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function Home() {
  const [lang, setLangState] = useState<'ko' | 'en'>('ko');
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  // Visual Calendar states
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Auth & Consent states
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login'); // Separated Tabs
  
  // Sign Up form states
  const [authName, setAuthName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authConsent, setAuthConsent] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  const supabase = getSupabaseClient();

  // Initialize lang and Supabase Session on Mount
  useEffect(() => {
    const savedLang = localStorage.getItem('tg_lang') as 'ko' | 'en';
    if (savedLang === 'ko' || savedLang === 'en') {
      setLangState(savedLang);
    }

    // Check current active session
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await handleSessionUser(session.user);
        }
      } catch (err) {
        console.error('Session retrieve error:', err);
      }
    }
    checkSession();

    // Listen to Auth State Changes (Google OAuth Redirect callback catch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleSessionUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle Session User: Sync auth user with database users profile table
  const handleSessionUser = async (authUser: any) => {
    try {
      // 1. Query users table
      const { data: profile, error: queryErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (queryErr) throw queryErr;

      if (profile) {
        // Log in directly
        setCurrentUser(profile);
        setCustomerName(profile.name || '');
        setCustomerPhone(profile.phone || '');
      } else {
        // 2. Profile not found - Check for pending signup draft in localStorage
        const signupDraftStr = localStorage.getItem('tg_signup_draft');
        const consentTime = new Date().toISOString();

        if (signupDraftStr) {
          const draft = JSON.parse(signupDraftStr);
          // Insert complete profile with name, phone, and consent
          const { data: newProfile, error: insertErr } = await supabase
            .from('users')
            .insert([
              {
                id: authUser.id,
                email: authUser.email,
                name: draft.name,
                phone: draft.phone,
                provider: 'google',
                role: 'USER',
                is_admin: false,
                consent_given: true,
                consent_timestamp: consentTime
              }
            ])
            .select()
            .single();

          if (insertErr) throw insertErr;
          
          setCurrentUser(newProfile);
          setCustomerName(newProfile.name || '');
          setCustomerPhone(newProfile.phone || '');
          localStorage.removeItem('tg_signup_draft');
        } else {
          // 3. Google Login clicked directly without signup draft (Auto-create profile)
          const { data: defaultProfile, error: defaultErr } = await supabase
            .from('users')
            .insert([
              {
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata.full_name || authUser.email.split('@')[0],
                phone: '',
                provider: 'google',
                role: 'USER',
                is_admin: false,
                consent_given: true,
                consent_timestamp: consentTime
              }
            ])
            .select()
            .single();

          if (defaultErr) throw defaultErr;

          setCurrentUser(defaultProfile);
          setCustomerName(defaultProfile.name || '');
          setCustomerPhone(defaultProfile.phone || '');
        }
      }
    } catch (err: any) {
      console.error('Failed to sync auth user profile:', err.message);
    }
  };

  // Update services registry when language changes
  useEffect(() => {
    setServices(getLocalizedServices(lang));
  }, [lang]);

  const setLang = (newLang: 'ko' | 'en') => {
    setLangState(newLang);
    localStorage.setItem('tg_lang', newLang);
  };

  // Calendar utility calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
    setSelectedDate('');
    setSelectedTime('');
  };

  const isDayInPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentYear, currentMonth, day);
    return checkDate < today;
  };

  const handleDaySelect = (day: number) => {
    if (isDayInPast(day)) return;
    setSelectedDay(day);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setSelectedTime(''); // Reset time when date changes
  };

  // Fetch Booked Slots dynamically when Date is picked
  useEffect(() => {
    if (!selectedDate) return;

    async function checkAvailability() {
      setIsLoadingSlots(true);
      try {
        const res = await fetch(`/api/bookings?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setBookedTimes(data.bookedSlots || []);
        }
      } catch (err) {
        console.error('Failed to retrieve slot lists:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    checkAvailability();
  }, [selectedDate]);

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || 'Failed to initialize Google Login.');
      setIsAuthLoading(false);
    }
  };

  // Google OAuth Sign Up (with custom metadata pre-stored in local storage)
  const handleGoogleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authConsent) {
      alert(lang === 'ko' ? '개인정보 활용 동의에 체크해 주세요.' : 'Please consent to the privacy policy.');
      return;
    }
    if (!authName || !authPhone) {
      alert(lang === 'ko' ? '이름과 연락처를 입력해 주세요.' : 'Please provide your name and phone number.');
      return;
    }

    setIsAuthLoading(true);
    try {
      // Save details to draft store in localStorage to read after auth redirect callback
      localStorage.setItem('tg_signup_draft', JSON.stringify({
        name: authName,
        phone: authPhone
      }));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || 'Failed to initialize Google Sign Up.');
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedServiceId || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      setErrorMessage(lang === 'ko' ? '시술 정보와 예약 정보를 모두 확인해 주세요.' : 'Please choose your styling service, date, time slot, and check your details.');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || null,
          customerName,
          customerPhone,
          serviceId: selectedServiceId,
          date: selectedDate,
          time: selectedTime,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit reservation.');
      }

      setIsSuccess(true);
      setSelectedServiceId('');
      setSelectedDay(null);
      setSelectedDate('');
      setSelectedTime('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Server collision. Please retry your submission.');
    }
  };

  const t = TRANSLATIONS[lang];

  // Calendar rendering grid preparation
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
  const dayNames = lang === 'ko' ? ['일', '월', '화', '수', '목', '금', '토'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabel = lang === 'ko' ? `${currentYear}년 ${currentMonth + 1}월` : `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;

  const calendarGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarGrid.push(i);
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 antialiased flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-stone-950 flex items-center justify-center rounded-sm">
              <span className="text-gold-500 font-serif text-lg font-bold italic">G</span>
            </div>
            <span className="font-serif text-sm sm:text-base font-bold tracking-tight text-stone-900">THE HAIR GALLERY</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Show Admin Dashboard Link only if currentUser.role === 'ADMIN' */}
            {currentUser && currentUser.role === 'ADMIN' && (
              <Link 
                href="/admin/dashboard" 
                className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-white bg-gold-600 hover:bg-gold-700 uppercase flex items-center gap-1 border border-gold-700 px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>{t.goToAdmin}</span>
              </Link>
            )}

            {/* Simulated Auth Menu */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs bg-stone-100 text-stone-700 px-2 py-1.5 rounded-lg font-mono flex items-center gap-1 border border-stone-200">
                  <User className="h-3 w-3" />
                  <span className="max-w-[70px] sm:max-w-[100px] truncate font-semibold">{currentUser.name}</span>
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-mono font-bold text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-300 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-stone-700 border border-stone-300 hover:bg-stone-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {lang === 'ko' ? '로그인' : 'Log In'}
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthConsent(false);
                    setShowAuthModal(true);
                  }}
                  className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-stone-100 bg-stone-900 hover:bg-stone-850 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {lang === 'ko' ? '회원가입' : 'Sign Up'}
                </button>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center gap-0.5 border border-stone-200 p-0.5 rounded-lg bg-stone-50 text-[9px] sm:text-[10px] font-mono font-bold">
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

      {/* Main Content */}
      <main className="flex-1">
        {/* Editorial Hero Block */}
        <section className="bg-stone-950 text-stone-100 py-16 px-4 text-center border-b border-stone-800 animate-fadeIn">
          <div className="max-w-4xl mx-auto space-y-4">
            <span className="text-2xl sm:text-5xl font-mono tracking-[0.25em] text-gold-500 uppercase font-extrabold block mb-4">{t.heroSub}</span>
            <h1 className="font-serif text-lg sm:text-2xl font-light tracking-tight text-stone-300 leading-tight">
              {t.heroTitle}
            </h1>
          </div>
        </section>

        <div className="max-w-5xl mx-auto py-12 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Booking Form and Services */}
            <div className="lg:col-span-7 space-y-8">
              {isSuccess ? (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-8 text-center space-y-6">
                  <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto animate-pulse" />
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-stone-900">{t.reservationSubmitted}</h2>
                    <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                      {t.successDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="w-full py-2.5 bg-stone-950 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    {t.bookAnother}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {/* Select Service */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                    <h2 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-2">
                      <Scissors className="h-4.5 w-4.5 text-gold-600" />
                      {t.selectService}
                    </h2>

                    <div className="space-y-3">
                      {services.map(s => (
                        <label
                          key={s.id}
                          className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
                            selectedServiceId === s.id ? 'bg-amber-50/40 border-gold-500/80 ring-1 ring-gold-500/50' : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-2.5">
                              <input
                                type="radio"
                                name="service"
                                checked={selectedServiceId === s.id}
                                onChange={() => setSelectedServiceId(s.id)}
                                className="mt-1 accent-stone-900"
                              />
                              <div>
                                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">{s.category}</span>
                                <h3 className="text-xs font-bold text-stone-900">{s.name}</h3>
                                <p className="text-[10px] text-stone-500 mt-1 leading-normal">{s.description}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                               <span className="text-xs font-bold font-serif block">
                                 {s.price !== null && s.price !== undefined 
                                   ? `₩${s.price.toLocaleString()}` 
                                   : (lang === 'ko' ? '가격 문의' : 'Inquiry')}
                               </span>
                              <span className="text-[9px] text-stone-400 font-mono">{s.durationMinutes}m</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info Box (Without Consent widget here, as it's signup only) */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                    <h3 className="font-serif text-sm font-semibold text-stone-900">{t.contactDetails}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-stone-400">{t.fullName}</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          placeholder={lang === 'ko' ? '예: 김철수' : 'e.g. John Doe'}
                          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:border-stone-400 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-stone-400">{t.contactNumber}</label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          placeholder={lang === 'ko' ? '010-1234-5678' : '+82-10-1234-5678'}
                          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:border-stone-400 transition-colors"
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedDate || !selectedTime || !selectedServiceId}
                      className={`w-full py-3.5 text-stone-900 text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md transition-transform active:scale-[0.98] ${
                        selectedDate && selectedTime && selectedServiceId
                          ? 'bg-gold-500 hover:bg-gold-600 cursor-pointer'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {t.bookSession}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Visual Calendar Flow */}
            <div className="lg:col-span-5 space-y-6">
              {/* Calendar Container */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                <h2 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-2">
                  <CalendarIcon className="h-4.5 w-4.5 text-gold-600" />
                  {t.appointmentDate}
                </h2>

                <div className="space-y-4">
                  {/* Calendar Header with Navigation */}
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="font-serif text-sm font-bold text-stone-900">{monthLabel}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 border border-stone-200 rounded hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4 text-stone-600" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 border border-stone-200 rounded hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4 text-stone-600" />
                      </button>
                    </div>
                  </div>

                  {/* Day Names Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-stone-400 uppercase">
                    {dayNames.map(dName => (
                      <div key={dName} className="py-1">{dName}</div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map((day, idx) => {
                      if (day === null) {
                        return <div key={`empty-${idx}`} className="py-2.5"></div>;
                      }

                      const isSelected = selectedDay === day;
                      const isPast = isDayInPast(day);

                      return (
                        <button
                          key={`day-${day}`}
                          type="button"
                          disabled={isPast}
                          onClick={() => handleDaySelect(day)}
                          className={`py-2.5 text-xs font-mono font-semibold rounded-lg transition-all flex items-center justify-center ${
                            isPast
                              ? 'text-stone-300 cursor-not-allowed font-light line-through'
                              : isSelected
                              ? 'bg-stone-950 text-stone-100 border border-stone-950 font-bold scale-[1.05] shadow-sm'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-800 cursor-pointer border border-transparent'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots (Conditionally rendered strictly after Date selection) */}
              {selectedDate && (
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4 animate-fadeIn">
                  <h3 className="font-serif text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                    <ClockIcon />
                    <span>{t.availableSlots}</span>
                  </h3>
                  
                  {isLoadingSlots ? (
                    <div className="text-center py-6 text-xs text-stone-400 font-mono">{t.checkingSchedules}</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS_24H.map(slot => {
                        const isBooked = bookedTimes.includes(slot);
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2.5 text-xs font-mono font-semibold rounded border transition-colors cursor-pointer ${
                              isBooked
                                ? 'bg-stone-100 text-stone-300 border-stone-100 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-stone-950 text-stone-100 border-stone-950 font-bold'
                                : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Personal Privacy Timeline Widget (Profile Audit Log) */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="font-serif text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <History className="h-4.5 w-4.5 text-gold-600" />
                  {t.consentTimelineTitle}
                </h3>
                
                {currentUser ? (
                  <div className="space-y-3 font-mono text-[11px]">
                    <div className="flex gap-3 items-start relative pb-2">
                      <div className="h-full w-0.5 bg-stone-200 absolute left-2.5 top-3.5 z-0"></div>
                      <div className="h-5 w-5 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center shrink-0 z-10">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <span className="font-bold text-stone-900">{t.consentGivenText}</span>
                        <div className="text-[10px] text-stone-500 mt-1">
                          📅 {new Date(currentUser.consent_timestamp || currentUser.created_at).toLocaleString()}
                        </div>
                        <div className="text-[9px] text-stone-400">
                          🛡️ Provider: {currentUser.provider === 'google' ? 'Google OAuth' : 'Credentials'} (ID: {currentUser.id.substring(0, 8)}...)
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 border-2 border-dashed border-stone-100 rounded-lg text-stone-400 text-xs leading-relaxed">
                    {t.notLoggedIn}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-300 py-12 border-t border-stone-800">
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
            <p className="pt-2">
              <a 
                href="https://maps.app.goo.gl/AzNDXDy9uLtMB5u3A" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-gold-500 hover:text-gold-400 hover:underline transition-colors bg-stone-900 border border-stone-800 px-3.5 py-1.5 rounded-lg hover:bg-stone-850"
              >
                <span>📍 Google Maps에서 위치 보기 (View on Google Maps)</span>
              </a>
            </p>
          </div>
          <p className="text-[10px] text-stone-600 font-mono pt-4">
            © {new Date().getFullYear()} THE HAIR GALLERY. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Auth Modal (Google SignUp vs Login Tabs) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-stone-950 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                  <Key className="h-5 w-5 text-gold-500" />
                  {lang === 'ko' ? '더 헤어 갤러리 인증' : 'The Hair Gallery Auth'}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono mt-1">Google OAuth 2.0 Secure Gateway</p>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-stone-400 hover:text-white text-lg font-bold cursor-pointer outline-none"
              >
                ✕
              </button>
            </div>

            {/* Tab Headers */}
            <div className="flex border-b border-stone-200 text-xs font-mono font-bold uppercase">
              <button 
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                  authMode === 'login' 
                    ? 'border-stone-900 text-stone-900 bg-stone-50/50' 
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                {lang === 'ko' ? '로그인' : 'Log In'}
              </button>
              <button 
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                  authMode === 'signup' 
                    ? 'border-stone-900 text-stone-900 bg-stone-50/50' 
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                {lang === 'ko' ? '회원가입' : 'Sign Up'}
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6">
              {authMode === 'login' ? (
                // Google Login tab
                <div className="space-y-6 text-center">
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {lang === 'ko' 
                      ? '기존 구글 연동 계정으로 바로 로그인하고 예약을 간편하게 관리하세요.' 
                      : 'Log in with your existing Google account to manage reservations.'}
                  </p>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isAuthLoading}
                    className="w-full py-3.5 border border-stone-300 hover:bg-stone-50 text-stone-900 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
                  >
                    <GoogleLogo />
                    <span>{lang === 'ko' ? '구글 계정으로 로그인' : 'Log in with Google'}</span>
                  </button>
                </div>
              ) : (
                // Google Sign Up tab (Consent Checkbox required here ONLY)
                <form onSubmit={handleGoogleSignUp} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-mono text-stone-400 block">{lang === 'ko' ? '고객 성함 *' : 'Full Name *'}</label>
                    <input 
                      type="text" 
                      required
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      placeholder={lang === 'ko' ? '홍길동' : 'John Doe'}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:border-stone-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-mono text-stone-400 block">{lang === 'ko' ? '연락처 휴대폰 번호 *' : 'Contact Phone *'}</label>
                    <input 
                      type="tel" 
                      required
                      value={authPhone}
                      onChange={e => setAuthPhone(e.target.value)}
                      placeholder="010-1234-5678"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:border-stone-400 transition-colors"
                    />
                  </div>

                  <div className="pt-2 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer justify-start">
                      <input 
                        type="checkbox"
                        required
                        checked={authConsent}
                        onChange={e => setAuthConsent(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-stone-900 text-left">
                        {t.privacyConsent}
                      </span>
                    </label>

                    <details className="border border-stone-200 rounded-lg bg-stone-50 text-[10px] outline-none">
                      <summary className="font-semibold text-stone-700 py-2.5 px-3 select-none cursor-pointer outline-none hover:bg-stone-100 rounded-t-lg transition-colors flex items-center justify-between text-left">
                        <span>{t.privacyDetailsTitle}</span>
                      </summary>
                      <div className="p-3 border-t border-stone-200 text-stone-600 whitespace-pre-line leading-relaxed bg-white rounded-b-lg text-left">
                        {t.privacyDetailsContent}
                      </div>
                    </details>
                  </div>

                  <button
                    type="submit"
                    disabled={!authConsent || isAuthLoading}
                    className={`w-full py-3.5 text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2.5 ${
                      authConsent && !isAuthLoading
                        ? 'bg-stone-950 text-stone-100 hover:bg-stone-850 cursor-pointer'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="bg-white p-0.5 rounded-sm shrink-0"><GoogleLogo /></span>
                    <span>{isAuthLoading ? (lang === 'ko' ? '로딩중...' : 'Authenticating...') : (lang === 'ko' ? '구글 계정으로 회원가입 완료' : 'Complete Sign Up with Google')}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline sub-components for layout safety
function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-gold-600" fill="none" viewBox="2 2 20 20" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  );
}
