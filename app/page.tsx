'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Scissors, CheckCircle, Info, LayoutDashboard, ChevronLeft, ChevronRight, User, Key, ShieldCheck, History, Clock, Bell, MessageSquarePlus, MapPin, Tag, Palette, Sparkles, Heart, Wind, Droplets, Crown } from 'lucide-react';
import PriceList from '@/app/components/PriceList';

const RESERVATION_CATEGORIES = [
  { id: 'cat-cut', nameKo: '커트 (Cut)', nameEn: 'Cut', descKo: '디자인컷, 학생컷, 앞머리컷 등', descEn: 'Design Cut, Student Cut, Bang Trim', icon: Scissors },
  { id: 'cat-color', nameKo: '염색 (Color)', nameEn: 'Color', descKo: '전체염색, 뿌리염색, 발레아쥬, 탈색 등', descEn: 'Full Color, Root Touch-up, Balayage, Bleach', icon: Palette },
  { id: 'cat-perm', nameKo: '펌 (Perm)', nameEn: 'Perm', descKo: '디자인펌, 열펌, 볼륨매직, 다운펌 등', descEn: 'Design Perm, Heat Perm, Volume Magic, Down Perm', icon: Sparkles },
  { id: 'cat-treatment', nameKo: '클리닉 (Treatment)', nameEn: 'Treatment', descKo: '모발 영양 클리닉, 두피 헤어 스파 등', descEn: 'Hair Nutrition Treatment, Scalp Spa', icon: Heart },
  { id: 'cat-styling', nameKo: '스타일링 (Styling)', nameEn: 'Styling', descKo: '블로우 드라이, 아이론 세팅, 데일리 드라이 등', descEn: 'Blowout, Thermal Iron Setting, Daily Styling', icon: Wind },
  { id: 'cat-shampoo', nameKo: '샴푸 (Shampoo)', nameEn: 'Shampoo', descKo: '스페셜 샴푸, 두피 마사지 & 케어 등', descEn: 'Special Shampoo, Scalp Massage & Care', icon: Droplets },
  { id: 'cat-upstyle', nameKo: '업스타일 (Upstyle)', nameEn: 'Upstyle', descKo: '혼주/웨딩 업스타일, 파티/행사 머리 등', descEn: 'Wedding Updo, Party & Event Styling', icon: Crown },
];
import { TRANSLATIONS, getLocalizedServices } from '@/lib/i18n';
import { getSupabaseClient } from '@/lib/supabase';
import ComponentInquiryModal from '@/app/components/ComponentInquiryModal';
import BoardSection from '@/app/components/BoardSection';
import Header from '@/app/components/Header';
import HairPortfolioGallery from '@/app/components/HairPortfolioGallery';
import InstallAppGuide from '@/app/components/InstallAppGuide';
import InstallAppBanner from '@/app/components/InstallAppBanner';

const TIME_SLOTS_24H = [
  '10:30', '11:30', '12:30', '13:30', '14:30',
  '15:30', '16:30', '17:30', '18:30', '19:30'
];

export default function Home() {
  const [lang, setLangState] = useState<'ko' | 'en'>('ko');
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('커트');
  const [priceItems, setPriceItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/price-list')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.items)) {
          setPriceItems(data.items);
        }
      })
      .catch(err => console.error('Failed to fetch price_list for reservation:', err));
  }, []);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [nonMemberPassword, setNonMemberPassword] = useState<string>('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<any | null>(null);
  
  // Visual Calendar states
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [pendingTimes, setPendingTimes] = useState<string[]>([]);
  const [closedTimes, setClosedTimes] = useState<string[]>([]);
  const [isBulkEditMode, setIsBulkEditMode] = useState<boolean>(false);
  const [bulkSelectedTimes, setBulkSelectedTimes] = useState<string[]>([]);
  const [isSavingBulk, setIsSavingBulk] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [bookingConsent, setBookingConsent] = useState<boolean>(false);

  // Help widget states
  const [showHelpWidget, setShowHelpWidget] = useState<boolean>(true);
  const [helpActiveStep, setHelpActiveStep] = useState<number>(0);

  // Component Inquiry & Install App Guide states
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [inquiryDefaultComp, setInquiryDefaultComp] = useState<string>('헤더 (Header & Navigation)');

  // Toggle help widget and persist to localStorage
  const handleToggleHelpWidget = () => {
    const nextVal = !showHelpWidget;
    setShowHelpWidget(nextVal);
    localStorage.setItem('tg_show_help_widget', String(nextVal));
  };

  // Auth & Onboarding states
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  // Notification States
  const [reservations, setReservations] = useState<any[]>([]);
  const [isNotiOpen, setIsNotiOpen] = useState<boolean>(false);
  const notiRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setIsNotiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadReservationsForNotifications = async () => {
    if (!currentUser) return;
    try {
      let query = supabase
        .from('reservations')
        .select(`
          id, date, time, status, customer_name, customer_phone, price, service_id,
          services ( name, duration_minutes )
        `);
      
      const isAdmin = currentUser.role === 'ADMIN';
      if (!isAdmin) {
        query = query.eq('user_id', currentUser.id);
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      if (!error && data) {
        setReservations(data);
      }
    } catch (e) {
      console.error('Failed to load reservations for notifications:', e);
    }
  };

  useEffect(() => {
    loadReservationsForNotifications();
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'ADMIN';
  const targetAlertStatus = isAdmin ? 'Pending' : 'Confirmed';
  const notificationReservations = useMemo(() => {
    return reservations.filter(resv => resv.status === targetAlertStatus);
  }, [reservations, targetAlertStatus]);
  const notificationCount = notificationReservations.length;

  // Onboarding modal states (For collecting Name & Phone on first login)
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [pendingAuthUser, setPendingAuthUser] = useState<any | null>(null);
  const [onboardingName, setOnboardingName] = useState<string>('');
  const [onboardingPhone, setOnboardingPhone] = useState<string>('');
  const [onboardingConsent, setOnboardingConsent] = useState<boolean>(false);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState<boolean>(false);

  // Guards to prevent duplicate alerts and concurrent race conditions
  const alertShownRef = useRef<boolean>(false);
  const isProcessingAuth = useRef<boolean>(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Auto phone number formatter for Korean mobile numbers (010-XXXX-XXXX)
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

  const loadActiveAnnouncement = async () => {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .lte('start_time', nowIso)
        .gte('end_time', nowIso)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setActiveAnnouncement(data);
      } else {
        setActiveAnnouncement(null);
      }
    } catch (e) {
      console.error('Failed to load active announcement:', e);
    }
  };

  const supabase = getSupabaseClient();

  // Initialize lang and Supabase Session on Mount
  useEffect(() => {
    const savedLang = localStorage.getItem('tg_lang') as 'ko' | 'en';
    if (savedLang === 'ko' || savedLang === 'en') {
      setLangState(savedLang);
    }

    const savedHelp = localStorage.getItem('tg_show_help_widget');
    if (savedHelp !== null) {
      setShowHelpWidget(savedHelp === 'true');
    }

    loadActiveAnnouncement();

    // Listen to Auth State Changes (Google/Kakao OAuth Redirect callback catch)
    // In Supabase v2, this listener automatically fires the initial event on subscription.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Prevent duplicate execution if the user ID hasn't changed
        if (currentUserIdRef.current === session.user.id) {
          return;
        }
        await handleSessionUser(session.user);
      } else {
        currentUserIdRef.current = null;
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle Session User: Sync auth user with database users profile table
  const handleSessionUser = async (authUser: any) => {
    if (isProcessingAuth.current) return;
    isProcessingAuth.current = true;
    try {
      // 1. Query users table by unique auth ID (immune to missing emails/OAuth provider quirks)
      const { data: profile, error: queryErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (queryErr) throw queryErr;

      if (profile) {
        // Check if user is fully registered (has phone and consent, or is admin)
        if (!profile.is_admin && (!profile.phone || !profile.consent_given)) {
          // Incomplete profile: Open onboarding modal to complete registration instead of signing out
          setPendingAuthUser(authUser);
          setOnboardingName(profile.name || authUser.user_metadata?.full_name || '');
          setOnboardingPhone(profile.phone || '');
          setOnboardingConsent(profile.consent_given || false);
          setShowOnboardingModal(true);
          setIsAuthLoading(false);
          setShowAuthModal(false);
          return;
        }
        // Log in directly
        currentUserIdRef.current = profile.id;
        setCurrentUser(profile);
        setCustomerName(profile.name || '');
        setCustomerPhone(profile.phone || '');
      } else {
        // 2. Profile not found - Open onboarding modal to collect details and complete sign up!
        setPendingAuthUser(authUser);
        setOnboardingName(authUser.user_metadata?.full_name || '');
        setOnboardingPhone('');
        setOnboardingConsent(false);
        setShowOnboardingModal(true);
        setIsAuthLoading(false);
        setShowAuthModal(false);
      }
    } catch (err: any) {
      console.error('Failed to sync auth user profile:', err.message);
    } finally {
      isProcessingAuth.current = false;
    }
  };

  // Load services with database fetching and localStorage fallback
  const loadServices = async (currentLang: 'ko' | 'en') => {
    // 1. Try to fetch from database first for real-time synchronization
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map((s: any) => {
          const displayName = currentLang === 'en' ? (s.name_en || s.name) : s.name;
          const displayDesc = currentLang === 'en' ? (s.description_en || s.description) : s.description;
          return {
            id: s.id,
            name: displayName,
            price: s.price,
            durationMinutes: s.duration_minutes,
            description: displayDesc,
            display_order: s.display_order || 0,
            name_ko: s.name,
            name_en: s.name_en || null,
            description_ko: s.description,
            description_en: s.description_en || null
          };
        });
        setServices(mapped);
        // Cache it in localStorage as fallback
        localStorage.setItem(`custom_services_${currentLang}`, JSON.stringify(mapped));
        return;
      }
    } catch (e) {
      console.error('Failed to fetch services from Supabase:', e);
    }

    // 2. Local storage fallback if offline or DB query fails
    const cached = localStorage.getItem(`custom_services_${currentLang}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0) || a.id.localeCompare(b.id));
        const localized = parsed.map((s: any) => {
          const displayName = currentLang === 'en' ? (s.name_en || s.name_ko || s.name) : (s.name_ko || s.name);
          const displayDesc = currentLang === 'en' ? (s.description_en || s.description_ko || s.description) : (s.description_ko || s.description);
          return {
            ...s,
            name: displayName,
            description: displayDesc
          };
        });
        setServices(localized);
        return;
      } catch (e) {
        console.error('Failed to parse cached services:', e);
      }
    }

    // 3. Static fallback if both DB and cache fail
    const staticSvc = getLocalizedServices(currentLang).map((s: any, idx: number) => Object.assign({}, s, { display_order: idx }));
    setServices(staticSvc);
  };

  useEffect(() => {
    loadServices(lang);
  }, [lang]);

  const handleUpdateService = async (updatedService: any) => {
    // Format the payload to match what the backend expects
    const payload = {
      originalId: updatedService.id,
      newId: updatedService.id,
      name: updatedService.name_ko || updatedService.name,
      nameEn: updatedService.name_en || null,
      price: updatedService.price === '' || updatedService.price === null ? null : Number(updatedService.price),
      durationMinutes: updatedService.durationMinutes,
      description: updatedService.description_ko || updatedService.description,
      descriptionEn: updatedService.description_en || null,
      category: updatedService.category || 'Cut'
    };

    // Update local state (simulate dynamic local update)
    const updatedServices = services.map(s => {
      if (s.id === updatedService.id) {
        const displayName = lang === 'en' ? (payload.nameEn || payload.name) : payload.name;
        const displayDesc = lang === 'en' ? (payload.descriptionEn || payload.description) : payload.description;
        return {
          ...s,
          name: displayName,
          price: payload.price,
          durationMinutes: payload.durationMinutes,
          description: displayDesc,
          name_ko: payload.name,
          name_en: payload.nameEn,
          description_ko: payload.description,
          description_en: payload.descriptionEn
        };
      }
      return s;
    });
    setServices(updatedServices);

    // Save to local storage for persistence
    localStorage.setItem(`custom_services_${lang}`, JSON.stringify(updatedServices));

    // Try to update on Supabase via API route securely
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        console.error('Failed to sync service to database:', errData.error);
      }
    } catch (e) {
      console.error('Failed to sync service to database:', e);
    }
  };

  // Shop interior preview slideshow slides
  const slides = useMemo(() => [
    { url: '/preview_01.jpg', title: lang === 'ko' ? '' : '' },
    { url: '/preview_02.jpg', title: lang === 'ko' ? '' : '' },
    { url: '/preview_03.jpg', title: lang === 'ko' ? '' : '' },
    { url: '/preview_04.jpg', title: lang === 'ko' ? '' : '' }
  ], [lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
          setPendingTimes(data.pendingSlots || []);
          setClosedTimes(data.closedSlots || []);
        }
      } catch (err) {
        console.error('Failed to retrieve slot lists:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    checkAvailability();
  }, [selectedDate]);

  // Unified OAuth Authentication Handler (Initiates Login)
  const handleAuthSubmit = async (provider: 'google' | 'kakao') => {
    setIsAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || `Failed to initialize ${provider === 'google' ? 'Google' : 'Kakao'} login.`);
      setIsAuthLoading(false);
    }
  };

  // Submit onboarding registration details
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAuthUser) return;

    if (!onboardingConsent) {
      alert(lang === 'ko' ? '개인정보 활용 동의에 체크해 주세요.' : 'Please consent to the privacy policy.');
      return;
    }
    if (!onboardingName.trim() || !onboardingPhone.trim()) {
      alert(lang === 'ko' ? '성함과 연락처 휴대폰 번호를 모두 입력해 주세요.' : 'Please provide both name and phone number.');
      return;
    }

    setIsOnboardingLoading(true);
    try {
      const consentTime = new Date().toISOString();
      const fallbackEmail = pendingAuthUser.email || `${pendingAuthUser.id}@user.oauth`;

      // Upsert the profile (creates if not exists, updates if incomplete)
      const { data: newProfile, error: upsertErr } = await supabase
        .from('users')
        .upsert({
          id: pendingAuthUser.id,
          email: fallbackEmail,
          name: onboardingName.trim(),
          phone: onboardingPhone.trim(),
          provider: pendingAuthUser.app_metadata?.provider || 'google',
          role: 'USER',
          is_admin: false,
          consent_given: true,
          consent_timestamp: consentTime
        }, { onConflict: 'id' })
        .select()
        .single();

      if (upsertErr) throw upsertErr;

      currentUserIdRef.current = newProfile.id;
      setCurrentUser(newProfile);
      setCustomerName(newProfile.name || '');
      setCustomerPhone(newProfile.phone || '');

      setShowOnboardingModal(false);
      setPendingAuthUser(null);
      alert(lang === 'ko' ? '회원 등록이 완료되었습니다!' : 'Registration completed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to complete registration.');
    } finally {
      setIsOnboardingLoading(false);
    }
  };

  const handleCancelOnboarding = async () => {
    await supabase.auth.signOut();
    currentUserIdRef.current = null;
    setCurrentUser(null);
    setPendingAuthUser(null);
    setShowOnboardingModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    currentUserIdRef.current = null;
    setCurrentUser(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleWithdrawMembership = async () => {
    if (!currentUser) return;
    
    const confirmMsg = lang === 'ko'
      ? '정말로 회원 탈퇴를 진행하시겠습니까?\n이름과 연락처를 포함한 회원 정보가 즉시 영구 삭제되며, 예약 정보와의 연결이 끊어집니다. 이 작업은 취소할 수 없습니다.'
      : 'Are you sure you want to withdraw your membership?\nYour personal details (name, phone) will be immediately and permanently deleted. This action cannot be undone.';
      
    if (!confirm(confirmMsg)) return;
    
    setIsWithdrawing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error(lang === 'ko' ? '로그인 세션 만료. 다시 로그인해 주세요.' : 'Session expired. Please log in again.');
      }
      
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete account.');
      }
      
      alert(lang === 'ko' ? '회원 탈퇴 및 개인정보 삭제가 완료되었습니다.' : 'Membership withdrawal and personal data deletion completed.');
      
      await supabase.auth.signOut();
      currentUserIdRef.current = null;
      setCurrentUser(null);
      setCustomerName('');
      setCustomerPhone('');
      
    } catch (err: any) {
      alert(err.message || (lang === 'ko' ? '계정 삭제 중 오류가 발생했습니다.' : 'Failed to delete account.'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Start Bulk Edit Mode for Administrator
  const handleStartBulkEdit = () => {
    setIsBulkEditMode(true);
    // Initialize bulk selected times with the currently closed slots
    setBulkSelectedTimes(closedTimes);
  };

  // Cancel Bulk Edit Mode
  const handleCancelBulkEdit = () => {
    setIsBulkEditMode(false);
    setBulkSelectedTimes([]);
  };

  // Save Bulk Closed Slots to Database
  const handleSaveBulkEdit = async () => {
    setIsSavingBulk(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert(lang === 'ko' ? '로그인 세션이 만료되었습니다. 다시 로그인 해주세요.' : 'Session expired. Please log in again.');
        setIsSavingBulk(false);
        return;
      }

      const res = await fetch('/api/admin/reservations/bulk-close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          times: bulkSelectedTimes
        })
      });

      if (res.ok) {
        alert(lang === 'ko' ? '예약 마감 설정이 성공적으로 반영되었습니다.' : 'Reservation block settings have been applied successfully.');
        setIsBulkEditMode(false);
        // Refresh slot lists
        const checkRes = await fetch(`/api/bookings?date=${selectedDate}`);
        if (checkRes.ok) {
          const data = await checkRes.json();
          setBookedTimes(data.bookedSlots || []);
          setPendingTimes(data.pendingSlots || []);
          setClosedTimes(data.closedSlots || []);
        }
      } else {
        const errData = await res.json();
        alert(errData.error || (lang === 'ko' ? '예약 마감 설정 저장에 실패했습니다.' : 'Failed to save reservation blocks.'));
      }
    } catch (err) {
      console.error('Error saving bulk blocks:', err);
      alert(lang === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.');
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Toggle selection of a time slot in bulk edit mode
  const handleToggleBulkSlot = (slot: string) => {
    // If the slot is already reserved by a customer (meaning booked but NOT closed by admin),
    // prevent toggling it, as customer reservations should not be cleared this way.
    const isCustomerReserved = bookedTimes.includes(slot) && !closedTimes.includes(slot);
    if (isCustomerReserved) {
      alert(lang === 'ko' ? '고객 예약이 완료된 시간대는 마감 모드에서 변경할 수 없습니다.' : 'Slots with customer reservations cannot be modified in close-out mode.');
      return;
    }

    setBulkSelectedTimes(prev =>
      prev.includes(slot) ? prev.filter(t => t !== slot) : [...prev, slot]
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedServiceId || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      setErrorMessage(lang === 'ko' ? '시술 정보와 예약 정보를 모두 확인해 주세요.' : 'Please choose your styling service, date, time slot, and check your details.');
      return;
    }

    if (!currentUser && !nonMemberPassword) {
      setErrorMessage(lang === 'ko' ? '비회원 예약 조회용 비밀번호를 입력해 주세요.' : 'Please enter a password for non-member query.');
      return;
    }

    if (!currentUser && nonMemberPassword.length < 4) {
      setErrorMessage(lang === 'ko' ? '비밀번호는 4자 이상으로 입력해야 합니다.' : 'Password must be at least 4 characters.');
      return;
    }

    if (!bookingConsent) {
      setErrorMessage(lang === 'ko' ? '개인정보 수집 및 이용에 동의해 주세요.' : 'Please accept the privacy consent to complete your booking.');
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
          password: currentUser ? null : nonMemberPassword
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
      setBookingConsent(false);
      setNonMemberPassword('');
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
    <div className="min-h-screen bg-stone-50 text-stone-950 antialiased flex flex-col">
      {/* Global Notice Banner */}
      {activeAnnouncement && (
        <div className="bg-amber-500 text-stone-955 text-[11px] sm:text-xs font-semibold py-2.5 px-4 text-center border-b border-amber-600/30 flex items-center justify-center gap-2 animate-fadeIn relative z-[60] shadow-sm">
          <span className="flex-1 tracking-wide">
            📢 {lang === 'ko' ? activeAnnouncement.details : (activeAnnouncement.details_en || activeAnnouncement.details)}
          </span>
          <button 
            onClick={() => setActiveAnnouncement(null)} 
            className="text-stone-955/65 hover:text-stone-955 absolute right-4 transition-colors font-bold cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}
      {/* Responsive 2-Tier Header */}
      <Header
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        notificationCount={notificationCount}
        notificationReservations={notificationReservations}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenInquiryModal={() => setShowInquiryModal(true)}
        onOpenInstallModal={() => setShowInstallModal(true)}
      />

      {/* Top Prominent App Installation Banner */}
      <InstallAppBanner lang={lang} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Editorial Hero Block */}
        <section className="relative bg-stone-955 text-stone-100 py-24 sm:py-36 px-4 border-b border-stone-800 animate-fadeIn overflow-hidden flex items-center justify-center min-h-[450px]">
          {/* Background image with brightness filter */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-110 sm:brightness-125 z-0"
            style={{ backgroundImage: "url('/banner_02.png')" }}
          />
          {/* Dark overlay to enhance text readability (reduced opacity for brightness) */}
          <div className="absolute inset-0 bg-black/25 z-0" />
          
          <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center justify-center min-h-[300px] py-8 sm:py-0 px-4">
            {/* Main Title Box (fits the text size exactly) */}
            <div className="bg-stone-950/65 backdrop-blur-[3px] py-4.5 px-8 sm:px-10 rounded-xl border border-white/15 shadow-2xl text-center max-w-max">
              <span className="text-xl sm:text-3xl font-mono tracking-[0.25em] text-gold-500 uppercase font-black block drop-shadow-md">
                {t.heroSub}
              </span>
            </div>
          </div>
        </section>

        {/* Shop Interior Slideshow Section */}
        <section className="bg-stone-50 border-b border-stone-200 py-10">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center space-y-2 mb-8">
              <span className="text-[10px] font-mono tracking-[0.2em] text-gold-600 uppercase font-bold block">
                {lang === 'ko' ? '공간 둘러보기' : 'SALON GALLERY'}
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-stone-900 font-normal">
                {lang === 'ko' ? '더 헤어 갤러리 내부 전경' : 'Explore Our Space'}
              </h2>
              <div className="h-[1px] w-12 bg-gold-500/45 mx-auto mt-2" />
            </div>

            {/* Slideshow Container */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-2xl border border-stone-200 shadow-lg bg-stone-900 group">
              {/* Slide Images */}
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  {/* Background image with brightness filter */}
                  <div 
                    className="absolute inset-0 filter brightness-135 sm:brightness-145"
                    style={{
                      backgroundImage: `url('${slide.url}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                  {/* Dark overlay for readability (reduced opacity for maximum brightness) */}
                  <div className="absolute inset-0 bg-black/5 z-10" />

                  {/* Caption */}
                  <div className="absolute bottom-6 left-6 right-6 z-20 text-left">
                    <p className="text-[10px] font-mono tracking-widest text-gold-400 uppercase font-semibold">
                      {lang === 'ko' ? `갤러리 0${idx + 1}` : `SPACE 0${idx + 1}`}
                    </p>
                    <h3 className="font-serif text-sm sm:text-lg text-white font-medium drop-shadow-sm mt-0.5">
                      {slide.title}
                    </h3>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm transition duration-300 opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm transition duration-300 opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Pagination Dots */}
              <div className="absolute bottom-6 right-6 z-20 flex gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentSlide ? 'w-5 bg-gold-400' : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Hair Portfolio Gallery Component */}
        <HairPortfolioGallery lang={lang} currentUser={currentUser} />

        {/* Dynamic Hair Gallery Price Guide Section */}
        <section id="price-section" className="bg-stone-100/60 border-y border-stone-200/80 py-12 px-4 sm:px-6">
          <PriceList lang={lang} currentUser={currentUser} isEmbedded={true} />
        </section>

        <div className="max-w-5xl mx-auto py-12 px-4">
          {/* 도움말 위젯 (Help & Booking Guide Widget) */}
          <div className="mb-8 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-gold-600" />
                <span className="font-serif text-sm font-bold text-stone-900">
                  {lang === 'ko' ? '초보자를 위한 1분 예약 가이드 💡' : '1-Minute Reservation Guide for Beginners 💡'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleHelpWidget}
                className="text-xs font-mono font-bold text-stone-600 hover:text-stone-950 flex items-center gap-1 cursor-pointer transition-colors border-none bg-transparent"
              >
                {showHelpWidget 
                  ? (lang === 'ko' ? '[도움말 접기]' : '[Hide Guide]') 
                  : (lang === 'ko' ? '[도움말 펼치기]' : '[Show Guide]')}
              </button>
            </div>

            {/* Expandable Body */}
            {showHelpWidget && (
              <div className="p-6 space-y-6 animate-fadeIn">
                {/* Stepper Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {[
                    { title: lang === 'ko' ? '1. 연락처 & 동의' : '1. Contact & Consent', icon: User },
                    { title: lang === 'ko' ? '2. 날짜 & 시간 선택' : '2. Date & Time', icon: CalendarIcon },
                    { title: lang === 'ko' ? '3. 시술 서비스 선택' : '3. Service Selection', icon: Scissors },
                    { title: lang === 'ko' ? '4. 예약 신청 완료' : '4. Complete Booking', icon: CheckCircle },
                  ].map((step, idx) => {
                    const StepIcon = step.icon;
                    const isActive = helpActiveStep === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHelpActiveStep(idx)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-stone-950 text-stone-100 border-stone-950 shadow-sm font-bold scale-[1.01]'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <StepIcon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-gold-550' : 'text-stone-500'}`} />
                        <span>{step.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Step Content Card */}
                <div className="p-5 bg-stone-50 border border-stone-200/60 rounded-xl text-xs leading-relaxed text-stone-750 space-y-3 relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 p-3 text-[48px] font-serif font-black text-stone-200/40 select-none pointer-events-none leading-none">
                    0{helpActiveStep + 1}
                  </div>

                  {helpActiveStep === 0 && (
                    <div className="space-y-2 text-left">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span>
                        {lang === 'ko' ? '회원 로그인 또는 연락처 직접 기입 및 개인정보 활용 동의' : 'Sign In or Direct Contact Info & Privacy Consent'}
                      </h4>
                      <p className="text-stone-600 pl-3">
                        {lang === 'ko' 
                          ? '• 상단 우측의 "로그인 / 회원가입"을 누르고 Google/Kakao 소셜 계정으로 로그인하시면, 예약 신청 시 성함과 연락처가 자동으로 연동되어 매번 기입할 필요가 없어 편리합니다.' 
                          : '• Click "Login / Sign Up" in the top header and sign in with your Google/Kakao social account. Your details will automatically sync, saving you time.'}
                      </p>
                      <p className="text-stone-600 pl-3">
                        {lang === 'ko' 
                          ? '• 로그인 없이 예약하시려면(비회원 예약), 아래의 "예약자 연락처 정보" 입력란에 직접 성함과 연락처 휴대폰 번호를 기입해 주세요.' 
                          : '• If you prefer booking as a guest, please manually fill in your "Full Name" and "Phone Number" in the contact details form below.'}
                      </p>
                      <p className="text-amber-800 font-semibold pl-3">
                        {lang === 'ko' 
                          ? '※ 필수의무 사항인 "개인정보 수집 및 이용에 동의합니다" 체크박스를 반드시 선택해 주셔야 예약 신청 버튼이 활성화됩니다.' 
                          : '※ Checking the mandatory "I agree to the collection and use of personal info" box is required to proceed.'}
                      </p>
                    </div>
                  )}

                  {helpActiveStep === 1 && (
                    <div className="space-y-2 text-left">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span>
                        {lang === 'ko' ? '예약 날짜 및 시간 선택' : 'Appointment Date & Time Slot Selection'}
                      </h4>
                      <p className="text-stone-600 pl-3">
                        {lang === 'ko' 
                          ? '• 화면 우측(모바일에서는 아래)의 "예약 날짜 선택" 달력에서 방문을 원하시는 날짜를 클릭하여 선택하세요. (지나간 날짜는 선택할 수 없습니다.)' 
                          : '• On the right side (or bottom on mobile), select your desired visit date from the calendar. Past dates cannot be booked.'}
                      </p>
                      <p className="text-stone-600 pl-3">
                        {lang === 'ko' 
                          ? '• 날짜를 고르고 나면 그 아래에 "선택 가능한 시간대" 목록이 활성화됩니다. 예약 가능한 시간 단추를 눌러 시간대를 선택하세요. (선이 그어진 시간은 예약 마감 혹은 마감된 시간대입니다.)' 
                          : '• Once a date is selected, the "Available Time Slots" list will appear underneath. Select a time slot. (Strikethrough slots are already blocked or reserved.)'}
                      </p>
                    </div>
                  )}

                  {helpActiveStep === 2 && (
                    <div className="space-y-2 text-left">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span>
                        {lang === 'ko' ? '시술 대분류 카테고리 선택' : 'Hair Styling Category Selection'}
                      </h4>
                      <p className="text-stone-600 pl-3">
                        {lang === 'ko' 
                          ? '• 아래 예약 폼의 "시술 대분류 선택" 상자에서 원하시는 시술 카테고리(커트, 염색, 펌, 클리닉, 스타일링, 샴푸, 업스타일)를 라디오 버튼으로 선택해 주세요.' 
                          : '• Select your desired procedure category (Cut, Color, Perm, Treatment, Styling, Shampoo, Upstyle) using radio buttons in the form below.'}
                      </p>
                      <p className="text-stone-600 pl-3">
                        {lang === 'ko' 
                          ? '• 세부 시술별 가변 가격표는 상단 [가격안내] 전용 페이지나 섹션에서 한눈에 확인하실 수 있습니다.' 
                          : '• Detailed procedure price guide is available in the Price Guide section or page.'}
                      </p>
                    </div>
                  )}

                  {helpActiveStep === 3 && (
                    <div className="space-y-2 text-left">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span>
                        {lang === 'ko' ? '예약 신청 및 완료 상태 확인' : 'Submitting Booking Request & Confirmation'}
                      </h4>
                      <p className="text-stone-600 pl-3">
                        {lang === 'ko' 
                          ? '• 1) 연락처/로그인, 2) 날짜/시간, 3) 시술 메뉴를 모두 채우고 개인정보 동의까지 체크하셨다면 하단의 "예약 신청하기" 단추가 활성화(노란색)됩니다.' 
                          : '• Once you complete: 1) Contact Info/Login, 2) Date/Time, 3) Styling Service, and check the privacy agreement, the "Request Reservation" button turns gold.'}
                      </p>
                      <p className="text-stone-600 pl-3">
                        {lang === 'ko' 
                          ? '• 버튼을 클릭하면 예약 신청이 접수되며, 매장에서 확인 후 승인하면 이메일로 "예약 확정" 상태가 전송됩니다. 마이페이지에서도 실시간 예약 현황을 조회하실 수 있습니다!' 
                          : '• Click the button to request your booking. Once confirmed, you will receive a notification email. You can also view your live reservation status under My Account.'}
                      </p>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setHelpActiveStep(0)}
                          className="px-3 py-1 bg-stone-950 text-white rounded hover:bg-stone-850 transition duration-200 cursor-pointer border-none font-bold"
                        >
                          {lang === 'ko' ? '가이드 처음으로' : 'Back to Step 1'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Navigation indicator dots */}
                  <div className="flex gap-1.5 justify-end pt-2 border-t border-stone-200/40">
                    {[0, 1, 2, 3].map((stepIdx) => (
                      <button
                        key={stepIdx}
                        type="button"
                        onClick={() => setHelpActiveStep(stepIdx)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          stepIdx === helpActiveStep ? 'w-4 bg-gold-500' : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                        }`}
                      />
                    ))}
                  </div>

                </div>
              </div>
            )}
          </div>

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

                    {/* Booking Pending & Rescheduling Alert Box */}
                    <div className="mt-5 p-4.5 bg-amber-500/5 border border-amber-200/40 rounded-xl text-left text-[11px] leading-relaxed text-stone-700 space-y-1.5 font-sans">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs mb-1">
                        ⚠️ {lang === 'ko' ? '예약 대기 및 시간 조율 안내' : 'Booking Pending & Rescheduling Notice'}
                      </span>
                      <p className="font-semibold text-amber-800">
                        {lang === 'ko' 
                          ? '• 신청하신 예약은 현재 [접수 대기] 상태이며, 아직 최종 확정이 아닙니다.' 
                          : '• Your requested booking is currently [Pending] and is not yet fully confirmed.'}
                      </p>
                      <p>
                        {lang === 'ko' 
                          ? '• 원장님이 확인 후, 남겨주신 전화번호로 직접 연락(전화 또는 카카오톡)을 드려 최종 시술 시간 조율이 필요할 수 있습니다.' 
                          : '• After review, the stylist will contact you directly via phone or KakaoTalk to coordinate and finalize the exact slot.'}
                      </p>
                      <p>
                        {lang === 'ko' 
                          ? '• 최종 조율 및 확인을 마친 후 예약이 [확정]되면 알림톡 및 안내 메일이 발송됩니다.' 
                          : '• Once coordinated, your booking status will change to [Confirmed] and you will receive notifications.'}
                      </p>
                    </div>

                    {/* Email Spam Filter Alert Warning Box */}
                    <div className="mt-3.5 p-4.5 bg-stone-50 border border-stone-200 rounded-xl text-left text-[11px] leading-relaxed text-stone-650 space-y-1 font-sans">
                      <span className="font-bold text-stone-900 block text-xs mb-1.5">
                        📧 {lang === 'ko' ? '예약 확정 이메일 수신 안내' : 'Booking Confirmation Email Notice'}
                      </span>
                      <p>
                        {lang === 'ko' 
                          ? '• 가입 시 사용하신 이메일 주소로 예약 확정 시 안내 메일이 발송됩니다.' 
                          : '• A confirmation email will be sent to your registered address once the booking is confirmed.'}
                      </p>
                      <p>
                        {lang === 'ko' 
                          ? '• 메일 서버 보안상 스팸메일함에 전달될 수 있으니 스팸함을 꼭 확인 부탁드립니다.' 
                          : '• The email may land in your Spam/Junk folder depending on server policies. Please check it.'}
                      </p>
                      <p className="font-semibold text-amber-700 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 inline-block mt-0.5">
                        {lang === 'ko' 
                          ? '• 예약 발송 이메일: thehairgalleryreservation@gmail.com' 
                          : '• Sender Address: thehairgalleryreservation@gmail.com'}
                      </p>
                    </div>
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
                                                      {/* Single 7 Procedure Categories Selection Form Widget */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                          <Scissors className="h-5 w-5 text-gold-600" />
                          {lang === 'ko' ? '시술 선택 (Service Category)' : 'Select Procedure Category'}
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {lang === 'ko' 
                            ? '원하시는 시술 대분류 카테고리를 라디오 버튼으로 1개 선택해 주세요.' 
                            : 'Please select 1 hair styling category using radio buttons.'}
                        </p>
                      </div>

                      <Link
                        href="/price"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-gold-700 border border-gold-400/60 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{lang === 'ko' ? '🏷️ 시술별 상세 가격표 보기' : '🏷️ View Detailed Price Guide'}</span>
                      </Link>
                    </div>

                    {/* 7 Procedure Categories Radio Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {RESERVATION_CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isSelected = selectedServiceId === cat.id || selectedServiceId === cat.nameKo || selectedServiceId === cat.nameKo.split(' ')[0];
                        return (
                          <label
                            key={cat.id}
                            className={`block p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'bg-stone-950 text-white border-gold-500/90 shadow-lg ring-2 ring-gold-500/50 scale-[1.01]' 
                                : 'bg-stone-50/50 border-stone-200 hover:border-stone-300 hover:bg-white text-stone-900'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="serviceCategoryRadio"
                                checked={isSelected}
                                onChange={() => setSelectedServiceId(cat.id)}
                                className="mt-1 accent-gold-400 h-4 w-4 shrink-0 cursor-pointer"
                              />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Icon className={`w-4 h-4 ${isSelected ? 'text-gold-400' : 'text-stone-500'}`} />
                                  <h3 
                                    className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}
                                    style={{ color: isSelected ? '#FFFFFF' : undefined }}
                                  >
                                    {lang === 'ko' ? cat.nameKo : cat.nameEn}
                                  </h3>
                                </div>
                                <p 
                                  className={`text-[11px] leading-normal pl-6 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}
                                  style={{ color: isSelected ? '#D6D3D1' : undefined }}
                                >
                                  {lang === 'ko' ? cat.descKo : cat.descEn}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>💡</span>
                        <span>{lang === 'ko' ? '시술별 디테일한 세부 가변 가격표는 [가격안내] 전용 페이지에서 언제든지 확인할 수 있습니다.' : 'Detailed procedure price guide is available on the Price Guide page.'}</span>
                      </span>
                      <Link href="/price" className="text-amber-950 font-bold underline shrink-0 hover:text-gold-700 text-xs">
                        {lang === 'ko' ? '가격안내 바로가기 →' : 'Price Guide →'}
                      </Link>
                    </div>
                  </div>

                  {/* Customer Info Box (Includes Privacy Consent for direct input) */}
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
                          onChange={e => setCustomerPhone(formatPhoneNumber(e.target.value))}
                          placeholder={lang === 'ko' ? '010-1234-5678' : '+82-10-1234-5678'}
                          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:border-stone-400 transition-colors"
                        />
                      </div>
                      {!currentUser && (
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] uppercase font-mono text-stone-400">
                            {lang === 'ko' ? '비회원 예약 조회용 비밀번호 (4자 이상)' : 'Query Password (4+ characters)'}
                          </label>
                          <input
                            type="password"
                            required
                            value={nonMemberPassword}
                            onChange={e => setNonMemberPassword(e.target.value)}
                            placeholder={lang === 'ko' ? '비밀번호 입력' : 'Enter password'}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:border-stone-400 transition-colors"
                          />
                          <p className="text-[9px] text-stone-500 font-sans mt-1">
                            {lang === 'ko' 
                              ? '※ 비회원 예약 조회 및 취소 시 사용됩니다. 안전한 비밀번호를 입력해주세요 (4자 이상).' 
                              : '※ Used for non-member query and cancellation. Enter a secure password (4+ characters).'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Consent Checkbox */}
                    <div className="pt-2 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer justify-start">
                        <input 
                          type="checkbox"
                          required
                          checked={bookingConsent}
                          onChange={e => setBookingConsent(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-stone-950 text-left">
                          {t.privacyConsent}
                        </span>
                      </label>

                      <details className="border border-stone-200 rounded-lg bg-stone-50 text-[10px] outline-none">
                        <summary className="font-semibold text-stone-700 py-2 px-3 select-none cursor-pointer outline-none hover:bg-stone-100 rounded-t-lg transition-colors flex items-center justify-between text-left">
                          <span>{t.privacyDetailsTitle}</span>
                        </summary>
                        <div className="p-3 border-t border-stone-200 text-stone-600 whitespace-pre-line leading-relaxed bg-white rounded-b-lg text-left">
                          {t.privacyDetailsContent}
                        </div>
                      </details>
                    </div>

                    {errorMessage && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedDate || !selectedTime || !selectedServiceId || !bookingConsent}
                      className={`w-full py-3.5 text-stone-900 text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md transition-transform active:scale-[0.98] ${
                        selectedDate && selectedTime && selectedServiceId && bookingConsent
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                      <ClockIcon />
                      <span>{t.availableSlots}</span>
                    </h3>
                    {currentUser && currentUser.role === 'ADMIN' && !isBulkEditMode && (
                      <button
                        type="button"
                        onClick={handleStartBulkEdit}
                        className="px-2.5 py-1 text-[10px] font-semibold text-gold-600 border border-gold-300 hover:border-gold-500 rounded bg-white hover:bg-gold-50 transition duration-200 cursor-pointer"
                      >
                        {lang === 'ko' ? '예약 마감 수정' : 'Manage Blocks'}
                      </button>
                    )}
                  </div>

{/* Bulk Edit Mode Block */}
                  {isBulkEditMode && (
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2.5 text-xs text-left">
                      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                        <span>🛠️ {lang === 'ko' ? '예약 마감 수정 모드' : 'Bulk Block Mode'}</span>
                        <span className="text-gold-600">
                          {bulkSelectedTimes.length} {lang === 'ko' ? '개 선택됨' : 'selected'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-relaxed">
                        {lang === 'ko' 
                          ? '• 마감하려는 시간대를 클릭하여 선택하세요. 일반 고객 예약은 수정할 수 없습니다.' 
                          : '• Click time slots to toggle blocks. Existing client reservations cannot be modified.'}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isSavingBulk}
                          onClick={handleCancelBulkEdit}
                          className="flex-1 py-2 text-[11px] font-semibold text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-100 transition duration-200 cursor-pointer bg-white"
                        >
                          {lang === 'ko' ? '취소' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          disabled={isSavingBulk}
                          onClick={handleSaveBulkEdit}
                          className="flex-1 py-2 text-[11px] font-semibold text-white bg-stone-950 hover:bg-stone-850 rounded-lg transition duration-200 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingBulk 
                            ? (lang === 'ko' ? '저장 중...' : 'Saving...') 
                            : (lang === 'ko' ? '수정 완료' : 'Save')}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {isLoadingSlots ? (
                    <div className="text-center py-6 text-xs text-stone-400 font-mono">{t.checkingSchedules}</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                       {TIME_SLOTS_24H.map(slot => {
                        const isCustomerReserved = bookedTimes.includes(slot) && !closedTimes.includes(slot);
                        const isBooked = bookedTimes.includes(slot);
                        const isPending = pendingTimes.includes(slot);
                        const isSelected = selectedTime === slot;
                        const isAdminClosedInMode = bulkSelectedTimes.includes(slot);

                        if (isBulkEditMode) {
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isCustomerReserved}
                              onClick={() => handleToggleBulkSlot(slot)}
                              className={`py-2.5 text-xs font-mono font-semibold rounded border transition-colors cursor-pointer ${
                                isCustomerReserved
                                  ? 'bg-stone-100 text-stone-300 border-stone-100 line-through cursor-not-allowed'
                                  : isAdminClosedInMode
                                  ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                              }`}
                            >
                              {slot} {isAdminClosedInMode && (lang === 'ko' ? '(마감)' : '(Closed)')}
                            </button>
                          );
                        }

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => {
                              if (isPending) {
                                const confirmMsg = lang === 'ko'
                                  ? '⚠️ 이 시간대는 현재 다른 고객님의 예약이 대기 중입니다. 원장님과의 전화/카톡 조율을 통해 시술 시간이 조정될 수 있습니다. 이대로 예약을 진행하시겠습니까?'
                                  : '⚠️ This slot is currently pending for another client. Stylist may need to reschedule. Proceed?';
                                if (!confirm(confirmMsg)) {
                                  return;
                                }
                              }
                              setSelectedTime(slot);
                            }}
                            className={`py-2.5 text-xs font-mono font-semibold rounded border transition-colors cursor-pointer flex flex-col items-center justify-center ${
                              isBooked
                                ? 'bg-stone-100 text-stone-300 border-stone-100 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-stone-950 text-stone-100 border-stone-950 font-bold'
                                : isPending
                                ? 'bg-amber-50/70 text-amber-700/80 border-amber-200/60 line-through hover:bg-amber-50'
                                : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                            }`}
                          >
                            <span>{slot}</span>
                            {isPending && !isSelected && (
                              <span className="text-[8px] no-underline block text-amber-600 font-sans font-bold mt-0.5 leading-none">
                                {lang === 'ko' ? '대기중' : 'Pending'}
                              </span>
                            )}
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
                  <div className="space-y-4 font-mono text-[11px]">
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

                    {/* Account Withdrawal / Data Deletion Widget */}
                    <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
                      <button
                        onClick={handleWithdrawMembership}
                        disabled={isWithdrawing}
                        className="w-full text-center py-2 px-3 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        {isWithdrawing 
                          ? (lang === 'ko' ? '탈퇴 처리 중...' : 'Processing...') 
                          : (lang === 'ko' ? '내 정보 및 계정 삭제 (회원 탈퇴)' : 'Delete My Data & Account (Withdrawal)')}
                      </button>
                      <p className="text-[10px] text-stone-400 font-sans font-light leading-relaxed">
                        {lang === 'ko' 
                          ? '※ 정보 삭제 시 이름과 연락처는 즉시 파기되며, 예약 내역은 비식별화(무기명) 처리되어 안전하게 지워집니다.' 
                          : '※ Upon deletion, your name and phone number are immediately destroyed, and reservation history is unlinked (anonymized) safely.'}
                      </p>
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

        {/* Main Board Section & Dedicated Store Location Section */}
        <div className="max-w-5xl mx-auto px-4 my-12 w-full space-y-12">
          {/* Main Board Section */}
          <BoardSection 
            currentUser={currentUser} 
            onOpenLoginModal={() => setShowAuthModal(true)} 
            lang={lang} 
          />

          <section id="store-location" className="bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-6 text-stone-100 animate-fadeIn scroll-mt-24 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-6 text-left">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>LOCATION & DIRECTIONS</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">
                  {lang === 'ko' ? '오시는 길 & 매장 안내' : 'Store Location & Directions'}
                </h2>
                <p className="text-xs text-stone-400">
                  {lang === 'ko' ? '더 헤어 갤러리를 찾아오시는 길을 원하시는 지도로 빠르게 안내해 드립니다.' : 'Find your way to The Hair Gallery easily with map navigation.'}
                </p>
              </div>

              {/* Map Direct Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a 
                  href="https://place.map.kakao.com/656750040" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#191919] bg-[#FEE500] hover:bg-[#FEE500]/90 px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>🟡 카카오맵 바로가기</span>
                </a>

                <a 
                  href="https://naver.me/IFEOOT3j" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#03C75A] hover:bg-[#03C75A]/90 px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>🟢 네이버지도 바로가기</span>
                </a>

                <a 
                  href="https://maps.app.goo.gl/AzNDXDy9uLtMB5u3A" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-stone-900 border border-stone-800 px-4 py-2.5 rounded-xl transition-all hover:bg-stone-850 shadow-md cursor-pointer"
                >
                  <span>📍 구글 지도 (Google Maps)</span>
                </a>
              </div>
            </div>

            {/* Info Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Address Card */}
              <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl space-y-2">
                <div className="text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>ADDRESS (주소)</span>
                </div>
                <p className="text-stone-200 text-xs leading-relaxed">
                  {lang === 'ko'
                    ? '경기도 김포시 북변동 806번지 상가동 103호 (풍년마을 삼성3단지 아파트 상가)'
                    : 'Room 103, Commercial Bldg, Pungnyeon Maeul Samsung 3-danji Apt, 806, Bukbyeon-dong, Gimpo-si, Gyeonggi-do, KR'}
                </p>
              </div>

              {/* Hours Card */}
              <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl space-y-2">
                <div className="text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>BUSINESS HOURS (영업 시간)</span>
                </div>
                <p className="text-stone-200 text-xs leading-relaxed">
                  {lang === 'ko' ? '매일 10:30 - 19:30 (100% 우선 예약제 운영)' : 'Daily 10:30 - 19:30 (100% Reservation Based)'}
                </p>
              </div>

              {/* Contact & Parking Card */}
              <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl space-y-2">
                <div className="text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Scissors className="w-4 h-4" />
                  <span>PARKING & CONTACT (주차 및 문의)</span>
                </div>
                <p className="text-stone-200 text-xs leading-relaxed">
                  {lang === 'ko'
                    ? '아파트 상가 주차장 이용 가능 / 전화 문의 및 온라인 예약 지원'
                    : 'Apartment commercial parking space available / Online booking supported'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-300 py-12 border-t border-stone-800">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <div className="text-sm font-mono tracking-widest text-gold-500 uppercase font-bold">
            THE HAIR GALLERY
          </div>
          <div className="text-xs text-stone-400 space-y-3">
            <p className="font-light">
              {lang === 'ko' 
                ? '주소: 경기도 김포시 북변동 806번지 상가동 103호 풍년마을삼성3단지아파트' 
                : 'Address: Room 103, Commercial Bldg, Pungnyeon Maeul Samsung 3-danji Apt, 806, Bukbyeon-dong, Gimpo-si, Gyeonggi-do, KR'}
            </p>

            {/* Map Action Links (Kakao Map, Naver Map, Google Maps) */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <a 
                href="https://place.map.kakao.com/656750040" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#191919] bg-[#FEE500] hover:bg-[#FEE500]/90 px-3.5 py-1.5 rounded-lg transition-transform active:scale-95 shadow-sm"
              >
                <span className="font-bold">🟡 카카오맵 (Kakao Map)</span>
              </a>

              <a 
                href="https://naver.me/IFEOOT3j" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-[#03C75A] hover:bg-[#03C75A]/90 px-3.5 py-1.5 rounded-lg transition-transform active:scale-95 shadow-sm"
              >
                <span className="font-bold">🟢 네이버지도 (Naver Map)</span>
              </a>

              <a 
                href="https://maps.app.goo.gl/AzNDXDy9uLtMB5u3A" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-gold-500 hover:text-gold-400 transition-colors bg-stone-900 border border-stone-800 px-3.5 py-1.5 rounded-lg hover:bg-stone-850"
              >
                <span>📍 Google Maps (구글지도)</span>
              </a>
            </div>

            {/* Component Inquiry Footer Link */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setInquiryDefaultComp('하단 푸터 & 지도 (Footer & Map)');
                  setShowInquiryModal(true);
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-400 hover:text-amber-300 underline transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>{lang === 'ko' ? '💬 일반 문의 및 컴포넌트 지정 문의' : '💬 General & Component Inquiry'}</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-stone-600 font-mono pt-4">
            © {new Date().getFullYear()} THE HAIR GALLERY. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating Component Inquiry Button */}
      <button
        type="button"
        onClick={() => {
          setInquiryDefaultComp('메인 소개 / 메인 갤러리 (Hero & Gallery)');
          setShowInquiryModal(true);
        }}
        className="fixed bottom-6 right-6 z-40 bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2.5 rounded-full shadow-2xl font-mono text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-amber-300/40 cursor-pointer"
        title="일반 문의 및 컴포넌트 지정 문의"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span className="hidden sm:inline">{lang === 'ko' ? '일반 문의 및 컴포넌트 지정 문의' : 'General & Component Inquiry'}</span>
      </button>

      {/* Component Inquiry Modal */}
      <ComponentInquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        defaultTargetComponent={inquiryDefaultComp}
        currentUser={currentUser}
        lang={lang}
      />

      {/* Install App Guide Modal */}
      <InstallAppGuide
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        lang={lang}
      />

      {/* Auth Modal (Unified Login & Sign Up) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-stone-950 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                  <Key className="h-5 w-5 text-gold-500" />
                  {lang === 'ko' ? '더 헤어 갤러리 시작하기' : 'Start with The Hair Gallery'}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono mt-1">OAuth 2.0 Secure Gateway</p>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-stone-400 hover:text-white text-lg font-bold cursor-pointer outline-none"
              >
                ✕
              </button>
            </div>

            {/* Unified Modal Body */}
            <div className="p-6 space-y-5">
              {/* Informational guide */}
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider block">로그인 안내 (Notice)</span>
                <p className="text-[10px] text-stone-600 leading-relaxed font-sans font-light">
                  {lang === 'ko' 
                    ? '• SNS 계정을 이용하여 간편하게 로그인을 진행해 주세요.' 
                    : '• Please sign in easily using your social account.'}
                </p>
                <p className="text-[10px] text-stone-600 leading-relaxed font-sans font-light">
                  {lang === 'ko' 
                    ? '• 처음 방문하시는 신규 회원인 경우, 로그인 후 회원 등록(이름/연락처 입력) 창으로 자동 연결됩니다.' 
                    : '• First-time users will be automatically redirected to complete registration (enter name/phone) after login.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isAuthLoading}
                  onClick={() => handleAuthSubmit('google')}
                  className="w-full py-3.5 border border-stone-300 hover:bg-stone-50 text-stone-900 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  <span className="bg-white p-0.5 rounded-sm shrink-0 border border-stone-200"><GoogleLogo /></span>
                  <span>{isAuthLoading ? (lang === 'ko' ? '인증 진행 중...' : 'Processing...') : (lang === 'ko' ? 'Google 계정으로 시작하기' : 'Start with Google')}</span>
                </button>

                <button
                  type="button"
                  disabled={isAuthLoading}
                  onClick={() => handleAuthSubmit('kakao')}
                  className="w-full py-3.5 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  <span className="shrink-0"><KakaoLogo /></span>
                  <span>{isAuthLoading ? (lang === 'ko' ? '인증 진행 중...' : 'Processing...') : (lang === 'ko' ? '카카오 계정으로 시작하기' : 'Start with Kakao')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal (Complete Profile for New/Incomplete users) */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-stone-950 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-gold-500" />
                  {lang === 'ko' ? '추가 정보 입력' : 'Complete Profile'}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono mt-1">First-time Registration Onboarding</p>
              </div>
              <button 
                onClick={handleCancelOnboarding}
                className="text-stone-400 hover:text-white text-lg font-bold cursor-pointer outline-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleOnboardingSubmit} className="p-6 space-y-5">
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 space-y-1 text-left">
                <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider block">회원 등록 안내 (Welcome)</span>
                <p className="text-[10px] text-stone-600 leading-relaxed font-sans font-light">
                  {lang === 'ko' 
                    ? '반갑습니다! 예약을 진행하고 이용 내역을 확인하기 위해 이름과 연락처를 입력해 주세요.' 
                    : 'Welcome! Please enter your name and phone number to complete your reservation profile.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-mono text-stone-400 block">고객 성함 *</label>
                  <input 
                    type="text" 
                    required
                    value={onboardingName}
                    onChange={e => setOnboardingName(e.target.value)}
                    placeholder={lang === 'ko' ? '예: 홍길동' : 'e.g. John Doe'}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:border-stone-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-mono text-stone-400 block">연락처 휴대폰 번호 *</label>
                  <input 
                    type="tel" 
                    required
                    value={onboardingPhone}
                    onChange={e => setOnboardingPhone(formatPhoneNumber(e.target.value))}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50 focus:border-stone-400 transition-colors"
                  />
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer justify-start">
                    <input 
                      type="checkbox"
                      required
                      checked={onboardingConsent}
                      onChange={e => setOnboardingConsent(e.target.checked)}
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
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelOnboarding}
                  className="flex-1 py-3 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer text-center"
                >
                  {lang === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isOnboardingLoading}
                  className="flex-1 py-3 bg-stone-950 hover:bg-stone-850 text-stone-100 text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 text-center"
                >
                  {isOnboardingLoading ? (lang === 'ko' ? '등록 중...' : 'Submitting...') : (lang === 'ko' ? '등록 완료' : 'Complete')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-stone-955 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-serif text-base font-semibold flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-gold-500" />
                  {editingService.isNew 
                    ? (lang === 'ko' ? '시술 선택지 추가' : 'Add Service Option') 
                    : (lang === 'ko' ? '시술 선택지 수정' : 'Edit Service Option')}
                </h3>
                {!editingService.isNew && (
                  <p className="text-[10px] text-stone-400 font-mono mt-1">ID: {editingService.id}</p>
                )}
              </div>
              <button 
                onClick={() => setEditingService(null)}
                className="text-stone-400 hover:text-white text-lg font-bold cursor-pointer outline-none"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleUpdateService(editingService);
              setEditingService(null);
            }} className="p-6 space-y-4">

              {/* Service ID (Only shown if isNew) */}
              {editingService.isNew && (
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">
                    {lang === 'ko' ? '서비스 ID (기본키)' : 'Service ID'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingService.id}
                    onChange={(e) => setEditingService({ ...editingService, id: e.target.value })}
                    placeholder="예: s8"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none bg-stone-50"
                  />
                </div>
              )}

              {/* Name (Korean) */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">
                  {lang === 'ko' ? '시술 명 (한국어)' : 'Service Name (Korean)'} *
                </label>
                <input
                  type="text"
                  required
                  value={editingService.name_ko || editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name_ko: e.target.value, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none bg-stone-50"
                />
              </div>

              {/* Name (English) */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">
                  {lang === 'ko' ? '시술 명 (영어)' : 'Service Name (English)'}
                </label>
                <input
                  type="text"
                  value={editingService.name_en || ''}
                  onChange={(e) => setEditingService({ ...editingService, name_en: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none bg-stone-50"
                />
              </div>

              {/* Price */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">
                  {lang === 'ko' ? '가격 (Price) - 입력하지 않으면 가격문의' : 'Price (Empty for Inquiry)'}
                </label>
                <input
                  type="number"
                  placeholder={lang === 'ko' ? '가격 문의' : 'Inquiry'}
                  value={editingService.price !== null && editingService.price !== undefined ? editingService.price : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingService({ ...editingService, price: val === '' ? null : Number(val) });
                  }}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none bg-stone-50"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">
                  {lang === 'ko' ? '시술 시간 (분) (Duration minutes)' : 'Duration (minutes)'}
                </label>
                <input
                  type="number"
                  required
                  value={editingService.durationMinutes}
                  onChange={(e) => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none bg-stone-50"
                />
              </div>

              {/* Description (Korean) */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">
                  {lang === 'ko' ? '상세 설명 (한국어)' : 'Description (Korean)'}
                </label>
                <textarea
                  rows={2}
                  value={editingService.description_ko || editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description_ko: e.target.value, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none resize-none leading-relaxed bg-stone-50"
                />
              </div>

              {/* Description (English) */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">
                  {lang === 'ko' ? '상세 설명 (영어)' : 'Description (English)'}
                </label>
                <textarea
                  rows={2}
                  value={editingService.description_en || ''}
                  onChange={(e) => setEditingService({ ...editingService, description_en: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none resize-none leading-relaxed bg-stone-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-850 text-xs font-semibold rounded-lg transition-colors tracking-wider"
                >
                  {lang === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-stone-950 hover:bg-stone-850 text-white text-xs font-semibold rounded-lg transition-colors tracking-wider"
                >
                  {lang === 'ko' ? '저장' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline sub-components for layout safety
function ClockIcon() {
  return (
    <Clock className="h-4.5 w-4.5 text-gold-600 shrink-0" />
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

function KakaoLogo() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c-5.52 0-10 3.48-10 7.78 0 2.76 1.83 5.17 4.59 6.55-.18.66-.66 2.4-0.76 2.79-.13.51.18.5.38.37.16-.11 2.59-1.76 3.65-2.48.69.09 1.4.15 2.14.15 5.52 0 10-3.48 10-7.78S17.52 3 12 3z"/>
    </svg>
  );
}
