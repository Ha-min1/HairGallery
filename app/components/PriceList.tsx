'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Scissors, 
  Palette, 
  Sparkles, 
  Heart, 
  Wind, 
  Droplets, 
  Crown, 
  Check, 
  X, 
  AlertCircle,
  Clock,
  Info
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

export interface PriceItem {
  id: string;
  category: string;
  title: string;
  price: string;
  description?: string | null;
  display_order?: number;
  created_at?: string;
}

interface PriceListProps {
  lang?: 'ko' | 'en';
  currentUser?: any | null;
  isEmbedded?: boolean;
}

export const CATEGORIES = [
  { id: '커트', labelKo: '커트', labelEn: 'Cut', icon: Scissors },
  { id: '염색', labelKo: '염색', labelEn: 'Color', icon: Palette },
  { id: '펌', labelKo: '펌', labelEn: 'Perm', icon: Sparkles },
  { id: '클리닉', labelKo: '클리닉', labelEn: 'Treatment', icon: Heart },
  { id: '스타일링', labelKo: '스타일링', labelEn: 'Styling', icon: Wind },
  { id: '샴푸', labelKo: '샴푸', labelEn: 'Shampoo', icon: Droplets },
  { id: '업스타일', labelKo: '업스타일', labelEn: 'Upstyle', icon: Crown },
];

export default function PriceList({ lang = 'ko', currentUser = null, isEmbedded = false }: PriceListProps) {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for CUD operations
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  
  // Form fields
  const [formCategory, setFormCategory] = useState<string>('커트');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'ADMIN' || 
      currentUser.is_admin === true || 
      currentUser.is_admin === 'true' || 
      currentUser.is_admin === 1
    )
  );

  const fetchPriceList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/price-list');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        console.error('Failed to fetch price list:', data.error);
      }
    } catch (e) {
      console.error('Error fetching price list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceList();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormCategory(selectedCategory !== 'all' ? selectedCategory : '커트');
    setFormTitle('');
    setFormPrice('');
    setFormDescription('');
    setFormDisplayOrder(items.length + 1);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PriceItem) => {
    setEditingItem(item);
    setFormCategory(item.category || '커트');
    setFormTitle(item.title || '');
    setFormPrice(item.price || '');
    setFormDescription(item.description || '');
    setFormDisplayOrder(item.display_order ?? 0);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory || !formTitle || !formPrice) {
      setErrorMsg(lang === 'ko' ? '카테고리, 시술명, 가격은 필수 항목입니다.' : 'Category, Title, and Price are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const method = editingItem ? 'PUT' : 'POST';
      const bodyPayload = {
        ...(editingItem && { id: editingItem.id }),
        category: formCategory,
        title: formTitle,
        price: formPrice,
        description: formDescription,
        display_order: formDisplayOrder
      };

      const res = await fetch('/api/price-list', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '가격표 정보 저장 중 오류가 발생했습니다.');
      }

      setSuccessMsg(
        editingItem 
          ? (lang === 'ko' ? '시술 가격 정보가 수정되었습니다.' : 'Price item updated successfully.')
          : (lang === 'ko' ? '새 시술 가격 정보가 등록되었습니다.' : 'New price item added successfully.')
      );
      
      setIsModalOpen(false);
      await fetchPriceList();

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, title: string) => {
    const confirmMsg = lang === 'ko' 
      ? `"${title}" 가격 항목을 삭제하시겠습니까?` 
      : `Are you sure you want to delete "${title}"?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/price-list?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '삭제 실패');
      }

      setSuccessMsg(lang === 'ko' ? '가격 항목이 삭제되었습니다.' : 'Price item deleted.');
      await fetchPriceList();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      item.title.toLowerCase().includes(query) || 
      item.category.toLowerCase().includes(query) || 
      (item.description && item.description.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  // Group items by category when viewing "all"
  const categoriesPresent = selectedCategory === 'all' 
    ? Array.from(new Set(items.map(i => i.category)))
    : [selectedCategory];

  return (
    <div className={`w-full max-w-7xl mx-auto ${isEmbedded ? '' : 'px-4 sm:px-6 py-8 sm:py-12'}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden text-stone-100">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/10 border border-gold-500/30 rounded-full text-gold-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Tag className="w-3.5 h-3.5" />
              <span>THE HAIR GALLERY PRICE GUIDE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              {lang === 'ko' ? '헤어갤러리 시술 가격 안내' : 'Hair Styling Price Guide'}
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {lang === 'ko' 
                ? '더 헤어 갤러리의 정직하고 합리적인 시술별 가변 가격표입니다. 모발 상태, 길이, 디자인 특성에 따라 맞춤 시술이 적용됩니다.'
                : 'Transparent and variable pricing for all hair styling procedures. Final prices may adjust based on hair length and condition.'}
            </p>
          </div>

          {/* Admin [+ 새 가격 항목 추가] Button */}
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 text-stone-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-gold-500/20 hover:scale-105 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ko' ? '+ 새 가격 항목 추가' : '+ Add New Price Item'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-fadeIn shadow-md">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls Bar: Category Filter Chips & Search Box */}
      <div className="space-y-4 mb-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-gold-400 shadow-md border border-stone-700'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {lang === 'ko' ? '전체 보기' : 'All Categories'} ({items.length})
          </button>

          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = items.filter(i => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-gold-400 shadow-md border border-stone-700'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-gold-400' : 'text-stone-400'}`} />
                <span>{lang === 'ko' ? cat.labelKo : cat.labelEn}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-stone-800 text-gold-300' : 'bg-stone-100 text-stone-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ko' ? '시술명 또는 설명으로 가격 검색...' : 'Search price list by title or detail...'}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-stone-400">{lang === 'ko' ? '가격표 데이터를 불러오는 중입니다...' : 'Loading price list...'}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 bg-white border border-stone-200 rounded-3xl text-center p-8 space-y-3 shadow-sm">
          <AlertCircle className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">
            {lang === 'ko' ? '해당 조건의 시술 가격 항목이 없습니다.' : 'No price items found.'}
          </h3>
          <p className="text-xs text-stone-500">
            {searchQuery 
              ? (lang === 'ko' ? '검색어를 변경하거나 카테고리 필터를 초기화해 보세요.' : 'Try changing search query or category filter.')
              : (lang === 'ko' ? '관리자 로그인 후 신규 가격 항목을 추가할 수 있습니다.' : 'Admins can add new price items.')}
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ko' ? '신규 가격 추가하기' : 'Add Price Item'}</span>
            </button>
          )}
        </div>
      ) : (
        /* Items Display Grid grouped by Category */
        <div className="space-y-10">
          {categoriesPresent.map(catName => {
            const catItems = filteredItems.filter(i => i.category === catName);
            if (catItems.length === 0) return null;

            const catInfo = CATEGORIES.find(c => c.id === catName) || { labelKo: catName, labelEn: catName, icon: Tag };
            const Icon = catInfo.icon;

            return (
              <div key={catName} className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-900 text-gold-400 flex items-center justify-center shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-serif font-bold text-stone-900">
                    {lang === 'ko' ? catInfo.labelKo : catInfo.labelEn}
                  </h2>
                  <span className="text-xs text-stone-400 font-mono">
                    ({catItems.length}{lang === 'ko' ? '개 항목' : ' items'})
                  </span>
                </div>

                {/* Price Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catItems.map(item => (
                    <div
                      key={item.id}
                      className="group bg-white rounded-2xl border border-stone-200 hover:border-gold-500/60 p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-3">
                          <h3 className="text-base font-bold text-stone-900 group-hover:text-gold-700 transition-colors leading-snug">
                            {item.title}
                          </h3>
                          <span className="inline-block px-2.5 py-1 bg-amber-50 border border-gold-500/30 text-gold-700 rounded-lg text-xs sm:text-sm font-bold font-serif whitespace-nowrap shrink-0 shadow-2xs">
                            {item.price}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-stone-500 leading-relaxed font-normal flex items-start gap-1.5 pt-1">
                            <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <span>{item.description}</span>
                          </p>
                        )}
                      </div>

                      {/* Admin Controls: Edit & Delete Buttons */}
                      {isAdmin && (
                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-stone-500" />
                            <span>{lang === 'ko' ? '✏️ 수정' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.title)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>{lang === 'ko' ? '🗑️ 삭제' : 'Delete'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info Note */}
      <div className="mt-12 p-5 bg-stone-100 rounded-2xl border border-stone-200 text-stone-600 text-xs leading-relaxed space-y-1">
        <p className="font-bold text-stone-800 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gold-600" />
          <span>{lang === 'ko' ? '가격 관련 참고 사항' : 'Price Information Notice'}</span>
        </p>
        <p>• {lang === 'ko' ? '표시된 금액은 기본 시술 기준이며, 기장 추가나 특수 영양 앰플 추가 시 현장에서 금액이 조정될 수 있습니다.' : 'Prices displayed are base rates. Additional charges may apply depending on hair length or special ampoules.'}</p>
        <p>• {lang === 'ko' ? '정확한 커스텀 견적은 원장과의 1:1 상담 시 상세히 안내해 드립니다.' : 'Customized quotes will be detailed during your 1-on-1 consultation with our Salon Director.'}</p>
      </div>

      {/* Admin Add/Edit Price Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl border border-stone-200 w-full max-w-lg shadow-2xl overflow-hidden text-stone-900">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-stone-900 text-white flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-gold-400" />
                <span>
                  {editingItem 
                    ? (lang === 'ko' ? '가격 항목 수정 (Admin Edit)' : 'Edit Price Item')
                    : (lang === 'ko' ? '새 가격 항목 추가 (Admin Add)' : 'Add New Price Item')}
                </span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'ko' ? '시술 대분류 카테고리 *' : 'Category *'}
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.labelKo} ({cat.labelEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'ko' ? '시술명 (Title) *' : 'Title *'}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={lang === 'ko' ? '예: 남성 디자인 컷, 영양 클리닉' : 'e.g. Mens Design Cut'}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'ko' ? '시술 가격 (Price) *' : 'Price *'}
                </label>
                <input
                  type="text"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder={lang === 'ko' ? '예: 25,000원 또는 80,000원 ~' : 'e.g. 25,000 KRW or 80,000 ~'}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'ko' ? '상세 설명 및 소요 시간 (Description)' : 'Description'}
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={lang === 'ko' ? '예: 샴푸 및 스타일링 포함 (45분)' : 'e.g. Includes shampoo & styling (45m)'}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'ko' ? '정렬 순서 (Display Order)' : 'Display Order'}
                </label>
                <input
                  type="number"
                  value={formDisplayOrder}
                  onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {lang === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting 
                    ? (lang === 'ko' ? '저장 중...' : 'Saving...') 
                    : editingItem 
                    ? (lang === 'ko' ? '수정 완료' : 'Save Changes')
                    : (lang === 'ko' ? '등록하기' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
