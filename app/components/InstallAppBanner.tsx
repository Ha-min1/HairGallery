'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  X, 
  Sparkles, 
  Lock,
  Zap
} from 'lucide-react';

interface InstallAppBannerProps {
  lang?: 'ko' | 'en';
}

export default function InstallAppBanner({ lang = 'ko' }: InstallAppBannerProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeStepTab, setActiveStepTab] = useState<'universal' | 'ios' | 'android'>('universal');
  const [showStepGuide, setShowStepGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check localStorage for 24h hide flag
    const hideUntil = localStorage.getItem('tg_hide_install_banner_until');
    if (hideUntil && Date.now() < Number(hideUntil)) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    // Detect user platform
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1) {
      setActiveStepTab('universal');
    } else {
      setActiveStepTab('universal');
    }

    // Capture PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismissToday = () => {
    // Hide for 24 hours
    const hideUntil = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('tg_hide_install_banner_until', String(hideUntil));
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleDirectInstall = async () => {
    if (!deferredPrompt) {
      setShowStepGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b border-gold-500/30 text-stone-100 py-3.5 px-4 sm:px-6 relative z-40 shadow-lg animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left Info / Promo */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0">
            <Download className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-300 font-mono font-bold text-[10px] uppercase tracking-wider border border-gold-500/30">
                PWA App Mode
              </span>
              <span className="font-bold text-white text-xs sm:text-sm font-serif">
                {lang === 'ko' ? '더 헤어 갤러리를 홈 화면에 추가하고 빠르게 예약하세요' : 'Add The Hair Gallery to your Home Screen'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-sans tracking-wide">
              {lang === 'ko' 
                ? '앱스토어 다운로드 없이 3초 만에 홈 화면 아이콘으로 들어올 수 있습니다.' 
                : 'Enjoy 1-click booking access directly from your phone home screen.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          {deferredPrompt ? (
            <button
              onClick={handleDirectInstall}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer tracking-wider animate-pulse"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'ko' ? '지금 원클릭 앱 설치' : 'Install App Now'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowStepGuide(!showStepGuide)}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-gold-400 border border-gold-500/40 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{showStepGuide ? (lang === 'ko' ? '가이드 접기' : 'Hide Steps') : (lang === 'ko' ? '📲 3초 설치 가이드' : 'View Guide')}</span>
            </button>
          )}

          {/* Dismiss 24h Button */}
          <button
            onClick={handleDismissToday}
            className="px-2.5 py-1.5 text-stone-400 hover:text-stone-200 text-[11px] font-mono hover:bg-stone-800 rounded-lg transition-colors cursor-pointer border border-stone-800"
            title="오늘 하루 동안 안내창을 띄우지 않습니다"
          >
            {lang === 'ko' ? '오늘 하루 보지 않기' : 'Hide for 24h'}
          </button>

          {/* Close X */}
          <button
            onClick={handleClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Step-by-Step Instructions */}
      {showStepGuide && (
        <div className="max-w-7xl mx-auto mt-3.5 pt-3.5 border-t border-stone-800/80 animate-fadeIn">
          <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-4 space-y-3">
            {/* Slogan */}
            <div className="text-center py-1 bg-stone-900/60 rounded-xl border border-gold-500/20">
              <span className="text-gold-300 font-bold text-xs flex items-center justify-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-gold-400" />
                <span>&ldquo;앱 스토어 방문 없이, 3초 만에 앱처럼 사용하기!&rdquo;</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStepTab('universal')}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeStepTab === 'universal'
                      ? 'bg-gradient-to-r from-amber-600/30 to-gold-600/30 text-gold-300 border border-gold-500/50 shadow-sm'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Zap className="w-3 h-3 text-gold-400" />
                  <span>[방법 1] 주소창 퀵</span>
                </button>
                <button
                  onClick={() => setActiveStepTab('ios')}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    activeStepTab === 'ios'
                      ? 'bg-stone-800 text-gold-400 border border-gold-500/40'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  iOS (Safari)
                </button>
                <button
                  onClick={() => setActiveStepTab('android')}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    activeStepTab === 'android'
                      ? 'bg-stone-800 text-gold-400 border border-gold-500/40'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Android
                </button>
              </div>
              <span className="text-[10px] text-stone-500 font-mono hidden sm:inline">
                PWA Web App Add-to-Home-Screen Step Guide
              </span>
            </div>

            {/* TAB 1: Universal Address Bar */}
            {activeStepTab === 'universal' && (
              <div className="space-y-3 text-left">
                {/* Mini Illustration */}
                <div className="p-2.5 bg-stone-900 rounded-xl border border-stone-700/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-300 font-mono text-[11px]">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>hairgallery.com 주소창 옆</span>
                  </div>
                  <div className="px-2 py-0.5 bg-gold-500/20 border border-gold-400 text-gold-300 font-mono font-bold text-[10px] rounded flex items-center gap-1 animate-pulse">
                    <Share2 className="w-3 h-3 text-gold-400" />
                    <span>[공유 📤]</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-gold-400 font-bold block">STEP 01</span>
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1 flex-wrap">
                      <span>웹사이트 주소창 옆</span>
                      <span className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[10px] rounded inline-flex items-center gap-1">
                        <Share2 className="w-3 h-3" /> [공유 📤]
                      </span>
                      <span>터치</span>
                    </p>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      화면 상단 또는 하단 주소창 옆의 공유 버튼을 누릅니다.
                    </p>
                  </div>
                  <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono text-gold-400 font-bold block">STEP 02</span>
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[10px] rounded inline-flex items-center gap-1">
                        <PlusSquare className="w-3 h-3" /> [홈 화면에 추가 ➕]
                      </span>
                      <span>선택</span>
                    </p>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      메뉴 목록에서 홈 화면에 추가를 선택하면 1초 만에 바탕화면에 추가됩니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: iOS Safari */}
            {activeStepTab === 'ios' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-mono text-gold-400 font-bold block">STEP 01</span>
                  <p className="font-bold text-stone-200 text-xs flex items-center gap-1">
                    <span>Safari 하단 중앙</span>
                    <Share2 className="w-3.5 h-3.5 text-gold-400" />
                    <span>공유 (📤)</span>
                  </p>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    아이폰 Safari 메인 하단 툴바 중앙의 공유 아이콘을 클릭합니다.
                  </p>
                </div>
                <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-mono text-gold-400 font-bold block">STEP 02</span>
                  <p className="font-bold text-stone-200 text-xs flex items-center gap-1">
                    <PlusSquare className="w-3.5 h-3.5 text-gold-400" />
                    <span>&apos;홈 화면에 추가&apos; ➕</span>
                  </p>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    메뉴 목록을 스크롤하여 &apos;홈 화면에 추가&apos; 옵션을 선택합니다.
                  </p>
                </div>
                <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-mono text-gold-400 font-bold block">STEP 03</span>
                  <p className="font-bold text-stone-200 text-xs">우측 상단 &apos;추가&apos; 확인</p>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    바탕화면에 아이콘이 즉시 생성되어 앱처럼 바로 실행됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: Android Chrome */}
            {activeStepTab === 'android' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-mono text-gold-400 font-bold block">STEP 01</span>
                  <p className="font-bold text-stone-200 text-xs flex items-center gap-1">
                    <span>우측 상단 메뉴</span>
                    <MoreVertical className="w-3.5 h-3.5 text-gold-400" />
                    <span>점 3개(⋮)</span>
                  </p>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    크롬 브라우저 우측 상단의 점 3개 메뉴 아이콘을 누릅니다.
                  </p>
                </div>
                <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[10px] font-mono text-gold-400 font-bold block">STEP 02</span>
                  <p className="font-bold text-stone-200 text-xs flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-gold-400" />
                    <span>&apos;앱 설치&apos; 또는 &apos;홈 화면에 추가&apos;</span>
                  </p>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    목록에서 &apos;앱 설치&apos; 또는 &apos;홈 화면에 추가&apos;를 누르고 설치합니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
