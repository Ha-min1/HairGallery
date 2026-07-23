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
  AlertCircle,
  LogIn
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface BoardSectionProps {
  currentUser: any | null;
  onOpenLoginModal: () => void;
  lang?: 'ko' | 'en';
}

const STATIC_ASSET_SAMPLES = [
  { label: '헤더 헤어갤러리 로고 (Logo)', url: '/hair_gallery_logo.png' },
  { label: '헤어 스타일링 예시 1', url: '/image/hair_style_1.jpg' },
  { label: '헤어 스타일링 예시 2', url: '/image/hair_style_2.jpg' }
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
        throw new Error(data.error || '게시글 저장 실패');
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
      const res = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '삭제 실패');
      }

      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }

      fetchPosts();
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  // Filter posts by search
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (post.title || '').toLowerCase().includes(q) ||
      (post.content || '').toLowerCase().includes(q) ||
      (post.author_name || '').toLowerCase().includes(q);
  });

  return (
    <section id="board" className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-6 text-stone-100 animate-fadeIn scroll-mt-24 w-full relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400">
              Community & Style Gallery
            </span>
            <span className="text-[10px] font-mono text-stone-400">Member Exclusive</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 tracking-tight flex items-center gap-2">
            <span>헤어 갤러리 메인 게시판</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-1">
            시술 후기, 최신 트렌드 헤어 스타일링 및 매장 소식을 공유하는 공간입니다.
          </p>
        </div>

        {/* Header Action / Write Button */}
        {currentUser ? (
          <button
            onClick={() => openWriteModal()}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/10 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>새 글 작성하기</span>
          </button>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-bold rounded-xl text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>로그인하여 글 작성</span>
          </button>
        )}
      </div>

      {/* Non-Authenticated Users Lock Banner (Prompt Spec Requirement) */}
      {!currentUser ? (
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-8 text-center space-y-4 my-6 shadow-inner relative z-10">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-stone-200">
              게시판은 로그인 후 이용하실 수 있습니다.
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              로그인하시면 시술 후기와 헤어 스타일링 노하우를 확인하고 자유롭게 게시글을 작성하실 수 있습니다.
            </p>
          </div>
          <button
            onClick={onOpenLoginModal}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10 inline-flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>로그인 하러 가기</span>
          </button>
        </div>
      ) : (
        /* Authenticated Board Interface */
        <div className="space-y-6 relative z-10">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-950/60 p-3 rounded-2xl border border-stone-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-stone-500" />
              <input
                type="text"
                placeholder="게시글 제목, 내용, 작성자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3.5 py-2 text-stone-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="text-[11px] text-stone-400 font-mono px-2">
              총 <span className="text-amber-400 font-bold">{filteredPosts.length}</span>개의 게시글
            </div>
          </div>

          {/* Board Posts Grid / List */}
          {isLoading ? (
            <div className="bg-stone-950/40 border border-stone-800 p-16 rounded-2xl text-center space-y-3">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-stone-400">게시글 목록을 불러오는 중...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-stone-950/40 border border-stone-800 p-16 rounded-2xl text-center space-y-2">
              <FileText className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-xs text-stone-400">등록된 게시글이 없습니다. 첫 게시글을 작성해 보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.map((post) => {
                const isPinned = Boolean(post.is_pinned);
                const isOwner = post.author_id === currentUser.id;

                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`group bg-stone-950/70 border rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl relative overflow-hidden ${
                      isPinned
                        ? 'border-amber-500/40 hover:border-amber-400 bg-amber-500/[0.03]'
                        : 'border-stone-800 hover:border-stone-700 hover:bg-stone-900/80'
                    }`}
                  >
                    {/* Top Row: Pin Badge & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPinned && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                            <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>상단 고정 {post.pin_order ? `(${post.pin_order}순위)` : ''}</span>
                          </span>
                        )}
                        {post.image_url && (
                          <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 text-[10px] font-mono flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-amber-400" />
                            <span>사진</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Content Excerpt & Image Thumbnail */}
                    <div className="space-y-2 flex-1">
                      <h3 className="text-sm font-bold text-stone-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {post.title}
                      </h3>

                      {post.image_url && (
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 my-2">
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <p className="text-xs text-stone-400 leading-relaxed line-clamp-2 font-sans">
                        {post.content}
                      </p>
                    </div>

                    {/* Footer Row: Author & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-stone-850/80 text-[11px] font-mono text-stone-400">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-500/80" />
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
                        <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center font-bold">
                          보기 <ChevronRight className="w-3 h-3" />
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
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-stone-100 flex flex-col max-h-[85vh]">
            <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedPost.is_pinned && (
                  <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg">
                    <Pin className="w-4 h-4 fill-amber-400" />
                  </span>
                )}
                <h3 className="font-bold text-sm text-stone-100 line-clamp-1">{selectedPost.title}</h3>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="flex items-center justify-between text-stone-400 font-mono text-[11px] pb-3 border-b border-stone-800">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  작성자: {selectedPost.author_name || '회원'}
                </span>
                <span>{new Date(selectedPost.created_at).toLocaleString()}</span>
              </div>

              {selectedPost.image_url && (
                <div className="rounded-xl overflow-hidden border border-stone-800 max-h-80 bg-stone-950 flex items-center justify-center">
                  <img src={selectedPost.image_url} alt={selectedPost.title} className="max-h-80 w-auto object-contain" />
                </div>
              )}

              <p className="text-stone-200 text-xs leading-relaxed whitespace-pre-wrap font-sans py-2">
                {selectedPost.content}
              </p>
            </div>

            <div className="bg-stone-950 px-6 py-3 border-t border-stone-800 flex items-center justify-between">
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
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
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
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden text-stone-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>{editingPost ? '게시글 수정' : '새 게시글 작성'}</span>
              </h3>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-300 uppercase font-mono">
                  게시글 제목 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="제목을 입력해 주세요"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-300 uppercase font-mono">
                  게시글 내용 *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="후기나 내용, 안내 사항을 상세히 기술해주세요."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-200 text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* ADMIN ONLY CONTROLS: Image Upload & Pin Options (Prompt Requirement) */}
              {isAdmin ? (
                <div className="bg-stone-950/80 border border-amber-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] font-mono border-b border-stone-800 pb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>관리자 전용 설정 (사진 첨부 및 상단 고정)</span>
                  </div>

                  {/* Image Attachment (Admin Only) */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-stone-300 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>이미지 / 사진 첨부 (Storage 파일 업로드 또는 URL / static asset 경로)</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Supabase Storage URL 또는 static 경로 (예: /image/hair_style_1.jpg)"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                      />

                      <label className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1 shrink-0 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? '업로드 중...' : '파일 선택'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Static Asset Preset Dropdown */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-stone-400 font-mono">기본 스태틱 자산 선택:</span>
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

                  {/* Pin Options (Admin Only) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center gap-2 bg-stone-900 p-2.5 rounded-xl border border-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsPinned}
                        onChange={(e) => setFormIsPinned(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5" />
                        <span>상단 고정 (Pin Post)</span>
                      </span>
                    </label>

                    <div className="space-y-1">
                      <input
                        type="number"
                        placeholder="핀 순서 (pin_order, 낮은 숫자가 우선)"
                        value={formPinOrder}
                        onChange={(e) => setFormPinOrder(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-[11px] text-stone-400 font-mono">
                  💡 사진 첨부 및 상단 고정 기능은 관리자 계정에서만 가능합니다.
                </div>
              )}

              {/* Submit Buttons */}
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
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : editingPost ? '게시글 수정 완료' : '게시글 등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
