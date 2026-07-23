'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/app/components/Header';
import PriceList from '@/app/components/PriceList';
import ComponentInquiryModal from '@/app/components/ComponentInquiryModal';
import InstallAppGuide from '@/app/components/InstallAppGuide';
import { getSupabaseClient } from '@/lib/supabase';
import { Scissors, Calendar, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PricePage() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const fetchSessionUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            setCurrentUser(profile);
          } else {
            setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              role: session.user.user_metadata?.role || 'USER',
              is_admin: session.user.user_metadata?.is_admin || false
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch session on price page:', e);
      }
    };

    fetchSessionUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchSessionUser();
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950 flex flex-col font-sans antialiased">
      {/* Dynamic SEO Meta Title */}
      <head>
        <title>{lang === 'ko' ? '시술 가격 안내 | 더 헤어 갤러리 (THE HAIR GALLERY)' : 'Price Guide | THE HAIR GALLERY'}</title>
        <meta 
          name="description" 
          content={lang === 'ko' ? '더 헤어 갤러리 커트, 염색, 펌, 클리닉, 스타일링, 샴푸, 업스타일 시술별 상세 가격 정보' : 'Detailed haircut and hair treatment price guide for THE HAIR GALLERY'} 
        />
      </head>

      {/* Global Navigation Header */}
      <Header
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        notificationCount={0}
        notificationReservations={[]}
        onOpenAuthModal={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/?auth=true';
          }
        }}
        onLogout={handleLogout}
        onOpenInquiryModal={() => setShowInquiryModal(true)}
        onOpenInstallModal={() => setShowInstallModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-stone-200 hover:border-stone-400 rounded-xl text-xs font-mono font-semibold text-stone-700 hover:text-stone-900 transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-stone-500" />
              <span>{lang === 'ko' ? '메인 예약 페이지로 돌아가기' : 'Back to Main Booking'}</span>
            </Link>

            <Link
              href="/#booking-section"
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-500 hover:bg-gold-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{lang === 'ko' ? '바로 예약 신청하기' : 'Book Appointment Now'}</span>
            </Link>
          </div>
        </div>

        {/* Price List Component */}
        <PriceList lang={lang} currentUser={currentUser} />
      </main>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <ComponentInquiryModal
          isOpen={showInquiryModal}
          onClose={() => setShowInquiryModal(false)}
          defaultTargetComponent="시술 메뉴 (Service Menu)"
          lang={lang}
        />
      )}

      {/* Install App Modal */}
      {showInstallModal && (
        <InstallAppGuide
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          lang={lang}
        />
      )}

      {/* Footer */}
      <footer className="bg-stone-950 border-t border-stone-800 py-8 px-4 sm:px-6 text-stone-400 text-xs text-center">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-serif font-bold text-stone-200 text-sm">THE HAIR GALLERY</p>
          <p>© {new Date().getFullYear()} THE HAIR GALLERY. All rights reserved. Premium Soho Hair Studio.</p>
        </div>
      </footer>
    </div>
  );
}
