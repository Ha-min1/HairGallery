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
  Trash2,
  ShieldCheck,
  ShieldAlert,
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

  // Admin Create/Edit Modal States
  const [editingItem, setEditingItem] = useState<HairStyleItem | null>(null);
  const [isCreateMode, setIsCreateMode] = useState<boolean>(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Cut');
  const [formDesigner, setFormDesigner] = useState<string>('Master Stylist');
  const [formTagsStr, setFormTagsStr] = useState<string>('');
  const [formImageName, setFormImageName] = useState<string>('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<string>('1');
  const [formIsVisible, setFormIsVisible] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Admin Delete Confirm Modal State
  const [deletingItem, setDeletingItem] = useState<HairStyleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'ADMIN' || 
      currentUser.is_admin === true || 
      currentUser.is_admin === 'true' || 
      currentUser.is_admin === 1
    )
  );

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

  const categories = ['All', 'Cut', 'Color', 'Perm', 'Styling'];

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
      setIsCreateMode(false);
      setEditingItem(item);
      setFormId(item.id || null);
      setFormImageName(item.image_name || '');
      setFormTitle(item.title || '');
      setFormDesc(item.description || '');
      setFormCategory(item.category || 'Cut');
      setFormDesigner(item.designer || 'Master Stylist');
      setFormTagsStr(Array.isArray(item.tags) ? item.tags.join(', ') : '');
      setFormDisplayOrder(String(item.display_order ?? 1));
      setFormIsVisible(item.is_visible !== false);
    } else {
      setIsCreateMode(true);
      setEditingItem({
        image_name: `hair_0${items.length + 1}.jpg`,
        imageSrc: `/assets/images/hair/hair_0${items.length + 1}.jpg`,
        title: '',
        category: 'Cut',
        tags: [],
        description: ''
      });
      setFormId(null);
      setFormImageName(`hair_0${items.length + 1}.jpg`);
      setFormTitle('');
      setFormDesc('');
      setFormCategory('Cut');
      setFormDesigner('Master Stylist');
      setFormTagsStr('');
      setFormDisplayOrder(String(items.length + 1));
      setFormIsVisible(true);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/posts/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success && data.image_url) {
        setFormImageName(data.image_url);
      } else {
        // Local Data URL Fallback
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setFormImageName(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      // FileReader Fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormImageName(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImageName.trim() || !formTitle.trim()) {
      alert('이미지 파일명/URL과 스타일 제목을 입력해주세요.');
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
        id: formId || undefined,
        image_name: formImageName.trim(),
        title: formTitle.trim(),
        description: formDesc.trim(),
        category: formCategory,
        designer: formDesigner.trim() || 'Master Stylist',
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

      alert(isCreateMode ? '새 헤어 스타일이 성공적으로 등록되었습니다!' : '헤어 포트폴리오 스타일 정보가 업데이트되었습니다!');
      setEditingItem(null);
      fetchPortfolioItems();
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let queryStr = '';
      if (deletingItem.id) {
        queryStr = `id=${encodeURIComponent(deletingItem.id)}`;
      } else {
        queryStr = `image_name=${encodeURIComponent(deletingItem.image_name)}`;
      }

      const res = await fetch(`/api/portfolio?${queryStr}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '삭제 처리 중 오류가 발생했습니다.');
      }

      // Optimistic UI update
      setItems(prev => prev.filter(item => 
        item.id !== deletingItem.id && item.image_name !== deletingItem.image_name
      ));
      if (selectedStyle && (selectedStyle.id === deletingItem.id || selectedStyle.image_name === deletingItem.image_name)) {
        setSelectedStyle(null);
      }

      alert('선택하신 헤어 스타일 항목이 삭제되었습니다.');
      setDeletingItem(null);
      fetchPortfolioItems();
    } catch (err: any) {
      alert(err.message || '삭제 처리에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Duplicate items array for marquee loop in collapsed state
  const marqueeItems = filteredItems.length > 0 ? [...filteredItems, ...filteredItems] : [];

  return (
    <section 
      id="portfolio-gallery" 
      className="bg-stone-900 border-y border-stone-800 py-16 relative overflow-hidden text-stone-100"
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
                className="px-4 py-2 bg-gradient-to-r from-amber-600/30 to-gold-600/30 hover:from-amber-600/40 hover:to-gold-600/40 text-gold-300 border border-gold-500/60 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 text-gold-400" />
                <span>+ 새 헤어 스타일 추가 (Admin)</span>
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
                {lang === 'ko' ? '등록된 포트폴리오 스타일이 없습니다 💈' : 'No Style Items Found 💈'}
              </h3>
              <p className="text-xs text-stone-400 font-sans leading-relaxed">
                {lang === 'ko' 
                  ? '새로운 시그니처 스타일 화보가 곧 업데이트될 예정입니다. 잠시만 기다려 주세요!' 
                  : 'Our design masters are preparing new hair portfolio collections.'}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => openAdminEditModal()}
                className="px-4 py-2 bg-gold-500 text-stone-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>지금 새 스타일 추가하기</span>
              </button>
            )}
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
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdminEditModal(item);
                            }}
                            className="p-1.5 rounded-lg bg-stone-900/90 text-gold-400 border border-gold-500/40 hover:bg-gold-500 hover:text-stone-950 transition-colors shadow-sm"
                            title="DB 수정 (Admin)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingItem(item);
                            }}
                            className="p-1.5 rounded-lg bg-red-950/90 text-red-300 border border-red-800/60 hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                            title="스타일 삭제 (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
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
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAdminEditModal(item);
                          }}
                          className="p-1.5 rounded-lg bg-stone-900/90 text-gold-400 border border-gold-500/40 hover:bg-gold-500 hover:text-stone-950 transition-colors shadow-sm"
                          title="DB 수정 (Admin)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingItem(item);
                          }}
                          className="p-1.5 rounded-lg bg-red-950/90 text-red-300 border border-red-800/60 hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                          title="스타일 삭제 (Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
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
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const target = selectedStyle;
                              setSelectedStyle(null);
                              openAdminEditModal(target);
                            }}
                            className="px-2.5 py-1 rounded bg-stone-800 hover:bg-gold-500 hover:text-stone-950 text-gold-400 text-[11px] font-mono flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>수정</span>
                          </button>
                          <button
                            onClick={() => {
                              const target = selectedStyle;
                              setSelectedStyle(null);
                              setDeletingItem(target);
                            }}
                            className="px-2.5 py-1 rounded bg-red-950 border border-red-800 hover:bg-red-600 text-red-300 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>삭제</span>
                          </button>
                        </div>
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

        {/* Admin DB Create / Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-100 flex flex-col max-h-[90vh]">
              <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
                <h3 className="font-serif text-base text-gold-400 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold-400" />
                  <span>{isCreateMode ? '관리자 전용: 새 헤어 스타일 등록' : '관리자 전용: 스타일 상세 정보 수정'}</span>
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-left">
                {/* Image Name & File Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-stone-300 uppercase flex items-center justify-between">
                    <span>이미지 파일명 또는 URL *</span>
                    {isUploadingImage && <span className="text-gold-400 animate-pulse">업로드 중...</span>}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="예: hair_05.jpg 또는 이미지 URL"
                      value={formImageName}
                      onChange={(e) => setFormImageName(e.target.value)}
                      className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 font-mono focus:border-gold-500/60"
                    />
                    <label className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-mono cursor-pointer flex items-center gap-1.5 shrink-0">
                      <Upload className="w-3.5 h-3.5 text-gold-400" />
                      <span>파일 선택</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-stone-500 font-mono">
                    로컬 파일 선택 시 Supabase 저장소로 업로드되거나 이미지 경로가 자동으로 반영됩니다.
                  </p>
                </div>

                {/* Style Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-stone-300 uppercase">
                    스타일 이름 (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 시그니처 옴브레, 모던 허쉬컷"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:border-gold-500/60"
                  />
                </div>

                {/* Style Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-stone-300 uppercase">
                    스타일 상세 설명 및 연출 포인트 (Description)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="추천 얼굴형, 시술 포인트, 관리 팁 등 상세 설명을 입력하세요"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:border-gold-500/60 resize-none leading-relaxed"
                  />
                </div>

                {/* Category & Designer */}
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
                      담당 디자이너
                    </label>
                    <input
                      type="text"
                      placeholder="예: Master Stylist Claire"
                      value={formDesigner}
                      onChange={(e) => setFormDesigner(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:border-gold-500/60"
                    />
                  </div>
                </div>

                {/* Display Order & Tags */}
                <div className="grid grid-cols-2 gap-3">
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

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-bold text-stone-300 uppercase">
                      태그 (쉼표로 구분)
                    </label>
                    <input
                      type="text"
                      placeholder="예: 발레아쥬, 옴브레, 허쉬컷"
                      value={formTagsStr}
                      onChange={(e) => setFormTagsStr(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:border-gold-500/60 font-mono"
                    />
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="formIsVisible"
                    checked={formIsVisible}
                    onChange={(e) => setFormIsVisible(e.target.checked)}
                    className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
                  />
                  <label htmlFor="formIsVisible" className="text-xs text-stone-300 font-medium cursor-pointer">
                    갤러리에 즉시 노출 (is_visible)
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl border border-stone-800 text-stone-400 hover:bg-stone-800 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold transition-all shadow-md cursor-pointer"
                  >
                    {isSubmitting ? '저장 중...' : (isCreateMode ? '+ 새 스타일 등록' : 'DB 업데이트 저장')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Delete Confirmation Modal */}
        {deletingItem && (
          <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-stone-900 border border-red-900/60 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-stone-100">
              <div className="bg-red-950/80 px-6 py-4 border-b border-red-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <span>🗑️ 헤어 스타일 포트폴리오 삭제 확인</span>
                </div>
                <button
                  onClick={() => setDeletingItem(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-left text-xs">
                <p className="text-stone-200 font-medium text-sm leading-relaxed">
                  정말 이 헤어 스타일 항목을 삭제하시겠습니까?
                </p>

                <div className="p-3 bg-stone-950 border border-stone-800 rounded-2xl flex items-center gap-3">
                  <img 
                    src={deletingItem.imageSrc} 
                    alt={deletingItem.title}
                    className="w-12 h-12 object-cover rounded-xl border border-stone-800 shrink-0" 
                  />
                  <div className="space-y-0.5 overflow-hidden">
                    <span className="text-[10px] font-mono text-gold-400 font-bold uppercase block">
                      {deletingItem.category} Portfolio
                    </span>
                    <h4 className="font-bold text-white text-xs truncate">
                      {deletingItem.title}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-mono truncate">
                      {deletingItem.image_name}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-red-400 font-mono bg-red-950/40 p-2.5 rounded-xl border border-red-900/40">
                  ⚠️ 삭제 시 해당 포트폴리오 데이터가 DB에서 영구 삭제되며 복구할 수 없습니다.
                </p>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeletingItem(null)}
                    className="px-4 py-2 rounded-xl border border-stone-800 text-stone-400 hover:bg-stone-800 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeleting ? '삭제 중...' : '삭제 완료'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
