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
  ArrowDownCircle
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
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Detect mobile platform to set initial tab
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1) {
      setActiveTab('ios');
    } else if (userAgent.indexOf('android') !== -1) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
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
              <h3 className="font-serif text-lg font-medium text-white tracking-tight">
                {lang === 'ko' ? '모바일 앱 설치 / 홈 화면 추가' : 'Add to Home Screen Guide'}
              </h3>
              <p className="text-[11px] text-stone-400 font-mono">
                {lang === 'ko' ? '원클릭 아이콘으로 빠르게 예약하고 확인하세요' : 'Quick access from your mobile home screen'}
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
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

          {/* Platform Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
            <button
              onClick={() => setActiveTab('ios')}
              className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-stone-800 text-gold-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS (iPhone)</span>
            </button>

            <button
              onClick={() => setActiveTab('android')}
              className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
              className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-stone-800 text-gold-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC / Chrome</span>
            </button>
          </div>

          {/* Step-by-Step Instructions */}
          {activeTab === 'ios' && (
            <div className="space-y-4 bg-stone-950/60 p-5 rounded-2xl border border-stone-800/80">
              <h4 className="font-serif text-sm font-medium text-white flex items-center gap-2">
                <span>iOS Safari 브라우저에서 홈 화면 추가</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                      <span>Safari 하단 중앙</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[11px] inline-flex items-center gap-1">
                        <Share2 className="w-3 h-3" /> 공유 버튼
                      </span>
                      <span>클릭</span>
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      아이폰 Safari 화면 하단 메인 툴바 중앙의 네모 상자 화살표 아이콘을 누릅니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                      <span>메뉴 목록에서</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[11px] inline-flex items-center gap-1">
                        <PlusSquare className="w-3 h-3" /> 홈 화면에 추가
                      </span>
                      <span>선택</span>
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      아래로 스크롤하여 &quot;홈 화면에 추가&quot; 옵션을 선택하세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-200 text-xs">
                      우측 상단 &apos;추가&apos; 클릭 후 바탕화면 앱처럼 사용
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      홈 화면에 아이콘이 생성되어 브라우저 주소 입력 없이 한 번의 터치로 접근이 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-4 bg-stone-950/60 p-5 rounded-2xl border border-stone-800/80">
              <h4 className="font-serif text-sm font-medium text-white flex items-center gap-2">
                <span>Android (Chrome / 삼성 인터넷) 브라우저</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                      <span>우측 상단</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[11px] inline-flex items-center gap-1">
                        <MoreVertical className="w-3 h-3" /> 메뉴 (점 3개)
                      </span>
                      <span>클릭</span>
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      크롬 또는 삼성 인터넷 상단 옵션 아이콘을 터치합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                      <span>목록에서</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-gold-400 font-mono text-[11px] inline-flex items-center gap-1">
                        <Download className="w-3 h-3" /> 앱 설치
                      </span>
                      <span>또는 &apos;홈 화면에 추가&apos; 선택</span>
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      팝업 창이 나타나면 &apos;설치&apos;를 확인하여 기기에 다운로드합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-4 bg-stone-950/60 p-5 rounded-2xl border border-stone-800/80">
              <h4 className="font-serif text-sm font-medium text-white flex items-center gap-2">
                <span>데스크톱 PC (Chrome / Edge) 설치</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-stone-900 rounded-xl border border-stone-800">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-200 text-xs">
                      주소창 우측 모니터/다운로드 아이콘 클릭
                    </p>
                    <p className="text-stone-400 text-[11px]">
                      Chrome 브라우저 주소 표시줄 우측에 표시되는 &apos;더 헤어 갤러리 앱 설치&apos; 버튼을 누릅니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-6 py-4 border-t border-stone-800 flex items-center justify-between">
          <span className="text-[10px] text-stone-500 font-mono">
            The Hair Gallery PWA Web App Guide
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
