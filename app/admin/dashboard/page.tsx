'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Phone, 
  Check, 
  X, 
  LayoutDashboard, 
  Lock, 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Database,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Bell,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Info,
  Users,
  Scissors,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { TRANSLATIONS, getLocalizedServices } from '@/lib/i18n';
import { getSupabaseClient } from '@/lib/supabase';

const matchCleanedPhone = (phoneStr: string | null | undefined, queryStr: string) => {
  if (!phoneStr) return false;
  const p = phoneStr.replace(/[^0-9]/g, '');
  const q = queryStr.replace(/[^0-9]/g, '');
  if (!q) return false;
  return p.includes(q);
};


// Standard 24h styling slots
const TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function AdminDashboard() {
  const [lang, setLangState] = useState<'ko' | 'en'>('ko');
  const [activeTab, setActiveTab] = useState<'reservations' | 'work-records' | 'sales' | 'customers' | 'services' | 'admin-settings'>('reservations');
  
  // Admin user notification setting states
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState<boolean>(false);
  const [isTogglingAdmin, setIsTogglingAdmin] = useState<string | null>(null);

  // Bulk reservation delete states
  const [selectedResIds, setSelectedResIds] = useState<string[]>([]);
  const [isDeletingRes, setIsDeletingRes] = useState<boolean>(false);

  // Email usage states
  const [emailUsage, setEmailUsage] = useState<any | null>(null);
  const [isLoadingEmailUsage, setIsLoadingEmailUsage] = useState<boolean>(false);
  
  // Reservations states
  const [reservations, setReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sendClientNotify, setSendClientNotify] = useState<boolean>(true);

  // Admin Calendar & Timeline states
  const [adminSelectedDate, setAdminSelectedDate] = useState<string>('');
  const [adminYear, setAdminYear] = useState<number>(new Date().getFullYear());
  const [adminMonth, setAdminMonth] = useState<number>(new Date().getMonth());

  // Manual Reservation Modal states
  const [showResModal, setShowResModal] = useState<boolean>(false);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [resSelectedUserId, setResSelectedUserId] = useState<string>('');
  const [resCustomerName, setResCustomerName] = useState<string>('');
  const [resCustomerPhone, setResCustomerPhone] = useState<string>('');
  const [resServiceId, setResServiceId] = useState<string>('');
  const [resDate, setResDate] = useState<string>('');
  const [resTime, setResTime] = useState<string>('10:00');
  const [resStatus, setResStatus] = useState<string>('Confirmed');
  const [resPrice, setResPrice] = useState<string>('');

  // Work Records states
  const [workRecords, setWorkRecords] = useState<any[]>([]);
  const [searchWorkQuery, setSearchWorkQuery] = useState<string>('');
  const [isWorkLoading, setIsWorkLoading] = useState<boolean>(false);
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState<boolean>(false);
  
  // Work Records Form states
  const [showWorkModal, setShowWorkModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [workSelectedUserId, setWorkSelectedUserId] = useState<string>('');
  const [workSelectedPastKey, setWorkSelectedPastKey] = useState<string>('');
  const [workCustomerName, setWorkCustomerName] = useState<string>('');
  const [workCustomerPhone, setWorkCustomerPhone] = useState<string>('');
  const [workContent, setWorkContent] = useState<string>('');
  const [workAmount, setWorkAmount] = useState<number | ''>('');
  const [workDate, setWorkDate] = useState<string>('');

  // Customer Management states
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState<boolean>(false);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [custName, setCustName] = useState<string>('');
  const [custPrice, setCustPrice] = useState<number | ''>('');
  const [custWorkMenu, setCustWorkMenu] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');

  // Telegram Settings States
  const [telegramAlertConfirm, setTelegramAlertConfirm] = useState<boolean>(true);
  const [telegramDailyBriefing, setTelegramDailyBriefing] = useState<boolean>(true);
  const [isUpdatingTelegramSettings, setIsUpdatingTelegramSettings] = useState<boolean>(false);

  // Announcement States
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annDetails, setAnnDetails] = useState<string>('');
  const [annDetailsEn, setAnnDetailsEn] = useState<string>('');
  const [annStartTime, setAnnStartTime] = useState<string>('');
  const [annEndTime, setAnnEndTime] = useState<string>('');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');

  // Service Management states
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [svcId, setSvcId] = useState<string>('');
  const [svcName, setSvcName] = useState<string>('');
  const [svcNameEn, setSvcNameEn] = useState<string>('');
  const [svcPrice, setSvcPrice] = useState<number | ''>('');
  const [svcDuration, setSvcDuration] = useState<number>(30);
  const [svcDescription, setSvcDescription] = useState<string>('');
  const [svcDescriptionEn, setSvcDescriptionEn] = useState<string>('');
  const [svcCategory, setSvcCategory] = useState<string>('Cut');

  // Sales statistics states
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>('');
  const [selectedMonthlyYear, setSelectedMonthlyYear] = useState<number>(new Date().getFullYear());
  const [selectedMonthlyMonth, setSelectedMonthlyMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYearlyYear, setSelectedYearlyYear] = useState<number>(new Date().getFullYear());

  // Authorization states
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null); // null means checking
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [adminProfile, setAdminProfile] = useState<any | null>(null);
  const [mobileOptimized, setMobileOptimized] = useState<boolean>(true);

  const supabase = getSupabaseClient();

  // Sync language with localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('tg_lang') as 'ko' | 'en';
    if (savedLang === 'ko' || savedLang === 'en') {
      setLangState(savedLang);
    }
    
    const savedNotify = localStorage.getItem('tg_send_client_notify');
    if (savedNotify !== null) {
      setSendClientNotify(savedNotify === 'true');
    }

    const savedOpt = localStorage.getItem('tg_mobile_optimized');
    if (savedOpt !== null) {
      setMobileOptimized(savedOpt === 'true');
    }
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    setWorkDate(today);
    setResDate(today);
    setSelectedDailyDate(today);
    setAdminSelectedDate(today);
  }, []);

  const setLang = (newLang: 'ko' | 'en') => {
    setLangState(newLang);
    localStorage.setItem('tg_lang', newLang);
  };

  const handleToggleMobileOptimized = async () => {
    const nextVal = !mobileOptimized;
    setMobileOptimized(nextVal);
    localStorage.setItem('tg_mobile_optimized', nextVal ? 'true' : 'false');

    if (adminProfile) {
      try {
        await supabase
          .from('users')
          .update({ mobile_optimized: nextVal })
          .eq('id', adminProfile.id);
        
        setAdminProfile((prev: any) => ({ ...prev, mobile_optimized: nextVal }));
      } catch (err) {
        console.error('Failed to update mobile optimization in DB:', err);
      }
    }
  };

  // Check Admin Authorization
  useEffect(() => {
    async function checkAdminSession() {
      setCheckingAuth(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Query users table for role (user_role) = 'ADMIN'
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile && profile.role === 'ADMIN') {
            setIsAdminAuthorized(true);
            setAdminProfile(profile);
            
            // Sync mobile optimization state
            if (profile.mobile_optimized !== undefined && profile.mobile_optimized !== null) {
              setMobileOptimized(profile.mobile_optimized);
            }
          } else {
            setIsAdminAuthorized(false);
          }
        } else {
          setIsAdminAuthorized(false);
        }
      } catch (err) {
        console.error('Failed to authorize admin session:', err);
        setIsAdminAuthorized(false);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAdminSession();
  }, []);

  // Load Admin Reservations Data (only if authorized)
  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch('/api/admin/reservations', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }); // Secured dashboard route
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      } else {
        // Standard mock fallback
        setReservations([
          { id: 'r-1', customerName: '김선영', customerPhone: '010-4321-8891', serviceName: '발레아쥬 컬러 터치', price: 13000, date: '2026-07-14', time: '10:00', status: 'Confirmed' },
          { id: 'r-2', customerName: '박민준', customerPhone: '010-7621-1104', serviceName: '시그니처 컷 & 블로우아웃', price: 15000, date: '2026-07-14', time: '13:00', status: 'Pending' },
          { id: 'r-3', customerName: '이지은', customerPhone: '010-9014-4432', serviceName: '두피 테라피 & 트리트먼트', price: 12000, date: '2026-07-15', time: '15:30', status: 'Confirmed' }
        ]);
      }
    } catch (err) {
      console.error('Failed to load active reservations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthorized !== true) return;
    loadReservations();
  }, [isAdminAuthorized]);

  // Load and manage administrators receive_notifications configuration
  const loadAdminUsers = async () => {
    setIsLoadingAdmins(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.adminUsers || []);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleToggleAdminNotification = async (userId: string, currentStatus: boolean) => {
    setIsTogglingAdmin(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          receiveNotifications: !currentStatus
        })
      });

      if (res.ok) {
        setAdminUsers(prev =>
          prev.map(u => u.id === userId ? { ...u, receive_notifications: !currentStatus } : u)
        );
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update alert settings.');
      }
    } catch (err) {
      console.error('Failed to toggle admin notification flag:', err);
    } finally {
      setIsTogglingAdmin(null);
    }
  };

  const loadEmailUsage = async () => {
    setIsLoadingEmailUsage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/email-usage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEmailUsage(data);
      }
    } catch (err) {
      console.error('Failed to load email usage statistics:', err);
    } finally {
      setIsLoadingEmailUsage(false);
    }
  };

  const loadAdminSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value');
      if (error) throw error;
      if (data) {
        data.forEach(item => {
          if (item.key === 'telegram_alert_confirm') setTelegramAlertConfirm(item.value);
          if (item.key === 'telegram_daily_briefing') setTelegramDailyBriefing(item.value);
        });
      }
    } catch (err) {
      console.error('Failed to load admin settings:', err);
    }
  };

  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    setIsUpdatingTelegramSettings(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value: !currentValue })
        .eq('key', key);
      
      if (error) throw error;
      
      if (key === 'telegram_alert_confirm') setTelegramAlertConfirm(!currentValue);
      if (key === 'telegram_daily_briefing') setTelegramDailyBriefing(!currentValue);
    } catch (err: any) {
      console.error('Failed to update setting:', err);
      alert('설정 변경 실패: ' + err.message);
    } finally {
      setIsUpdatingTelegramSettings(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annDetails || !annStartTime || !annEndTime) {
      alert(lang === 'ko' ? '모든 필드를 입력해 주세요.' : 'Please fill all fields.');
      return;
    }
    
    setIsSavingAnnouncement(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([
          {
            details: annDetails,
            details_en: annDetailsEn || null,
            start_time: new Date(annStartTime).toISOString(),
            end_time: new Date(annEndTime).toISOString()
          }
        ]);

      if (error) throw error;

      alert(lang === 'ko' ? '공지사항이 성공적으로 등록되었습니다.' : 'Announcement registered successfully.');
      setAnnDetails('');
      setAnnDetailsEn('');
      setAnnStartTime('');
      setAnnEndTime('');
      await loadAnnouncements();
    } catch (err: any) {
      console.error('Failed to save announcement:', err);
      alert('공지사항 등록 실패: ' + err.message);
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm(lang === 'ko' ? '정말 이 공지사항을 삭제하시겠습니까?' : 'Are you sure you want to delete this announcement?')) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAnnouncements();
    } catch (err: any) {
      console.error('Failed to delete announcement:', err);
      alert('공지사항 삭제 실패: ' + err.message);
    }
  };

  useEffect(() => {
    if (isAdminAuthorized && activeTab === 'admin-settings') {
      loadAdminUsers();
      loadEmailUsage();
      loadAdminSettings();
      loadAnnouncements();
    }
  }, [isAdminAuthorized, activeTab]);

  // Bulk reservation delete handlers
  const handleToggleAllReservations = () => {
    if (selectedResIds.length === filteredReservations.length && filteredReservations.length > 0) {
      setSelectedResIds([]);
    } else {
      setSelectedResIds(filteredReservations.map(r => r.id));
    }
  };

  const handleToggleReservation = (id: string) => {
    setSelectedResIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteReservations = async () => {
    if (selectedResIds.length === 0) return;
    const confirmMsg = lang === 'ko'
      ? `정말로 선택한 ${selectedResIds.length}개의 예약을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`
      : `Are you sure you want to delete ${selectedResIds.length} selected reservation(s)?\nThis action cannot be undone.`;
    
    if (!confirm(confirmMsg)) return;

    setIsDeletingRes(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/reservations/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reservationIds: selectedResIds })
      });

      if (res.ok) {
        // Local state update
        setReservations(prev => prev.filter(r => !selectedResIds.includes(r.id)));
        setSelectedResIds([]);
        alert(lang === 'ko' ? '선택한 예약이 성공적으로 삭제되었습니다.' : 'Selected reservations deleted successfully.');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete reservations.');
      }
    } catch (err) {
      console.error('Bulk delete reservations error:', err);
      alert(lang === 'ko' ? '삭제 처리 중 오류가 발생했습니다.' : 'An error occurred during deletion.');
    } finally {
      setIsDeletingRes(false);
    }
  };

  // Load registered users and services for manual reservation creation
  useEffect(() => {
    if (isAdminAuthorized !== true) return;

    const fetchDropdownData = async () => {
      try {
        // Fetch registered users
        const { data: users, error: usersErr } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .order('name', { ascending: true });
        if (usersErr) throw usersErr;
        setRegisteredUsers(users || []);

        // Fetch services
        const { data: svcs, error: svcsErr } = await supabase
          .from('services')
          .select('*')
          .order('name', { ascending: true });
        if (svcsErr) throw svcsErr;
        setServicesList(svcs || []);
        if (svcs && svcs.length > 0) {
          setResServiceId(svcs[0].id);
        }
      } catch (err) {
        console.error('Failed to load dropdown records:', err);
        // Fallback for services
        const localized = getLocalizedServices(lang);
        setServicesList(localized);
        if (localized.length > 0) {
          setResServiceId(localized[0].id);
        }
      }
    };

    fetchDropdownData();
  }, [isAdminAuthorized, lang]);

  // Load Work Records Data (only if authorized)
  useEffect(() => {
    if (isAdminAuthorized !== true) return;
    loadWorkRecords();
    loadCustomersList();
    loadServicesList();
  }, [isAdminAuthorized]);

  const loadWorkRecords = async () => {
    setIsWorkLoading(true);
    try {
      // Fetch directly using Supabase JS client
      const { data, error } = await supabase
        .from('work_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        // Table not found or caching error -> fall back to Local Storage
        if (error.message.includes('relation "work_records" does not exist') || error.code === 'PGRST116' || error.code === '42P01') {
          setIsUsingLocalStorage(true);
          const localData = localStorage.getItem('tg_work_records');
          const records = localData ? JSON.parse(localData) : [];
          // Ensure descending date and created_at sorting
          records.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateB - dateA;
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
          });
          setWorkRecords(records);
        } else {
          throw error;
        }
      } else {
        setIsUsingLocalStorage(false);
        setWorkRecords(data || []);
      }
    } catch (err) {
      console.error('Error fetching work records:', err);
      // Fallback
      setIsUsingLocalStorage(true);
      const localData = localStorage.getItem('tg_work_records');
      const records = localData ? JSON.parse(localData) : [];
      records.sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
      setWorkRecords(records);
    } finally {
      setIsWorkLoading(false);
    }
  };

  const loadCustomersList = async () => {
    setIsCustomersLoading(true);
    try {
      if (isUsingLocalStorage) {
        const localData = localStorage.getItem('tg_customers');
        setCustomersList(localData ? JSON.parse(localData) : []);
      } else {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, phone, work_menu')
          .eq('role', 'USER')
          .order('name', { ascending: true });
        
        if (error) {
          if (error.message.includes('column "work_menu" does not exist') || error.code === '42703') {
            const fallback = await supabase
              .from('users')
              .select('id, name, email, phone')
              .eq('role', 'USER')
              .order('name', { ascending: true });
            setCustomersList((fallback.data || []).map((u) => Object.assign({}, u, { work_menu: '' })));
          } else {
            throw error;
          }
        } else {
          setCustomersList(data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsCustomersLoading(false);
    }
  };

  const loadServicesList = async () => {
    try {
      if (isUsingLocalStorage) {
        const saved = localStorage.getItem(`custom_services_${lang}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0) || a.id.localeCompare(b.id));
          setServicesList(parsed);
        } else {
          setServicesList([]);
        }
      } else {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('display_order', { ascending: true })
          .order('id', { ascending: true });
        if (!error && data) {
          setServicesList(data);
        }
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;

    const custData = {
      name: custName,
      work_menu: custWorkMenu,
      email: editingCustomer?.email || ('a_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5) + '@ex.com'),
      phone: custPhone || null,
      role: 'USER' as const
    };

    try {
      if (isUsingLocalStorage) {
        const localData = localStorage.getItem('tg_customers');
        let list = localData ? JSON.parse(localData) : [];
        if (editingCustomer) {
          list = list.map((c: any) => c.id === editingCustomer.id ? Object.assign({}, c, custData) : c);
        } else {
          list.push(Object.assign({}, custData, { id: crypto.randomUUID() }));
        }
        localStorage.setItem('tg_customers', JSON.stringify(list));
        setCustomersList(list);
      } else {
        if (editingCustomer) {
          const { error } = await supabase
            .from('users')
            .update({
              name: custName,
              phone: custPhone || null,
              work_menu: custWorkMenu
            })
            .eq('id', editingCustomer.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('users')
            .insert([custData]);
          if (error) throw error;
        }
        await loadCustomersList();
      }
      setShowCustomerModal(false);
    } catch (err: any) {
      console.error('Failed to save customer:', err);
      alert('고객 저장 실패: ' + err.message);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('정말로 이 고객을 명단에서 삭제하시겠습니까?')) return;
    try {
      if (isUsingLocalStorage) {
        const localData = localStorage.getItem('tg_customers');
        let list = localData ? JSON.parse(localData) : [];
        list = list.filter((c: any) => c.id !== id);
        localStorage.setItem('tg_customers', JSON.stringify(list));
        setCustomersList(list);
      } else {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await loadCustomersList();
      }
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      alert('고객 삭제 실패: ' + err.message);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcId || !svcName || svcDuration === undefined) return;

    const serviceObj = {
      id: svcId,
      name: svcName,
      name_en: svcNameEn || null,
      price: svcPrice === '' || svcPrice === null ? null : Number(svcPrice),
      duration_minutes: Number(svcDuration),
      durationMinutes: Number(svcDuration),
      description: svcDescription,
      description_en: svcDescriptionEn || null,
      category: svcCategory
    };

    try {
      if (isUsingLocalStorage) {
        const saved = localStorage.getItem(`custom_services_${lang}`);
        let services = saved ? JSON.parse(saved) : [];
        if (editingService) {
          services = services.map((s: any) => s.id === editingService.id ? serviceObj : s);
        } else {
          services.push(serviceObj);
        }
        localStorage.setItem(`custom_services_${lang}`, JSON.stringify(services));
        setServicesList(services);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          alert('로그인 세션이 만료되었습니다. 다시 로그인 해주세요.');
          return;
        }

        if (editingService) {
          const res = await fetch('/api/admin/services', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              originalId: editingService.id,
              newId: svcId,
              name: svcName,
              nameEn: svcNameEn || null,
              price: svcPrice === '' || svcPrice === null ? null : Number(svcPrice),
              durationMinutes: Number(svcDuration),
              description: svcDescription,
              descriptionEn: svcDescriptionEn || null,
              category: svcCategory
            })
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to update service');
          }
        } else {
          const res = await fetch('/api/admin/services', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              id: svcId,
              name: svcName,
              nameEn: svcNameEn || null,
              price: svcPrice === '' || svcPrice === null ? null : Number(svcPrice),
              durationMinutes: Number(svcDuration),
              description: svcDescription,
              descriptionEn: svcDescriptionEn || null,
              category: svcCategory
            })
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to create service');
          }
        }
        await loadServicesList();
      }
      setShowServiceModal(false);
    } catch (err: any) {
      console.error('Failed to save service:', err);
      alert('서비스 저장 실패: ' + err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('정말로 이 서비스를 삭제하시겠습니까?')) return;
    try {
      if (isUsingLocalStorage) {
        const saved = localStorage.getItem(`custom_services_${lang}`);
        let services = saved ? JSON.parse(saved) : [];
        services = services.filter((s: any) => s.id !== id);
        localStorage.setItem(`custom_services_${lang}`, JSON.stringify(services));
        setServicesList(services);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res = await fetch('/api/admin/services?id=' + id, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to delete service');
        }

        await loadServicesList();
      }
    } catch (err: any) {
      console.error('Failed to delete service:', err);
      alert('서비스 삭제 실패: ' + err.message);
    }
  };

  const handleMoveService = async (svc: any, direction: 'up' | 'down') => {
    const currentIndex = servicesList.findIndex(s => s.id === svc.id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= servicesList.length) return; // boundary check

    const swapTarget = servicesList[targetIndex];

    try {
      if (isUsingLocalStorage) {
        const listCopy = [...servicesList];
        const currentOrder = svc.display_order || currentIndex;
        const targetOrder = swapTarget.display_order || targetIndex;

        listCopy[currentIndex] = { ...swapTarget, display_order: currentOrder };
        listCopy[targetIndex] = { ...svc, display_order: targetOrder };
        
        listCopy.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0) || a.id.localeCompare(b.id));
        const finalized = listCopy.map((s, idx) => Object.assign({}, s, { display_order: idx }));

        localStorage.setItem(`custom_services_${lang}`, JSON.stringify(finalized));
        setServicesList(finalized);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res1 = await fetch('/api/admin/services', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            originalId: swapTarget.id,
            newId: swapTarget.id,
            name: swapTarget.name,
            nameEn: swapTarget.name_en || null,
            price: swapTarget.price,
            durationMinutes: swapTarget.duration_minutes || swapTarget.durationMinutes || 30,
            description: swapTarget.description,
            descriptionEn: swapTarget.description_en || null,
            category: swapTarget.category,
            displayOrder: currentIndex
          })
        });

        if (!res1.ok) throw new Error('Failed to update display order of adjacent service');

        const res2 = await fetch('/api/admin/services', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            originalId: svc.id,
            newId: svc.id,
            name: svc.name,
            nameEn: svc.name_en || null,
            price: svc.price,
            durationMinutes: svc.duration_minutes || svc.durationMinutes || 30,
            description: svc.description,
            descriptionEn: svc.description_en || null,
            category: svc.category,
            displayOrder: targetIndex
          })
        });

        if (!res2.ok) throw new Error('Failed to update display order of current service');

        await loadServicesList();
      }
    } catch (err: any) {
      console.error('Failed to move service:', err);
      alert('순서 변경 실패: ' + err.message);
    }
  };

  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resCustomerName || !resServiceId || !resDate || !resTime) return;

    try {
      // 1. Check double booking
      const { data: duplicateCheck, error: checkError } = await supabase
        .from('reservations')
        .select('id')
        .eq('date', resDate)
        .eq('time', resTime)
        .neq('status', 'Cancelled')
        .maybeSingle();

      if (checkError) throw checkError;
      if (duplicateCheck) {
        alert(lang === 'ko' ? '이미 해당 시간대에 다른 예약이 존재합니다.' : 'This time slot is already booked.');
        return;
      }

      // 2. Insert new reservation
      const { error } = await supabase
        .from('reservations')
        .insert([
          {
            user_id: resSelectedUserId || null,
            customer_name: resCustomerName,
            customer_phone: resCustomerPhone || null,
            service_id: resServiceId,
            date: resDate,
            time: resTime,
            status: resStatus,
            price: resPrice ? Number(resPrice) : null
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          alert(lang === 'ko' ? '이미 해당 시간대에 다른 예약이 존재합니다.' : 'This time slot is already booked.');
        } else {
          throw error;
        }
      } else {
        setShowResModal(false);
        // Reset states
        setResSelectedUserId('');
        setResCustomerName('');
        setResCustomerPhone('');
        setResDate(new Date().toISOString().split('T')[0]);
        setResTime('10:00');
        setResStatus('Confirmed');
        setResPrice('');
        // Reload
        await loadReservations();
      }
    } catch (err) {
      console.error('Failed to create reservation:', err);
      alert('예약 등록 실패: ' + (err as any).message);
    }
  };

  // When a user is selected in the manual reservation dropdown
  const handleUserSelectChange = (userId: string) => {
    setResSelectedUserId(userId);
    if (!userId) {
      setResCustomerName('');
      setResCustomerPhone('');
    } else {
      const selected = registeredUsers.find(u => u.id === userId);
      if (selected) {
        setResCustomerName(selected.name || '');
        setResCustomerPhone(selected.phone || '');
      }
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setResServiceId(serviceId);
    const selected = servicesList.find(s => s.id === serviceId);
    if (selected && selected.price !== null && selected.price !== undefined) {
      setResPrice(String(selected.price));
    } else {
      setResPrice('');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Confirmed' | 'Completed' | 'Cancelled') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          status: newStatus,
          sendNotification: sendClientNotify
        }),
      });

      if (response.ok) {
        setReservations(prev =>
          prev.map(res => (res.id === id ? { ...res, status: newStatus } : res))
        );
      } else {
        setReservations(prev =>
          prev.map(res => (res.id === id ? { ...res, status: newStatus } : res))
        );
      }
    } catch (err) {
      console.error('Failed to patch status:', err);
    }
  };

  // Work records CRUD actions
  const openAddModal = () => {
    setEditingRecord(null);
    setWorkSelectedUserId('');
    setWorkSelectedPastKey('');
    setWorkCustomerName('');
    setWorkCustomerPhone('');
    setWorkContent('');
    setWorkAmount('');
    setWorkDate(new Date().toISOString().split('T')[0]);
    setShowWorkModal(true);
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    const matchedUser = registeredUsers.find(u => u.name === record.customer_name && u.phone === record.customer_phone);
    setWorkSelectedUserId(matchedUser ? matchedUser.id : '');
    const pastKey = `${record.customer_name}|||${record.customer_phone}`;
    setWorkSelectedPastKey(!matchedUser ? pastKey : '');
    setWorkCustomerName(record.customer_name);
    setWorkCustomerPhone(record.customer_phone);
    setWorkContent(record.work_content);
    setWorkAmount(record.amount || '');
    setWorkDate(record.date);
    setShowWorkModal(true);
  };

  const handleWorkUserSelectChange = (userId: string) => {
    setWorkSelectedUserId(userId);
    setWorkSelectedPastKey(''); // Clear past customer selection
    if (!userId) {
      setWorkCustomerName('');
      setWorkCustomerPhone('');
    } else {
      const selected = registeredUsers.find(u => u.id === userId);
      if (selected) {
        setWorkCustomerName(selected.name || '');
        setWorkCustomerPhone(selected.phone || '');
      }
    }
  };

  const handleWorkPastUserSelectChange = (key: string) => {
    setWorkSelectedPastKey(key);
    setWorkSelectedUserId(''); // Clear registered user
    if (!key) {
      setWorkCustomerName('');
      setWorkCustomerPhone('');
    } else {
      const [name, phone] = key.split('|||');
      setWorkCustomerName(name || '');
      setWorkCustomerPhone(phone || '');
    }
  };

  const pastCustomersList = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; phone: string; key: string }[] = [];
    workRecords.forEach(r => {
      const name = r.customer_name || '';
      const phone = r.customer_phone || '';
      const key = `${name}|||${phone}`;
      if (name && phone && !seen.has(key)) {
        seen.add(key);
        list.push({ name, phone, key });
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [workRecords]);

  const filteredCustomers = useMemo(() => {
    let list = [...customersList];
    if (customerSearchQuery.trim()) {
      const query = customerSearchQuery.toLowerCase().trim();
      list = list.filter(cust => {
        const nameMatch = (cust.name || '').toLowerCase().includes(query);
        const phoneMatch = (cust.phone || '').toLowerCase().includes(query) || matchCleanedPhone(cust.phone, query);
        return nameMatch || phoneMatch;
      });
    }
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
  }, [customersList, customerSearchQuery]);

  const handleSaveWorkRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workContent) return;

    const recordData = {
      customer_name: workCustomerName || null,
      customer_phone: workCustomerPhone || null,
      work_content: workContent,
      amount: Number(workAmount) || 0,
      date: workDate || new Date().toISOString().split('T')[0] // automatic fallback to today
    };

    try {
      if (isUsingLocalStorage) {
        const localData = localStorage.getItem('tg_work_records');
        let records = localData ? JSON.parse(localData) : [];
        if (editingRecord) {
          records = records.map((r: any) => r.id === editingRecord.id ? Object.assign({}, r, recordData) : r);
        } else {
          records.push(Object.assign({}, recordData, { 
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
          }));
        }
        // Ensure descending date and created_at sorting
        records.sort((a: any, b: any) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) return dateB - dateA;
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
        localStorage.setItem('tg_work_records', JSON.stringify(records));
        setWorkRecords(records);

        // LocalStorage customer sync
        if (workCustomerName) {
          const localCustData = localStorage.getItem('tg_customers');
          let customers = localCustData ? JSON.parse(localCustData) : [];
          const existingIdx = customers.findIndex((c: any) => c.name === workCustomerName);
          const custData = {
            name: workCustomerName,
            price: Number(workAmount) || 0,
            work_menu: workContent,
            email: 'a@ex.com',
            phone: null
          };
          if (existingIdx >= 0) {
            customers[existingIdx] = Object.assign({}, customers[existingIdx], custData);
          } else {
            customers.push(Object.assign({}, custData, { id: crypto.randomUUID() }));
          }
          localStorage.setItem('tg_customers', JSON.stringify(customers));
          setCustomersList(customers);
        }
      } else {
        if (editingRecord) {
          const { error } = await supabase
            .from('work_records')
            .update(recordData)
            .eq('id', editingRecord.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('work_records')
            .insert([recordData]);
          if (error) throw error;
        }
        await loadWorkRecords();

        // Supabase customer sync
        if (workCustomerName) {
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id, name')
            .eq('name', workCustomerName)
            .eq('role', 'USER')
            .maybeSingle();

          if (!checkError) {
            if (existingUser) {
              await supabase
                .from('users')
                .update({
                  price: Number(workAmount) || 0,
                  work_menu: workContent
                })
                .eq('id', existingUser.id);
            } else {
              const tempEmail = 'a_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '@ex.com';
              await supabase
                .from('users')
                .insert([{
                  name: workCustomerName,
                  role: 'USER',
                  email: tempEmail,
                  phone: null,
                  price: Number(workAmount) || 0,
                  work_menu: workContent
                }]);
            }
          }
          await loadCustomersList();
        }
      }
      setShowWorkModal(false);
    } catch (err) {
      console.error('Failed to save work record:', err);
      alert('저장 실패: ' + (err as any).message);
    }
  };

  const handleDeleteWorkRecord = async (id: string) => {
    if (!confirm(lang === 'ko' ? '정말로 이 작업 기록을 삭제하시겠습니까?' : 'Are you sure you want to delete this record?')) return;
    
    try {
      if (isUsingLocalStorage) {
        const localData = localStorage.getItem('tg_work_records');
        let records = localData ? JSON.parse(localData) : [];
        records = records.filter((r: any) => r.id !== id);
        localStorage.setItem('tg_work_records', JSON.stringify(records));
        setWorkRecords(records);
      } else {
        const { error } = await supabase
          .from('work_records')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await loadWorkRecords();
      }
    } catch (err) {
      console.error('Failed to delete work record:', err);
      alert('삭제 실패: ' + (err as any).message);
    }
  };

  // Date formatter (supports YYYY/M/D like 2026/7/11)
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return `${year}/${month}/${day}`;
    }
    return dateStr.replace(/-/g, '/');
  };

  // Filter reservations
  const filteredReservations = reservations.filter(res => {
    const nameMatch = res.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const phoneMatch = (res.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || matchCleanedPhone(res.customerPhone, searchQuery);
    const matchesSearch = nameMatch || phoneMatch;
    const matchesStatus = filterStatus === 'All' || res.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Admin Calendar Helper calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleAdminPrevMonth = () => {
    if (adminMonth === 0) {
      setAdminMonth(11);
      setAdminYear(prev => prev - 1);
    } else {
      setAdminMonth(prev => prev - 1);
    }
  };

  const handleAdminNextMonth = () => {
    if (adminMonth === 11) {
      setAdminMonth(0);
      setAdminYear(prev => prev + 1);
    } else {
      setAdminMonth(prev => prev + 1);
    }
  };

  const handleAdminDaySelect = (day: number) => {
    const dateStr = `${adminYear}-${String(adminMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setAdminSelectedDate(dateStr);
  };

  const adminDaysInMonth = getDaysInMonth(adminYear, adminMonth);
  const adminFirstDayIndex = getFirstDayOfMonth(adminYear, adminMonth);
  const adminDayNames = lang === 'ko' ? ['일', '월', '화', '수', '목', '금', '토'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const adminMonthLabel = lang === 'ko' 
    ? `${adminYear}년 ${adminMonth + 1}월` 
    : `${new Date(adminYear, adminMonth).toLocaleString('default', { month: 'long' })} ${adminYear}`;

  const adminCalendarGrid = [];
  for (let i = 0; i < adminFirstDayIndex; i++) {
    adminCalendarGrid.push(null);
  }
  for (let i = 1; i <= adminDaysInMonth; i++) {
    adminCalendarGrid.push(i);
  }

  // Check if a specific date has any reservations (for showing dot indicator)
  const hasReservationsOnDate = (day: number) => {
    const dateStr = `${adminYear}-${String(adminMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return reservations.some(res => res.date === dateStr && res.status !== 'Cancelled');
  };

  // Filter work records (Search by phone or name)
  const filteredWorkRecords = workRecords.filter(rec => {
    if (!searchWorkQuery.trim()) return true;
    const nameMatch = rec.customer_name?.toLowerCase().includes(searchWorkQuery.toLowerCase().trim()) || false;
    const phoneMatch = (rec.customer_phone?.toLowerCase().includes(searchWorkQuery.toLowerCase().trim()) || false) || matchCleanedPhone(rec.customer_phone, searchWorkQuery.trim());
    return nameMatch || phoneMatch;
  });

  // Sales settlement calculations
  // 1. Daily Sales
  const dailySalesSum = workRecords
    .filter(rec => rec.date === selectedDailyDate)
    .reduce((sum, rec) => sum + rec.amount, 0);

  const dailySalesRecords = workRecords.filter(rec => rec.date === selectedDailyDate);

  // 2. Monthly Sales
  const selectedMonthlyPrefix = `${selectedMonthlyYear}-${String(selectedMonthlyMonth).padStart(2, '0')}`;
  const monthlySalesSum = workRecords
    .filter(rec => rec.date.startsWith(selectedMonthlyPrefix))
    .reduce((sum, rec) => sum + rec.amount, 0);

  const monthlySalesRecords = workRecords.filter(rec => rec.date.startsWith(selectedMonthlyPrefix));

  // 3. Yearly Sales
  const selectedYearlyPrefix = `${selectedYearlyYear}-`;
  const yearlySalesSum = workRecords
    .filter(rec => rec.date.startsWith(selectedYearlyPrefix))
    .reduce((sum, rec) => sum + rec.amount, 0);

  const yearlySalesRecords = workRecords.filter(rec => rec.date.startsWith(selectedYearlyPrefix));

  const t = TRANSLATIONS[lang];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pending': return t.statusPending;
      case 'Confirmed': return t.statusConfirmed;
      case 'Completed': return t.statusCompleted;
      case 'Cancelled': return t.statusCancelled;
      default: return status;
    }
  };

  const sqlCode = `CREATE TABLE work_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    work_content TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;

-- users 테이블에 mobile_optimized 컬럼 추가 (존재하지 않는 경우)
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_optimized BOOLEAN DEFAULT TRUE;

-- Admins can do everything on work_records
CREATE POLICY "Admins can do everything on work_records" 
ON work_records FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
);`;

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#09090b] text-stone-100 flex flex-col items-center justify-center font-mono text-xs relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="h-6 w-6 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
        <span className="text-stone-400 tracking-widest uppercase animate-pulse">
          {lang === 'ko' ? '보안 인증을 확인하고 있습니다 (role: ADMIN)...' : 'Verifying Security Clearance (role: ADMIN)...'}
        </span>
      </div>
    );
  }

  if (isAdminAuthorized !== true) {
    return (
      <div className="min-h-screen bg-[#09090b] text-stone-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-rose-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="bg-stone-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative z-10">
          <div className="h-14 w-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/25 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <Lock className="h-6 w-6 text-rose-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-bold tracking-tight text-white">
              {lang === 'ko' ? '비공개 관리자 구역' : 'Access Restricted'}
            </h2>
            <p className="text-xs text-stone-450 leading-relaxed font-sans font-light">
              {lang === 'ko' 
                ? '이 페이지는 관리자(role: ADMIN)만 접근할 수 있는 영역입니다. 일반 계정은 접근이 제한됩니다.' 
                : 'This page is restricted to salon administration (role = ADMIN) sessions only.'}
            </p>
          </div>
          <Link 
            href="/"
            className="w-full py-3 bg-gradient-to-r from-stone-900 to-stone-800 border border-white/5 hover:bg-stone-850 text-stone-200 text-xs font-mono font-bold tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t.goToHome}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-stone-100 antialiased flex flex-col relative overflow-hidden select-none">
      {/* Ambient background glows for Aura aesthetic */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[25%] w-[350px] h-[350px] bg-[#d97706]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/85 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between z-10 relative">
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg transition-transform group-hover:scale-105 overflow-hidden shadow-md">
              <img src="/hair_gallery_logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif text-sm sm:text-lg font-bold tracking-tight text-white group-hover:text-gold-400 transition-colors">THE HAIR GALLERY</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-stone-300 hover:text-white uppercase flex items-center gap-1.5 border border-white/5 px-3 py-1.5 rounded-lg bg-stone-900/50 hover:bg-stone-850 transition-all active:scale-[0.98]"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{t.goToHome}</span>
            </Link>

            {/* Mobile Optimization Toggle */}
            <button
              onClick={handleToggleMobileOptimized}
              className={`text-[9px] sm:text-[10px] font-mono font-bold tracking-wider px-2.5 py-1.5 rounded-lg border transition-all active:scale-[0.98] flex items-center gap-1 cursor-pointer ${
                mobileOptimized 
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20' 
                  : 'border-white/5 bg-stone-900/50 text-stone-400 hover:text-white hover:bg-stone-850'
              }`}
              title={lang === 'ko' ? '모바일 화면 최적화 토글' : 'Toggle Mobile Optimization'}
            >
              <span>📱</span>
              <span className="hidden sm:inline">{lang === 'ko' ? '모바일 최적화' : 'Mobile Opt'}</span>
              <span className="inline sm:hidden">{lang === 'ko' ? '최적화' : 'Opt'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${mobileOptimized ? 'bg-emerald-500 animate-pulse' : 'bg-stone-600'}`}></span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 border border-white/5 p-0.5 rounded-lg bg-stone-900/60 text-[10px] font-mono font-bold">
              <button
                onClick={() => setLang('ko')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  lang === 'ko' 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_10px_rgba(109,40,217,0.3)]' 
                    : 'text-stone-550 hover:text-stone-200'
                }`}
              >
                KO
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  lang === 'en' 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_10px_rgba(109,40,217,0.3)]' 
                    : 'text-stone-550 hover:text-stone-200'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 sm:p-10 z-10 relative">
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
          
          {/* Title Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-6 gap-4">
            <div>
              <span className="text-xs font-mono tracking-widest text-gold-500 font-semibold uppercase block">{t.adminCockpit}</span>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-stone-400 mt-1">{t.adminTitle}</h1>
              <p className="text-xs text-stone-400 mt-1 font-mono">{t.supabaseConnected}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 self-start shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {t.liveConnection}
              </span>
              {isUsingLocalStorage ? (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-305 border border-amber-500/20 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 self-start">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  {lang === 'ko' ? '임시 로컬 저장소 모드' : 'Local Storage Mode'}
                </span>
              ) : (
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 self-start">
                  <Database className="h-3 w-3 text-indigo-400" />
                  {lang === 'ko' ? 'Supabase 연동 완료' : 'Supabase Connected'}
                </span>
              )}
            </div>
          </div>

          {/* Database Missing Warning Banner */}
          {isUsingLocalStorage && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-amber-200 backdrop-blur-md animate-fadeIn">
              <div className="flex gap-2.5 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold font-serif">{lang === 'ko' ? '작업 기록 테이블 필요' : 'Work Records Table Required'}</h4>
                  <p className="mt-1 text-stone-400 leading-relaxed font-sans font-light">
                    {t.dbErrorWarning}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(sqlCode);
                  alert(lang === 'ko' ? 'SQL 스크립트가 클립보드에 복사되었습니다!' : 'SQL script copied to clipboard!');
                }}
                className="shrink-0 text-[10px] font-mono font-bold px-3.5 py-2 bg-amber-500 text-stone-955 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer active:scale-[0.98]"
              >
                {lang === 'ko' ? 'SQL 코드 복사' : 'Copy SQL Script'}
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className={`bg-stone-900/50 p-1.5 rounded-xl border border-white/5 flex gap-2 shadow-xl w-full backdrop-blur-md overflow-x-auto scrollbar-none ${
            mobileOptimized ? 'flex-nowrap whitespace-nowrap' : 'flex-wrap'
          }`}>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                mobileOptimized ? 'whitespace-nowrap' : ''
              } ${
                activeTab === 'reservations'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="h-4 w-4 shrink-0" />
              <span className={mobileOptimized ? 'whitespace-nowrap' : ''}>{t.reservationsTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('work-records')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                mobileOptimized ? 'whitespace-nowrap' : ''
              } ${
                activeTab === 'work-records'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span className={mobileOptimized ? 'whitespace-nowrap' : ''}>{t.workRecordsTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                mobileOptimized ? 'whitespace-nowrap' : ''
              } ${
                activeTab === 'sales'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span className={mobileOptimized ? 'whitespace-nowrap' : ''}>{t.salesDashboardTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                mobileOptimized ? 'whitespace-nowrap' : ''
              } ${
                activeTab === 'customers'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span className={mobileOptimized ? 'whitespace-nowrap' : ''}>{t.customersTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                mobileOptimized ? 'whitespace-nowrap' : ''
              } ${
                activeTab === 'services'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Scissors className="h-4 w-4 shrink-0" />
              <span className={mobileOptimized ? 'whitespace-nowrap' : ''}>{t.servicesTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('admin-settings')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                mobileOptimized ? 'whitespace-nowrap' : ''
              } ${
                activeTab === 'admin-settings'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell className="h-4 w-4 shrink-0" />
              <span className={mobileOptimized ? 'whitespace-nowrap' : ''}>{lang === 'ko' ? '알림 수신 설정' : 'Alert Settings'}</span>
            </button>
          </div>

          {/* TAB CONTENT: 1. Reservations */}
          {activeTab === 'reservations' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* 예약 타임라인 현황판 (Daily Reservation Calendar & Timeline) */}
              <div className="bg-stone-900/30 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/5">
                  <Calendar className="h-5 w-5 text-gold-500" />
                  <div>
                    <h2 className="font-serif text-lg font-bold text-white">
                      {lang === 'ko' ? '일별 예약 스케줄 현황' : 'Daily Reservation Schedule'}
                    </h2>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {lang === 'ko' ? '달력을 클릭하여 각 날짜의 타임라인별 예약을 한눈에 관리하세요.' : 'Navigate calendar to inspect and manage reservations on a visual timeline.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Calendar (col-span-5) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-stone-950/60 p-4 rounded-xl border border-white/5">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                        <span className="font-serif text-sm font-bold text-white">{adminMonthLabel}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleAdminPrevMonth}
                            className="p-1 border border-white/10 rounded hover:bg-white/5 transition-colors cursor-pointer text-stone-300"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleAdminNextMonth}
                            className="p-1 border border-white/10 rounded hover:bg-white/5 transition-colors cursor-pointer text-stone-300"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Day Names Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-stone-500 uppercase mb-2">
                        {adminDayNames.map(dName => (
                          <div key={dName} className="py-1">{dName}</div>
                        ))}
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {adminCalendarGrid.map((day, idx) => {
                          if (day === null) {
                            return <div key={`admin-empty-${idx}`} className="py-2"></div>;
                          }

                          const dateStr = `${adminYear}-${String(adminMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isSelected = adminSelectedDate === dateStr;
                          const hasBookings = hasReservationsOnDate(day);

                          return (
                            <button
                              key={`admin-day-${day}`}
                              type="button"
                              onClick={() => handleAdminDaySelect(day)}
                              className={`py-2 text-xs font-mono font-semibold rounded-lg transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold scale-[1.05] shadow-md border border-indigo-500/20'
                                  : 'bg-stone-900/40 hover:bg-stone-900 text-stone-300 border border-transparent'
                              }`}
                            >
                              <span>{day}</span>
                              {hasBookings && (
                                <span className={`h-1.5 w-1.5 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-indigo-400'}`}></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date Summary Card */}
                    <div className="bg-stone-950/40 p-4 rounded-xl border border-white/5 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center text-stone-300">
                        <span className="font-bold text-white">
                          📅 {formatDisplayDate(adminSelectedDate)}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          {
                            (() => {
                              const count = reservations.filter(res => res.date === adminSelectedDate && res.status !== 'Cancelled').length;
                              return lang === 'ko' ? `총 ${count}건의 예약` : `${count} booking(s)`;
                            })()
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Timeline List (col-span-7) */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="bg-stone-950/60 p-4 rounded-xl border border-white/5 max-h-[460px] overflow-y-auto scrollbar-thin">
                      <div className="space-y-2">
                        {[
                          '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
                          '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
                        ].map((hour) => {
                          // Find reservations for this day that fall into this hour slot
                          const hourStr = hour.split(':')[0];
                          const slotReservations = reservations.filter(res => {
                            if (res.date !== adminSelectedDate) return false;
                            const resHour = res.time.split(':')[0];
                            return resHour === hourStr;
                          });

                          // Sort slot reservations ascending (just in case there are multiple)
                          slotReservations.sort((a, b) => a.time.localeCompare(b.time));

                          return (
                            <div key={hour} className="flex gap-4 items-stretch border-b border-white/[0.03] pb-2.5 last:border-b-0 last:pb-0 pt-2.5 first:pt-0">
                              {/* Hour label */}
                              <div className="w-12 text-stone-400 font-mono font-bold text-xs flex items-center shrink-0">
                                {hour}
                              </div>

                              {/* Bookings timeline box */}
                              <div className="flex-1 space-y-2">
                                {slotReservations.length > 0 ? (
                                  slotReservations.map((res) => (
                                    <div key={res.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-stone-900 border border-white/5 hover:border-white/10 transition-colors">
                                      <div className="text-left space-y-0.5">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-[10px] font-bold text-indigo-300">
                                            {res.time}
                                          </span>
                                          <span className="font-serif font-bold text-xs text-white">
                                            {res.customerName}
                                          </span>
                                          {res.customerPhone ? (
                                            <span className="text-[10px] text-stone-400 font-mono">
                                              ({res.customerPhone})
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="text-[10px] text-stone-300 font-light">
                                          {res.serviceName} • ₩{res.price.toLocaleString()}
                                        </p>
                                      </div>

                                      {/* Right side: status and quick action controls */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        {/* Quick status change buttons */}
                                        <div className="flex items-center gap-1.5">
                                          {res.status === 'Pending' && (
                                            <button
                                              onClick={() => handleUpdateStatus(res.id, 'Confirmed')}
                                              className="p-1 bg-sky-500/10 hover:bg-sky-600 text-sky-400 hover:text-white rounded border border-sky-500/20 transition-all cursor-pointer animate-pulse"
                                              title={t.confirmReservation}
                                            >
                                              <Check className="h-3.5 w-3.5" />
                                            </button>
                                          )}
                                          {res.status === 'Confirmed' && (
                                            <button
                                              onClick={() => handleUpdateStatus(res.id, 'Completed')}
                                              className="p-1 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded border border-emerald-500/20 transition-all cursor-pointer"
                                              title={t.completeAppointment}
                                            >
                                              <Check className="h-3.5 w-3.5" />
                                            </button>
                                          )}
                                          {res.status !== 'Cancelled' && res.status !== 'Completed' && (
                                            <button
                                              onClick={() => handleUpdateStatus(res.id, 'Cancelled')}
                                              className="p-1 bg-stone-850 hover:bg-rose-600 text-stone-400 hover:text-white rounded border border-white/5 hover:border-rose-500 transition-all cursor-pointer"
                                              title={t.cancelAppointment}
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </button>
                                          )}
                                        </div>
                                        
                                        {/* Status badge */}
                                        <span className={`text-[9px] font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded border shrink-0 ${
                                          res.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                          res.status === 'Confirmed' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                          res.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                          'bg-stone-800/80 text-stone-400 border-white/5'
                                        }`}>
                                          {getStatusText(res.status)}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-stone-900/20 border border-dashed border-white/[0.04] text-[10px] text-stone-500 font-mono">
                                    <span>{lang === 'ko' ? '예약 없음 (Available)' : 'Empty Time Slot'}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResSelectedUserId('');
                                        setResCustomerName('');
                                        setResCustomerPhone('');
                                        setResDate(adminSelectedDate);
                                        setResTime(hour);
                                        setResStatus('Confirmed');
                                        setShowResModal(true);
                                      }}
                                      className="py-1 px-2 border border-white/10 hover:border-indigo-500/60 rounded bg-stone-900/80 hover:bg-indigo-600 hover:text-white transition duration-200 text-[9px] font-bold cursor-pointer"
                                    >
                                      + {lang === 'ko' ? '예약 추가' : 'Book'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls & Add Button */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-stone-900/30 p-4 rounded-xl border border-white/5 backdrop-blur-md shadow-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-550" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-9 pr-4 py-2 bg-stone-950/60 border border-white/5 focus:border-indigo-500/80 rounded-lg text-xs outline-none text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="py-2 px-3 bg-stone-900 border border-white/5 rounded-lg text-xs text-stone-300 outline-none cursor-pointer focus:border-indigo-500/80 w-32 sm:w-auto"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="All" className="bg-stone-900 text-white">{t.allStatuses}</option>
                    <option value="Pending" className="bg-stone-900 text-white">{t.statusPending}</option>
                    <option value="Confirmed" className="bg-stone-900 text-white">{t.statusConfirmed}</option>
                    <option value="Completed" className="bg-stone-900 text-white">{t.statusCompleted}</option>
                    <option value="Cancelled" className="bg-stone-900 text-white">{t.statusCancelled}</option>
                  </select>
                  <button
                    onClick={() => {
                      setResSelectedUserId('');
                      setResCustomerName('');
                      setResCustomerPhone('');
                      setResDate(new Date().toISOString().split('T')[0]);
                      setResTime('10:00');
                      setResStatus('Confirmed');
                      setShowResModal(true);
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-mono font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(109,40,217,0.3)] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.addReservation}</span>
                  </button>
                </div>
              </div>

              {/* Reservations List */}
              <div className="bg-stone-900/20 rounded-2xl border border-white/5 overflow-hidden shadow-xl backdrop-blur-md">
                <div className="px-6 py-4.5 bg-[#121214] border-b border-white/5 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    {filteredReservations.length > 0 && (
                      <input
                        type="checkbox"
                        checked={selectedResIds.length === filteredReservations.length && filteredReservations.length > 0}
                        onChange={handleToggleAllReservations}
                        className="h-4 w-4 rounded border-white/10 text-gold-500 focus:ring-gold-500 bg-stone-900 cursor-pointer"
                        title={lang === 'ko' ? '전체 선택/해제' : 'Select/Deselect All'}
                      />
                    )}
                    <h2 className="font-serif text-base font-semibold text-gold-400 tracking-wide">{t.reservationsRoster}</h2>
                  </div>
                  
                  {selectedResIds.length > 0 ? (
                    <button
                      type="button"
                      disabled={isDeletingRes}
                      onClick={handleBulkDeleteReservations}
                      className="bg-red-750 hover:bg-red-650 disabled:bg-stone-850 text-white text-[10px] font-mono font-bold py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(220,38,38,0.25)] border border-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                      <span>
                        {lang === 'ko' 
                          ? `${selectedResIds.length}개 선택 삭제` 
                          : `Delete Selected (${selectedResIds.length})`}
                      </span>
                    </button>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer text-[10px] font-mono uppercase tracking-wider text-stone-300 select-none bg-stone-950 border border-white/5 px-3 py-1.5 rounded-lg hover:bg-stone-900 transition duration-200">
                      <input
                        type="checkbox"
                        checked={sendClientNotify}
                        onChange={e => {
                          const checked = e.target.checked;
                          setSendClientNotify(checked);
                          localStorage.setItem('tg_send_client_notify', checked ? 'true' : 'false');
                        }}
                        className="h-3.5 w-3.5 rounded border-white/10 text-gold-500 focus:ring-gold-500 bg-stone-900 cursor-pointer"
                      />
                      <span>{lang === 'ko' ? '확정/취소 시 고객 알림 전송' : 'Send Notify on Update'}</span>
                    </label>
                  )}

                  <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">
                    {t.sortedBy}
                  </span>
                </div>

                {isLoading ? (
                  <div className="text-center py-16 text-stone-500 text-xs font-mono tracking-wider">{t.loadingRecords}</div>
                ) : filteredReservations.length === 0 ? (
                  <div className="text-center py-16 text-stone-500 text-xs font-light">{t.noRecords}</div>
                ) : (
                  <div className="divide-y divide-white/5 text-xs">
                    {filteredReservations.map(res => (
                      <div key={res.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.02] transition-all duration-300">
                        
                        <div className="flex items-start gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedResIds.includes(res.id)}
                            onChange={() => handleToggleReservation(res.id)}
                            className="mt-1 h-4 w-4 rounded border-white/10 text-gold-500 focus:ring-gold-500 bg-stone-900 cursor-pointer shrink-0"
                          />
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                                {res.date} @ {res.time}
                              </span>
                              <h3 className="font-serif text-sm font-semibold text-white">{res.customerName}</h3>
                            </div>
                            <p className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-stone-550" />
                              {res.customerPhone ? res.customerPhone : <span className="text-stone-500">{lang === 'ko' ? '전화번호 미기재' : 'No Phone Number'}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-5 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="font-semibold text-stone-200">{res.serviceName}</p>
                            <p className="text-[10px] text-stone-500 mt-0.5 font-mono">
                              {lang === 'ko' ? '요금: ' : 'Price: '}
                              {res.price > 1000 ? `₩${res.price.toLocaleString()}` : `$${res.price}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 border-l border-white/5 pl-4.5">
                            {res.status === 'Pending' && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'Confirmed')}
                                className="p-1.5 bg-sky-500/10 hover:bg-sky-600 text-sky-400 hover:text-white rounded border border-sky-500/20 transition-all cursor-pointer"
                                title={t.confirmReservation}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {res.status === 'Confirmed' && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'Completed')}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded border border-emerald-500/20 transition-all cursor-pointer"
                                title={t.completeAppointment}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {res.status !== 'Cancelled' && res.status !== 'Completed' && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'Cancelled')}
                                className="p-1.5 bg-stone-850 hover:bg-rose-600 text-stone-400 hover:text-white rounded border border-white/5 hover:border-rose-500 transition-all cursor-pointer"
                                title={t.cancelAppointment}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            <span className={`text-[10px] font-mono font-bold tracking-wide uppercase px-2.5 py-1 rounded border ${
                              res.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              res.status === 'Confirmed' ? 'bg-sky-500/10 text-sky-450 border-sky-500/20' :
                              res.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              'bg-stone-800/80 text-stone-400 border-white/5'
                            }`}>
                              {getStatusText(res.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. Work Records */}
          {activeTab === 'work-records' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Controls & Add Button */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-555" />
                  <input
                    type="text"
                    value={searchWorkQuery}
                    onChange={e => setSearchWorkQuery(e.target.value)}
                    placeholder={t.searchWorkPlaceholder}
                    className="w-full pl-9 pr-4 py-2 bg-stone-950/60 border border-white/5 focus:border-indigo-500/80 rounded-lg text-xs outline-none text-stone-100 placeholder-stone-550 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                  />
                </div>
                <button
                  onClick={openAddModal}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-mono font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(109,40,217,0.3)] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addRecord}</span>
                </button>
              </div>

              {/* Work Records List */}
              <div className="bg-stone-900/20 rounded-2xl border border-white/5 overflow-hidden shadow-xl backdrop-blur-md">
                <div className="px-6 py-4.5 bg-[#121214] border-b border-white/5 flex justify-between items-center">
                  <h2 className="font-serif text-base font-semibold text-gold-400 tracking-wide">{t.workRecordsTab}</h2>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">
                    {lang === 'ko' ? '날짜 오름차순 정렬' : 'Sorted by date (asc)'}
                  </span>
                </div>

                {isWorkLoading ? (
                  <div className="text-center py-16 text-stone-500 text-xs font-mono tracking-wider">{t.loadingRecords}</div>
                ) : filteredWorkRecords.length === 0 ? (
                  <div className="text-center py-16 text-stone-500 text-xs font-light">{t.noWorkRecords}</div>
                ) : (
                  <div className="divide-y divide-white/5 text-xs">
                    {filteredWorkRecords.map(rec => (
                      <div key={rec.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02] transition-all duration-300">
                        <div className="space-y-2 flex-1 w-full">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                              {formatDisplayDate(rec.date)}
                            </span>
                            <h3 className="font-serif text-sm font-semibold text-white">{rec.customer_name || (lang === 'ko' ? '미기재' : 'Unspecified')}</h3>
                            {rec.customer_phone ? (
                              <span className="text-[10px] text-stone-400 font-mono">({rec.customer_phone})</span>
                             ) : null}
                          </div>
                          <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-3 rounded-lg border border-white/5">
                            {rec.work_content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 border-white/5 pt-3.5 md:pt-0">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-mono text-stone-500 uppercase block tracking-widest">
                              {lang === 'ko' ? '매출 금액' : 'Revenue'}
                            </span>
                            <span className="font-serif font-bold text-white text-base">
                              ₩{rec.amount.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pl-4.5 border-l border-white/5">
                            <button
                              onClick={() => openEditModal(rec)}
                              className="p-2 text-stone-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/5 transition-all cursor-pointer"
                              title={t.editRecord}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkRecord(rec.id)}
                              className="p-2 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-500/20 hover:border-rose-500 transition-all cursor-pointer"
                              title={t.deleteRecord}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. Sales Statistics */}
          {activeTab === 'sales' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Sales Calculation Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Daily Card */}
                <div className="bg-stone-900/30 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5 backdrop-blur-md hover:border-white/10 transition-colors duration-350">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono tracking-widest text-stone-400 font-bold uppercase">{t.dailySales}</span>
                      <Calendar className="h-4.5 w-4.5 text-gold-550" />
                    </div>
                    {/* Date Selector */}
                    <input 
                      type="date"
                      value={selectedDailyDate}
                      onChange={e => setSelectedDailyDate(e.target.value)}
                      className="text-xs py-1.5 px-3 border border-white/5 rounded-lg bg-stone-900 text-white outline-none w-full focus:border-indigo-500/60"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-550 block font-mono">
                      {formatDisplayDate(selectedDailyDate)} {lang === 'ko' ? '합계' : 'Total'}
                    </span>
                    <span className="text-2xl font-serif font-bold text-white">
                      ₩{dailySalesSum.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 2. Monthly Card */}
                <div className="bg-stone-900/30 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5 backdrop-blur-md hover:border-white/10 transition-colors duration-350">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono tracking-widest text-stone-400 font-bold uppercase">{t.monthlySales}</span>
                      <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
                    </div>
                    {/* Month Selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedMonthlyYear}
                        onChange={e => setSelectedMonthlyYear(Number(e.target.value))}
                        className="text-xs py-1.5 px-2 bg-stone-900 border border-white/5 rounded-lg outline-none text-white cursor-pointer focus:border-indigo-500/60"
                        style={{ colorScheme: 'dark' }}
                      >
                        {[2025, 2026, 2027, 2028].map(yr => (
                          <option key={yr} value={yr} className="bg-stone-900 text-white">{yr}년</option>
                        ))}
                      </select>
                      <select
                        value={selectedMonthlyMonth}
                        onChange={e => setSelectedMonthlyMonth(Number(e.target.value))}
                        className="text-xs py-1.5 px-2 bg-stone-900 border border-white/5 rounded-lg outline-none text-white cursor-pointer focus:border-indigo-500/60"
                        style={{ colorScheme: 'dark' }}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m} className="bg-stone-900 text-white">{m}월</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-550 block font-mono">
                      {selectedMonthlyYear}/{selectedMonthlyMonth} {lang === 'ko' ? '합계' : 'Total'}
                    </span>
                    <span className="text-2xl font-serif font-bold text-indigo-300">
                      ₩{monthlySalesSum.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 3. Yearly Card */}
                <div className="bg-gradient-to-br from-[#121214] to-[#09090b] rounded-2xl p-6 shadow-xl text-white flex flex-col justify-between space-y-5 border border-gold-500/20 relative overflow-hidden">
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-5 pointer-events-none">
                    <DollarSign className="w-32 h-32 text-gold-550" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono tracking-widest text-stone-400 font-bold uppercase">{t.yearlySales}</span>
                      <DollarSign className="h-4.5 w-4.5 text-gold-550" />
                    </div>
                    {/* Year Selector */}
                    <select
                      value={selectedYearlyYear}
                      onChange={e => setSelectedYearlyYear(Number(e.target.value))}
                      className="text-xs py-1.5 px-3 border border-white/5 rounded-lg bg-stone-900 text-white outline-none cursor-pointer w-full focus:border-gold-500/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      {[2025, 2026, 2027, 2028].map(yr => (
                        <option key={yr} value={yr} className="bg-stone-900 text-white">{yr}년</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] text-stone-450 block font-mono">
                      {selectedYearlyYear}년 {lang === 'ko' ? '누적 합계' : 'Yearly Cumulative'}
                    </span>
                    <span className="text-2xl font-serif font-bold text-gold-400 tracking-wide drop-shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                      ₩{yearlySalesSum.toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>

              {/* Sales breakdown lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Selected Day Details */}
                <div className="bg-stone-900/20 rounded-2xl border border-white/5 overflow-hidden shadow-xl backdrop-blur-md">
                  <div className="px-5 py-4 bg-[#121214] border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-serif text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-stone-400" />
                      <span>{formatDisplayDate(selectedDailyDate)} {lang === 'ko' ? '매출 상세 내역' : 'Daily Transactions'}</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-stone-850 text-stone-300 px-2 py-0.5 rounded border border-white/5">
                      {dailySalesRecords.length}건
                    </span>
                  </div>
                  <div className="p-4 max-h-[300px] overflow-y-auto">
                    {dailySalesRecords.length === 0 ? (
                      <p className="text-center py-10 text-stone-500 text-xs font-light">{lang === 'ko' ? '해당 날짜에 기록된 매출이 없습니다.' : 'No transactions recorded on this day.'}</p>
                    ) : (
                      <div className="divide-y divide-white/5 text-xs">
                        {dailySalesRecords.map(rec => (
                          <div key={rec.id} className="py-3 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-white">{rec.customer_name || (lang === 'ko' ? '미기재' : 'Unspecified')}</p>
                              <p className="text-[10px] text-stone-400 max-w-[200px] truncate">{rec.work_content}</p>
                            </div>
                            <span className="font-mono font-bold text-stone-200">₩{rec.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Month Details */}
                <div className="bg-stone-900/20 rounded-2xl border border-white/5 overflow-hidden shadow-xl backdrop-blur-md">
                  <div className="px-5 py-4 bg-[#121214] border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-serif text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-stone-400" />
                      <span>{selectedMonthlyYear}년 {selectedMonthlyMonth}월 {lang === 'ko' ? '매출 상세 내역' : 'Monthly Transactions'}</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-stone-850 text-stone-300 px-2 py-0.5 rounded border border-white/5">
                      {monthlySalesRecords.length}건
                    </span>
                  </div>
                  <div className="p-4 max-h-[300px] overflow-y-auto">
                    {monthlySalesRecords.length === 0 ? (
                      <p className="text-center py-10 text-stone-500 text-xs font-light">{lang === 'ko' ? '해당 월에 기록된 매출이 없습니다.' : 'No transactions recorded in this month.'}</p>
                    ) : (
                      <div className="divide-y divide-white/5 text-xs">
                        {monthlySalesRecords.map(rec => (
                          <div key={rec.id} className="py-3 flex justify-between items-center">
                            <div>
                              <div className="flex gap-2 items-center">
                                <span className="font-mono text-[9px] bg-stone-850 border border-white/5 px-1.5 py-0.2 rounded text-stone-400">
                                  {formatDisplayDate(rec.date)}
                                </span>
                                <p className="font-semibold text-white">{rec.customer_name || (lang === 'ko' ? '미기재' : 'Unspecified')}</p>
                              </div>
                              <p className="text-[10px] text-stone-400 max-w-[200px] truncate">{rec.work_content}</p>
                            </div>
                            <span className="font-mono font-bold text-stone-200">₩{rec.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB CONTENT: 4. Customers */}
          {activeTab === 'customers' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="text-left">
                  <h2 className="font-serif text-lg font-semibold text-gold-400 tracking-wide">{t.customersTab}</h2>
                  <p className="text-xs text-stone-400">{lang === 'ko' ? '고객 정보 및 작업 내용 관리' : 'Manage customer contacts and work content'}</p>
                </div>
                <div className="flex gap-2.5 items-center">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder={lang === 'ko' ? '이름 또는 전화번호로 검색' : 'Search by name or phone'}
                    className="p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white text-xs w-48 sm:w-64"
                  />
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setCustName('');
                      setCustPhone('');
                      setCustWorkMenu('');
                      setShowCustomerModal(true);
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-mono font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(109,40,217,0.3)] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.addCustomer}</span>
                  </button>
                </div>
              </div>

              <div className="bg-stone-900/20 rounded-2xl border border-white/5 overflow-hidden shadow-xl backdrop-blur-md">
                {isCustomersLoading ? (
                  <div className="text-center py-16 text-stone-550 text-xs font-mono tracking-wider">{t.loadingRecords}</div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-16 text-stone-550 text-xs font-light">{t.noCustomers}</div>
                ) : (
                  <div className="divide-y divide-white/5 text-xs">
                    {filteredCustomers.map(cust => (
                      <div key={cust.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02] transition-all duration-300">
                        <div className="space-y-1.5 flex-1 w-full text-left">
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-serif text-sm font-semibold text-white">{cust.name}</h3>
                            {cust.phone && (
                              <span className="font-mono text-[10px] text-stone-400 bg-stone-950/60 px-2 py-0.5 rounded border border-white/5">
                                {cust.phone}
                              </span>
                            )}
                          </div>
                          {cust.work_menu && (
                            <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-3 rounded-lg border border-white/5">
                              <span className="font-mono text-[10px] text-stone-400 block mb-1 uppercase tracking-wider">{lang === 'ko' ? '작업 내용' : 'Work Content'}</span>
                              {cust.work_menu}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 border-white/5 pt-3.5 md:pt-0">
                          <div className="flex items-center gap-1.5 pl-4.5">
                            <button
                              onClick={() => {
                                setEditingCustomer(cust);
                                setCustName(cust.name || '');
                                setCustPhone(cust.phone || '');
                                setCustWorkMenu(cust.work_menu || '');
                                setShowCustomerModal(true);
                              }}
                              className="p-2 text-stone-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/5 transition-all cursor-pointer"
                              title={t.editCustomer}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(cust.id)}
                              className="p-2 text-rose-450 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-500/20 hover:border-rose-500 transition-all cursor-pointer"
                              title={t.deleteCustomer}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 5. Services */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="text-left">
                  <h2 className="font-serif text-lg font-semibold text-gold-400 tracking-wide">{t.servicesTab}</h2>
                  <p className="text-xs text-stone-400">{lang === 'ko' ? '시술 가격표 및 서비스 목록 수정 (전체 컬럼 수정 가능)' : 'Modify services registry and prices (All columns editable)'}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingService(null);
                    setSvcId('');
                    setSvcName('');
                    setSvcNameEn('');
                    setSvcPrice('');
                    setSvcDuration(30);
                    setSvcDescription('');
                    setSvcDescriptionEn('');
                    setSvcCategory('Cut');
                    setShowServiceModal(true);
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-mono font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(109,40,217,0.3)] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addService}</span>
                </button>
              </div>

              <div className="bg-stone-900/20 rounded-2xl border border-white/5 overflow-hidden shadow-xl backdrop-blur-md">
                {servicesList.length === 0 ? (
                  <div className="text-center py-16 text-stone-550 text-xs font-light">{t.noServices}</div>
                ) : (
                  <div className="divide-y divide-white/5 text-xs">
                    {servicesList.map(svc => (
                      <div key={svc.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02] transition-all duration-300">
                        <div className="space-y-1.5 flex-1 w-full text-left">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                              ID: {svc.id}
                            </span>
                            <h3 className="font-serif text-sm font-semibold text-white">
                              {svc.name} {svc.name_en && <span className="text-xs text-stone-400 font-normal font-sans ml-1">/ {svc.name_en}</span>}
                            </h3>
                            <span className="text-[10px] text-stone-455 font-mono">({(svc.duration_minutes || svc.durationMinutes || 30) + (lang === 'ko' ? '분' : 'm')})</span>
                          </div>
                          <p className="text-xs text-stone-300 leading-normal">
                            {svc.description}
                          </p>
                          {svc.description_en && (
                            <p className="text-xs text-stone-500 leading-normal italic mt-0.5">
                              En: {svc.description_en}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 border-white/5 pt-3.5 md:pt-0">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-mono text-stone-400 uppercase block tracking-widest">
                              {lang === 'ko' ? '단가' : 'Price'}
                            </span>
                            <span className="font-serif font-bold text-white text-base">
                              {svc.price !== null && svc.price !== undefined ? ('₩' + svc.price.toLocaleString()) : '가격 문의'}
                            </span>
                          </div>

                           <div className="flex items-center gap-1.5 pl-4.5 border-l border-white/5">
                            {/* Reordering Buttons */}
                            <div className="flex flex-col gap-0.5 mr-1.5">
                              <button
                                onClick={() => handleMoveService(svc, 'up')}
                                className="p-1 text-stone-400 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                disabled={servicesList.indexOf(svc) === 0}
                                title={lang === 'ko' ? '위로 이동' : 'Move Up'}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleMoveService(svc, 'down')}
                                className="p-1 text-stone-400 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                disabled={servicesList.indexOf(svc) === servicesList.length - 1}
                                title={lang === 'ko' ? '아래로 이동' : 'Move Down'}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                setEditingService(svc);
                                setSvcId(svc.id || '');
                                setSvcName(svc.name || '');
                                setSvcNameEn(svc.name_en || '');
                                setSvcPrice(svc.price !== null && svc.price !== undefined ? svc.price : '');
                                setSvcDuration(svc.duration_minutes || svc.durationMinutes || 30);
                                setSvcDescription(svc.description || '');
                                setSvcDescriptionEn(svc.description_en || '');
                                setSvcCategory(svc.category || 'Cut');
                                setShowServiceModal(true);
                              }}
                              className="p-2 text-stone-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/5 transition-all cursor-pointer"
                              title={t.editService}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(svc.id)}
                              className="p-2 text-rose-455 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-500/20 hover:border-rose-500 transition-all cursor-pointer"
                              title={t.deleteService}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 6. Admin Settings */}
          {activeTab === 'admin-settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-stone-900/30 p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl space-y-4 text-left">
                <div>
                  <h2 className="font-serif text-base font-semibold text-gold-400 tracking-wide flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gold-500" />
                    {lang === 'ko' ? '신규 예약 알림 수신 설정' : 'New Booking Alert Settings'}
                  </h2>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    {lang === 'ko' 
                      ? '고객이 새로운 예약을 신청했을 때 이메일 알림을 수신할 관리자 계정을 지정할 수 있습니다.' 
                      : 'Select which administrator accounts will receive email alerts when a new client booking is requested.'}
                  </p>
                </div>

                {/* Receiver Empty Warning Banner */}
                {!isLoadingAdmins && adminUsers.length > 0 && !adminUsers.some(u => u.receive_notifications) && (
                  <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-start gap-2.5 animate-pulse mt-2 text-left">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500" />
                    <div>
                      <p className="font-semibold">
                        {lang === 'ko' ? '⚠️ 경고: 이메일 알림 수신 지정자 없음' : '⚠️ Warning: No Email Alert Receiver Selected'}
                      </p>
                      <p className="text-[10px] text-red-400/80 mt-1 leading-normal">
                        {lang === 'ko' 
                          ? '현재 알림을 수신하도록 설정된 관리자가 아무도 없습니다. 신규 예약 신청이 등록되어도 이메일 알림이 발송되지 않습니다. 최소 한 명 이상의 관리자 설정을 켜주시기 바랍니다.' 
                          : 'No administrator is currently selected to receive notifications. No email alerts will go out when a new booking is requested. Please activate notification for at least one administrator.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* EmailJS Quota Tracker Progress Widget */}
                {emailUsage && (
                  <div className="p-4 bg-stone-950/50 rounded-xl border border-white/5 space-y-3 font-sans mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-stone-300">
                        📬 {lang === 'ko' ? 'EmailJS 이번 달 알림 전송 사용량' : 'EmailJS Current Cycle Usage'}
                      </span>
                      <span className="font-mono text-stone-400">
                        <strong className="text-gold-400 font-bold">{emailUsage.usage}</strong> / {emailUsage.limit} {lang === 'ko' ? '회' : 'reqs'}
                      </span>
                    </div>

                    {/* Progress Bar Gauge */}
                    <div className="w-full bg-stone-850 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                          (emailUsage.usage / emailUsage.limit) > 0.85 
                            ? 'from-red-500 to-rose-600' 
                            : (emailUsage.usage / emailUsage.limit) > 0.6 
                            ? 'from-amber-500 to-orange-600' 
                            : 'from-gold-550 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, (emailUsage.usage / emailUsage.limit) * 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-stone-500 font-mono">
                      <span>
                        {lang === 'ko' ? '잔여 횟수: ' : 'Remaining: '} 
                        <strong className="text-stone-300">{emailUsage.remaining}</strong> {lang === 'ko' ? '회' : 'times'}
                      </span>
                      <span>
                        {lang === 'ko' 
                          ? `초기화 기준일: 매월 ${emailUsage.startDate.split('-')[2]}일 (다음 리셋: ${emailUsage.resetDate})` 
                          : `Reset Day: Day ${emailUsage.startDate.split('-')[2]} (Next reset: ${emailUsage.resetDate})`}
                      </span>
                    </div>
                  </div>
                )}

                {isLoadingAdmins ? (
                  <div className="text-center py-12 text-stone-550 text-xs font-mono tracking-wider">
                    {lang === 'ko' ? '관리자 목록을 불러오는 중...' : 'Loading administrator records...'}
                  </div>
                ) : adminUsers.length === 0 ? (
                  <div className="text-center py-12 text-stone-500 text-xs font-light">
                    {lang === 'ko' ? '등록된 관리자가 없습니다.' : 'No administrators registered.'}
                  </div>
                ) : (
                  <div className="bg-stone-950/40 rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                    {adminUsers.map(admin => (
                      <div 
                        key={admin.id} 
                        className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.01] transition-all"
                      >
                        <div>
                          <h3 className="font-serif text-sm font-semibold text-white">{admin.name}</h3>
                          <p className="text-[11px] text-stone-500 font-mono mt-0.5">{admin.email}</p>
                        </div>
                        
                        <button
                          type="button"
                          disabled={isTogglingAdmin === admin.id}
                          onClick={() => handleToggleAdminNotification(admin.id, admin.receive_notifications)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 outline-none ${
                            admin.receive_notifications ? 'bg-indigo-600' : 'bg-stone-700'
                          } disabled:opacity-50`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-250 ease-in-out ${
                              admin.receive_notifications ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Telegram Bot Alert Settings Card */}
              <div className="bg-stone-900/30 p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl space-y-4 text-left">
                <div>
                  <h2 className="font-serif text-base font-semibold text-gold-400 tracking-wide flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gold-500" />
                    {lang === 'ko' ? '텔레그램 알림 및 브리핑 설정' : 'Telegram Alert & Briefing Settings'}
                  </h2>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    {lang === 'ko' 
                      ? '관리자용 텔레그램 봇의 알림 및 자동 브리핑 기능을 활성화하거나 비활성화할 수 있습니다.' 
                      : 'Toggle Telegram notifications for reservations confirmation and morning briefings.'}
                  </p>
                </div>

                <div className="bg-stone-950/40 rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                  {/* Toggle 1: 예약 확정 알림 */}
                  <div className="p-5 flex justify-between items-center gap-4 hover:bg-white/[0.01] transition-all">
                    <div>
                      <h3 className="font-serif text-sm font-semibold text-white">
                        {lang === 'ko' ? '예약 확정 알림' : 'Confirm Alert'}
                      </h3>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        {lang === 'ko' ? '대시보드에서 예약을 확정할 때 알림을 발송합니다.' : 'Dispatches telegram alert when reservation is confirmed.'}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      disabled={isUpdatingTelegramSettings}
                      onClick={() => handleToggleSetting('telegram_alert_confirm', telegramAlertConfirm)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 outline-none ${
                        telegramAlertConfirm ? 'bg-indigo-600' : 'bg-stone-700'
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-250 ease-in-out ${
                          telegramAlertConfirm ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: 당일 9시 브리핑 */}
                  <div className="p-5 flex justify-between items-center gap-4 hover:bg-white/[0.01] transition-all">
                    <div>
                      <h3 className="font-serif text-sm font-semibold text-white">
                        {lang === 'ko' ? '당일 9시 예약 확정 브리핑' : 'Morning Daily Briefing'}
                      </h3>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        {lang === 'ko' ? '매일 오전 9시에 금일 예약 확정 목록 브리핑을 발송합니다.' : 'Dispatches a summary list of today\'s bookings at 9 AM.'}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      disabled={isUpdatingTelegramSettings}
                      onClick={() => handleToggleSetting('telegram_daily_briefing', telegramDailyBriefing)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 outline-none ${
                        telegramDailyBriefing ? 'bg-indigo-600' : 'bg-stone-700'
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-250 ease-in-out ${
                          telegramDailyBriefing ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Announcement / Holidays Settings Card */}
              <div className="bg-stone-900/30 p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl space-y-6 text-left">
                <div>
                  <h2 className="font-serif text-base font-semibold text-gold-400 tracking-wide flex items-center gap-2">
                    <Info className="h-5 w-5 text-gold-500" />
                    {lang === 'ko' ? '사이트 공지사항 등록 및 관리' : 'Announcement Settings'}
                  </h2>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    {lang === 'ko' 
                      ? '휴가 일정, 이벤트 등의 소식을 상단 배너에 노출하기 위해 공지사항 기간을 설정하고 등록합니다.' 
                      : 'Post announcements for events or salon holiday closures at the top banner.'}
                  </p>
                </div>

                {/* Form to Create Announcement */}
                <form onSubmit={handleSaveAnnouncement} className="space-y-4 bg-stone-950/20 p-5 rounded-xl border border-white/5 text-xs font-mono">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-stone-400 font-bold block">{lang === 'ko' ? '세부사항 (국문)' : 'Details (KO)'}</label>
                      <input
                        type="text"
                        required
                        value={annDetails}
                        onChange={e => setAnnDetails(e.target.value)}
                        placeholder="예: 7/25~7/28 여름 휴가로 인해 임시 휴무합니다."
                        className="w-full p-2.5 bg-stone-900 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-stone-400 font-bold block">{lang === 'ko' ? '세부사항 (영문 - 선택)' : 'Details (EN - Optional)'}</label>
                      <input
                        type="text"
                        value={annDetailsEn}
                        onChange={e => setAnnDetailsEn(e.target.value)}
                        placeholder="e.g. Closed from July 25th to 28th for summer vacation."
                        className="w-full p-2.5 bg-stone-900 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold block">{lang === 'ko' ? '시작 일시' : 'Start Date & Time'}</label>
                      <input
                        type="datetime-local"
                        required
                        value={annStartTime}
                        onChange={e => setAnnStartTime(e.target.value)}
                        className="w-full p-2.5 bg-stone-900 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold block">{lang === 'ko' ? '종료 일시' : 'End Date & Time'}</label>
                      <input
                        type="datetime-local"
                        required
                        value={annEndTime}
                        onChange={e => setAnnEndTime(e.target.value)}
                        className="w-full p-2.5 bg-stone-900 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingAnnouncement}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer text-xs"
                    >
                      {isSavingAnnouncement 
                        ? (lang === 'ko' ? '등록 중...' : 'Posting...') 
                        : (lang === 'ko' ? '공지 등록하기' : 'Post Announcement')}
                    </button>
                  </div>
                </form>

                {/* Announcement List */}
                <div className="space-y-3">
                  <h3 className="font-serif text-sm font-semibold text-stone-200">
                    {lang === 'ko' ? '현재 등록된 공지사항 목록' : 'Registered Announcements'}
                  </h3>

                  {announcements.length === 0 ? (
                    <div className="text-center py-8 text-stone-500 text-xs font-light bg-stone-950/20 rounded-xl border border-white/5">
                      {lang === 'ko' ? '등록된 공지사항이 없습니다.' : 'No announcements registered.'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {announcements.map((ann) => {
                        const isCurrentlyActive = new Date(ann.start_time) <= new Date() && new Date() <= new Date(ann.end_time);
                        return (
                          <div 
                            key={ann.id} 
                            className={`p-4 rounded-xl border flex justify-between items-center gap-4 transition-all ${
                              isCurrentlyActive 
                                ? 'bg-indigo-950/20 border-indigo-500/20 hover:border-indigo-500/30' 
                                : 'bg-stone-950/40 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase">
                                  {isCurrentlyActive 
                                    ? (lang === 'ko' ? '🔴 노출 중' : '🔴 Active') 
                                    : (lang === 'ko' ? '⚪ 비활성' : '⚪ Inactive')}
                                </span>
                                <span className="text-[10px] text-stone-500 font-mono">
                                  {new Date(ann.start_time).toLocaleString()} ~ {new Date(ann.end_time).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs text-white font-serif truncate">{ann.details}</p>
                              {ann.details_en && (
                                <p className="text-[10px] text-stone-400 italic truncate">{ann.details_en}</p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="p-2 text-rose-455 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-500/20 hover:border-rose-500 transition-all cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add Manual Reservation Modal */}
      {showResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-slideUp">
            <button 
              onClick={() => setShowResModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-white border-b border-white/5 pb-3 mb-5">
              {t.addReservation}
            </h3>

            <form onSubmit={handleSaveReservation} className="space-y-4 text-xs">
              
              {/* Select Registered Customer */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.selectUser}</label>
                <select
                  value={resSelectedUserId}
                  onChange={e => handleUserSelectChange(e.target.value)}
                  className="w-full p-2.5 bg-stone-955/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-stone-900 text-white">{t.manualInput}</option>
                  {registeredUsers.map(user => (
                    <option key={user.id} value={user.id} className="bg-stone-900 text-white">
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.customerName} *</label>
                <input 
                  type="text"
                  required
                  value={resCustomerName}
                  onChange={e => setResCustomerName(e.target.value)}
                  placeholder="예: 홍길동"
                  disabled={!!resSelectedUserId}
                  className={`w-full p-2.5 border rounded-lg outline-none focus:border-indigo-500 ${
                    resSelectedUserId 
                      ? 'bg-stone-955/40 border-white/5 text-stone-500 cursor-not-allowed' 
                      : 'bg-stone-950/80 border-white/5 text-white'
                  }`}
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.customerPhone} *</label>
                <input 
                  type="text"
                  required
                  value={resCustomerPhone}
                  onChange={e => setResCustomerPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  disabled={!!resSelectedUserId}
                  className={`w-full p-2.5 border rounded-lg outline-none focus:border-indigo-500 ${
                    resSelectedUserId 
                      ? 'bg-stone-955/40 border-white/5 text-stone-550 cursor-not-allowed' 
                      : 'bg-stone-950/80 border-white/5 text-white'
                  }`}
                />
              </div>

              {/* Hair Service */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.service} *</label>
                <select
                  required
                  value={resServiceId}
                  onChange={e => handleServiceChange(e.target.value)}
                  className="w-full p-2.5 bg-stone-955/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" disabled className="bg-stone-900 text-white">{t.selectServicePrompt}</option>
                  {servicesList.map(svc => (
                    <option key={svc.id} value={svc.id} className="bg-stone-900 text-white">
                      {svc.name} {svc.price !== null && svc.price !== undefined ? `(₩${svc.price.toLocaleString()})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Price */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '예약 요금 / 금액' : 'Price / Amount'}</label>
                <input 
                  type="number"
                  value={resPrice}
                  onChange={e => setResPrice(e.target.value)}
                  placeholder={lang === 'ko' ? "직접 금액 입력 (미입력 가능)" : "Enter custom price (optional)"}
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white font-mono font-bold"
                />
              </div>

              {/* Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.date} *</label>
                  <input 
                    type="date"
                    required
                    value={resDate}
                    onChange={e => setResDate(e.target.value)}
                    className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.time} *</label>
                  <select
                    required
                    value={resTime}
                    onChange={e => setResTime(e.target.value)}
                    className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot} className="bg-stone-900 text-white">{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.status} *</label>
                <select
                  required
                  value={resStatus}
                  onChange={e => setResStatus(e.target.value)}
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="Pending" className="bg-stone-900 text-white">{t.statusPending}</option>
                  <option value="Confirmed" className="bg-stone-900 text-white">{t.statusConfirmed}</option>
                  <option value="Completed" className="bg-stone-900 text-white">{t.statusCompleted}</option>
                  <option value="Cancelled" className="bg-stone-900 text-white">{t.statusCancelled}</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResModal(false)}
                  className="flex-1 py-2.5 bg-stone-850 hover:bg-stone-800 border border-white/5 rounded-lg text-stone-300 font-semibold transition-all cursor-pointer text-center active:scale-[0.98]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold transition-all cursor-pointer text-center active:scale-[0.98] shadow-[0_0_10px_rgba(109,40,217,0.2)]"
                >
                  {t.save}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Work Record Modal */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-955/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-slideUp">
            <button 
              onClick={() => setShowWorkModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-white border-b border-white/5 pb-3 mb-5">
              {editingRecord ? t.editRecord : t.addRecord}
            </h3>

            <form onSubmit={handleSaveWorkRecord} className="space-y-4 text-xs">
              
              {/* Select Registered Customer */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.selectUser}</label>
                <select
                  value={workSelectedUserId}
                  onChange={e => handleWorkUserSelectChange(e.target.value)}
                  className="w-full p-2.5 bg-stone-955/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-stone-900 text-white">{t.manualInput}</option>
                  {registeredUsers.map(user => (
                    <option key={user.id} value={user.id} className="bg-stone-900 text-white">
                      {user.name} ({user.email || user.phone || 'No Contact'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Past Customer */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">
                  {lang === 'ko' ? '기존 매출 고객 선택' : 'Select Past Customer'}
                </label>
                <select
                  value={workSelectedPastKey}
                  onChange={e => handleWorkPastUserSelectChange(e.target.value)}
                  disabled={!!workSelectedUserId}
                  className={`w-full p-2.5 border rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer ${
                    workSelectedUserId 
                      ? 'bg-stone-955/40 border-white/5 text-stone-550 cursor-not-allowed' 
                      : 'bg-stone-955/80 border-white/5'
                  }`}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-stone-900 text-white">
                    {lang === 'ko' ? '-- 직접 입력 / 선택 안 함 --' : '-- Direct Input / None --'}
                  </option>
                  {pastCustomersList.map(cust => (
                    <option key={cust.key} value={cust.key} className="bg-stone-900 text-white">
                      {cust.name} ({cust.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.customerName}</label>
                <input 
                  type="text"
                  value={workCustomerName}
                  onChange={e => setWorkCustomerName(e.target.value)}
                  placeholder="예: 홍길동 (미기재 가능)"
                  disabled={!!workSelectedUserId || !!workSelectedPastKey}
                  className={`w-full p-2.5 border rounded-lg outline-none focus:border-indigo-500 ${
                    (workSelectedUserId || workSelectedPastKey)
                      ? 'bg-stone-955/40 border-white/5 text-stone-550 cursor-not-allowed' 
                      : 'bg-stone-955/80 border-white/5 text-white'
                  }`}
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">
                  {lang === 'ko' ? '전화번호' : 'Phone'}
                </label>
                <input 
                  type="text"
                  value={workCustomerPhone}
                  onChange={e => setWorkCustomerPhone(e.target.value)}
                  placeholder="예: 010-1234-5678 (미기재 가능)"
                  disabled={!!workSelectedUserId || !!workSelectedPastKey}
                  className={`w-full p-2.5 border rounded-lg outline-none focus:border-indigo-500 ${
                    (workSelectedUserId || workSelectedPastKey)
                      ? 'bg-stone-955/40 border-white/5 text-stone-550 cursor-not-allowed' 
                      : 'bg-stone-955/80 border-white/5 text-white'
                  }`}
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.date} *</label>
                <input 
                  type="date"
                  required
                  value={workDate}
                  onChange={e => setWorkDate(e.target.value)}
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {/* Work Details */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.workContent} *</label>
                <textarea 
                  required
                  rows={3}
                  value={workContent}
                  onChange={e => setWorkContent(e.target.value)}
                  placeholder="예: 시그니처 컷 + 볼륨 매직 시술 완료"
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white resize-none text-left"
                />
              </div>

              {/* Sales Amount */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.salesAmount} *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-550 font-mono">₩</span>
                  <input 
                    type="number"
                    required
                    min={0}
                    value={workAmount}
                    onChange={e => setWorkAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white font-mono font-bold text-left"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWorkModal(false)}
                  className="flex-1 py-2.5 bg-stone-850 hover:bg-stone-800 border border-white/5 rounded-lg text-stone-300 font-semibold transition-all cursor-pointer text-center active:scale-[0.98]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold transition-all cursor-pointer text-center active:scale-[0.98] shadow-[0_0_10px_rgba(109,40,217,0.2)]"
                >
                  {t.save}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-slideUp text-left">
            <button 
              onClick={() => setShowCustomerModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-white border-b border-white/5 pb-3 mb-5">
              {editingCustomer ? t.editCustomer : t.addCustomer}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              {/* Customer Name */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.customerName} *</label>
                <input 
                  type="text"
                  required
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white text-left"
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '전화번호' : 'Phone'} *</label>
                <input 
                  type="text"
                  required
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white text-left"
                />
              </div>

              {/* Work Details */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '작업 내용' : 'Work Content'}</label>
                <textarea 
                  rows={3}
                  value={custWorkMenu}
                  onChange={e => setCustWorkMenu(e.target.value)}
                  placeholder="예: 커트, 샴푸 등"
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white resize-none text-left"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 py-2.5 bg-stone-850 hover:bg-stone-800 border border-white/5 rounded-lg text-stone-300 font-semibold transition-all cursor-pointer text-center active:scale-[0.98]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold transition-all cursor-pointer text-center active:scale-[0.98] shadow-[0_0_10px_rgba(109,40,217,0.2)]"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-slideUp text-left">
            <button 
              onClick={() => setShowServiceModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-white border-b border-white/5 pb-3 mb-5">
              {editingService ? t.editService : t.addService}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              {/* Service ID (Primary Key) */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '서비스 ID (기본키)' : 'Service ID'} *</label>
                <input 
                  type="text"
                  required
                  value={svcId}
                  onChange={e => setSvcId(e.target.value)}
                  placeholder="예: s1"
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white text-left"
                />
              </div>

              {/* Service Name (Korean) */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '시술명 (한국어)' : 'Service Name (Korean)'} *</label>
                <input 
                  type="text"
                  required
                  value={svcName}
                  onChange={e => setSvcName(e.target.value)}
                  placeholder="예: 시그니처 컷"
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white text-left"
                />
              </div>

              {/* Service Name (English) */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '시술명 (영어)' : 'Service Name (English)'}</label>
                <input 
                  type="text"
                  value={svcNameEn}
                  onChange={e => setSvcNameEn(e.target.value)}
                  placeholder="예: Signature Cut"
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white text-left"
                />
              </div>

              {/* Service Category */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '카테고리' : 'Category'} *</label>
                <select
                  value={svcCategory}
                  onChange={e => setSvcCategory(e.target.value)}
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white text-left"
                >
                  <option value="Cut" className="bg-stone-900 text-white">{lang === 'ko' ? '커트 (Cut)' : 'Cut'}</option>
                  <option value="Color" className="bg-stone-900 text-white">{lang === 'ko' ? '염색 (Color)' : 'Color'}</option>
                  <option value="Perm" className="bg-stone-900 text-white">{lang === 'ko' ? '펌 (Perm)' : 'Perm'}</option>
                  <option value="Treatment" className="bg-stone-900 text-white">{lang === 'ko' ? '클리닉 (Treatment)' : 'Treatment'}</option>
                  <option value="Styling" className="bg-stone-900 text-white">{lang === 'ko' ? '스타일링 (Styling)' : 'Styling'}</option>
                </select>
              </div>

              {/* Service Price */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '단가 / 금액' : 'Price'}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-550 font-mono">₩</span>
                  <input 
                    type="number"
                    value={svcPrice}
                    onChange={e => setSvcPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="예: 15000 (빈 칸 설정 시 가격 문의)"
                    className="w-full pl-7 pr-3 py-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white font-mono font-bold text-left"
                  />
                </div>
              </div>

              {/* Duration Minutes */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '소요 시간 (분)' : 'Duration (minutes)'} *</label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={svcDuration}
                  onChange={e => setSvcDuration(Number(e.target.value))}
                  placeholder="예: 60"
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white font-mono text-left"
                />
              </div>

              {/* Description (Korean) */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '상세 설명 (한국어)' : 'Description (Korean)'}</label>
                <textarea 
                  rows={2}
                  value={svcDescription}
                  onChange={e => setSvcDescription(e.target.value)}
                  placeholder="예: 고급 샴푸와 두피 마사지가 포함된 시술입니다."
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white resize-none text-left"
                />
              </div>

              {/* Description (English) */}
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{lang === 'ko' ? '상세 설명 (영어)' : 'Description (English)'}</label>
                <textarea 
                  rows={2}
                  value={svcDescriptionEn}
                  onChange={e => setSvcDescriptionEn(e.target.value)}
                  placeholder="예: Includes premium shampoo and scalp massage."
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white resize-none text-left"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 py-2.5 bg-stone-850 hover:bg-stone-800 border border-white/5 rounded-lg text-stone-300 font-semibold transition-all cursor-pointer text-center active:scale-[0.98]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold transition-all cursor-pointer text-center active:scale-[0.98] shadow-[0_0_10px_rgba(109,40,217,0.2)]"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
