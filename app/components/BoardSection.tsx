'use client';

import React, { useState, useEffect } from 'react';
import { 
  Pin, 
  Plus, 
  Search, 
  Image as ImageIcon, 
  Lock, 
  User, 
  Calendar, 
  Clock, 
  X, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Sparkles,
  FileText,
  Upload,
  ChevronRight,
  LogIn,
  SlidersHorizontal
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface BoardSectionProps {
  currentUser: any | null;
  onOpenLoginModal: () => void;
  lang?: 'ko' | 'en';
}

const STATIC_ASSET_SAMPLES = [
  { label: '헤더 헤어갤러리 로고 (Logo)', url: '/hair_gallery_logo.png' },
  { label: '헤어 스타일링 예시 1', url: '/assets/images/hair/hair_01.jpg' },
  { label: '헤어 스타일링 예시 2', url: '/assets/images/hair/hair_02.jpg' },
  { label: '헤어 스타일링 예시 3', url: '/assets/images/hair/hair_03.jpg' },
  { label: '헤어 스타일링 예시 4', url: '/assets/images/hair/hair_04.jpg' }
];

export default function BoardSection({
  currentUser,
  onOpenLoginModal,
  lang = 'ko'
}: BoardSectionProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);

  // Write/Edit Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formPinOrder, setFormPinOrder] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const supabase = getSupabaseClient();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.is_admin === true;

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (err) {
      console.error('Failed to get session token:', err);
      return null;
    }
  };

  const fetchPosts = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('인증 토큰이 필요합니다.');

      const res = await fetch('/api/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '게시글 목록을 불러오지 못했습니다.');
      }

      setPosts(data.posts || []);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setErrorMsg(err.message || '게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    } else {
      setPosts([]);
      setIsLoading(false);
    }
  }, [currentUser]);

  const openWriteModal = (postToEdit?: any) => {
    if (postToEdit) {
      setEditingPost(postToEdit);
      setFormTitle(postToEdit.title || '');
      setFormContent(postToEdit.content || '');
      setFormImageUrl(postToEdit.image_url || '');
      setFormIsPinned(postToEdit.is_pinned || false);
      setFormPinOrder(postToEdit.pin_order !== null && postToEdit.pin_order !== undefined ? String(postToEdit.pin_order) : '');
    } else {
      setEditingPost(null);
      setFormTitle('');
      setFormContent('');
      setFormImageUrl('');
      setFormIsPinned(false);
      setFormPinOrder('');
    }
    setIsWriteModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAdmin) {
      alert('사진 첨부는 관리자만 가능합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const token = await getAuthToken();
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
      if (!res.ok || data.error) {
        throw new Error(data.error || '이미지 업로드 실패');
      }

      setFormImageUrl(data.image_url);
    } catch (err: any) {
      alert(err.message || '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('로그인이 필요합니다.');

      const payload: any = {
        title: formTitle.trim(),
        content: formContent.trim()
      };

      if (editingPost) {
        payload.id = editingPost.id;
      }

      if (isAdmin) {
        payload.image_url = formImageUrl.trim() ? formImageUrl.trim() : null;
        payload.is_pinned = formIsPinned;
        payload.pin_order = formPinOrder.trim() !== '' ? Number(formPinOrder) : null;
      }

      const method = editingPost ? 'PATCH' : 'POST';
      const res = await fetch('/api/posts', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '게시글 저장에 실패했습니다.');
      }

      setIsWriteModalOpen(false);
      fetchPosts();
    } catch (err: any) {
      alert(err.message || '게시글 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('로그인이 필요합니다.');

      const res = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '게시글 삭제에 실패했습니다.');
      }

      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
      fetchPosts();
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (post.title || '').toLowerCase().includes(q) ||
      (post.content || '').toLowerCase().includes(q) ||
      (post.author_name || '').toLowerCase().includes(q);
  });

  return (
    <section 
      id="board" 
      className="bg-stone-900/90 border border-stone-800/80 rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.15)] space-y-8 text-stone-100 animate-fadeIn scroll-mt-24 w-full relative overflow-hidden backdrop-blur-sm"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
    >
      {/* Modern Minimalist Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-800/80 pb-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-stone-800 border border-stone-700/60 text-gold-400">
              Community & Journal
            </span>
            <span className="text-[10px] font-mono text-stone-400 tracking-wider">Clean & Sleek Edition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-white tracking-tight flex items-center gap-2.5">
            <span>헤어 갤러리 저널 & 커뮤니티</span>
            <Sparkles className="w-5 h-5 text-gold-400 stroke-[1.5]" />
          </h2>
          <p className="text-xs text-stone-400 font-sans tracking-wide leading-relaxed max-w-xl">
            고객님들의 스타일 후기와 더 헤어 갤러리의 최신 디자이너 소식, 스타일링 노하우를 담은 정갈한 공간입니다.
          </p>
        </div>

        {/* Action Button */}
        {currentUser ? (
          <button
            onClick={() => openWriteModal()}
            className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer tracking-wide"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>새 저널 작성</span>
          </button>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="px-5 py-2.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer tracking-wide"
          >
            <LogIn className="w-4 h-4 text-gold-400" />
            <span>로그인하여 참관하기</span>
          </button>
        )}
      </div>

      {/* Non-Authenticated Users Lock Banner */}
      {!currentUser ? (
        <div className="bg-stone-950/70 border border-stone-800/80 rounded-2xl p-8 sm:p-10 text-center space-y-4 my-4 shadow-sm relative z-10">
          <div className="w-12 h-12 bg-stone-900 border border-stone-750 text-gold-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-serif font-medium text-stone-200 tracking-tight">
              회원 전용 게시판입니다
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed font-sans tracking-wide">
              로그인 후 시술 후기, 헤어 케어 팁을 감상하거나 본인만의 스타일 경험을 자유롭게 나눠보세요.
            </p>
          </div>
          <button
            onClick={onOpenLoginModal}
            className="px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer tracking-wide"
          >
            <LogIn className="w-4 h-4" />
            <span>간편 소셜 로그인</span>
          </button>
        </div>
      ) : (
        /* Authenticated Board Interface */
        <div className="space-y-6 relative z-10">
          {/* Search & Statistics Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-stone-500" />
              <input
                type="text"
                placeholder="제목, 내용, 작성자로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900/90 border border-stone-800 rounded-xl pl-9 pr-3.5 py-2 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 transition-colors tracking-wide"
              />
            </div>
            <div className="text-[11px] text-stone-400 font-mono px-2 flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold-400" />
              <span>전체 게시물: <strong className="text-gold-400 font-bold">{filteredPosts.length}</strong>개</span>
            </div>
          </div>

          {/* Posts Grid */}
          {isLoading ? (
            <div className="bg-stone-950/50 border border-stone-800/60 p-16 rounded-2xl text-center space-y-3">
              <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-stone-400 tracking-wider">게시글 목록을 정갈하게 불러오는 중...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-stone-950/50 border border-stone-800/60 p-16 rounded-2xl text-center space-y-2">
              <FileText className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-xs text-stone-400 tracking-wide">등록된 게시글이 없습니다. 첫 이야기를 남겨보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredPosts.map((post) => {
                const isPinned = Boolean(post.is_pinned);
                const isOwner = post.author_id === currentUser.id;

                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`group bg-stone-950/80 border rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-lg relative overflow-hidden ${
                      isPinned
                        ? 'border-gold-500/30 bg-stone-950/90 shadow-sm'
                        : 'border-stone-800/80 hover:border-stone-700 hover:bg-stone-900/90'
                    }`}
                  >
                    {/* Top Row: Clean Pinned Chip Badge & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPinned ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[10px] font-mono font-bold flex items-center gap-1.5 tracking-wider">
                            <span>📌 PINNED</span>
                            {post.pin_order && <span className="text-stone-400 font-normal">#{post.pin_order}</span>}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-stone-400 text-[10px] font-mono tracking-wider">
                            JOURNAL
                          </span>
                        )}
                        {post.image_url && (
                          <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300 text-[10px] font-mono flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-gold-400" />
                            <span>사진</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono tracking-wide">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Content Excerpt & Image Thumbnail */}
                    <div className="space-y-2 flex-1">
                      <h3 className="text-sm font-serif font-medium text-white group-hover:text-gold-400 transition-colors line-clamp-1 tracking-tight">
                        {post.title}
                      </h3>

                      {post.image_url && (
                        <div className="w-full h-40 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 my-2">
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <p className="text-xs text-stone-400 leading-relaxed line-clamp-2 font-sans tracking-wide">
                        {post.content}
                      </p>
                    </div>

                    {/* Footer Row: Author & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-stone-800/80 text-[11px] font-mono text-stone-400">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gold-400" />
                        <span>{post.author_name || '회원'}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {(isOwner || isAdmin) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-gold-400 group-hover:translate-x-0.5 transition-transform flex items-center font-bold text-[10px]">
                          상세보기 <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-stone-100 flex flex-col max-h-[85vh]">
            <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedPost.is_pinned && (
                  <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 border border-gold-500/40 rounded text-[10px] font-mono font-bold">
                    📌 PINNED
                  </span>
                )}
                <h3 className="font-serif font-medium text-sm text-white line-clamp-1">{selectedPost.title}</h3>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="flex items-center justify-between text-stone-400 font-mono text-[11px] pb-3 border-b border-stone-800/80">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gold-400" />
                  작성자: {selectedPost.author_name || '회원'}
                </span>
                <span>{new Date(selectedPost.created_at).toLocaleString()}</span>
              </div>

              {selectedPost.image_url && (
                <div className="rounded-xl overflow-hidden border border-stone-800 max-h-80 bg-stone-950 flex items-center justify-center">
                  <img src={selectedPost.image_url} alt={selectedPost.title} className="max-h-80 w-auto object-contain" />
                </div>
              )}

              <p className="text-stone-200 text-xs leading-relaxed whitespace-pre-wrap font-sans tracking-wide py-2">
                {selectedPost.content}
              </p>
            </div>

            <div className="bg-stone-950 px-6 py-3.5 border-t border-stone-800 flex items-center justify-between">
              <div>
                {(selectedPost.author_id === currentUser?.id || isAdmin) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const target = selectedPost;
                        setSelectedPost(null);
                        openWriteModal(target);
                      }}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-mono font-medium flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-gold-400" />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => handleDeletePost(selectedPost.id)}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-rose-950 hover:text-rose-400 text-stone-400 rounded-lg text-xs font-mono font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Write / Edit Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden text-stone-100 flex flex-col max-h-[90vh]">
            <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-serif text-base font-medium text-gold-400 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>{editingPost ? '저널 글 수정' : '새 저널 작성'}</span>
              </h3>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-300 uppercase font-mono tracking-wider">
                  제목 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="제목을 입력해 주세요"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 tracking-wide"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-300 uppercase font-mono tracking-wider">
                  내용 *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="시술 후기, 궁금한 사항, 헤어 스타일 추천 이야기를 상세히 작성해 주세요."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 resize-none tracking-wide leading-relaxed"
                />
              </div>

              {isAdmin ? (
                <div className="bg-stone-950/80 border border-gold-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-gold-400 font-bold text-[11px] font-mono border-b border-stone-800 pb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>관리자 옵션 (사진 첨부 & 상단 고정)</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-stone-300 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-gold-400" />
                      <span>이미지 첨부</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="이미지 경로 (예: /assets/images/hair/hair_01.jpg)"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60 font-mono"
                      />

                      <label className="px-3 py-2 bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1 shrink-0 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? '업로드...' : '파일 선택'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-stone-400 font-mono">샘플 이미지:</span>
                      <select
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="bg-stone-900 border border-stone-800 text-stone-300 rounded-lg px-2 py-1 text-[11px]"
                      >
                        <option value="">직접 입력 / 업로드 선택</option>
                        {STATIC_ASSET_SAMPLES.map(sample => (
                          <option key={sample.url} value={sample.url}>{sample.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center gap-2 bg-stone-900 p-2.5 rounded-xl border border-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsPinned}
                        onChange={(e) => setFormIsPinned(e.target.checked)}
                        className="w-4 h-4 accent-gold-500 rounded"
                      />
                      <span className="text-xs font-bold text-gold-300 flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5" />
                        <span>PINNED (상단 고정)</span>
                      </span>
                    </label>

                    <div className="space-y-1">
                      <input
                        type="number"
                        placeholder="고정 순서 (pin_order)"
                        value={formPinOrder}
                        onChange={(e) => setFormPinOrder(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none focus:border-gold-500/60"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-stone-950 border border-stone-800/80 rounded-xl text-[11px] text-stone-400 font-mono">
                  💡 사진 첨부 및 상단 고정은 관리자 전용 기능입니다.
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-800 text-stone-400 hover:bg-stone-800 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-stone-950 font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : editingPost ? '수정 완료' : '게시글 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
