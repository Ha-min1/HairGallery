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
  ArrowRight,
  Maximize2,
  Minimize2,
  Edit3,
  ShieldCheck,
  Upload,
  AlertCircle,
  Plus
} from 'lucide-react';

interface HairStyleItem {
  id?: string;
  image_name: string;
  imageSrc: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  designer?: string;
  display_order?: number;
  is_visible?: boolean;
}

interface HairPortfolioGalleryProps {
  lang?: 'ko' | 'en';
  currentUser?: any | null;
}

export default function HairPortfolioGallery({ lang = 'ko', currentUser }: HairPortfolioGalleryProps) {
  const [items, setItems] = useState<HairStyleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<HairStyleItem | null>(null);

  // Admin Edit Modal States
  const [editingItem, setEditingItem] = useState<HairStyleItem | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Cut');
  const [formTagsStr, setFormTagsStr] = useState<string>('');
  const [formImageName, setFormImageName] = useState<string>('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<string>('1');
  const [formIsVisible, setFormIsVisible] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.is_admin === true;

  const fetchPortfolioItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items.filter((item: HairStyleItem) => item.is_visible !== false));
      }
    } catch (err) {
      console.error('Error loading portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  const categories = ['All', 'Cut', 'Color', 'Perm'];

  const filteredItems = items.filter(item => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  const scrollToBooking = () => {
    setSelectedStyle(null);
    const el = document.getElementById('booking-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openAdminEditModal = (item?: HairStyleItem) => {
    if (item) {
      setEditingItem(item);
      setFormImageName(item.image_name || 'hair_01.jpg');
      setFormTitle(item.title || '');
      setFormDesc(item.description || '');
      setFormCategory(item.category || 'Cut');
      setFormTagsStr(Array.isArray(item.tags) ? item.tags.join(', ') : '');
      setFormDisplayOrder(String(item.display_order ?? 1));
      setFormIsVisible(item.is_visible !== false);
    } else {
      setEditingItem(null);
      setFormImageName(`hair_0${items.length + 1}.jpg`);
      setFormTitle('');
      setFormDesc('');
      setFormCategory('Cut');
      setFormTagsStr('');
      setFormDisplayOrder(String(items.length + 1));
      setFormIsVisible(true);
    }
  };

  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImageName.trim() || !formTitle.trim()) {
      alert('이미지 파일명과 스타일 제목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const tagsArray = formTagsStr
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        image_name: formImageName.trim(),
        title: formTitle.trim(),
        description: formDesc.trim(),
        category: formCategory,
        tags: tagsArray,
        display_order: Number(formDisplayOrder),
        is_visible: formIsVisible
      };

      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '저장 중 오류가 발생했습니다.');
      }

      alert('헤어 포트폴리오 스타일 정보가 성공적으로 저장되었습니다!');
      setEditingItem(null);
      fetchPortfolioItems();
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate items array for marquee loop in collapsed state
  const marqueeItems = filteredItems.length > 0 ? [...filteredItems, ...filteredItems] : [];

  return (
    <section 
      id="portfolio-gallery" 
      className="bg-stone-900 border-y border-stone-800 py-16 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-800 pb-6">
          <div className="text-left space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[10px] font-mono font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Signature Gallery</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal tracking-tight">
              {lang === 'ko' ? '시그니처 헤어 포트폴리오 갤러리' : 'Signature Hair Portfolio'}
            </h2>
            <p className="text-xs text-stone-400 font-sans tracking-wide leading-relaxed">
              {lang === 'ko' 
                ? '더 헤어 갤러리 마스터 디자이너들이 시술한 트렌디한 헤어 스타일 컬렉션입니다.' 
                : 'Bespoke hair design, precision cuts, and luminous color artistry.'}
            </p>
          </div>

          {/* Action Buttons: Expand/Collapse & Admin Add */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                onClick={() => openAdminEditModal()}
                className="px-3.5 py-2 bg-gold-600/20 hover:bg-gold-600/30 text-gold-400 border border-gold-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>스타일 추가 (Admin)</span>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-gold-400 border border-stone-700 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-4 h-4 text-gold-400" />
                  <span>{lang === 'ko' ? '슬라이더로 접기 🔺' : 'Collapse View 🔺'}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-gold-400" />
                  <span>{lang === 'ko' ? '더보기 / 전체보기 (Expand) 🔻' : 'Expand Grid 🔻'}</span>
                </>
              )}
            </button>
          </div>
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
              {cat === 'All' ? (lang === 'ko' ? '전체 스타일 (All)' : 'All Styles') : cat}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-stone-950/60 border border-stone-800 p-16 rounded-3xl text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-gold-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-mono text-stone-400">포트폴리오 스타일 갤러리를 로딩 중입니다...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State: "업데이트 준비 중입니다" */
          <div className="bg-stone-950/80 border border-stone-800 rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto shadow-inner">
            <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 text-gold-400 flex items-center justify-center mx-auto">
              <Scissors className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-medium text-white tracking-tight">
                {lang === 'ko' ? '업데이트 준비 중입니다 💈' : 'Style Collection Coming Soon 💈'}
              </h3>
              <p className="text-xs text-stone-400 font-sans leading-relaxed">
                {lang === 'ko' 
                  ? '새로운 시그니처 스타일 화보가 곧 업데이트될 예정입니다. 잠시만 기다려 주세요!' 
                  : 'Our design masters are preparing new hair portfolio collections.'}
              </p>
            </div>
          </div>
        ) : !isExpanded ? (
          /* ================= 1. COLLAPSED STATE: CONTINUOUS MARQUEE INFINITE AUTO-SCROLL ================= */
          <div className="relative w-full overflow-hidden py-4 rounded-3xl bg-stone-950/60 border border-stone-800/80 shadow-inner group">
            {/* Gradient Fades for Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-stone-950 to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-stone-950 to-transparent z-20 pointer-events-none" />

            <div className="animate-marquee gap-5">
              {marqueeItems.map((item, idx) => (
                <div
                  key={`${item.id || item.image_name}-${idx}`}
                  onClick={() => setSelectedStyle(item)}
                  className="w-64 sm:w-72 shrink-0 group/card relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 transition-all duration-300 cursor-pointer hover:border-gold-500/60 hover:shadow-2xl hover:scale-[1.02]"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-900">
                    <img
                      src={item.imageSrc}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-108"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-80 group-hover/card:opacity-90 transition-opacity" />

                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-lg bg-stone-950/80 backdrop-blur-md border border-stone-800 text-gold-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity flex gap-1">
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAdminEditModal(item);
                          }}
                          className="p-1.5 rounded-lg bg-stone-900/90 text-gold-400 border border-gold-500/40 hover:bg-gold-500 hover:text-stone-950 transition-colors"
                          title="DB 수정 (Admin)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="p-1.5 rounded-lg bg-gold-500 text-stone-950 shadow-md">
                        <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10 space-y-1.5 text-left">
                      <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block">
                        {item.designer || 'Master Stylist'}
                      </span>
                      <h3 className="font-serif text-sm text-white font-medium group-hover/card:text-gold-300 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.tags.slice(0, 2).map((tag, tIdx) => (
                          <span key={tIdx} className="px-1.5 py-0.5 rounded bg-stone-900/90 text-[9px] font-mono text-stone-300 border border-stone-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 text-[10px] text-center font-mono text-stone-500">
              💡 마우스 커서를 올리면 가로 스크롤이 정지하여 편리하게 감상하실 수 있습니다.
            </div>
          </div>
        ) : (
          /* ================= 2. EXPANDED STATE: RESPONSIVE GRID LAYOUT ================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fadeIn">
            {filteredItems.map((item) => (
              <div
                key={item.id || item.image_name}
                onClick={() => setSelectedStyle(item)}
                className="group relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 transition-all duration-300 cursor-pointer hover:border-gold-500/50 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-900">
                  <img
                    src={item.imageSrc}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-950/80 backdrop-blur-md border border-stone-800 text-gold-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAdminEditModal(item);
                        }}
                        className="p-1.5 rounded-lg bg-stone-900/90 text-gold-400 border border-gold-500/40 hover:bg-gold-500 hover:text-stone-950 transition-colors"
                        title="DB 수정 (Admin)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="p-2 rounded-xl bg-gold-500 text-stone-950 shadow-lg">
                      <Eye className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-2 text-left">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
                      {item.designer || 'Master Stylist'}
                    </span>
                    <h3 className="font-serif text-base text-white font-medium group-hover:text-gold-300 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.slice(0, 3).map((tag, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 rounded bg-stone-900/90 border border-stone-800 text-[9px] font-mono text-stone-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox / Preview Detail Modal */}
        {selectedStyle && (
          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden text-stone-100 flex flex-col md:flex-row max-h-[90vh] relative">
              <button
                onClick={() => setSelectedStyle(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-950/80 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

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

              <div className="md:w-1/2 p-6 sm:p-8 space-y-6 flex flex-col justify-between overflow-y-auto text-left">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-gold-400 uppercase tracking-widest block font-semibold">
                        {selectedStyle.designer || 'Master Stylist'}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            const target = selectedStyle;
                            setSelectedStyle(null);
                            openAdminEditModal(target);
                          }}
                          className="px-2.5 py-1 rounded bg-stone-800 hover:bg-gold-500 hover:text-stone-950 text-gold-400 text-[11px] font-mono flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>DB 편집 (Admin)</span>
                        </button>
                      )}
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl text-white font-normal tracking-tight">
                      {selectedStyle.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-300 font-sans leading-relaxed tracking-wide">
                    {selectedStyle.description || '시술에 대한 상세 스타일 설명이 등록되어 있지 않습니다.'}
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

                <div className="pt-4 border-t border-stone-800/80 space-y-3">
                  <button
                    onClick={scrollToBooking}
                    className="w-full py-3.5 bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer tracking-wider"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{lang === 'ko' ? '이 스타일로 실시간 예약하기' : 'Book This Style Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin DB Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-100 flex flex-col max-h-[90vh]">
              <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
                <h3 className="font-serif text-base text-gold-400 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold-400" />
                  <span>관리자 전용: 스타일 상세 설명 DB 편집</span>
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-left">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-stone-300 uppercase">
                    이미지 파일명 (hair_portfolio PRIMARY KEY) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: hair_01.jpg"
                    value={formImageName}
                    onChange={(e) => setFormImageName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 font-mono focus:border-gold-500/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-stone-300 uppercase">
                    스타일 이름 (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="스타일 제목 입력"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:border-gold-500/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-stone-300 uppercase">
                    스타일 상세 설명 및 특징 (Description)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="추천 얼굴형, 시술 정보, 특징 설명"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:border-gold-500/60 resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-bold text-stone-300 uppercase">
                      카테고리
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:border-gold-500/60"
                    >
                      <option value="Cut">Cut (커트)</option>
                      <option value="Color">Color (염색)</option>
                      <option value="Perm">Perm (파펌)</option>
                      <option value="Styling">Styling (스타일링)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-bold text-stone-300 uppercase">
                      노출 순서 (display_order)
                    </label>
                    <input
                      type="number"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:border-gold-500/60 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-stone-300 uppercase">
                    태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 발레아쥬, 옴브레, 내추럴웨이브"
                    value={formTagsStr}
                    onChange={(e) => setFormTagsStr(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:border-gold-500/60 font-mono"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl border border-stone-800 text-stone-400 hover:bg-stone-800"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold transition-all shadow-md"
                  >
                    {isSubmitting ? '저장 중...' : 'DB에 업데이트 저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
