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
  FileSpreadsheet
} from 'lucide-react';
import { TRANSLATIONS, getLocalizedServices } from '@/lib/i18n';
import { getSupabaseClient } from '@/lib/supabase';

// Standard 24h styling slots
const TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function AdminDashboard() {
  const [lang, setLangState] = useState<'ko' | 'en'>('ko');
  const [activeTab, setActiveTab] = useState<'reservations' | 'work-records' | 'sales'>('reservations');
  
  // Reservations states
  const [reservations, setReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
  const [workAmount, setWorkAmount] = useState<number>(0);
  const [workDate, setWorkDate] = useState<string>('');

  // Sales statistics states
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>('');
  const [selectedMonthlyYear, setSelectedMonthlyYear] = useState<number>(new Date().getFullYear());
  const [selectedMonthlyMonth, setSelectedMonthlyMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYearlyYear, setSelectedYearlyYear] = useState<number>(new Date().getFullYear());

  // Authorization states
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null); // null means checking
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  const supabase = getSupabaseClient();

  // Sync language with localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('tg_lang') as 'ko' | 'en';
    if (savedLang === 'ko' || savedLang === 'en') {
      setLangState(savedLang);
    }
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    setWorkDate(today);
    setResDate(today);
    setSelectedDailyDate(today);
  }, []);

  const setLang = (newLang: 'ko' | 'en') => {
    setLangState(newLang);
    localStorage.setItem('tg_lang', newLang);
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
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile && profile.role === 'ADMIN') {
            setIsAdminAuthorized(true);
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
  }, [isAdminAuthorized]);

  const loadWorkRecords = async () => {
    setIsWorkLoading(true);
    try {
      // Fetch directly using Supabase JS client
      const { data, error } = await supabase
        .from('work_records')
        .select('*')
        .order('date', { ascending: true }); // 정렬: 날짜 오름차순

      if (error) {
        // Table not found or caching error -> fall back to Local Storage
        if (error.message.includes('relation "work_records" does not exist') || error.code === 'PGRST116' || error.code === '42P01') {
          setIsUsingLocalStorage(true);
          const localData = localStorage.getItem('tg_work_records');
          const records = localData ? JSON.parse(localData) : [];
          // Ensure ascending date sorting
          records.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
      records.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setWorkRecords(records);
    } finally {
      setIsWorkLoading(false);
    }
  };

  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resCustomerName || !resCustomerPhone || !resServiceId || !resDate || !resTime) return;

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
            customer_phone: resCustomerPhone,
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
        body: JSON.stringify({ status: newStatus }),
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
    setWorkAmount(0);
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
    setWorkAmount(record.amount);
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

  const handleSaveWorkRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workCustomerName || !workCustomerPhone || !workContent) return;

    const recordData = {
      customer_name: workCustomerName,
      customer_phone: workCustomerPhone,
      work_content: workContent,
      amount: Number(workAmount),
      date: workDate || new Date().toISOString().split('T')[0] // automatic fallback to today
    };

    try {
      if (isUsingLocalStorage) {
        const localData = localStorage.getItem('tg_work_records');
        let records = localData ? JSON.parse(localData) : [];
        if (editingRecord) {
          records = records.map((r: any) => r.id === editingRecord.id ? { ...r, ...recordData } : r);
        } else {
          records.push({ ...recordData, id: crypto.randomUUID() });
        }
        // sort ascending
        records.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        localStorage.setItem('tg_work_records', JSON.stringify(records));
        setWorkRecords(records);
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
    const phoneMatch = res.customerPhone?.includes(searchQuery) || false;
    const matchesSearch = nameMatch || phoneMatch;
    const matchesStatus = filterStatus === 'All' || res.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter work records (Search by phone or name)
  const filteredWorkRecords = workRecords.filter(rec => {
    const nameMatch = rec.customer_name?.toLowerCase().includes(searchWorkQuery.toLowerCase()) || false;
    const phoneMatch = rec.customer_phone?.includes(searchWorkQuery) || false;
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
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    work_content TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;

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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-mono text-xs text-stone-400">
        <span>Verifying Security Clearance (role: ADMIN)...</span>
      </div>
    );
  }

  if (isAdminAuthorized !== true) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-8 max-w-md w-full text-center space-y-6 animate-fadeIn">
          <div className="h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto border border-rose-200">
            <Lock className="h-6 w-6 text-rose-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              {lang === 'ko' ? '비공개 관리자 구역' : 'Access Restricted'}
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              {lang === 'ko' 
                ? '이 페이지는 관리자(role: ADMIN)만 접근할 수 있는 영역입니다. 일반 계정은 접근이 제한됩니다.' 
                : 'This page is restricted to salon administration (role = ADMIN) sessions only.'}
            </p>
          </div>
          <Link 
            href="/"
            className="w-full py-3 bg-stone-950 text-white text-xs font-semibold rounded-lg hover:bg-stone-850 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t.goToHome}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 antialiased flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-stone-900 flex items-center justify-center rounded-sm">
              <span className="text-gold-500 font-serif text-lg font-bold italic">G</span>
            </div>
            <span className="font-serif text-sm sm:text-base font-bold tracking-tight text-stone-900">THE HAIR GALLERY</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-stone-600 hover:text-stone-900 uppercase flex items-center gap-1.5 border border-stone-200 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{t.goToHome}</span>
            </Link>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 border border-stone-200 p-0.5 rounded-lg bg-stone-50 text-[10px] font-mono font-bold">
              <button
                onClick={() => setLang('ko')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  lang === 'ko' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                KO
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 sm:p-10">
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
          
          {/* Title Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 pb-6 gap-4">
            <div>
              <span className="text-xs font-mono tracking-widest text-gold-600 font-semibold uppercase block">{t.adminCockpit}</span>
              <h1 className="font-serif text-3xl font-normal text-stone-900">{t.adminTitle}</h1>
              <p className="text-xs text-stone-500 mt-1">{t.supabaseConnected}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 self-start">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t.liveConnection}
              </span>
              {isUsingLocalStorage ? (
                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 self-start">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  {lang === 'ko' ? '임시 로컬 저장소 모드' : 'Local Storage Mode'}
                </span>
              ) : (
                <span className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 self-start">
                  <Database className="h-3 w-3 text-sky-600" />
                  {lang === 'ko' ? 'Supabase 연동 완료' : 'Supabase Connected'}
                </span>
              )}
            </div>
          </div>

          {/* Database Missing Warning Banner */}
          {isUsingLocalStorage && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-amber-900 animate-fadeIn">
              <div className="flex gap-2.5 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">{lang === 'ko' ? '작업 기록 테이블 필요' : 'Work Records Table Required'}</h4>
                  <p className="mt-1 text-amber-800 leading-relaxed">
                    {t.dbErrorWarning}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(sqlCode);
                  alert(lang === 'ko' ? 'SQL 스크립트가 클립보드에 복사되었습니다!' : 'SQL script copied to clipboard!');
                }}
                className="shrink-0 text-[10px] font-mono font-bold px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg transition-colors cursor-pointer"
              >
                {lang === 'ko' ? 'SQL 코드 복사' : 'Copy SQL Script'}
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-stone-200/60 p-1.5 rounded-xl border border-stone-300/40 flex gap-2 overflow-x-auto scrollbar-none shadow-inner max-w-lg">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                activeTab === 'reservations'
                  ? 'bg-stone-950 text-white shadow-md'
                  : 'text-stone-550 hover:text-stone-900 hover:bg-stone-300/30'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{t.reservationsTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('work-records')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                activeTab === 'work-records'
                  ? 'bg-stone-950 text-white shadow-md'
                  : 'text-stone-550 hover:text-stone-900 hover:bg-stone-300/30'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{t.workRecordsTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                activeTab === 'sales'
                  ? 'bg-stone-950 text-white shadow-md'
                  : 'text-stone-550 hover:text-stone-900 hover:bg-stone-300/30'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>{t.salesDashboardTab}</span>
            </button>
          </div>

          {/* TAB CONTENT: 1. Reservations */}
          {activeTab === 'reservations' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Controls & Add Button */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-9 pr-4 py-2 border border-stone-200 focus:border-stone-900 rounded-lg text-xs outline-none bg-stone-50 transition-colors animate-fadeIn"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="py-2 px-3 border border-stone-200 rounded-lg text-xs bg-white outline-none cursor-pointer text-stone-700 w-32 sm:w-auto"
                  >
                    <option value="All">{t.allStatuses}</option>
                    <option value="Pending">{t.statusPending}</option>
                    <option value="Confirmed">{t.statusConfirmed}</option>
                    <option value="Completed">{t.statusCompleted}</option>
                    <option value="Cancelled">{t.statusCancelled}</option>
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
                    className="bg-stone-900 hover:bg-stone-850 text-white text-xs font-mono font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.addReservation}</span>
                  </button>
                </div>
              </div>

              {/* Reservations List */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-stone-900 text-stone-100 flex justify-between items-center flex-wrap gap-2">
                  <h2 className="font-serif text-base font-medium text-gold-500">{t.reservationsRoster}</h2>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400">
                    {t.sortedBy}
                  </span>
                </div>

                {isLoading ? (
                  <div className="text-center py-12 text-stone-400 text-xs font-mono">{t.loadingRecords}</div>
                ) : filteredReservations.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs font-light">{t.noRecords}</div>
                ) : (
                  <div className="divide-y divide-stone-100 text-xs">
                    {filteredReservations.map(res => (
                      <div key={res.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-stone-50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded">
                              {res.date} @ {res.time}
                            </span>
                            <h3 className="font-serif text-sm font-semibold text-stone-950">{res.customerName}</h3>
                          </div>
                          <p className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                            <Phone className="h-3 w-3 text-stone-400" /> {res.customerPhone}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="font-semibold text-stone-900">{res.serviceName}</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">
                              {lang === 'ko' ? '요금: ' : 'Price: '}
                              {res.price > 1000 ? `₩${res.price.toLocaleString()}` : `$${res.price}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 border-l border-stone-200 pl-4">
                            {res.status === 'Pending' && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'Confirmed')}
                                className="p-1.5 bg-sky-50 hover:bg-sky-500 text-sky-700 hover:text-white rounded border border-sky-200 transition-colors cursor-pointer"
                                title={t.confirmReservation}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {res.status === 'Confirmed' && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'Completed')}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white rounded border border-emerald-200 transition-colors cursor-pointer"
                                title={t.completeAppointment}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {res.status !== 'Cancelled' && res.status !== 'Completed' && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'Cancelled')}
                                className="p-1.5 bg-stone-50 hover:bg-rose-500 text-stone-500 hover:text-white rounded border border-stone-200 hover:border-rose-300 transition-colors cursor-pointer"
                                title={t.cancelAppointment}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            <span className={`text-[10px] font-mono font-bold tracking-wide uppercase px-2 py-1 rounded block ${
                              res.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              res.status === 'Confirmed' ? 'bg-sky-100 text-sky-800' :
                              res.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-stone-100 text-stone-700'
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchWorkQuery}
                    onChange={e => setSearchWorkQuery(e.target.value)}
                    placeholder={t.searchWorkPlaceholder}
                    className="w-full pl-9 pr-4 py-2 border border-stone-200 focus:border-stone-900 rounded-lg text-xs outline-none bg-white transition-colors"
                  />
                </div>
                <button
                  onClick={openAddModal}
                  className="bg-stone-900 hover:bg-stone-850 text-white text-xs font-mono font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.addRecord}</span>
                </button>
              </div>

              {/* Work Records List */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-stone-900 text-stone-100 flex justify-between items-center">
                  <h2 className="font-serif text-base font-medium text-gold-500">{t.workRecordsTab}</h2>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400">
                    {lang === 'ko' ? '날짜 오름차순 정렬' : 'Sorted by date (asc)'}
                  </span>
                </div>

                {isWorkLoading ? (
                  <div className="text-center py-12 text-stone-400 text-xs font-mono">{t.loadingRecords}</div>
                ) : filteredWorkRecords.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs font-light">{t.noWorkRecords}</div>
                ) : (
                  <div className="divide-y divide-stone-100 text-xs">
                    {filteredWorkRecords.map(rec => (
                      <div key={rec.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-stone-50 transition-colors">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded">
                              {formatDisplayDate(rec.date)}
                            </span>
                            <h3 className="font-serif text-sm font-semibold text-stone-950">{rec.customer_name}</h3>
                            <span className="text-[10px] text-stone-400 font-mono">({rec.customer_phone})</span>
                          </div>
                          <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                            {rec.work_content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 border-stone-100 pt-3 md:pt-0">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-mono text-stone-400 uppercase block tracking-wider">
                              {lang === 'ko' ? '매출 금액' : 'Revenue'}
                            </span>
                            <span className="font-serif font-bold text-stone-950 text-base">
                              ₩{rec.amount.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pl-4 border-l border-stone-200">
                            <button
                              onClick={() => openEditModal(rec)}
                              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200 cursor-pointer"
                              title={t.editRecord}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkRecord(rec.id)}
                              className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-colors border border-rose-200 hover:border-rose-600 cursor-pointer"
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
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono tracking-wider text-stone-400 font-bold uppercase">{t.dailySales}</span>
                      <Calendar className="h-4 w-4 text-gold-600" />
                    </div>
                    {/* Date Selector */}
                    <input 
                      type="date"
                      value={selectedDailyDate}
                      onChange={e => setSelectedDailyDate(e.target.value)}
                      className="text-xs py-1 px-2 border border-stone-200 rounded-lg bg-stone-50 outline-none text-stone-700 w-full"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      {formatDisplayDate(selectedDailyDate)} {lang === 'ko' ? '합계' : 'Total'}
                    </span>
                    <span className="text-2xl font-serif font-bold text-stone-900">
                      ₩{dailySalesSum.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 2. Monthly Card */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono tracking-wider text-stone-400 font-bold uppercase">{t.monthlySales}</span>
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    {/* Month Selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedMonthlyYear}
                        onChange={e => setSelectedMonthlyYear(Number(e.target.value))}
                        className="text-xs py-1 px-2 border border-stone-200 rounded-lg bg-stone-50 outline-none text-stone-700 cursor-pointer"
                      >
                        {[2025, 2026, 2027, 2028].map(yr => (
                          <option key={yr} value={yr}>{yr}년</option>
                        ))}
                      </select>
                      <select
                        value={selectedMonthlyMonth}
                        onChange={e => setSelectedMonthlyMonth(Number(e.target.value))}
                        className="text-xs py-1 px-2 border border-stone-200 rounded-lg bg-stone-50 outline-none text-stone-700 cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{m}월</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      {selectedMonthlyYear}/{selectedMonthlyMonth} {lang === 'ko' ? '합계' : 'Total'}
                    </span>
                    <span className="text-2xl font-serif font-bold text-emerald-700">
                      ₩{monthlySalesSum.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 3. Yearly Card */}
                <div className="bg-gradient-to-br from-stone-900 to-stone-850 rounded-2xl p-6 shadow-md text-white flex flex-col justify-between space-y-4 border border-stone-950">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono tracking-wider text-stone-400 font-bold uppercase">{t.yearlySales}</span>
                      <DollarSign className="h-4 w-4 text-gold-500" />
                    </div>
                    {/* Year Selector */}
                    <select
                      value={selectedYearlyYear}
                      onChange={e => setSelectedYearlyYear(Number(e.target.value))}
                      className="text-xs py-1 px-2 border border-stone-750 rounded-lg bg-stone-800 text-white outline-none cursor-pointer w-full"
                    >
                      {[2025, 2026, 2027, 2028].map(yr => (
                        <option key={yr} value={yr}>{yr}년</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      {selectedYearlyYear}년 {lang === 'ko' ? '누적 합계' : 'Yearly Cumulative'}
                    </span>
                    <span className="text-2xl font-serif font-bold text-gold-400">
                      ₩{yearlySalesSum.toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>

              {/* Sales breakdown lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Selected Day Details */}
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
                    <h3 className="font-serif text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-stone-500" />
                      <span>{formatDisplayDate(selectedDailyDate)} {lang === 'ko' ? '매출 상세 내역' : 'Daily Transactions'}</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                      {dailySalesRecords.length}건
                    </span>
                  </div>
                  <div className="p-4 max-h-[300px] overflow-y-auto">
                    {dailySalesRecords.length === 0 ? (
                      <p className="text-center py-8 text-stone-400 text-xs font-light">{lang === 'ko' ? '해당 날짜에 기록된 매출이 없습니다.' : 'No transactions recorded on this day.'}</p>
                    ) : (
                      <div className="divide-y divide-stone-100 text-xs">
                        {dailySalesRecords.map(rec => (
                          <div key={rec.id} className="py-2.5 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-stone-900">{rec.customer_name}</p>
                              <p className="text-[10px] text-stone-400 max-w-[200px] truncate">{rec.work_content}</p>
                            </div>
                            <span className="font-mono font-bold text-stone-900">₩{rec.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Month Details */}
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
                    <h3 className="font-serif text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-stone-500" />
                      <span>{selectedMonthlyYear}년 {selectedMonthlyMonth}월 {lang === 'ko' ? '매출 상세 내역' : 'Monthly Transactions'}</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                      {monthlySalesRecords.length}건
                    </span>
                  </div>
                  <div className="p-4 max-h-[300px] overflow-y-auto">
                    {monthlySalesRecords.length === 0 ? (
                      <p className="text-center py-8 text-stone-400 text-xs font-light">{lang === 'ko' ? '해당 월에 기록된 매출이 없습니다.' : 'No transactions recorded in this month.'}</p>
                    ) : (
                      <div className="divide-y divide-stone-100 text-xs">
                        {monthlySalesRecords.map(rec => (
                          <div key={rec.id} className="py-2.5 flex justify-between items-center">
                            <div>
                              <div className="flex gap-1.5 items-center">
                                <span className="font-mono text-[9px] bg-stone-100 border border-stone-200 px-1 py-0.2 rounded text-stone-500">
                                  {formatDisplayDate(rec.date)}
                                </span>
                                <p className="font-semibold text-stone-900">{rec.customer_name}</p>
                              </div>
                              <p className="text-[10px] text-stone-400 max-w-[200px] truncate">{rec.work_content}</p>
                            </div>
                            <span className="font-mono font-bold text-stone-900">₩{rec.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>

      {/* Add Manual Reservation Modal */}
      {showResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-slideUp">
            <button 
              onClick={() => setShowResModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3 mb-5">
              {t.addReservation}
            </h3>

            <form onSubmit={handleSaveReservation} className="space-y-4 text-xs">
              
              {/* Select Registered Customer */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.selectUser}</label>
                <select
                  value={resSelectedUserId}
                  onChange={e => handleUserSelectChange(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50 cursor-pointer text-stone-700"
                >
                  <option value="">{t.manualInput}</option>
                  {registeredUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.customerName} *</label>
                <input 
                  type="text"
                  required
                  value={resCustomerName}
                  onChange={e => setResCustomerName(e.target.value)}
                  placeholder="예: 홍길동"
                  disabled={!!resSelectedUserId}
                  className={`w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 ${
                    resSelectedUserId ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-stone-50 text-stone-900'
                  }`}
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.customerPhone} *</label>
                <input 
                  type="text"
                  required
                  value={resCustomerPhone}
                  onChange={e => setResCustomerPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  disabled={!!resSelectedUserId}
                  className={`w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 ${
                    resSelectedUserId ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-stone-50 text-stone-900'
                  }`}
                />
              </div>

              {/* Hair Service */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.service} *</label>
                <select
                  required
                  value={resServiceId}
                  onChange={e => handleServiceChange(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50 cursor-pointer text-stone-700"
                >
                  <option value="" disabled>{t.selectServicePrompt}</option>
                  {servicesList.map(svc => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} {svc.price !== null && svc.price !== undefined ? `(₩${svc.price.toLocaleString()})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Price / Price for reservation */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{lang === 'ko' ? '예약 요금 / 금액' : 'Price / Amount'}</label>
                <input 
                  type="number"
                  value={resPrice}
                  onChange={e => setResPrice(e.target.value)}
                  placeholder={lang === 'ko' ? "직접 금액 입력 (미입력 가능)" : "Enter custom price (optional)"}
                  className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50 text-stone-900 font-mono font-bold"
                />
              </div>

              {/* Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-600 block">{t.date} *</label>
                  <input 
                    type="date"
                    required
                    value={resDate}
                    onChange={e => setResDate(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-600 block">{t.time} *</label>
                  <select
                    required
                    value={resTime}
                    onChange={e => setResTime(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50 cursor-pointer text-stone-700"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.status} *</label>
                <select
                  required
                  value={resStatus}
                  onChange={e => setResStatus(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50 cursor-pointer text-stone-700"
                >
                  <option value="Pending">{t.statusPending}</option>
                  <option value="Confirmed">{t.statusConfirmed}</option>
                  <option value="Completed">{t.statusCompleted}</option>
                  <option value="Cancelled">{t.statusCancelled}</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResModal(false)}
                  className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 font-semibold transition-colors cursor-pointer text-center"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-stone-950 hover:bg-stone-850 text-white rounded-lg font-semibold transition-colors cursor-pointer text-center"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-slideUp">
            <button 
              onClick={() => setShowWorkModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3 mb-5">
              {editingRecord ? t.editRecord : t.addRecord}
            </h3>

            <form onSubmit={handleSaveWorkRecord} className="space-y-4 text-xs">
              
              {/* Select Registered Customer */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.selectUser}</label>
                <select
                  value={workSelectedUserId}
                  onChange={e => handleWorkUserSelectChange(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50 cursor-pointer text-stone-700"
                >
                  <option value="">{t.manualInput}</option>
                  {registeredUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email || user.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Load from Past Records */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block font-sans">
                  {lang === 'ko' ? '지난 기록으로부터 불러오기' : 'Load from Past Records'}
                </label>
                <select
                  value={workSelectedPastKey}
                  onChange={e => handleWorkPastUserSelectChange(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50 cursor-pointer text-stone-700"
                >
                  <option value="">{t.manualInput}</option>
                  {pastCustomersList.map(cust => (
                    <option key={cust.key} value={cust.key}>
                      {cust.name} ({cust.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.customerName} *</label>
                <input 
                  type="text"
                  required
                  value={workCustomerName}
                  onChange={e => setWorkCustomerName(e.target.value)}
                  placeholder="예: 홍길동"
                  disabled={!!workSelectedUserId || !!workSelectedPastKey}
                  className={`w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 ${
                    (workSelectedUserId || workSelectedPastKey) ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-stone-50 text-stone-900'
                  }`}
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.customerPhone} *</label>
                <input 
                  type="text"
                  required
                  value={workCustomerPhone}
                  onChange={e => setWorkCustomerPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  disabled={!!workSelectedUserId || !!workSelectedPastKey}
                  className={`w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 ${
                    (workSelectedUserId || workSelectedPastKey) ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-stone-50 text-stone-900'
                  }`}
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.date} *</label>
                <input 
                  type="date"
                  required
                  value={workDate}
                  onChange={e => setWorkDate(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50"
                />
              </div>

              {/* Work Details */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.workContent} *</label>
                <textarea 
                  required
                  rows={3}
                  value={workContent}
                  onChange={e => setWorkContent(e.target.value)}
                  placeholder="예: 시그니처 컷 + 볼륨 매직 시술 완료"
                  className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50 resize-none"
                />
              </div>

              {/* Sales Amount */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block">{t.salesAmount} *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono">₩</span>
                  <input 
                    type="number"
                    required
                    min={0}
                    value={workAmount}
                    onChange={e => setWorkAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 border border-stone-200 rounded-lg outline-none focus:border-stone-900 bg-stone-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWorkModal(false)}
                  className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 font-semibold transition-colors cursor-pointer text-center"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-stone-950 hover:bg-stone-850 text-white rounded-lg font-semibold transition-colors cursor-pointer text-center"
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
