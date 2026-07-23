'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Globe, 
  Monitor, 
  ChevronRight,
  ArrowDownCircle,
  Lock,
  Zap
} from 'lucide-react';

interface InstallAppGuideProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ko' | 'en';
}

export default function InstallAppGuide({
  isOpen,
  onClose,
  lang = 'ko'
}: InstallAppGuideProps) {
  const [activeTab, setActiveTab] = useState<'universal' | 'ios' | 'android' | 'desktop'>('universal');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Detect mobile platform to set initial tab or default to universal
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1) {
      setActiveTab('universal');
    } else if (userAgent.indexOf('android') !== -1) {
      setActiveTab('universal');
    } else {
      setActiveTab('universal');
    }

    // Capture PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDirectInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden text-stone-100 flex flex-col max-h-[90vh] relative">
        {/* Modal Header */}
        <div className="bg-stone-950 px-6 py-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Download className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-white tracking-tight flex items-center gap-2">
                <span>{lang === 'ko' ? '모바일 앱 설치 / 홈 화면 추가' : 'Add to Home Screen Guide'}</span>
                <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[10px] font-mono border border-gold-500/30">PWA</span>
              </h3>
              <p className="text-[11px] text-stone-400 font-mono">
                {lang === 'ko' ? '앱 스토어 방문 없이 3초 만에 앱처럼 사용하기' : 'Quick access from your mobile home screen in 3s'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Smart PWA Banner if supported */}
          {deferredPrompt && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-pulse">
              <div className="flex items-center gap-3">
                <ArrowDownCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="font-bold text-white text-xs block">
                    {lang === 'ko' ? '원클릭 자동 설치 지원 기기' : 'Direct App Installation Supported'}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    {lang === 'ko' ? '버튼 한 번으로 모바일 앱처럼 설치할 수 있습니다.' : 'Install directly onto your device now.'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDirectInstall}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md shrink-0 cursor-pointer"
              >
                {lang === 'ko' ? '지금 앱 설치하기' : 'Install App Now'}
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-4 bg-gold-950/50 border border-gold-700/60 rounded-2xl flex items-center gap-3 text-gold-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-gold-400 shrink-0" />
              <span>{lang === 'ko' ? '이미 앱이 설치되어 편리하게 이용 중입니다!' : 'App installed on your device successfully!'}</span>
            </div>
          )}

          {/* Catchy Main Slogan Banner */}
          <div className="bg-gradient-to-r from-amber-950/50 via-gold-950/40 to-amber-950/50 border border-gold-500/30 p-3.5 rounded-2xl text-center space-y-1">
            <span className="text-gold-300 font-bold text-xs flex items-center justify-center gap-1.5 font-serif">
              <Zap className="w-4 h-4 text-gold-400 fill-gold-400/20" />
              <span>&ldquo;앱 스토어 방문 없이, 3초 만에 앱처럼 사용하기!&rdquo;</span>
            </span>
            <p className="text-[11px] text-stone-300 font-sans">
              스마트폰 주소창의 공유 버튼만 누르면 바탕화면 앱 아이콘이 바로 생성됩니다.
            </p>
          </div>

          {/* Platform Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
            <button
              onClick={() => setActiveTab('universal')}
              className={`py-2 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'universal'
                  ? 'bg-gradient-to-r from-amber-600/30 to-gold-600/30 text-gold-300 border border-gold-500/50 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-gold-400" />
              <span>[방법 1] 주소창 퀵</span>
            </button>

            <button
              onClick={() => setActiveTab('ios')}
              className={`py-2 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-stone-800 text-gold-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS (Safari)</span>
            </button>

            <button
              onClick={() => setActiveTab('android')}
              className={`py-2 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-stone-800 text-gold-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>

            <button
              onClick={() => setActiveTab('desktop')}
              className={`py-2 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-stone-800 text-gold-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC Chrome</span>
            </button>
          </div>

          {/* TAB 1: Universal / Address Bar Guide */}
          {activeTab === 'universal' && (
            <div className="space-y-4 bg-stone-950/80 p-5 rounded-2xl border border-stone-800 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-xs sm:text-sm font-bold text-gold-300 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-400 border border-gold-500/30 text-[10px] font-mono">가장 쉬운 방법</span>
                  <span>[방법 1] 브라우저 주소창 근처 이용하기</span>
                </h4>
              </div>

              {/* Simulated Browser Address Bar UI Illustration */}
              <div className="p-3 bg-stone-900/90 rounded-2xl border border-stone-700/80 space-y-2.5 shadow-inner">
                <div className="text-[10px] text-stone-400 font-mono flex items-center justify-between px-1">
                  <span>📱 스마트폰 브라우저 주소창 미니 일러스트</span>
                  <span className="text-gold-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 1-Touch 공유
                  </span>
                </div>
                <div className="bg-stone-950 rounded-xl p-2.5 border border-stone-800 flex items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2 text-stone-400 text-[11px] font-mono truncate min-w-0">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-stone-200 font-medium truncate">hairgallery.com</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500/30 to-gold-500/30 border border-gold-400 text-gold-300 font-mono font-bold text-[10px] rounded-lg flex items-center gap-1 animate-pulse shadow-xs">
                      <Share2 className="w-3.5 h-3.5 text-gold-400 stroke-[2.5]" />
                      <span>[공유 📤]</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800/90 hover:border-gold-500/40 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/40 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-stone-100 text-xs flex items-center gap-1.5 flex-wrap">
                      <span>화면 상단 또는 하단의</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-gold-500/40 text-gold-300 font-mono text-[11px] inline-flex items-center gap-1 font-bold">
                        <Share2 className="w-3.5 h-3.5 text-gold-400 stroke-[2.5]" /> 웹사이트 주소창 옆 [공유 📤]
                      </span>
                      <span>버튼을 터치합니다.</span>
                    </p>
                    <p className="text-stone-400 text-[11px] leading-relaxed">
                      모바일 화면 상단 또는 하단의 웹사이트 주소창 옆 공유 아이콘을 눌러주세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800/90 hover:border-gold-500/40 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/40 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-stone-100 text-xs flex items-center gap-1.5 flex-wrap">
                      <span>메뉴 목록에서</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-gold-500/40 text-gold-300 font-mono text-[11px] inline-flex items-center gap-1 font-bold">
                        <PlusSquare className="w-3.5 h-3.5 text-gold-400 stroke-[2.5]" /> [홈 화면에 추가 ➕]
                      </span>
                      <span>를 선택하면 끝!</span>
                    </p>
                    <p className="text-stone-400 text-[11px] leading-relaxed">
                      바탕화면에 전용 아이콘이 생성되며 1초 만에 앱처럼 빠르게 바로가기가 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: iOS Safari */}
          {activeTab === 'ios' && (
            <div className="space-y-4 bg-stone-950/80 p-5 rounded-2xl border border-stone-800 animate-fadeIn">
              <h4 className="font-serif text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-stone-800 text-gold-400 border border-stone-700 text-[10px] font-mono">iOS전용</span>
                <span>[방법 2] iOS (Safari) 브라우저 이용하기</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1.5 flex-wrap">
                      <span>Safari 하단 중앙</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[11px] inline-flex items-center gap-1 font-bold">
                        <Share2 className="w-3.5 h-3.5" /> 공유 (네모 위 화살표 📤)
                      </span>
                      <span>아이콘 클릭</span>
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      아이폰 Safari 화면 하단 중앙 툴바의 공유 버튼을 누릅니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1.5 flex-wrap">
                      <span>메뉴 목록을 아래로 스크롤하여</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[11px] inline-flex items-center gap-1 font-bold">
                        <PlusSquare className="w-3.5 h-3.5" /> &apos;홈 화면에 추가&apos; ➕
                      </span>
                      <span>선택</span>
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      목록에서 &ldquo;홈 화면에 추가&rdquo; 옵션을 선택해 설치합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-stone-200 text-xs">
                      우측 상단 &apos;추가&apos; 클릭 후 바탕화면 앱 아이콘 생성 확인
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      홈 화면에 전용 아이콘이 설치되어 1-터치 빠른 실행이 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Android */}
          {activeTab === 'android' && (
            <div className="space-y-4 bg-stone-950/80 p-5 rounded-2xl border border-stone-800 animate-fadeIn">
              <h4 className="font-serif text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-stone-800 text-gold-400 border border-stone-700 text-[10px] font-mono">Android전용</span>
                <span>[방법 2] Android (Chrome / Samsung) 브라우저 이용하기</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1.5 flex-wrap">
                      <span>우측 상단</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[11px] inline-flex items-center gap-1 font-bold">
                        <MoreVertical className="w-3.5 h-3.5" /> 점 3개(⋮) 메뉴
                      </span>
                      <span>터치</span>
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      크롬 또는 삼성 인터넷 우측 상단 옵션 아이콘을 터치합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1.5 flex-wrap">
                      <span>목록에서</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[11px] inline-flex items-center gap-1 font-bold">
                        <Download className="w-3.5 h-3.5" /> &apos;앱 설치&apos;
                      </span>
                      <span>또는</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[11px] inline-flex items-center gap-1 font-bold">
                        <PlusSquare className="w-3.5 h-3.5" /> &apos;홈 화면에 추가&apos;
                      </span>
                      <span>선택</span>
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      팝업 창이 나타나면 &apos;설치&apos;를 확인하여 기기에 다운로드합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PC Desktop */}
          {activeTab === 'desktop' && (
            <div className="space-y-4 bg-stone-950/80 p-5 rounded-2xl border border-stone-800 animate-fadeIn">
              <h4 className="font-serif text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-stone-800 text-gold-400 border border-stone-700 text-[10px] font-mono">데스크톱 PC</span>
                <span>PC (Chrome / Edge) 브라우저 앱 설치</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                      <span>주소창 우측 모니터/다운로드 아이콘 클릭</span>
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      Chrome/Edge 주소창 우측에 나타나는 &ldquo;더 헤어 갤러리 앱 설치&rdquo; 아이콘을 누르면 독립 실행 창으로 설치됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-6 py-4 border-t border-stone-800 flex items-center justify-between">
          <span className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gold-500" />
            <span>The Hair Gallery PWA Guide</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-gold-500 hover:from-amber-500 hover:to-gold-400 text-stone-950 font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
