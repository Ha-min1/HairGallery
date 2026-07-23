'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Search, 
  Trash2, 
  RefreshCw, 
  Monitor, 
  User, 
  Layout, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
  ShieldAlert,
  Store,
  Cpu
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface AdminInquiryViewerProps {
  lang?: 'ko' | 'en';
  token?: string;
}

export default function AdminInquiryViewer({ lang = 'ko', token }: AdminInquiryViewerProps) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reply state
  const [replyTextMap, setReplyTextMap] = useState<{ [key: string]: string }>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getAuthToken = async (): Promise<string | null> => {
    if (token) return token;
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (err) {
      console.error('Failed to get session token:', err);
      return null;
    }
  };

  const fetchInquiries = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const authToken = await getAuthToken();
      const headers: any = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/admin/inquiries', { headers });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || '문의 목록을 불러오지 못했습니다.');
      }

      setInquiries(data.inquiries || []);
    } catch (err: any) {
      console.error('Error fetching inquiries:', err);
      setErrorMsg(err.message || '문의 데이터를 불러올 수 없습니다. 관리자 권한을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [token]);

  const handleUpdateStatus = async (id: string, newStatus: string, replyText?: string) => {
    setUpdatingId(id);
    try {
      const authToken = await getAuthToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const body: any = { id, status: newStatus };
      if (replyText !== undefined) {
        body.reply_content = replyText;
        body.admin_reply = replyText;
      }

      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '상태 변경 실패');
      }

      // Update local state
      setInquiries(prev => prev.map(item => {
        if (item.id === id) {
          const finalReply = replyText !== undefined ? replyText : (item.reply_content || item.admin_reply);
          return {
            ...item,
            status: newStatus,
            reply_content: finalReply,
            admin_reply: finalReply,
            replied_at: finalReply ? new Date().toISOString() : item.replied_at
          };
        }
        return item;
      }));
    } catch (err: any) {
      alert(err.message || '상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ko' ? '정말 이 문의 내역을 삭제하시겠습니까?' : 'Are you sure you want to delete this inquiry?')) {
      return;
    }

    try {
      const authToken = await getAuthToken();
      const headers: any = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/admin/inquiries?id=${id}`, {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '삭제 실패');
      }

      setInquiries(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredInquiries = inquiries.filter(item => {
    // Status filter
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'pending' && item.status !== 'pending' && item.status !== 'OPEN') return false;
      if (filterStatus === 'replied' && item.status !== 'replied' && item.status !== 'RESOLVED') return false;
    }
    // Category filter
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComp = (item.target_component || '').toLowerCase().includes(q);
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchContent = (item.content || '').toLowerCase().includes(q);
      const matchUser = (item.user_email || item.user_name || '').toLowerCase().includes(q);
      return matchComp || matchTitle || matchContent || matchUser;
    }
    return true;
  });

  const totalCount = inquiries.length;
  const pendingCount = inquiries.filter(i => i.status === 'pending' || i.status === 'OPEN').length;
  const repliedCount = inquiries.filter(i => i.status === 'replied' || i.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-stone-400 font-medium">{lang === 'ko' ? '전체 문의 건수' : 'Total Inquiries'}</p>
            <h3 className="text-2xl font-bold text-stone-100 mt-1">{totalCount}</h3>
          </div>
          <div className="p-3 bg-stone-800/60 text-stone-300 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-stone-900 border border-amber-900/30 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-amber-400/90 font-medium">{lang === 'ko' ? '답변 대기 중' : 'Pending'}</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-stone-900 border border-emerald-900/30 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-emerald-400/90 font-medium">{lang === 'ko' ? '답변 완료' : 'Replied'}</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{repliedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Toolbar & Filters */}
      <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
            <input
              type="text"
              placeholder={lang === 'ko' ? '컴포넌트/영역, 제목, 작성자 검색...' : 'Search inquiries...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3.5 py-2 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filter dropdowns & Refresh button */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-300 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">{lang === 'ko' ? '모든 답변 상태' : 'All Status'}</option>
              <option value="pending">{lang === 'ko' ? '🟡 답변 대기 (pending)' : 'Pending'}</option>
              <option value="replied">{lang === 'ko' ? '🟢 답변 완료 (replied)' : 'Replied'}</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-300 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">{lang === 'ko' ? '모든 카테고리' : 'All Categories'}</option>
              <option value="store">🏪 매장/시술 문의</option>
              <option value="component">🧩 부품/기술 문의</option>
              <option value="bug">🐞 버그/오류</option>
              <option value="other">📌 기타</option>
            </select>

            <button
              onClick={fetchInquiries}
              disabled={isLoading}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Inquiry List Table */}
      {errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto" />
          <p className="font-semibold text-sm">{errorMsg}</p>
        </div>
      ) : isLoading ? (
        <div className="bg-stone-900 border border-stone-800 p-12 rounded-2xl text-center text-stone-400 font-mono text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
          {lang === 'ko' ? '문의 목록을 불러오는 중...' : 'Loading inquiries...'}
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 p-12 rounded-2xl text-center text-stone-400 font-mono text-xs">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-stone-600" />
          {lang === 'ko' ? '조회된 문의 내역이 없습니다.' : 'No inquiries found.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInquiries.map((item) => {
            const isExpanded = expandedId === item.id;
            const debugObj = item.debug_info || {};
            const isReplied = item.status === 'replied' || item.status === 'RESOLVED';
            const currentReply = item.reply_content || item.admin_reply || '';

            return (
              <div
                key={item.id}
                className={`bg-stone-900 border transition-all rounded-2xl overflow-hidden ${
                  !isReplied
                    ? 'border-amber-900/40 hover:border-amber-700/60'
                    : 'border-stone-800/80 hover:border-stone-700'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {/* Category Badge */}
                      <span className="px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700 text-amber-300 font-mono font-bold flex items-center gap-1">
                        {item.category === 'store' ? <Store className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                        {item.category === 'store' ? '매장 문의' : item.category === 'component' ? '부품/기술' : item.category === 'bug' ? '버그/오류' : '기타'}
                      </span>

                      {/* Target Component Tag */}
                      <span className="px-2.5 py-1 rounded-lg bg-stone-800/60 border border-stone-700/60 text-stone-300 font-mono flex items-center gap-1">
                        <Layout className="w-3.5 h-3.5 text-stone-400" />
                        {item.target_component}
                      </span>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-lg font-mono font-bold ${
                        !isReplied
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {!isReplied ? '🟡 답변 대기중' : '🟢 답변 완료'}
                      </span>

                      {/* User ID / Role Tag */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-400">
                        {item.user_id ? '로그인 회원' : '비회원 (Guest)'}
                      </span>
                    </div>

                    <h4 className="text-stone-100 font-bold text-sm pt-1">
                      {item.title}
                    </h4>

                    <p className="text-stone-300 text-xs leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>

                    {/* Admin Reply Snippet Preview */}
                    {currentReply && (
                      <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
                        <span className="font-bold text-emerald-400 font-mono block mb-0.5">💬 관리자 답변:</span>
                        <p className="text-stone-200">{currentReply}</p>
                      </div>
                    )}

                    <div className="text-[11px] text-stone-400 font-mono pt-1 flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        {item.user_name || '익명'} {item.user_email ? `(${item.user_email})` : ''}
                      </span>
                      <span>• {new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-stone-800">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Monitor className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'ko' ? '답변 작성 & 디버깅' : 'Reply & Debug'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-xl bg-stone-800 hover:bg-red-950 hover:text-red-400 text-stone-400 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Debug Logs & Admin Reply Section */}
                {isExpanded && (
                  <div className="bg-stone-950 border-t border-stone-800 p-5 space-y-4 text-xs font-mono">
                    {/* Status Toggle & Admin Reply Form */}
                    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-stone-200 font-bold text-xs font-serif">
                          {lang === 'ko' ? '관리자 답변 작성 및 상태 설정' : 'Admin Reply & Status'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={updatingId === item.id}
                            onClick={() => handleUpdateStatus(item.id, 'pending')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              !isReplied ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            답변대기 (pending)
                          </button>
                          <button
                            disabled={updatingId === item.id}
                            onClick={() => {
                              const reply = replyTextMap[item.id] !== undefined ? replyTextMap[item.id] : currentReply;
                              handleUpdateStatus(item.id, 'replied', reply);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              isReplied ? 'bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            답변완료 (replied)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={3}
                          placeholder={lang === 'ko' ? '고객에게 전달할 답변 또는 조치 사항을 작성해주세요. (로그인 유저는 마이페이지에서 확인 가능)' : 'Enter reply content for user...'}
                          defaultValue={currentReply}
                          onChange={(e) => setReplyTextMap({ ...replyTextMap, [item.id]: e.target.value })}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-200 text-xs focus:outline-none focus:border-amber-500 resize-none font-sans"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-stone-500">
                            {item.replied_at ? `마지막 답변 시각: ${new Date(item.replied_at).toLocaleString()}` : '아직 답변이 작성되지 않았습니다.'}
                          </span>
                          <button
                            disabled={updatingId === item.id}
                            onClick={() => {
                              const reply = replyTextMap[item.id] !== undefined ? replyTextMap[item.id] : currentReply;
                              handleUpdateStatus(item.id, 'replied', reply);
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{lang === 'ko' ? '답변 작성 완료 & 저장' : 'Save Reply'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Debug metadata panel */}
                    <div className="bg-black/60 border border-stone-800/80 rounded-xl p-4 space-y-2 text-stone-300">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-amber-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Monitor className="w-4 h-4" />
                          환경 디버깅 데이터 (Environment Context)
                        </span>
                        <span className="text-[10px] text-stone-500">ID: {item.id}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-stone-400 pt-1">
                        <div>
                          <span className="text-stone-200 font-semibold">Page URL:</span>{' '}
                          <a href={debugObj.current_url || '#'} target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">
                            {debugObj.current_url || 'N/A'} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div>
                          <span className="text-stone-200 font-semibold">Screen:</span> {debugObj.screen_resolution || 'N/A'}
                        </div>
                        <div>
                          <span className="text-stone-200 font-semibold">Platform:</span> {debugObj.platform || 'N/A'}
                        </div>
                        <div>
                          <span className="text-stone-200 font-semibold">Language:</span> {debugObj.language || 'N/A'}
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-stone-200 font-semibold">User Agent:</span> {debugObj.user_agent || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
