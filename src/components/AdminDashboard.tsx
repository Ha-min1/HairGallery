import React, { useState } from 'react';
import { Calendar, Search, CheckCircle, Clock4, XCircle, Sparkles, User, Phone, Database, BookOpen, Clock, Settings, RefreshCw, Filter } from 'lucide-react';
import { Reservation, ServiceMenu, ReservationStatus } from '../types';

interface AdminDashboardProps {
  reservations: Reservation[];
  services: ServiceMenu[];
  onUpdateReservationStatus: (id: string, newStatus: ReservationStatus) => void;
  onResetMockData: () => void;
  lang?: 'ko' | 'en';
}

const getLocalizedService = (id: string, name: string, description?: string, isKo?: boolean) => {
  if (!isKo) return { name, description };
  switch (id) {
    case 's1':
      return {
        name: '시그니처 커트 & 블로우아웃',
        description: '고객님의 얼굴형과 두상에 맞춘 1:1 비스포크 커트 디자인. 럭셔리 스파 워시와 탄력 있는 시그니처 드라이 스타일링이 포함됩니다.'
      };
    case 's2':
      return {
        name: '젠츠 프리시전 컷 (남성 디자인)',
        description: '정교한 가위&클리퍼 커트, 세밀한 텍스처라이징, 스팀 타월 마사지 및 프리미엄 매트 왁스 스타일링.'
      };
    case 's3':
      return {
        name: '시그니처 발레아쥬 아트',
        description: '자연스럽게 어우러지는 수제 하이라이팅 염색. 모발 손상을 줄이면서 부드럽고 풍부한 입체감을 연출합니다.'
      };
    case 's4':
      return {
        name: '풀 디멘셔널 염색 (전체 염색)',
        description: '모발에 깊이감과 투명한 광택을 주는 비스포크 글레이징 및 전체 톤 업/다운 컬러 트리트먼트.'
      };
    case 's5':
      return {
        name: '뿌리 염색 (리터치)',
        description: '새치 커버 및 기존 헤어 톤과의 완벽한 뿌리 매칭, 영양 가득한 프로틴 보호막 코팅 포함.'
      };
    case 's6':
      return {
        name: '프리미엄 케라틴 매직 크리닉',
        description: '부스스한 곱슬을 차분하게 교정하고 습도로부터 모발을 보호하여 데일리 스타일링 시간을 단축해 주는 프리미엄 결 케어.'
      };
    case 's7':
      return {
        name: '블랙 캐비어 무코타 딥 컨디셔닝',
        description: '블랙 캐비어 추출물과 세라마이드 단백질을 모발 깊숙이 침투시켜 푸석한 모발에 수분과 고광택 지질 보호막을 생성합니다.'
      };
    case 's8':
      return {
        name: '레드카펫 블로우아웃 & 스타일링',
        description: '드레스업 행사나 촬영을 위한 특별한 드라이 스타일링. 볼륨감 넘치는 세팅과 고정 윤기 마감.'
      };
    default:
      return { name, description };
  }
};

export default function AdminDashboard({ reservations, services, onUpdateReservationStatus, onResetMockData, lang = 'ko' }: AdminDashboardProps) {
  const isKo = lang === 'ko';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [historySearch, setHistorySearch] = useState<string>('');
  
  // Tab within Admin Dashboard: Appointments vs Client History vs Schema Specs
  const [activeTab, setActiveTab] = useState<'appointments' | 'clients' | 'schema'>('appointments');

  const getServiceInfo = (serviceId: string) => {
    const s = services.find(s => s.id === serviceId);
    if (!s) return { name: isKo ? '알 수 없는 시술' : 'Unknown Service', price: 0, durationMinutes: 0, id: '' };
    const loc = getLocalizedService(s.id, s.name, s.description, isKo);
    return { name: loc.name, price: s.price, durationMinutes: s.durationMinutes, id: s.id };
  };

  // 1. Filtered reservations for scheduling lists
  const sortedReservations = [...reservations].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  const filteredReservations = sortedReservations.filter(res => {
    const matchesSearch = res.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.customerPhone.includes(searchQuery);
    const matchesStatus = filterStatus === 'All' || res.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Today's Date String
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayReservations = filteredReservations.filter(res => res.date === todayStr);
  const upcomingReservations = filteredReservations.filter(res => res.date > todayStr);
  const historicReservations = filteredReservations.filter(res => res.date < todayStr);

  // 2. Client History Management
  // Unique list of clients derived from all reservations
  interface ClientRecord {
    name: string;
    phone: string;
    bookings: Reservation[];
  }

  const clientMap = new Map<string, ClientRecord>();
  reservations.forEach(res => {
    const key = `${res.customerName.toLowerCase()}_${res.customerPhone}`;
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        name: res.customerName,
        phone: res.customerPhone,
        bookings: []
      });
    }
    clientMap.get(key)!.bookings.push(res);
  });

  const clientsList = Array.from(clientMap.values()).filter(c => 
    c.name.toLowerCase().includes(historySearch.toLowerCase()) || c.phone.includes(historySearch)
  );

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded uppercase tracking-wide">{isKo ? '승인대기' : 'Pending'}</span>;
      case 'Confirmed':
        return <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold rounded uppercase tracking-wide">{isKo ? '확정됨' : 'Confirmed'}</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded uppercase tracking-wide">{isKo ? '시술완료' : 'Completed'}</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded uppercase tracking-wide">{isKo ? '취소됨' : 'Cancelled'}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto my-10 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-200 pb-6 mb-8 gap-4">
        <div>
          <span className="font-mono text-xs tracking-widest text-[#BFA181] font-bold uppercase block">
            {isKo ? '관리 콘솔 제어센터' : 'OWNER PORTAL'}
          </span>
          <h1 className="font-serif text-3xl font-normal text-stone-900">
            {isKo ? '더 헤어 갤러리 예약 운영팀 콘솔' : 'Salon Management Console'}
          </h1>
          <p className="text-xs text-stone-500 font-light mt-1">
            {isKo ? '엘레나 로스토바 원장 • 최고시스템관리자' : 'Elena Rostova • Administrator'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onResetMockData}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 hover:border-stone-400 text-xs font-semibold rounded transition-colors cursor-pointer"
            title={isKo ? '데이터베이스를 데포 시드 상태로 초기화' : 'Reset to default mock data'}
          >
            <RefreshCw className="h-3 w-3 text-[#BFA181]" />
            {isKo ? '가상 데이터 초기화' : 'Reset DB'}
          </button>
          
          <div className="flex bg-stone-100 p-1 rounded text-xs">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-3 py-1.5 font-bold rounded transition-colors cursor-pointer ${
                activeTab === 'appointments' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {isKo ? '실시간 예약 접수 현황' : 'Reservations'}
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3 py-1.5 font-bold rounded transition-colors cursor-pointer ${
                activeTab === 'clients' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {isKo ? '고객 카드 조회' : 'Client History'}
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-1 px-3 py-1.5 font-bold rounded transition-colors cursor-pointer ${
                activeTab === 'schema' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Database className="h-3.5 w-3.5 text-[#BFA181]" />
              {isKo ? 'Supabase 스키마 정보' : 'SQL Schema'}
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: Appointments List */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded border border-stone-200 shadow-sm">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isKo ? '고객 성함 또는 연락처 뒤 4자리를 입력하고 엔터...' : 'Search guest name or contact number...'}
                className="w-full pl-9 pr-4 py-2 border border-stone-200 focus:border-stone-950 rounded text-xs outline-none bg-[#FBFBFA]"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full py-2 px-3 border border-stone-200 rounded text-xs bg-white outline-none cursor-pointer font-bold"
              >
                <option value="All">{isKo ? '전체 예약 상황 보기' : 'All Booking Statuses'}</option>
                <option value="Pending">{isKo ? '승인대기 스케줄' : 'Pending'}</option>
                <option value="Confirmed">{isKo ? '확정완료 스케줄' : 'Confirmed'}</option>
                <option value="Completed">{isKo ? '시술 완료 기록' : 'Completed'}</option>
                <option value="Cancelled">{isKo ? '예약 취소 내역' : 'Cancelled'}</option>
              </select>
            </div>

            <div className="md:col-span-3 text-right flex items-center justify-end text-xs font-mono text-stone-500">
              {isKo ? `조회된 예약 개수: ${filteredReservations.length}건` : `Active Display: ${filteredReservations.length} appointments`}
            </div>
          </div>

          {/* Appointments Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Today's Appointments */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h2 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#BFA181]"></span>
                  {isKo ? '오늘 진행되는 스타일 타임라인' : "Today's Styling Grid"}
                </h2>
                <span className="font-mono text-[10px] bg-stone-100 text-[#BFA181] font-bold px-2 py-0.5 rounded uppercase">{todayStr}</span>
              </div>

              {todayReservations.length === 0 ? (
                <div className="bg-white rounded border border-stone-200 p-8 text-center text-stone-400 text-xs font-light">
                  {isKo ? '오늘 예정된 시술 예약 내역이 비어 있습니다.' : 'No styling appointments booked for today.'}
                </div>
              ) : (
                <div className="space-y-3" id="today-appointments-list">
                  {todayReservations.map(res => {
                    const sInfo = getServiceInfo(res.serviceId);
                    return (
                      <div key={res.id} className="bg-white rounded border border-stone-200 p-5 shadow-sm hover:border-stone-400 transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">{res.time}</span>
                              <h3 className="font-serif text-sm font-semibold text-stone-900">{res.customerName}</h3>
                            </div>
                            <p className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                              <Phone className="h-3 w-3 text-stone-400" /> {res.customerPhone}
                            </p>
                          </div>
                          <div>
                            {getStatusBadge(res.status)}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                          <div>
                            <span className="text-stone-400 text-[10px] block uppercase font-mono tracking-wider">{isKo ? '요청하신 헤어 서비스 메뉴' : 'Requested Service'}</span>
                            <span className="font-bold text-stone-800">{sInfo.name}</span>
                            <span className="text-stone-400 text-[11px] font-mono"> ({isKo ? `${sInfo.price.toLocaleString()}원` : `₩${sInfo.price.toLocaleString()}`})</span>
                          </div>

                          {/* Quick Actions Status Switch */}
                          <div className="flex flex-wrap gap-1.5 pt-1 sm:pt-0">
                            {res.status === 'Pending' && (
                              <button
                                onClick={() => onUpdateReservationStatus(res.id, 'Confirmed')}
                                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
                              >
                                {isKo ? '예약 승인' : 'Confirm'}
                              </button>
                            )}
                            {res.status === 'Confirmed' && (
                              <button
                                onClick={() => onUpdateReservationStatus(res.id, 'Completed')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
                              >
                                {isKo ? '시술 완료' : 'Complete'}
                              </button>
                            )}
                            {res.status !== 'Completed' && res.status !== 'Cancelled' && (
                              <button
                                onClick={() => onUpdateReservationStatus(res.id, 'Cancelled')}
                                className="px-3 py-1 bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-500 text-[10px] font-bold uppercase border border-stone-200 hover:border-rose-200 rounded transition-colors cursor-pointer"
                              >
                                {isKo ? '예약 거부' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Col: Upcoming & Historic Appointments */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border-b border-stone-200 pb-2">
                <h2 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#BFA181]"></span>
                  {isKo ? '내일 이후 다가오는 예약들' : 'Upcoming Reservations'}
                </h2>
              </div>

              {upcomingReservations.length === 0 ? (
                <div className="bg-white rounded border border-stone-200 p-8 text-center text-stone-400 text-xs font-light">
                  {isKo ? '예정된 예약 일정이 비어 있습니다.' : 'No upcoming appointments scheduled.'}
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" id="upcoming-appointments-list">
                  {upcomingReservations.map(res => {
                    const sInfo = getServiceInfo(res.serviceId);
                    return (
                      <div key={res.id} className="bg-white rounded border border-stone-200 p-4 shadow-sm hover:border-stone-400 transition-all text-xs">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{res.date}</span>
                              <span className="font-mono text-[10px] text-stone-500">
                                {isKo ? `${res.time} 시` : `at ${res.time}`}
                              </span>
                              <h3 className="font-serif font-semibold text-stone-950">{res.customerName}</h3>
                            </div>
                            <p className="text-[10px] text-stone-400 font-mono mt-1">
                              {isKo ? '고객 연락처:' : 'Contact:'} {res.customerPhone}
                            </p>
                          </div>
                          <div>
                            {getStatusBadge(res.status)}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-stone-100 flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <span className="text-stone-600 font-semibold">{sInfo.name}</span>
                            <span className="text-stone-400 font-mono text-[11px]"> ({isKo ? `${sInfo.price.toLocaleString()}원` : `₩${sInfo.price.toLocaleString()}`})</span>
                          </div>

                          <div className="flex gap-1">
                            {res.status === 'Pending' && (
                              <button
                                onClick={() => onUpdateReservationStatus(res.id, 'Confirmed')}
                                className="px-2 py-0.5 bg-sky-600 text-white text-[9px] font-bold uppercase rounded cursor-pointer"
                              >
                                {isKo ? '예약승인' : 'Confirm'}
                              </button>
                            )}
                            {res.status === 'Confirmed' && (
                              <button
                                onClick={() => onUpdateReservationStatus(res.id, 'Completed')}
                                className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold uppercase rounded cursor-pointer"
                              >
                                {isKo ? '시술완료' : 'Complete'}
                              </button>
                            )}
                            {res.status !== 'Completed' && res.status !== 'Cancelled' && (
                              <button
                                onClick={() => onUpdateReservationStatus(res.id, 'Cancelled')}
                                className="px-2 py-0.5 bg-stone-100 text-stone-500 text-[9px] font-bold uppercase border border-stone-200 rounded cursor-pointer"
                              >
                                {isKo ? '예약취소' : 'Cancel'}
                              </button>
                            )}
                          </div>
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

      {/* VIEW 2: Client History Log */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded border border-stone-200 shadow-sm relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder={isKo ? '조회하실 단골 고객의 이름 또는 정확한 연락처를 입력...' : 'Search customers name or exact telephone contact...'}
              className="w-full pl-11 pr-4 py-2.5 border border-stone-200 focus:border-stone-950 rounded text-xs outline-none bg-[#FBFBFA]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="clients-history-grid">
            {clientsList.map((client, cIdx) => {
              // Calculate past services
              const pastSessions = client.bookings.filter(b => b.status === 'Completed');
              const activeSessions = client.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending');

              return (
                <div key={cIdx} className="bg-white rounded border border-stone-200 p-6 space-y-4 shadow-sm hover:border-stone-400 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-serif text-base font-semibold border border-stone-200 shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold text-stone-900">{client.name}</h3>
                      <p className="text-xs text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {client.phone}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-stone-100 py-3 text-xs">
                    <div>
                      <span className="text-stone-400 block uppercase font-mono text-[9px] tracking-wider">
                        {isKo ? '완료 처리된 헤어 시술' : 'Completed Treatments'}
                      </span>
                      <span className="text-stone-900 font-bold text-sm mt-0.5 block">
                        {pastSessions.length} {isKo ? '회 완료' : 'sessions'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block uppercase font-mono text-[9px] tracking-wider">
                        {isKo ? '대기 / 활성 스케줄' : 'Active Bookings'}
                      </span>
                      <span className="text-[#BFA181] font-bold text-sm mt-0.5 block">
                        {activeSessions.length} {isKo ? '개 예약됨' : 'scheduled'}
                      </span>
                    </div>
                  </div>

                  {/* Booking timeline list */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono">
                      {isKo ? '헤어 솔루션 타임라인 히스토리' : 'Service Timeline'}
                    </span>
                    
                    {client.bookings.length === 0 ? (
                      <p className="text-[11px] text-stone-400 font-light">{isKo ? '등록된 예약 스케줄 이력이 전혀 없습니다.' : 'No booking history recorded.'}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-2">
                        {client.bookings.map(b => {
                          const s = getServiceInfo(b.serviceId);
                          return (
                            <div key={b.id} className="flex justify-between items-center text-[11px] p-2 bg-stone-50 rounded border border-stone-100">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-stone-400">{b.date}</span>
                                <span className="font-semibold text-stone-800">{s.name}</span>
                              </div>
                              <div>
                                {getStatusBadge(b.status)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: PostgreSQL / Prisma Database Representation schema */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-stone-900 text-stone-200 rounded border border-stone-800 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-[#BFA181]" />
                <h2 className="font-serif text-lg font-medium text-stone-50">
                  {isKo ? 'Supabase PostgreSQL 및 Prisma 테이블 설계 명세서' : 'Supabase & Prisma Database Architectural Schema'}
                </h2>
              </div>
              <p className="text-xs text-stone-400 max-w-2xl font-light leading-relaxed">
                {isKo 
                  ? '더 헤어 갤러리는 백엔드 영구 스토리지 데이터 무결성을 위해 Supabase의 PostgreSQL을 연동하도록 설계되어 있습니다. 하단의 테이블 구조(Schema) 명세서를 확인하여 즉각 배포가 가능합니다.'
                  : 'The Hair Gallery boilerplate utilizes Supabase PostgreSQL under Cloudflare Pages with absolute database consistency and strict Relational Integrity. Review our structural schemas below.'}
              </p>
            </div>

            {/* Prisma Schema Code block */}
            <div className="space-y-3">
              <span className="block text-xs font-mono tracking-widest text-[#BFA181] uppercase font-bold">1. PRISMA DATABASE MODEL (prisma/schema.prisma)</span>
              <pre className="p-4 bg-stone-950 text-emerald-400 text-xs font-mono rounded border border-stone-800 overflow-x-auto leading-relaxed shadow-inner">
{`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Supabase Connection URI
}

enum Role {
  USER
  ADMIN
}

enum ReservationStatus {
  Pending
  Confirmed
  Completed
  Cancelled
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  name         String
  role         Role          @default(USER)
  phone        String?
  provider     String        // "credentials" or "google"
  createdAt    DateTime      @default(now())
  reservations Reservation[]
}

model ServiceMenu {
  id              String        @id @default(uuid())
  name            String
  price           Float
  durationMinutes Int
  category        String        // "Cut", "Color", "Treatment", "Styling"
  description     String?
  reservations    Reservation[]
}

model Reservation {
  id            String            @id @default(uuid())
  userId        String
  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  customerName  String
  customerPhone String
  serviceId     String
  service       ServiceMenu       @relation(fields: [serviceId], references: [id])
  date          String            // YYYY-MM-DD
  time          String            // HH:mm (24-hour)
  status        ReservationStatus @default(Pending)
  createdAt     DateTime          @default(now())

  @@index([date, time]) // Performance index for live slot lookups
}`}
              </pre>
            </div>

            {/* Direct SQL Code Block */}
            <div className="space-y-3 pt-4">
              <span className="block text-xs font-mono tracking-widest text-[#BFA181] uppercase font-bold">2. DIRECT SQL SEEDING & TABLES (supabase/schema.sql)</span>
              <pre className="p-4 bg-stone-950 text-amber-500 text-xs font-mono rounded border border-stone-800 overflow-x-auto leading-relaxed shadow-inner">
{`-- Create custom types for strict validations
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE reservation_status AS ENUM ('Pending', 'Confirmed', 'Completed', 'Cancelled');

-- Create Users table with standard security integrations
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'USER',
    phone VARCHAR(50),
    provider VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Service Menu registry
CREATE TABLE service_menus (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT
);

-- Create reservations ledger with relational integrity
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    service_id VARCHAR(50) REFERENCES service_menus(id),
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    status reservation_status DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create search optimization index for double-booking validator queries
CREATE INDEX idx_reservations_date_time ON reservations(date, time);`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
