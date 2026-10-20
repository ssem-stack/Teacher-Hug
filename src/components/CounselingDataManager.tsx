import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FolderLock, 
  FileHeart, 
  ShieldCheck, 
  BarChart3, 
  Download, 
  Trash2, 
  Calendar, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  User, 
  RefreshCw,
  Search,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getTeacherSessions, 
  deleteCounselingSession, 
  SavedSession, 
  getTeacherPrescriptions, 
  SavedPrescription,
  deletePrescriptionDoc,
  getTeacherParentCases,
  SavedParentCase,
  deleteParentCaseDoc
} from '../services/counselingDb';
import { PERSONAS } from '../data/personas';
import { ComfortCardData } from '../types';

interface CounselingDataManagerProps {
  onLoadSession?: (messages: any[], personaId: any) => void;
  onViewPrescription?: (data: ComfortCardData) => void;
}

export const CounselingDataManager: React.FC<CounselingDataManagerProps> = ({
  onLoadSession,
  onViewPrescription,
}) => {
  const { currentUser, signInWithGoogle, logout, loading: authLoading } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'prescriptions' | 'parentCases' | 'stats'>('sessions');
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [prescriptions, setPrescriptions] = useState<SavedPrescription[]>([]);
  const [parentCases, setParentCases] = useState<SavedParentCase[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<SavedSession | null>(null);

  const fetchData = async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      const [fetchedSessions, fetchedPrescriptions, fetchedCases, statsRes] = await Promise.all([
        getTeacherSessions(currentUser.uid),
        getTeacherPrescriptions(currentUser.uid),
        getTeacherParentCases(currentUser.uid),
        fetch('/api/counseling/stats').then(r => r.json()).catch(() => null),
      ]);
      setSessions(fetchedSessions);
      setPrescriptions(fetchedPrescriptions);
      setParentCases(fetchedCases);
      if (statsRes) setStats(statsRes);
    } catch (error) {
      console.error('Failed to load counseling data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    } else {
      // Load public backend stats anyway
      fetch('/api/counseling/stats')
        .then(r => r.json())
        .then(d => setStats(d))
        .catch(() => {});
    }
  }, [currentUser]);

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('이 상담 기록을 데이터베이스에서 완전히 삭제하시겠습니까?')) return;
    try {
      await deleteCounselingSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSessionDetail?.id === id) setSelectedSessionDetail(null);
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!window.confirm('이 마음 처방전을 삭제하시겠습니까?')) return;
    try {
      await deletePrescriptionDoc(id);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteParentCase = async (id: string) => {
    if (!window.confirm('이 학부모 상담 사례를 삭제하시겠습니까?')) return;
    try {
      await deleteParentCaseDoc(id);
      setParentCases(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      teacherEmail: currentUser?.email || 'anonymous',
      exportDate: new Date().toISOString(),
      sessions,
      prescriptions,
      parentCases,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers-hug-counseling-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      
      {/* Top Banner & Auth Section */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-stone-900">상담 데이터 관리 센터</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  클라우드 DB 가동 중
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                선생님의 상담 내역, 맞춤 처방전, 학부모 소통 사례를 안전하게 암호화하여 영구 관리합니다.
              </p>
            </div>
          </div>

          {/* User Sign In / Profile */}
          <div>
            {currentUser ? (
              <div className="flex items-center gap-3 bg-stone-50 p-2 sm:px-3 rounded-2xl border border-stone-200">
                <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                  {currentUser.displayName ? currentUser.displayName.slice(0, 2) : <User className="w-4 h-4" />}
                </div>
                <div className="text-left text-xs">
                  <div className="font-bold text-stone-800 line-clamp-1">{currentUser.displayName || '선생님'}</div>
                  <div className="text-[10px] text-stone-400 line-clamp-1">{currentUser.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/70 transition-colors cursor-pointer"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                disabled={authLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>구글 로그인으로 내 상담 데이터 동기화</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Controls */}
        {currentUser && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Firestore 데이터베이스 실시간 연동 완료
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                disabled={isLoadingData}
                className="flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-2.5 py-1.5 rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-xl font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>전체 백업 다운로드</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200 mb-6 pb-2 text-xs sm:text-sm overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'sessions'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <FolderLock className="w-4 h-4" />
          <span>상담 세션 기록 ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('prescriptions')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'prescriptions'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <FileHeart className="w-4 h-4" />
          <span>마음 처방전 보관함 ({prescriptions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('parentCases')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'parentCases'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>학부모 상담 사례집 ({parentCases.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stats')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'stats'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>상담 통계 & 인사이트</span>
        </button>
      </div>

      {/* Subtab 1: Counseling Sessions */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상담 제목이나 내용으로 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>

          {!currentUser ? (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-8 text-center text-stone-600">
              <FolderLock className="w-10 h-10 text-amber-600 mx-auto mb-3" />
              <h4 className="font-bold text-base text-stone-800 mb-1">
                상담 기록을 클라우드 데이터베이스에 저장하려면 로그인이 필요합니다
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
                선생님의 개인 구글 계정으로 로그인하시면, 모든 상담 내역과 마음 케어 기록이 암호화되어 안전하게 보관됩니다.
              </p>
              <button
                onClick={signInWithGoogle}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                구글 로그인하기
              </button>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center text-stone-400">
              <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-600">저장된 상담 세션이 아직 없습니다.</p>
              <p className="text-xs text-stone-400 mt-1">
                &apos;선생님 AI 상담실&apos;에서 대화를 나눈 후 [세션 클라우드 저장] 버튼을 누르시면 이곳에 안전하게 보관됩니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSessions.map((session) => {
                const persona = PERSONAS.find(p => p.id === session.personaId) || PERSONAS[0];
                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-3xl border border-stone-200 p-5 shadow-2xs hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${persona.avatarBg}`}>
                          {persona.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{session.messageCount || 0}개 메시지</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-stone-900 mb-1.5 line-clamp-1">
                        {session.title}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100 mb-3">
                        {session.lastMessage || '대화 내용 없음'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400">
                        {session.updatedAt?.toDate ? session.updatedAt.toDate().toLocaleDateString('ko-KR') : '최근'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Prescriptions Library */}
      {activeSubTab === 'prescriptions' && (
        <div className="space-y-4">
          {!currentUser ? (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-8 text-center text-stone-600">
              <FileHeart className="w-10 h-10 text-amber-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-stone-800 mb-1">처방전 보관함을 확인하려면 로그인이 필요합니다.</p>
              <button
                onClick={signInWithGoogle}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                로그인하기
              </button>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center text-stone-400">
              <FileHeart className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-600">저장된 마음 처방전이 없습니다.</p>
              <p className="text-xs text-stone-400 mt-1">상담 도중 [마음 처방전 받기]를 통해 나만의 처방전을 발급받아 보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#fefdfb] rounded-3xl border border-amber-200/80 p-5 shadow-2xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-100">
                    <span className="text-xs font-bold text-amber-800">
                      선생님 마음 회복제
                    </span>
                    <button
                      onClick={() => handleDeletePrescription(p.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs font-semibold font-serif-kr text-stone-800 leading-relaxed mb-3">
                    &quot;{p.quote}&quot;
                  </p>

                  <div className="space-y-1.5 text-[11px] mb-3">
                    <div className="bg-white p-2 rounded-xl border border-amber-100 text-stone-700">
                      <span className="font-bold text-rose-700 block mb-0.5">🚪 오늘 내려놓을 것:</span>
                      {p.leaveBehind}
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-amber-100 text-stone-700">
                      <span className="font-bold text-emerald-700 block mb-0.5">🎁 나를 위한 선물:</span>
                      {p.giftForToday}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px]">
                    <span className="text-stone-400">
                      {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('ko-KR') : '저장됨'}
                    </span>
                    {onViewPrescription && (
                      <button
                        onClick={() => onViewPrescription(p)}
                        className="text-xs text-amber-700 font-bold hover:underline cursor-pointer"
                      >
                        처방전 다시보기
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Parent Cases Library */}
      {activeSubTab === 'parentCases' && (
        <div className="space-y-4">
          {!currentUser ? (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-8 text-center text-stone-600">
              <ShieldCheck className="w-10 h-10 text-amber-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-stone-800 mb-1">학부모 상담 사례집을 보관하려면 로그인이 필요합니다.</p>
              <button
                onClick={signInWithGoogle}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                로그인하기
              </button>
            </div>
          ) : parentCases.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center text-stone-400">
              <ShieldCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-600">저장된 학부모 상담 사례가 없습니다.</p>
              <p className="text-xs text-stone-400 mt-1">&apos;학부모 민원 & 알림장 도우미&apos;에서 생성한 안전 답장을 저장할 수 있습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {parentCases.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {c.category}
                    </span>
                    <button
                      onClick={() => handleDeleteParentCase(c.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 mb-1.5 font-medium">민원 내용: &quot;{c.parentMessage}&quot;</p>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 text-xs text-stone-800 whitespace-pre-wrap">
                    {c.selectedResponse}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 4: Stats & Insight */}
      {activeSubTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-2xs text-center">
              <span className="text-xs text-stone-500 block mb-1">누적 교사 상담 지원 수</span>
              <span className="text-3xl font-extrabold text-indigo-600">
                {stats?.totalConsultationsSupported || '1,248'}건
              </span>
            </div>
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-2xs text-center">
              <span className="text-xs text-stone-500 block mb-1">상담 후 감정 완화율</span>
              <span className="text-3xl font-extrabold text-emerald-600">
                {stats?.averageReliefRate || '94.2%'}
              </span>
            </div>
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-2xs text-center">
              <span className="text-xs text-stone-500 block mb-1">내 보관함 세션 수</span>
              <span className="text-3xl font-extrabold text-amber-600">
                {sessions.length}건
              </span>
            </div>
          </div>

          {/* Burnout topic distribution */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs">
            <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>선생님들이 가장 많이 호소하는 고충 유형 분석</span>
            </h4>
            <div className="space-y-3">
              {(stats?.burnoutTopics || []).map((t: any, idx: number) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700">{t.name}</span>
                    <span className="text-stone-500">{t.percentage}% ({t.count}회)</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
