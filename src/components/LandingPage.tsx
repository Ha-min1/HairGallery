import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Phone, Award, Sparkles, ChevronRight, Check } from 'lucide-react';
import { ServiceMenu } from '../types';

interface LandingPageProps {
  onBookNow: () => void;
  services: ServiceMenu[];
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

export default function LandingPage({ onBookNow, services, lang = 'ko' }: LandingPageProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Cut' | 'Color' | 'Treatment' | 'Styling'>('All');
  const isKo = lang === 'ko';

  const categories = ['All', 'Cut', 'Color', 'Treatment', 'Styling'] as const;

  const catNames: Record<string, string> = {
    All: isKo ? '전체 메뉴' : 'Full Menu',
    Cut: isKo ? '커트' : 'Cuts',
    Color: isKo ? '컬러' : 'Colors',
    Treatment: isKo ? '클리닉' : 'Treatments',
    Styling: isKo ? '스타일링' : 'Stylings'
  };

  const filteredServices = activeCategory === 'All'
    ? services
    : services.filter(s => s.category === activeCategory);

  const testimonials = [
    {
      name: isKo ? '김선영 고객님' : 'Victoria Hastings',
      role: isKo ? '2024년부터 단골 고객' : 'Client since 2024',
      quote: isKo 
        ? '시그니처 발레아쥬 아트 시술을 받았는데 정말 대만족이에요! 모발 상태와 두상을 정확히 파악해서 염색해주시는데, 단순한 머리 스타일링이 아닌 예술적인 조형을 만난 느낌입니다.' 
        : 'The Balayage Artistry is unparalleled. Elena spends time understanding your hair and lifestyle. It is not just a haircut, it is absolute luxury.',
      service: isKo ? '발레아쥬 & 시그니처 드라이' : 'Balayage & Blowout'
    },
    {
      name: isKo ? '박민준 고객님' : 'Oliver Thorne',
      role: isKo ? '월간 지정 고객' : 'Regular Client',
      quote: isKo 
        ? '매우 섬세하고 완벽한 가위컷입니다. 살롱 인테리어가 굉장히 아늑하고 세련되었어요. 마무리 스팀 타월 서비스와 정교한 잔털 정리까지 하나하나 세심함이 돋보입니다.' 
        : 'An impeccable precision cut. The atmosphere is warm yet highly sophisticated. Their attention to detail and neck shave makes all the difference.',
      service: isKo ? '남성 프리시전 컷' : 'Gents Precision Cut'
    },
    {
      name: isKo ? '이지은 고객님' : 'Genevieve Dupre',
      role: isKo ? '2025년부터 단골 고객' : 'Client since 2025',
      quote: isKo 
        ? '케라틴 스무스 매직 크리닉을 시술받고 아침에 머리 말리는 시간이 절반으로 줄었습니다! 장마철 습한 날씨에도 머리가 전혀 부스스해지지 않아 너무나 편안하고 완벽합니다!' 
        : 'The Keratin smooth treatment has completely transformed my mornings. Frizz-free in the humid summer. Highly recommend this gorgeous studio!',
      service: isKo ? '케라틴 결 케어' : 'Keratin Smoothing'
    }
  ];

  return (
    <div className="bg-[#FBFBFA] text-[#1A1A1A] min-h-screen">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-stone-100 py-24 sm:py-32">
        {/* Background Decorative Mesh / Gradients */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-amber-500 blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-amber-600 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-800/80 border border-stone-700/80 rounded text-[10px] font-bold tracking-widest text-[#BFA181] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isKo ? '헤어 아티스트리의 예술' : 'The Art of Hair Artistry'}</span>
              </div>
              
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight tracking-tight text-stone-50">
                {isKo ? (
                  <>
                    아름다움을 <span className="italic font-light text-stone-300">조각하고</span>,<br />
                    개성을 <span className="font-semibold text-[#BFA181] underline decoration-1 underline-offset-8">정의하다</span>.
                  </>
                ) : (
                  <>
                    Sculpting <span className="italic font-light text-stone-300">beauty</span>,<br />
                    defining <span className="font-semibold text-[#BFA181] underline decoration-1 underline-offset-8">individuality</span>.
                  </>
                )}
              </h1>
              
              <p className="text-stone-300 text-base sm:text-lg font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                {isKo 
                  ? '원장 엘레나가 1:1로 직접 디자인하고 처음부터 끝까지 직접 시술하는 프리미엄 프라이빗 1인 미용실입니다. 복잡한 대기 공간 없이 오직 고객님만을 위한 전용 세션을 예약해 보실 수 있습니다.'
                  : 'A premium private 1-designer salon where master stylist Elena provides meticulous 1:1 care. Book an exclusive session tailored entirely to you, free of distraction.'}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={onBookNow}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#BFA181] hover:bg-[#aa8c6c] text-[#1A1A1A] hover:text-white font-bold text-xs uppercase tracking-widest rounded transition-all duration-300 cursor-pointer shadow-lg"
                  id="hero-book-btn"
                >
                  <Calendar className="h-4 w-4" />
                  {isKo ? '실시간 세션 예약하기' : 'Reserve an Experience'}
                </button>
                <a
                  href="#service-menu"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-8 py-4 bg-transparent hover:bg-stone-800 border border-stone-700 hover:border-stone-500 text-stone-200 hover:text-stone-50 text-xs font-bold uppercase tracking-widest rounded transition-all duration-300"
                >
                  {isKo ? '서비스 가이드 보기' : 'Explore Services'}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {/* Badges/Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-800 max-w-lg mx-auto lg:mx-0">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                  <span className="font-serif text-2xl font-semibold text-[#BFA181]">4.9★</span>
                  <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">{isKo ? '구글 최우수 평점' : 'Google Rated'}</span>
                </div>
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left border-x border-stone-800 px-4">
                  <span className="font-serif text-2xl font-semibold text-[#BFA181]">12+</span>
                  <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">{isKo ? '수석 디자이너 경력' : 'Years Mastery'}</span>
                </div>
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                  <span className="font-serif text-2xl font-semibold text-[#BFA181]">100%</span>
                  <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">{isKo ? '프리미엄 천연 제품' : 'Organic Care'}</span>
                </div>
              </div>
            </div>

            {/* Hero Right: Premium Visual Board */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm aspect-square sm:aspect-4/5 rounded-2xl bg-gradient-to-tr from-stone-950 via-stone-900 to-stone-800 border border-stone-800 p-8 flex flex-col justify-between overflow-hidden shadow-2xl">
                {/* Decorative circle backdrop */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-stone-800/40 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border border-stone-700/20 border-dashed pointer-events-none"></div>
                
                {/* Visual Highlights */}
                <div className="z-10 flex justify-between items-start">
                  <Award className="h-10 w-10 text-[#BFA181] stroke-[1.2]" />
                  <span className="text-xs font-mono tracking-widest text-stone-400 bg-stone-950/60 px-2.5 py-1 rounded-full border border-stone-800">
                    {isKo ? '100% 예약제 프라이빗 1인 살롱' : '1:1 PRIVATE STUDIO'}
                  </span>
                </div>
                
                <div className="z-10 space-y-4">
                  <span className="font-mono text-xs tracking-widest text-[#BFA181] block uppercase">EST. 2018</span>
                  <blockquote className="font-serif text-lg sm:text-xl font-light italic text-stone-300 leading-relaxed">
                    {isKo 
                      ? '"헤어는 머리라는 한 폭의 프레임이자 최고의 갤러리입니다. 우리는 단순히 머리를 자르는 것이 아니라, 고객님 고유의 시그니처 예술을 디자인합니다."'
                      : '"Hair is the ultimate gallery space. We don’t just style; we curate your personal signature style."'}
                  </blockquote>
                  <div className="border-t border-stone-800/80 pt-3">
                    <p className="text-xs font-medium text-stone-200">{isKo ? '엘레나 로스토바 원장' : 'Elena Rostova'}</p>
                    <p className="text-[10px] font-mono tracking-wider text-stone-400">{isKo ? '더 헤어 갤러리 대표 원장' : 'Founder & Principal Stylist'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Quick-Cards (Hours, Location, Contact) */}
      <section className="relative z-20 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-lg shadow-xl overflow-hidden border border-stone-200 divide-y md:divide-y-0 md:divide-x divide-stone-200">
          {/* Card 1: Hours */}
          <div className="bg-white p-6 flex items-start gap-4 hover:bg-stone-50 transition-colors duration-200">
            <div className="p-3 bg-stone-100 rounded text-[#BFA181]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-stone-900">{isKo ? '운영 시간' : 'Salon Hours'}</h3>
              <p className="text-xs text-stone-500 mt-1 font-mono">{isKo ? '화요일 – 토요일 운영' : 'Tuesday – Saturday'}</p>
              <p className="text-sm text-stone-700 font-medium mt-0.5">09:00 – 20:00</p>
              <span className="text-[10px] text-amber-600 font-medium tracking-wide block mt-1 uppercase">{isKo ? '매주 일요일, 월요일 정기 휴무' : 'Sundays & Mondays Closed'}</span>
            </div>
          </div>

          {/* Card 2: Location */}
          <div className="bg-white p-6 flex items-start gap-4 hover:bg-stone-50 transition-colors duration-200">
            <div className="p-3 bg-stone-100 rounded text-[#BFA181]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-stone-900">{isKo ? '매장 주소' : 'Our Gallery'}</h3>
              <p className="text-xs text-stone-500 mt-1 font-mono">{isKo ? '사우역 인근 위치' : 'Gimpo Goldline Sau'}</p>
              <p className="text-sm text-stone-700 font-bold mt-0.5">
                {isKo ? '경기 김포시 김포대로926번길 46' : '46, Gimpo-daero 926beon-gil, Gimpo-si, Gyeonggi-do'}
              </p>
              <span className="text-[10px] text-amber-700 block mt-1 font-semibold">
                {isKo ? '김포골드사우역 1번 출구에서 843m' : '843m from Sau Station Exit 1'}
              </span>
            </div>
          </div>

          {/* Card 3: Contact */}
          <div className="bg-white p-6 flex items-start gap-4 hover:bg-stone-50 transition-colors duration-200">
            <div className="p-3 bg-stone-100 rounded text-[#BFA181]">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-stone-900">{isKo ? '문의 및 연락처' : 'Direct Inquiries'}</h3>
              <p className="text-xs text-stone-500 mt-1 font-mono">{isKo ? '전화 또는 예약 문자 전송' : 'Phone & SMS'}</p>
              <p className="text-sm text-stone-700 font-medium mt-0.5">{isKo ? '031-984-1234' : '+1 (555) 019-2831'}</p>
              <p className="text-[10px] text-stone-400 block mt-1">concierge@hairgallery.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Menu Section */}
      <section id="service-menu" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="font-mono text-xs tracking-widest text-[#BFA181] uppercase font-semibold">
            {isKo ? '살롱 시술 안내' : 'The Service Registry'}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-950">
            {isKo ? '엄선된 프리미엄 헤어 시술 메뉴' : 'Curated Hair Care & Styling Menu'}
          </h2>
          <div className="h-0.5 w-16 bg-[#BFA181] mx-auto mt-4"></div>
          <p className="text-stone-500 font-light text-sm sm:text-base leading-relaxed">
            {isKo 
              ? '더 헤어 갤러리의 모든 프리미엄 살롱 서비스에는 맞춤형 모발 & 두피 진단 스파, 시그니처 릴렉싱 헤어 테라피 및 맞춤 마무리가 기본 서비스로 적용됩니다.'
              : 'All services include a customized scalp assessment, signature premium oil massage, botanical hair wash, and customized finishing styles.'}
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
              }`}
            >
              {catNames[cat]}
            </button>
          ))}
        </div>

        {/* Dynamic Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="services-grid">
          {filteredServices.map(service => {
            const loc = getLocalizedService(service.id, service.name, service.description, isKo);
            return (
              <div
                key={service.id}
                className="bg-white rounded-lg p-6 border border-stone-200/80 hover:border-stone-400 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-mono rounded font-semibold uppercase tracking-wider mb-2">
                        {catNames[service.category] || service.category}
                      </span>
                      <h3 className="font-serif text-base font-bold text-stone-900 group-hover:text-[#BFA181] transition-colors duration-200">
                        {loc.name}
                      </h3>
                    </div>
                     <div className="text-right">
                      <span className="font-serif text-base sm:text-lg font-bold text-stone-900 whitespace-nowrap">
                        {isKo ? `${service.price.toLocaleString()}원` : `₩${service.price.toLocaleString()}`}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 block mt-0.5">
                        {service.durationMinutes} {isKo ? '분 소요' : 'MIN'}
                      </span>
                    </div>
                  </div>
                  {loc.description && (
                    <p className="text-xs text-stone-500 font-light leading-relaxed">
                      {loc.description}
                    </p>
                  )}
                </div>
                
                <div className="border-t border-stone-100/80 pt-4 mt-5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Check className="h-3.5 w-3.5 text-[#BFA181]" />
                    <span>{isKo ? '디자이너 마감 드라이 포함' : 'Styling included'}</span>
                  </div>
                  <button
                    onClick={onBookNow}
                    className="text-[#BFA181] font-bold group-hover:text-[#aa8c6c] flex items-center gap-1 cursor-pointer"
                  >
                    {isKo ? '예약 신청' : 'Book Service'}
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Review Testimonials */}
      <section className="bg-stone-900 text-stone-100 py-20 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto space-y-4 mb-14">
            <span className="font-mono text-xs tracking-widest text-[#BFA181] uppercase">{isKo ? '다이어리 기록' : 'Guest Journals'}</span>
            <h2 className="font-serif text-3xl font-normal">{isKo ? '방문 고객 리얼 리뷰' : 'Patron Testimonials'}</h2>
            <div className="h-0.5 w-12 bg-[#BFA181] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-stone-800/60 rounded-lg p-8 border border-stone-700/50 flex flex-col justify-between hover:border-stone-700 transition-colors"
              >
                <p className="text-stone-300 font-light italic text-sm leading-relaxed mb-6">
                  "{t.quote}"
                </p>
                <div>
                  <h4 className="font-serif text-stone-100 font-semibold text-sm">{t.name}</h4>
                  <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">{t.role}</p>
                  <span className="inline-block mt-3 px-2 py-0.5 bg-stone-900 rounded font-mono text-[9px] text-[#BFA181] border border-stone-800">
                    {t.service}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location / Interactive Map Panel */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="font-mono text-xs tracking-widest text-[#BFA181] uppercase font-semibold">{isKo ? '상세 위치 안내' : 'Location Studio'}</span>
            <h2 className="font-serif text-3xl font-normal text-stone-950">
              {isKo ? '프라이빗 갤러리 예약 매장' : 'Visit Our Sanctuary'}
            </h2>
            <p className="text-stone-500 text-sm font-light leading-relaxed">
              {isKo 
                ? '도심의 번잡함을 벗어나 아늑하고 차분한 무드로 연출된 더 헤어 갤러리는 편안한 헤어 스타일 솔루션을 약속드립니다. 매장 내 프라이빗 에스프레소 카페 서비스와 함께 편안하고 럭셔리한 대기 경험을 누릴 수 있습니다.'
                : 'Nestled in the heart of Gimpo, The Hair Gallery features double-height premium ceilings, relaxing ambient acoustics, and a private espresso bar for our esteemed guests.'}
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#BFA181] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-stone-900">{isKo ? '더 헤어 갤러리 김포점' : 'The Hair Gallery Gimpo'}</p>
                  <p className="text-xs text-stone-500">경기 김포시 김포대로926번길 46</p>
                  <p className="text-[10px] text-amber-700 font-bold block mt-1">
                    {isKo ? '★ 김포골드사우역 1번 출구에서 도보 843m 직진' : '843m from Sau Station Exit 1'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#BFA181] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-stone-900">{isKo ? '100% 실시간 사전 예약 권장' : 'Appointments Recommended'}</p>
                  <p className="text-xs text-stone-500">{isKo ? '고객 밀집 방지를 위해 사전 온라인 예약을 꼭 진행 부탁드립니다.' : 'Walk-ins handled based on physical slot availability.'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={onBookNow}
              className="px-6 py-3 bg-[#1A1A1A] text-white text-xs font-bold tracking-wider uppercase rounded hover:bg-stone-800 transition-all duration-200 cursor-pointer inline-flex items-center gap-2 shadow-md"
            >
              <Calendar className="h-3.5 w-3.5 text-[#BFA181]" />
              {isKo ? '실시간 스케줄 확인 및 예약' : 'Book Your Visit'}
            </button>
          </div>

          <div className="lg:col-span-7">
            {/* Visual Map Placeholder of High Aesthetic Value */}
            <div className="bg-stone-100 rounded-lg border border-stone-200 overflow-hidden relative shadow-md p-4 aspect-video flex flex-col justify-between">
              <div className="absolute inset-0 bg-stone-50/50 mix-blend-multiply opacity-70"></div>
              {/* Map Lines Mimicked via styled SVG */}
              <svg className="absolute inset-0 w-full h-full text-stone-300 stroke-[1]" viewBox="0 0 400 200">
                <line x1="0" y1="50" x2="400" y2="50" />
                <line x1="0" y1="120" x2="400" y2="120" />
                <line x1="80" y1="0" x2="80" y2="200" />
                <line x1="280" y1="0" x2="280" y2="200" />
                <line x1="180" y1="0" x2="180" y2="200" />
                <path d="M 0 80 Q 200 110 400 80" fill="none" className="stroke-stone-200" />
                <circle cx="180" cy="120" r="16" className="fill-stone-100/50 stroke-[#BFA181]/30 stroke-2 animate-ping" />
                <circle cx="180" cy="120" r="6" className="fill-[#BFA181]" />
              </svg>
              
              <div className="z-10 flex justify-between items-start">
                <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-mono tracking-widest text-stone-600 border border-stone-200 uppercase rounded">{isKo ? '김포 주차/오시는 길' : 'MAP GRID'}</span>
                <span className="bg-emerald-500/10 text-emerald-700 px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wide rounded border border-emerald-200">
                  {isKo ? '실시간 영업중' : 'ACTIVE STUDIO'}
                </span>
              </div>
              
              <div className="z-10 bg-[#1A1A1A]/95 text-stone-100 p-4 rounded max-w-sm border border-stone-800 shadow-xl backdrop-blur-sm">
                <p className="font-serif text-xs font-bold text-[#BFA181]">{isKo ? '더 헤어 갤러리 김포' : 'The Hair Gallery Gimpo'}</p>
                <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                  {isKo 
                    ? '사우역 대성빌딩 1층에 자리 잡고 있습니다. 전용 주차공간 및 주말 주차 발레 서비스를 무상으로 제공합니다.' 
                    : 'Directly diagonal to the Gimpo Art Park. Valet parking stands are adjacent to the main archway.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Elegant Footer */}
      <footer className="bg-stone-950 text-stone-400 py-12 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="font-serif text-stone-200 tracking-widest text-lg font-medium">{isKo ? '더 헤어 갤러리' : 'THE HAIR GALLERY'}</p>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed font-light">
            {isKo 
              ? '수석 디자이너의 고품격 헤어 정밀 컷, 컬러 마스터링 및 모발 크리닉 케어 서비스를 선사합니다. 머리의 고유한 결을 예술로 정의하는 비스포크 공간.'
              : 'Curators of precision, color depth, and hair wellness. Celebrating hair beauty as a fine art installation since 2018.'}
          </p>
          <div className="border-t border-stone-900 pt-6 text-[10px] font-mono uppercase tracking-widest flex flex-col sm:flex-row justify-between items-center gap-4 text-stone-600">
            <span>© 2026 THE HAIR GALLERY. ALL RIGHTS RESERVED.</span>
            <div className="flex gap-6 font-bold">
              <a href="#service-menu" className="hover:text-[#BFA181]">{isKo ? '시술안내' : 'SERVICES'}</a>
              <span>•</span>
              <span className="text-stone-500">{isKo ? '경기 김포시 사우동' : 'GIMPO, KOREA'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
