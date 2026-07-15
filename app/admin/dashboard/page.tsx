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
    <div className="min-h-screen bg-[#09090b] text-stone-100 antialiased flex flex-col relative overflow-hidden select-none">
      {/* Ambient background glows for Aura aesthetic */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[25%] w-[350px] h-[350px] bg-[#d97706]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/85 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between z-10 relative">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm transition-transform group-hover:scale-105">
              <span className="text-stone-955 font-serif text-lg font-bold italic">G</span>
            </div>
            <span className="font-serif text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-gold-400 transition-colors">THE HAIR GALLERY</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-stone-300 hover:text-white uppercase flex items-center gap-1.5 border border-white/5 px-3 py-1.5 rounded-lg bg-stone-900/50 hover:bg-stone-850 transition-all active:scale-[0.98]"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{t.goToHome}</span>
            </Link>

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
                <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 self-start">
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
                className="shrink-0 text-[10px] font-mono font-bold px-3.5 py-2 bg-amber-500 text-stone-950 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer active:scale-[0.98]"
              >
                {lang === 'ko' ? 'SQL 코드 복사' : 'Copy SQL Script'}
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-stone-900/50 p-1.5 rounded-xl border border-white/5 flex gap-2 overflow-x-auto scrollbar-none shadow-xl max-w-lg backdrop-blur-md">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                activeTab === 'reservations'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{t.reservationsTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('work-records')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                activeTab === 'work-records'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{t.workRecordsTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                activeTab === 'sales'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(109,40,217,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
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
                    className="py-2 px-3 bg-stone-950/60 border border-white/5 rounded-lg text-xs text-stone-300 outline-none cursor-pointer focus:border-indigo-500/80 w-32 sm:w-auto"
                  >
                    <option value="All" className="bg-stone-900">{t.allStatuses}</option>
                    <option value="Pending" className="bg-stone-900">{t.statusPending}</option>
                    <option value="Confirmed" className="bg-stone-900">{t.statusConfirmed}</option>
                    <option value="Completed" className="bg-stone-900">{t.statusCompleted}</option>
                    <option value="Cancelled" className="bg-stone-900">{t.statusCancelled}</option>
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
                  <h2 className="font-serif text-base font-semibold text-gold-400 tracking-wide">{t.reservationsRoster}</h2>
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
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                              {res.date} @ {res.time}
                            </span>
                            <h3 className="font-serif text-sm font-semibold text-white">{res.customerName}</h3>
                          </div>
                          <p className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-stone-500" /> {res.customerPhone}
                          </p>
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
                              res.status === 'Confirmed' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
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
                            <h3 className="font-serif text-sm font-semibold text-white">{rec.customer_name}</h3>
                            <span className="text-[10px] text-stone-400 font-mono">({rec.customer_phone})</span>
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
                      <Calendar className="h-4.5 w-4.5 text-gold-500" />
                    </div>
                    {/* Date Selector */}
                    <input 
                      type="date"
                      value={selectedDailyDate}
                      onChange={e => setSelectedDailyDate(e.target.value)}
                      className="text-xs py-1.5 px-3 border border-white/5 rounded-lg bg-stone-955/60 outline-none text-stone-200 w-full focus:border-indigo-500/60"
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
                        className="text-xs py-1.5 px-2 bg-stone-950/60 border border-white/5 rounded-lg outline-none text-stone-300 cursor-pointer focus:border-indigo-500/60"
                      >
                        {[2025, 2026, 2027, 2028].map(yr => (
                          <option key={yr} value={yr} className="bg-stone-900">{yr}년</option>
                        ))}
                      </select>
                      <select
                        value={selectedMonthlyMonth}
                        onChange={e => setSelectedMonthlyMonth(Number(e.target.value))}
                        className="text-xs py-1.5 px-2 bg-stone-950/60 border border-white/5 rounded-lg outline-none text-stone-300 cursor-pointer focus:border-indigo-500/60"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m} className="bg-stone-900">{m}월</option>
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
                    <DollarSign className="w-32 h-32 text-gold-500" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono tracking-widest text-stone-400 font-bold uppercase">{t.yearlySales}</span>
                      <DollarSign className="h-4.5 w-4.5 text-gold-500" />
                    </div>
                    {/* Year Selector */}
                    <select
                      value={selectedYearlyYear}
                      onChange={e => setSelectedYearlyYear(Number(e.target.value))}
                      className="text-xs py-1.5 px-3 border border-white/5 rounded-lg bg-stone-900/80 text-white outline-none cursor-pointer w-full focus:border-gold-500/50"
                    >
                      {[2025, 2026, 2027, 2028].map(yr => (
                        <option key={yr} value={yr} className="bg-stone-900">{yr}년</option>
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
                              <p className="font-semibold text-white">{rec.customer_name}</p>
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
                                <p className="font-semibold text-white">{rec.customer_name}</p>
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
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                >
                  <option value="" className="bg-stone-900">{t.manualInput}</option>
                  {registeredUsers.map(user => (
                    <option key={user.id} value={user.id} className="bg-stone-900">
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
                      ? 'bg-stone-955/40 border-white/5 text-stone-555 cursor-not-allowed' 
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
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                >
                  <option value="" disabled className="bg-stone-900">{t.selectServicePrompt}</option>
                  {servicesList.map(svc => (
                    <option key={svc.id} value={svc.id} className="bg-stone-900">
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
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.time} *</label>
                  <select
                    required
                    value={resTime}
                    onChange={e => setResTime(e.target.value)}
                    className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot} className="bg-stone-900">{slot}</option>
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
                >
                  <option value="Pending" className="bg-stone-900">{t.statusPending}</option>
                  <option value="Confirmed" className="bg-stone-900">{t.statusConfirmed}</option>
                  <option value="Completed" className="bg-stone-900">{t.statusCompleted}</option>
                  <option value="Cancelled" className="bg-stone-900">{t.statusCancelled}</option>
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
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.selectUser}</label>
                <select
                  value={workSelectedUserId}
                  onChange={e => handleWorkUserSelectChange(e.target.value)}
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                >
                  <option value="" className="bg-stone-900">{t.manualInput}</option>
                  {registeredUsers.map(user => (
                    <option key={user.id} value={user.id} className="bg-stone-900">
                      {user.name} ({user.email || user.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Load from Past Records */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">
                  {lang === 'ko' ? '지난 기록으로부터 불러오기' : 'Load from Past Records'}
                </label>
                <select
                  value={workSelectedPastKey}
                  onChange={e => handleWorkPastUserSelectChange(e.target.value)}
                  className="w-full p-2.5 bg-stone-950/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-stone-200 cursor-pointer"
                >
                  <option value="" className="bg-stone-900">{t.manualInput}</option>
                  {pastCustomersList.map(cust => (
                    <option key={cust.key} value={cust.key} className="bg-[#09090b]">{cust.name} ({cust.phone})</option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.customerName} *</label>
                <input 
                  type="text"
                  required
                  value={workCustomerName}
                  onChange={e => setWorkCustomerName(e.target.value)}
                  placeholder="예: 홍길동"
                  disabled={!!workSelectedUserId || !!workSelectedPastKey}
                  className={`w-full p-2.5 border rounded-lg outline-none focus:border-indigo-500 ${
                    (workSelectedUserId || workSelectedPastKey) 
                      ? 'bg-stone-955/40 border-white/5 text-stone-550 cursor-not-allowed' 
                      : 'bg-stone-955/80 border-white/5 text-white'
                  }`}
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.customerPhone} *</label>
                <input 
                  type="text"
                  required
                  value={workCustomerPhone}
                  onChange={e => setWorkCustomerPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  disabled={!!workSelectedUserId || !!workSelectedPastKey}
                  className={`w-full p-2.5 border rounded-lg outline-none focus:border-indigo-500 ${
                    (workSelectedUserId || workSelectedPastKey) 
                      ? 'bg-stone-955/40 border-white/5 text-stone-550 cursor-not-allowed' 
                      : 'bg-stone-955/80 border-white/5 text-white'
                  }`}
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.date} *</label>
                <input 
                  type="date"
                  required
                  value={workDate}
                  onChange={e => setWorkDate(e.target.value)}
                  className="w-full p-2.5 bg-stone-955/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white"
                />
              </div>

              {/* Work Details */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.workContent} *</label>
                <textarea 
                  required
                  rows={3}
                  value={workContent}
                  onChange={e => setWorkContent(e.target.value)}
                  placeholder="예: 시그니처 컷 + 볼륨 매직 시술 완료"
                  className="w-full p-2.5 bg-stone-955/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white resize-none"
                />
              </div>

              {/* Sales Amount */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-400 block font-mono uppercase tracking-wider text-[10px]">{t.salesAmount} *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-mono">₩</span>
                  <input 
                    type="number"
                    required
                    min={0}
                    value={workAmount}
                    onChange={e => setWorkAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 bg-stone-955/80 border border-white/5 rounded-lg outline-none focus:border-indigo-500 text-white font-mono font-bold"
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

    </div>
  );
}

}