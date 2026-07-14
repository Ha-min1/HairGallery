import React from 'react';
import { Calendar, Phone, CheckCircle, Clock4, XCircle, ShoppingBag, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { Reservation, ServiceMenu, User } from '../types';

interface ClientDashboardProps {
  currentUser: User;
  reservations: Reservation[];
  services: ServiceMenu[];
  onCancelReservation: (id: string) => void;
  onNavigateToBooking: () => void;
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

export default function ClientDashboard({ currentUser, reservations, services, onCancelReservation, onNavigateToBooking, lang = 'ko' }: ClientDashboardProps) {
  const isKo = lang === 'ko';

  const clientReservations = reservations
    .filter(res => res.userId === currentUser.id || res.customerPhone === currentUser.phone)
    .sort((a, b) => {
      // Sort upcoming first, sorted by date & time
      return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
    });

  const getServiceInfo = (serviceId: string) => {
    const s = services.find(s => s.id === serviceId);
    if (!s) return { name: isKo ? '살롱 헤어 시술' : 'Salon Service', price: 0, id: '' };
    const loc = getLocalizedService(s.id, s.name, s.description, isKo);
    return { name: loc.name, price: s.price, id: s.id };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded uppercase tracking-wide">{isKo ? '확인 대기중' : 'Pending Verification'}</span>;
      case 'Confirmed':
        return <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold rounded uppercase tracking-wide">{isKo ? '예약 확정됨' : 'Confirmed Slot'}</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded uppercase tracking-wide">{isKo ? '시술 완료' : 'Completed Session'}</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded uppercase tracking-wide">{isKo ? '취소 처리됨' : 'Cancelled'}</span>;
      default:
        return null;
    }
  };

  const upcomingReservations = clientReservations.filter(res => res.status === 'Pending' || res.status === 'Confirmed');
  const pastReservations = clientReservations.filter(res => res.status === 'Completed' || res.status === 'Cancelled');

  return (
    <div className="max-w-4xl mx-auto my-12 px-4 space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-stone-900 text-stone-100 p-8 rounded border border-stone-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[80%] rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2">
          <span className="font-mono text-[10px] tracking-widest text-[#BFA181] font-bold uppercase">
            {isKo ? '개인 마이페이지 콘솔' : 'PERSONAL PROFILE'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal leading-tight text-stone-50">
            {isKo ? <>{currentUser.name} 님, 반갑습니다</> : <>Hello, {currentUser.name}</>}
          </h1>
          <p className="text-xs text-stone-300 font-light max-w-md leading-relaxed">
            {isKo 
              ? '더 헤어 갤러리 예약 통합 대스크입니다. 예약 스케줄 실시간 접수 및 스타일 히스토리 기록을 이곳에서 관리해 드립니다.'
              : 'Welcome to your Hair Gallery concierge desk. Track styling slots, cancel scheduling, and browse historical recipe files.'}
          </p>
        </div>

        <div className="flex flex-col text-[11px] text-stone-400 font-mono space-y-1 bg-stone-950/40 p-4 rounded border border-stone-800 shrink-0 w-full md:w-auto">
          <p className="flex justify-between md:justify-start gap-4">
            <span className="text-stone-500 w-16 shrink-0">{isKo ? '이메일 주소:' : 'EMAIL:'}</span>
            <span className="font-semibold text-stone-300">{currentUser.email}</span>
          </p>
          <p className="flex justify-between md:justify-start gap-4">
            <span className="text-stone-500 w-16 shrink-0">{isKo ? '연락처 번호:' : 'PHONE:'}</span>
            <span className="font-semibold text-stone-300 font-mono">{currentUser.phone || (isKo ? '연락처 미등록' : 'No Phone Registered')}</span>
          </p>
          <p className="flex justify-between md:justify-start gap-4">
            <span className="text-stone-500 w-16 shrink-0">{isKo ? '연동 수단:' : 'METHOD:'}</span>
            <span className="font-semibold text-stone-300 capitalize">
              {currentUser.provider === 'google' ? (isKo ? '구글 소셜 로그인' : 'Google Login') : (isKo ? '이메일 계정 가입' : 'Email Account')}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Upcoming bookings */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border-b border-stone-200 pb-2">
            <h2 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-[#BFA181]"></span>
              {isKo ? '현재 활성화된 시술 예약 내역' : 'Your Active Reservations'}
            </h2>
          </div>

          {upcomingReservations.length === 0 ? (
            <div className="bg-white rounded border border-stone-200 p-8 text-center space-y-4 shadow-sm">
              <p className="text-xs text-stone-400 font-light">
                {isKo ? '현재 예약 신청되거나 확정된 스케줄이 없습니다.' : 'You do not have any active styling reservations scheduled.'}
              </p>
              <button
                onClick={onNavigateToBooking}
                className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-widest rounded shadow-sm transition-colors cursor-pointer"
              >
                {isKo ? '실시간 헤어 시술 예약하러 가기' : 'Schedule First Session'}
              </button>
            </div>
          ) : (
            <div className="space-y-4" id="client-active-bookings-list">
              {upcomingReservations.map(res => {
                const sInfo = getServiceInfo(res.serviceId);
                return (
                  <div key={res.id} className="bg-white rounded border border-stone-200 p-5 shadow-sm hover:border-stone-400 transition-all flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100">{res.date}</span>
                          <span className="font-mono text-[10px] text-stone-500">
                            {isKo ? `시작 시간: ${res.time}` : `at ${res.time}`}
                          </span>
                        </div>
                        <h3 className="font-serif text-base font-semibold text-stone-900 mt-2">{sInfo.name}</h3>
                      </div>
                      <div>
                        {getStatusBadge(res.status)}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100/80 flex items-center justify-between text-xs flex-wrap gap-3">
                      <div>
                        <span className="text-stone-400 font-mono text-[10px] block uppercase">{isKo ? '예정 시술비' : 'Est. Investment'}</span>
                        <span className="font-serif text-sm font-bold text-stone-900">
                          {isKo ? `${sInfo.price.toLocaleString()}원` : `₩${sInfo.price.toLocaleString()}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {res.status === 'Pending' && (
                          <div className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 bg-amber-50/50 px-2 py-1 rounded">
                            <Clock4 className="h-3 w-3" /> {isKo ? '원장 검토 대기중' : 'Stylist reviews shortly'}
                          </div>
                        )}
                        <button
                          onClick={() => onCancelReservation(res.id)}
                          className="px-3 py-1.5 border border-stone-200 hover:border-rose-200 text-stone-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded transition-all cursor-pointer"
                        >
                          {isKo ? '예약 취소' : 'Cancel Appointment'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Past styling records */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border-b border-stone-200 pb-2">
            <h2 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-[#BFA181]"></span>
              {isKo ? '시술 스타일 이력 및 히스토리' : 'Style Ledger History'}
            </h2>
          </div>

          {pastReservations.length === 0 ? (
            <div className="bg-white rounded border border-stone-200 p-6 text-center text-stone-400 text-xs font-light">
              {isKo ? '이전에 이용하셨던 헤어 시술 내역이 기록되어 있지 않습니다.' : 'No previous services registered on this profile.'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2" id="client-past-bookings-list">
              {pastReservations.map(res => {
                const sInfo = getServiceInfo(res.serviceId);
                return (
                  <div key={res.id} className="bg-white rounded border border-stone-200 p-4 text-xs shadow-inner flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono text-[10px] text-stone-400">{res.date}</span>
                        <h4 className="font-semibold text-stone-800 mt-0.5">{sInfo.name}</h4>
                      </div>
                      <div>
                        {getStatusBadge(res.status)}
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
  );
}
