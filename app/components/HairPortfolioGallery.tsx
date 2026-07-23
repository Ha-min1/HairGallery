'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Eye, 
  X, 
  Calendar, 
  Scissors, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Tag,
  Grid,
  Layers,
  ArrowRight
} from 'lucide-react';

interface HairStyleItem {
  id: string;
  imageFileName: string;
  imageSrc: string;
  title: string;
  titleEn: string;
  category: 'Cut' | 'Color' | 'Perm' | 'Styling';
  tags: string[];
  description: string;
  descriptionEn: string;
  designer: string;
}

const GALLERY_PIPELINE_ITEMS: HairStyleItem[] = [
  {
    id: 'hair-01',
    imageFileName: 'hair_01.jpg',
    imageSrc: '/assets/images/hair/hair_01.jpg',
    title: '시그니처 발레아쥬 옴브레 & 내추럴 웨이브',
    titleEn: 'Signature Balayage Ombre & Natural Waves',
    category: 'Color',
    tags: ['발레아쥬', '옴브레', '내추럴웨이브', '입체감'],
    description: '자연스러운 그라데이션과 부드러운 하이라이트로 얼굴 라인을 가꿔주는 더 헤어 갤러리의 베스트 컬러 시술입니다.',
    descriptionEn: 'Subtle dimensional color with seamless ombre gradients, designed for low-maintenance elegance.',
    designer: 'Senior Colorist Alex'
  },
  {
    id: 'hair-02',
    imageFileName: 'hair_02.jpg',
    imageSrc: '/assets/images/hair/hair_02.jpg',
    title: '모던 허쉬 컷 & 페이스 라인 커튼뱅',
    titleEn: 'Modern Layered Bob & Face-Framing Bangs',
    category: 'Cut',
    tags: ['레이어드컷', '허쉬컷', '커튼뱅', '볼륨감'],
    description: '어깨 라인을 스치는 경쾌한 레이어와 커튼뱅이 결합되어 감각적이고 세련된 라인을 연출합니다.',
    descriptionEn: 'Precision texturized layering that creates weightless movement and soft face framing.',
    designer: 'Master Stylist Claire'
  },
  {
    id: 'hair-03',
    imageFileName: 'hair_03.jpg',
    imageSrc: '/assets/images/hair/hair_03.jpg',
    title: '클래식 헤이즐넛 브라운 젤리 파펌',
    titleEn: 'Hazelnut Brown Soft Volume Perm',
    category: 'Perm',
    tags: ['빌드펌', '젤리펌', '헤이즐넛', '손상최소화'],
    description: '따뜻한 헤이즐넛 브라운 톤과 함께 풍성한 굵은 컬을 완성하는 손상 케어 특화 파펌입니다.',
    descriptionEn: 'Deep moisture-infused volume curls paired with rich, luminous hazelnut brown tone.',
    designer: 'Top Stylist Min'
  },
  {
    id: 'hair-04',
    imageFileName: 'hair_04.jpg',
    imageSrc: '/assets/images/hair/hair_04.jpg',
    title: '쿨 애쉬 블론드 슬릭 태슬 컷',
    titleEn: 'Cool Ash Blonde Sleek Tassel Cut',
    category: 'Color',
    tags: ['애쉬블론드', '태슬컷', '슬릭컷', '트렌디'],
    description: '매끄러운 질감과 차가운 애쉬 톤의 하모니로 깔끔하고 세련된 분위기를 자아내는 프리미엄 디자인입니다.',
    descriptionEn: 'Sharp, ultra-clean line styling combined with crisp cool-toned ash blonde tones.',
    designer: 'Director Jay'
  },
  {
    id: 'hair-05',
    imageFileName: 'hair_05.jpg',
    imageSrc: '/assets/images/hair/hair_05.jpg',
    title: '볼륨 매직 프렌치 숏 컷',
    titleEn: 'Volume Magic French Short Cut',
    category: 'Cut',
    tags: ['프렌치컷', '볼륨매직', '숏컷', '스타일리시'],
    description: '두상 곡선을 감싸는 섬세한 테일러링 커트로 손질이 쉽고 단정한 실루엣을 제공합니다.',
    descriptionEn: 'Tailored short haircut hugging natural head shape for effortless daily styling.',
    designer: 'Master Stylist Claire'
  },
  {
    id: 'hair-06',
    imageFileName: 'hair_06.jpg',
    imageSrc: '/assets/images/hair/hair_06.jpg',
    title: '글램 디자이너 C컬 파펌 & 복구 트리트먼트',
    titleEn: 'Glamour C-Curl Perm & Restoration Clinic',
    category: 'Perm',
    tags: ['C컬파펌', '복구케어', '윤기', '여신머리'],
    description: '모발 끝부분의 탄력있는 C컬과 깊은 유수분 보습 케어로 윤기나는 머릿결을 연출합니다.',
    descriptionEn: 'Silky glass-hair finish with elastic C-curls and restorative bond therapy.',
    designer: 'Senior Colorist Alex'
  }
];

interface HairPortfolioGalleryProps {
  lang?: 'ko' | 'en';
}

export default function HairPortfolioGallery({ lang = 'ko' }: HairPortfolioGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedStyle, setSelectedStyle] = useState<HairStyleItem | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Cut', 'Color', 'Perm'];

  const filteredItems = GALLERY_PIPELINE_ITEMS.filter(item => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id: string) => {
    setImageErrorMap(prev => ({ ...prev, [id]: true }));
  };

  const scrollToBooking = () => {
    setSelectedStyle(null);
    const el = document.getElementById('booking-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="portfolio-gallery" 
      className="bg-stone-900 border-y border-stone-800 py-16 px-4 sm:px-6 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[10px] font-mono font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hair Portfolio Collection</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal tracking-tight">
            {lang === 'ko' ? '시그니처 헤어 포트폴리오 갤러리' : 'Signature Hair Portfolio'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 font-sans tracking-wide leading-relaxed">
            {lang === 'ko' 
              ? '더 헤어 갤러리 전문 디자이너들이 시술한 트렌디한 헤어 스타일 컬렉션을 확인해보세요.' 
              : 'Discover bespoke hair designs, precision cuts, and radiant colors crafted by our Soho masters.'}
          </p>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-gold-500 text-stone-950 shadow-md scale-105'
                  : 'bg-stone-950/80 text-stone-400 hover:text-white border border-stone-800 hover:border-stone-700'
              }`}
            >
              {cat === 'All' ? (lang === 'ko' ? '전체 보기 (All)' : 'All Styles') : cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isError = Boolean(imageErrorMap[item.id]);
            const isLoaded = Boolean(loadedImages[item.id]);

            return (
              <div
                key={item.id}
                onClick={() => !isError && setSelectedStyle(item)}
                className={`group relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 transition-all duration-300 ${
                  !isError ? 'cursor-pointer hover:border-gold-500/50 hover:shadow-2xl hover:-translate-y-1' : ''
                }`}
              >
                {/* Fallback / Skeleton UI */}
                {(!isLoaded && !isError) && (
                  <div className="aspect-[3/4] w-full bg-stone-850 animate-pulse flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
                    <span className="text-[10px] font-mono text-stone-400">Loading Pipeline Asset...</span>
                  </div>
                )}

                {/* Missing Image Fallback UI */}
                {isError ? (
                  <div className="aspect-[3/4] w-full bg-stone-950 border border-dashed border-stone-800 p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-600">
                      <Scissors className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-gold-400 block">
                        Style Collection Coming Soon
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono block">
                        Path: /assets/images/hair/{item.imageFileName}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Actual Image */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-900">
                      <img
                        src={item.imageSrc}
                        alt={item.title}
                        onLoad={() => handleImageLoad(item.id)}
                        onError={() => handleImageError(item.id)}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                      {/* Top Category Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-950/80 backdrop-blur-md border border-stone-800 text-gold-400 text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                          {item.category}
                        </span>
                      </div>

                      {/* Hover Quick Action */}
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="p-2 rounded-xl bg-gold-500 text-stone-950 shadow-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 stroke-[2.5]" />
                        </span>
                      </div>

                      {/* Card Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-2 text-left">
                        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
                          {item.designer}
                        </span>
                        <h3 className="font-serif text-base text-white font-medium group-hover:text-gold-300 transition-colors line-clamp-1">
                          {lang === 'ko' ? item.title : item.titleEn}
                        </h3>

                        {/* Tag Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.tags.slice(0, 3).map((tag, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-0.5 rounded bg-stone-900/90 border border-stone-800 text-[9px] font-mono text-stone-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Lightbox / Preview Modal */}
        {selectedStyle && (
          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden text-stone-100 flex flex-col md:flex-row max-h-[90vh] relative">
              {/* Close Button */}
              <button
                onClick={() => setSelectedStyle(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-950/80 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Left: Image */}
              <div className="md:w-1/2 bg-stone-950 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-stone-800 relative">
                <img
                  src={selectedStyle.imageSrc}
                  alt={selectedStyle.title}
                  className="w-full h-full object-cover max-h-[450px] md:max-h-full"
                />
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="px-3 py-1 bg-stone-950/90 border border-stone-800 text-gold-400 text-[10px] font-mono font-bold rounded-lg uppercase tracking-widest">
                    {selectedStyle.category} Portfolio
                  </span>
                </div>
              </div>

              {/* Modal Right: Details & Booking */}
              <div className="md:w-1/2 p-6 sm:p-8 space-y-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-gold-400 uppercase tracking-widest block font-semibold">
                      {selectedStyle.designer}
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl text-white font-normal tracking-tight">
                      {lang === 'ko' ? selectedStyle.title : selectedStyle.titleEn}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-300 font-sans leading-relaxed tracking-wide">
                    {lang === 'ko' ? selectedStyle.description : selectedStyle.descriptionEn}
                  </p>

                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
                      Style Key Tags
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedStyle.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 text-xs font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Booking CTA */}
                <div className="pt-4 border-t border-stone-800/80 space-y-3">
                  <button
                    onClick={scrollToBooking}
                    className="w-full py-3.5 bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer tracking-wider"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{lang === 'ko' ? '이 스타일로 실시간 예약하기' : 'Book This Style Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-center text-stone-500 font-mono">
                    💡 예약 시 디자이너 상담 후 고객님 맞춤형으로 시술이 진행됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
