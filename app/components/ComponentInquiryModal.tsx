'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquarePlus, X, Bug, Layout, Monitor, ShieldCheck, 
  CheckCircle2, ChevronDown, ChevronUp, Store, Cpu, Info
} from 'lucide-react';

interface ComponentInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTargetComponent?: string;
  currentUser?: any;
  lang?: 'ko' | 'en';
}

const DEFAULT_COMPONENTS = [
  '일반 매장 문의 (Store / Hair Salon General)',
  '헤더 (Header & Navigation)',
  '메인 소개 / 메인 갤러리 (Hero & Gallery)',
  '시술 메뉴 (Service Menu)',
  '온라인 예약 (Booking Calendar & Form)',
  '마이페이지 (My Page & History)',
  '관리자 대시보드 (Admin Dashboard)',
  '하단 푸터 & 지도 (Footer & Map)',
  '기타 / 특정 영역 (Other Component / Area)'
];

export default function ComponentInquiryModal({
  isOpen,
  onClose,
  defaultTargetComponent = '일반 매장 문의 (Store / Hair Salon General)',
  currentUser,
  lang = 'ko'
}: ComponentInquiryModalProps) {
  const [targetComponent, setTargetComponent] = useState(defaultTargetComponent);
  const [customComponent, setCustomComponent] = useState('');
  const [category, setCategory] = useState<string>('store');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDebugPreview, setShowDebugPreview] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (defaultTargetComponent) {
      setTargetComponent(defaultTargetComponent);
    }
  }, [defaultTargetComponent]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDebugInfo({
        user_agent: navigator.userAgent,
        current_url: window.location.href,
        screen_resolution: `${window.screen.width}x${window.screen.height} (Viewport: ${window.innerWidth}x${window.innerHeight})`,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toLocaleString()
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const finalTarget = targetComponent.includes('기타 / 특정 영역') && customComponent.trim() 
    ? customComponent.trim() 
    : targetComponent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert(lang === 'ko' ? '제목과 문의 내용을 입력해 주세요.' : 'Please enter title and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_component: finalTarget,
          title: title.trim(),
          content: content.trim(),
          category,
          debug_info: debugInfo,
          user_id: currentUser?.id || null,
          user_email: currentUser?.email || null,
          user_name: currentUser?.name || (currentUser ? '회원' : '비회원 (Guest)'),
          user_role: currentUser?.role || (currentUser?.is_admin ? 'ADMIN' : 'USER')
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || '문의 접수 실패');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setTitle('');
        setContent('');
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message || (lang === 'ko' ? '문의 접수 중 오류가 발생했습니다.' : 'Failed to submit inquiry.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden text-stone-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-amber-400">
                {lang === 'ko' ? '매장 & 시스템 서비스 문의하기' : 'Store & System Inquiry'}
              </h3>
              <p className="text-[11px] text-stone-400 font-mono">
                {lang === 'ko' ? '일반 매장 문의부터 기술/컴포넌트 문의까지 접수하실 수 있습니다.' : 'Submit general store inquiries or component feedback.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Login Notice Banner (Spec Requirement) */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center gap-2 text-xs text-amber-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium">
            {lang === 'ko' 
              ? '로그인 후 문의 작성 시 마이페이지에서 답변을 확인하실 수 있습니다.'
              : 'When logged in, you can check your inquiries and replies on My Page.'}
          </span>
        </div>

        {/* Content Body */}
        {submitSuccess ? (
          <div className="p-10 text-center space-y-3 my-auto">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-emerald-400">
              {lang === 'ko' ? '문의가 성공적으로 접수되었습니다!' : 'Inquiry Submitted Successfully!'}
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
              {lang === 'ko' 
                ? currentUser 
                  ? '문의 내용이 저장되었습니다. 마이페이지에서 관리자 답변 상태를 확인하실 수 있습니다.'
                  : '문의가 성공적으로 접수되었습니다. 관리자 확인 후 순차 처리됩니다.' 
                : 'Your inquiry has been saved successfully.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-300 flex items-center gap-1.5 uppercase font-mono">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'ko' ? '문의 유형 (Category)' : 'Category'}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'store', label: lang === 'ko' ? '🏪 매장/시술 문의' : 'Store', icon: Store },
                  { key: 'component', label: lang === 'ko' ? '🧩 부품/기술' : 'Tech', icon: Cpu },
                  { key: 'bug', label: lang === 'ko' ? '🐞 버그/오류' : 'Bug', icon: Bug },
                  { key: 'other', label: lang === 'ko' ? '📌 기타 문의' : 'Other', icon: Layout }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                      category === item.key
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Component / Area Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-300 flex items-center gap-1.5 uppercase font-mono">
                <Layout className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'ko' ? '문의 대상 영역 / 컴포넌트' : 'Target Component'}</span>
              </label>
              <select
                value={targetComponent}
                onChange={(e) => setTargetComponent(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              >
                {DEFAULT_COMPONENTS.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
              {targetComponent.includes('기타 / 특정 영역') && (
                <input
                  type="text"
                  placeholder={lang === 'ko' ? '특정 영역이나 컴포넌트명을 직접 입력하세요' : 'Enter target area or component name'}
                  value={customComponent}
                  onChange={(e) => setCustomComponent(e.target.value)}
                  className="w-full mt-2 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                />
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-300 uppercase font-mono">
                {lang === 'ko' ? '문의 제목' : 'Title'}
              </label>
              <input
                type="text"
                required
                placeholder={lang === 'ko' ? '예: 매장 시술 가격 및 예약 가능 시간에 대한 문의' : 'Summary of inquiry'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-300 uppercase font-mono">
                {lang === 'ko' ? '상세 문의 내용' : 'Detailed Description'}
              </label>
              <textarea
                required
                rows={4}
                placeholder={lang === 'ko' ? '문의하실 내용을 상세히 적어주세요. 로그인 유저는 답변을 마이페이지에서 확인하실 수 있습니다.' : 'Describe details'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Debug Info Collapsible Preview */}
            <div className="bg-stone-950/70 border border-stone-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDebugPreview(!showDebugPreview)}
                className="w-full px-3.5 py-2 text-stone-400 hover:text-stone-200 flex items-center justify-between text-[11px] font-mono"
              >
                <span className="flex items-center gap-1.5 text-amber-400/90 font-bold">
                  <Monitor className="w-3.5 h-3.5" />
                  {lang === 'ko' ? '자동 수집 정보 미리보기' : 'Auto Debugging Context'}
                </span>
                {showDebugPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showDebugPreview && (
                <div className="p-3 border-t border-stone-800/80 bg-black/40 font-mono text-[10px] space-y-1 text-stone-400 leading-relaxed">
                  <p><span className="text-stone-300 font-semibold">User:</span> {currentUser ? `${currentUser.name} (${currentUser.email || 'OAuth'})` : '비회원 (Guest)'}</p>
                  <p><span className="text-stone-300 font-semibold">URL:</span> {debugInfo.current_url}</p>
                  <p><span className="text-stone-300 font-semibold">Screen:</span> {debugInfo.screen_resolution}</p>
                  <p><span className="text-stone-300 font-semibold">UserAgent:</span> {debugInfo.user_agent}</p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200 font-semibold transition-colors"
              >
                {lang === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all shadow-md shadow-amber-500/10 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>{lang === 'ko' ? '접수 중...' : 'Submitting...'}</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === 'ko' ? '문의 접수하기' : 'Submit Inquiry'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
