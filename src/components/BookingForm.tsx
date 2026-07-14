import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Scissors, User, Phone, CheckCircle, Info, Sparkles } from 'lucide-react';
import { ServiceMenu, Reservation, User as UserType } from '../types';

interface BookingFormProps {
  currentUser: UserType | null;
  services: ServiceMenu[];
  reservations: Reservation[];
  onAddReservation: (reservationData: {
    customerName: string;
    customerPhone: string;
    serviceId: string;
    date: string;
    time: string;
  }) => void;
  onNavigateToAuth: () => void;
  lang?: 'ko' | 'en';
}

// 24-hour standard slots for the Salon (Tuesday – Saturday, 09:00 – 20:00)
const TIME_SLOTS_24H = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:30', '16:30', '17:30', '18:00', '19:00'
];

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

export default function BookingForm({ currentUser, services, reservations, onAddReservation, onNavigateToAuth, lang = 'ko' }: BookingFormProps) {
  const isKo = lang === 'ko';

  // Get tomorrow's date string as default minimum
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowString());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  // Validation status
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Auto-populate logged-in user profile
  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name);
      setCustomerPhone(currentUser.phone || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [currentUser]);

  // Dynamic slot booking checks
  useEffect(() => {
    if (selectedDate) {
      // Find all active (non-cancelled) reservations for the picked date
      const activeBookings = reservations.filter(
        res => res.date === selectedDate && res.status !== 'Cancelled'
      );
      
      const times = activeBookings.map(res => res.time);
      setBookedTimes(times);
      
      // If previously selected time becomes unavailable, reset it
      if (times.includes(selectedTime)) {
        setSelectedTime('');
      }
    }
  }, [selectedDate, reservations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedServiceId) {
      setErrorMsg(isKo ? '살롱 헤어 서비스 메뉴를 선택해주세요.' : 'Please select a salon hair service from our menu.');
      return;
    }
    if (!selectedDate) {
      setErrorMsg(isKo ? '예약 날짜를 올바르게 선택해주세요.' : 'Please select a valid date for your styling.');
      return;
    }
    if (!selectedTime) {
      setErrorMsg(isKo ? '예약 가능한 시간대를 선택해주세요.' : 'Please choose an available time slot.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg(isKo ? '시술을 받으실 예약자 성함을 입력해주세요.' : 'Please specify the recipient guest name.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg(isKo ? '예약 연락 및 비상용 연락처를 입력해주세요.' : 'Please specify a mobile phone contact number.');
      return;
    }

    // Secondary safety double-booking verification
    if (bookedTimes.includes(selectedTime)) {
      setErrorMsg(isKo ? '선택하신 시간대는 이미 다른 고객님께서 예약하셨습니다. 다른 일정을 선택해주세요.' : 'This time slot is already fully reserved. Please pick another time.');
      return;
    }

    // Trigger parent storage add
    onAddReservation({
      customerName,
      customerPhone,
      serviceId: selectedServiceId,
      date: selectedDate,
      time: selectedTime
    });

    setIsSuccess(true);
    // Scroll to top of panel
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const localizedService = selectedService ? getLocalizedService(selectedService.id, selectedService.name, selectedService.description, isKo) : null;

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-lg border border-stone-200 shadow-xl p-8 text-center space-y-6 animate-fadeIn">
        <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
          <CheckCircle className="h-9 w-9 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-normal text-stone-900">
            {isKo ? '예약 신청 완료!' : 'Appointment Requested!'}
          </h2>
          <p className="text-xs text-stone-500 font-light max-w-sm mx-auto">
            {isKo 
              ? '더 헤어 갤러리 프리미엄 예약 시술이 접수되었습니다. 담당 헤어 디자이너가 실시간 배정 확인 후 연락드리겠습니다.' 
              : 'Your luxury styling reservation at The Hair Gallery has been submitted. A stylist will verify your slot shortly.'}
          </p>
        </div>

        <div className="bg-[#FBFBFA] border border-stone-200 rounded p-5 text-left divide-y divide-stone-200/60 text-xs text-stone-700">
          <div className="py-2.5 flex justify-between">
            <span className="text-stone-400">{isKo ? '예약자 이름:' : 'Guest Recipient:'}</span>
            <span className="font-bold text-stone-900">{customerName}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-stone-400">{isKo ? '선택한 시술:' : 'Hair Service:'}</span>
            <span className="font-bold text-stone-900">{localizedService?.name}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-stone-400">{isKo ? '예약 일시:' : 'Scheduled For:'}</span>
            <span className="font-bold text-stone-900 font-mono">{selectedDate} {selectedTime}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-stone-400">{isKo ? '예약자 연락처:' : 'Mobile Alert:'}</span>
            <span className="font-bold text-[#1A1A1A] font-mono">{customerPhone}</span>
          </div>
          <div className="py-2.5 flex justify-between font-bold text-stone-900">
            <span className="text-stone-400">{isKo ? '예상 금액:' : 'Estimated Cost:'}</span>
            <span className="font-serif text-sm">
              {selectedService ? (isKo ? `${selectedService.price.toLocaleString()}원` : `₩${selectedService.price.toLocaleString()}`) : ''}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setIsSuccess(false);
              setSelectedServiceId('');
              setSelectedTime('');
              if (!currentUser) {
                setCustomerName('');
                setCustomerPhone('');
              }
            }}
            className="flex-1 py-3 border border-stone-200 hover:border-stone-400 rounded text-xs font-semibold uppercase tracking-wider text-stone-600 transition-colors cursor-pointer"
          >
            {isKo ? '새 예약 신청하기' : 'Book Another'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      <div className="text-center space-y-3 mb-10">
        <span className="font-mono text-xs tracking-widest text-[#BFA181] font-semibold uppercase block">
          {isKo ? '실시간 스케줄 관리 데스크' : 'SCHEDULING DESK'}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-950">
          {isKo ? '프리미엄 헤어 시술 예약' : 'Book Your Styling Reservation'}
        </h1>
        <div className="h-0.5 w-12 bg-[#BFA181] mx-auto"></div>
        <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
          {isKo 
            ? '원하시는 맞춤 헤어 서비스를 선택하고, 예약 가능한 날짜와 비어 있는 시간 슬롯을 예약하여 비스포크 살롱을 경험하세요.'
            : 'Select your service, choose an open date and time slot, and finalize your direct salon booking.'}
        </p>
      </div>

      {!currentUser && (
        <div className="mb-8 p-5 bg-stone-900 text-stone-100 rounded border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif text-sm font-semibold text-[#BFA181] flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="h-4 w-4" />
              {isKo ? '로그인 후 더 간편한 예약 서비스를 만나보세요' : 'Sign in for seamless reservations'}
            </h3>
            <p className="text-[11px] text-stone-400 font-light max-w-md">
              {isKo 
                ? '구글 로그인 또는 계정 등록을 하시면 연락처 정보 자동입력, 예약 스케줄 실시간 알림 추적 및 과거 스타일 이력을 영구 보관하실 수 있습니다.'
                : 'Sign in with Google or create an account to auto-populate contact files, track live stylist status, and access past records.'}
            </p>
          </div>
          <button
            onClick={onNavigateToAuth}
            className="shrink-0 px-5 py-2.5 bg-[#BFA181] hover:bg-[#aa8c6c] text-[#1A1A1A] hover:text-white text-xs font-bold uppercase tracking-widest rounded shadow-md transition-colors cursor-pointer"
          >
            {isKo ? '로그인 / 신규가입' : 'Login / Register'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Services & Info */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Select Service */}
          <div className="bg-white p-6 rounded border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-[#BFA181]"></span>
              {isKo ? '1단계: 헤어 시술 메뉴 선택' : 'Select Salon Service Menu'}
            </h3>
            
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2" id="booking-services-list">
              {services.map((service) => {
                const loc = getLocalizedService(service.id, service.name, service.description, isKo);
                return (
                  <label
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`block p-4 rounded border transition-all duration-200 cursor-pointer text-left ${
                      selectedServiceId === service.id
                        ? 'bg-stone-50 border-[#BFA181] ring-1 ring-[#BFA181]/50 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 bg-[#FBFBFA]/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="service"
                          checked={selectedServiceId === service.id}
                          onChange={() => setSelectedServiceId(service.id)}
                          className="mt-1 accent-[#BFA181]"
                        />
                        <div>
                          <span className="text-[9px] font-mono text-[#BFA181] uppercase tracking-widest font-black block">
                            {isKo ? (service.category === 'Cut' ? '커트' : service.category === 'Color' ? '염색' : service.category === 'Treatment' ? '클리닉' : '스타일링') : service.category}
                          </span>
                          <h4 className="text-xs font-bold text-[#1A1A1A] mt-0.5">{loc.name}</h4>
                          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{loc.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-serif text-sm font-bold text-[#1A1A1A] block">
                          {isKo ? `${service.price.toLocaleString()}원` : `₩${service.price.toLocaleString()}`}
                        </span>
                        <span className="text-[9px] font-mono text-stone-400 block">{service.durationMinutes}{isKo ? '분' : 'm'}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Step 2: Guest Information */}
          <div className="bg-white p-6 rounded border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-[#BFA181]"></span>
              {isKo ? '2단계: 예약 고객 연락 정보 확인' : 'Contact Verification'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKo ? '예약 고객 성함 *' : 'Recipient Name *'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={isKo ? '홍길동' : 'Clara Mercer'}
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-stone-200 focus:border-[#BFA181] rounded text-xs bg-[#FBFBFA] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKo ? '휴대폰 번호 (확인 문자 전송용) *' : 'Mobile Phone Number *'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={isKo ? '010-1234-5678' : '+1 (555) 000-0000'}
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-stone-200 focus:border-[#BFA181] rounded text-xs bg-[#FBFBFA] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Date & Slot Calendar Grid */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-6 rounded border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-[#BFA181]"></span>
              {isKo ? '3단계: 희망 예약 일시 선택' : 'Date & 24h Time Selection'}
            </h3>

            {/* Date Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {isKo ? '방문 날짜 지정' : 'Select Date'}
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-stone-400" />
                <input
                  type="date"
                  value={selectedDate}
                  min={getTomorrowString()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-2.5 border border-stone-200 focus:border-[#BFA181] rounded text-xs bg-[#FBFBFA] outline-none transition-all cursor-pointer font-mono"
                  id="booking-date-picker"
                />
              </div>
              <p className="text-[10px] text-stone-400">
                {isKo ? '※ 더 헤어 갤러리는 화~토 운영하며, 매주 일/월요일은 정기 휴무입니다.' : 'Our studio is open Tuesday – Saturday. Closed Sunday/Monday.'}
              </p>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-3 pt-2">
              <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {isKo ? '시술 시작 예약 시간' : 'Available Slots'}
              </span>
              
              <div className="grid grid-cols-3 gap-2" id="time-slots-grid">
                {TIME_SLOTS_24H.map((slot) => {
                  const isBooked = bookedTimes.includes(slot);
                  const isSelected = selectedTime === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-3 text-xs font-bold rounded font-mono border transition-all cursor-pointer ${
                        isBooked
                          ? 'bg-stone-50 text-stone-300 border-stone-100 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#1A1A1A] text-[#BFA181] border-[#1A1A1A] shadow-md'
                          : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                      title={isBooked ? (isKo ? '예약 마감' : 'Slot Booked') : `${slot} ${isKo ? '예약 선택' : 'Book'}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {/* Grid Legend */}
              <div className="flex gap-4 pt-1 text-[10px] text-stone-400 font-mono justify-center">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded bg-stone-50 border border-stone-200"></div>
                  <span>{isKo ? '마감 / 휴일' : 'Booked / Closed'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded bg-white border border-stone-200"></div>
                  <span>{isKo ? '예약가능' : 'Available'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded bg-[#1A1A1A]"></div>
                  <span>{isKo ? '선택됨' : 'Selected'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout/Summary Panel */}
          <div className="bg-[#1A1A1A] text-white rounded p-6 flex flex-col shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-[#BFA181] uppercase tracking-widest">
              {isKo ? '예약 확정 정보 개요' : 'RESERVATION SUMMARY'}
            </h4>
            
            <div className="divide-y divide-stone-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">{isKo ? '선택한 헤어 스타일:' : 'Selected Style:'}</span>
                <span className="font-bold text-gray-200">
                  {localizedService ? localizedService.name : (isKo ? '선택되지 않음' : 'None Selected')}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">{isKo ? '총 소요시간:' : 'Duration:'}</span>
                <span className="font-bold text-gray-200">
                  {selectedService ? `${selectedService.durationMinutes}${isKo ? '분 소요' : ' minutes'}` : '0m'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">{isKo ? '예약 지정 일시:' : 'Date & Slot:'}</span>
                <span className="font-bold text-gray-200 font-mono">
                  {selectedTime ? `${selectedDate} ${selectedTime}` : (isKo ? '시간을 선택해주세요' : 'Select slots')}
                </span>
              </div>
              <div className="py-3 flex justify-between text-sm pt-4">
                <span className="text-gray-200 font-bold">{isKo ? '예상 결제 금액:' : 'Bespoke Total:'}</span>
                <span className="font-serif text-lg font-bold text-[#BFA181]">
                  {selectedService ? (isKo ? `${selectedService.price.toLocaleString()}원` : `₩${selectedService.price.toLocaleString()}`) : (isKo ? '0원' : '₩0')}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#BFA181] hover:bg-[#aa8c6c] text-[#1A1A1A] hover:text-white py-3.5 text-xs font-bold uppercase tracking-widest rounded transition-all duration-200 cursor-pointer shadow-lg"
              id="confirm-booking-btn"
            >
              {isKo ? '예약 요청 확정하기' : 'Confirm & Book Session'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
