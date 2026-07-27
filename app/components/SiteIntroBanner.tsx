'use client';

import React, { useState } from 'react';
import { Sparkles, Calendar, Scissors, Store, ChevronDown, ChevronUp } from 'lucide-react';

interface SiteIntroBannerProps {
  lang?: string;
  customTitle?: string;
  customSubtitle?: string;
}

export default function SiteIntroBanner({ lang = 'ko', customTitle, customSubtitle }: SiteIntroBannerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Finalized Admin Intro Text Data
  const bannerData = {
    tag: lang === 'ko' ? 'OFFICIAL WEBSITE & GUIDE' : 'OFFICIAL WEBSITE & GUIDE',
    title: customTitle || (lang === 'ko' ? '더 헤어갤러리 공식 웹사이트에 오신 것을 환영합니다' : 'Welcome to The Hair Gallery Official Website'),
    subtitle: customSubtitle || (lang === 'ko' 
      ? '더 헤어갤러리 공식 사이트에서는 매장 분위기 확인부터 스타일 탐색, 24시간 간편 예약까지 한 번에 이용하실 수 있습니다.' 
      : 'Explore salon ambiance, browse hairstyles, and enjoy 24/7 online booking all in one place.'),
    features: [
      {
        icon: Calendar,
        title: lang === 'ko' ? '1분 빠른 예약 시스템' : 'Quick 1-Minute Booking',
        desc: lang === 'ko' ? '전화 문의 없이 24시간 언제든 원하는 날짜와 시술을 간편하게 예약하세요.' : 'Book your desired date and service 24/7 online without phone calls.'
      },
      {
        icon: Scissors,
        title: lang === 'ko' ? '스타일 포트폴리오' : 'Style Portfolio',
        desc: lang === 'ko' ? '실제 시술된 트렌디한 헤어스타일 갤러리를 둘러보고 원하는 스타일을 쉽게 참고하세요.' : 'Browse our gallery of actual trendy hairstyles for easy style reference.'
      },
      {
        icon: Store,
        title: lang === 'ko' ? '매장 전경 & 분위기 확인' : 'Salon Atmosphere & Interior',
        desc: lang === 'ko' ? '사진과 안내를 통해 편안하고 정갈한 매장 내부 및 외관 분위기를 미리 확인하실 수 있습니다.' : 'Preview our cozy, elegant salon interior and exterior before your visit.'
      }
    ]
  };

  return (
    <div className="mb-6 bg-stone-900 border border-stone-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 text-stone-100">
      {/* Top Banner Header Bar */}
      <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-0.5 bg-gold-500/15 border border-gold-500/30 text-gold-400 rounded-full text-[11px] font-mono font-bold tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gold-400 animate-pulse" />
            <span>{bannerData.tag}</span>
          </span>
          <h2 className="font-serif text-sm sm:text-base font-bold text-white tracking-wide">
            {lang === 'ko' ? '더 헤어갤러리 공식 안내' : 'The Hair Gallery Official Guide'}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-mono font-semibold text-stone-400 hover:text-gold-400 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-stone-850 transition-colors cursor-pointer"
        >
          <span>
            {isOpen 
              ? (lang === 'ko' ? '[안내 접기]' : '[Hide Guide]') 
              : (lang === 'ko' ? '[안내 펼치기]' : '[Show Guide]')}
          </span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Intro Body */}
      {isOpen && (
        <div className="p-6 space-y-6 animate-fadeIn">
          {/* Main Title & Subtitle */}
          <div className="space-y-2 text-left border-b border-stone-800/80 pb-5">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-gold-300 leading-snug">
              {bannerData.title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-3xl">
              {bannerData.subtitle}
            </p>
          </div>

          {/* 3 Core Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bannerData.features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div 
                  key={idx}
                  className="p-4 bg-stone-950/70 border border-stone-800/80 rounded-xl hover:border-gold-500/30 transition-all text-left space-y-2 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-gold-400 group-hover:border-gold-500/50 group-hover:text-gold-300 transition-colors">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-white group-hover:text-gold-400 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-stone-400 leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
