import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Send, 
  Copy, 
  Check, 
  PhoneCall, 
  Lightbulb, 
  Sparkles, 
  AlertTriangle,
  HelpCircle,
  FileText,
  BookmarkCheck,
  Save
} from 'lucide-react';
import { ParentResponseResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveParentCaseDoc } from '../services/counselingDb';

export const ParentShield: React.FC = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [parentMessage, setParentMessage] = useState<string>('');
  const [situationContext, setSituationContext] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('학생 간 다툼/교우관계');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ParentResponseResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [savedCaseIdx, setSavedCaseIdx] = useState<number | null>(null);

  const handleSaveCase = async (responseOptionMessage: string, index: number) => {
    if (!currentUser) {
      if (window.confirm('학부모 상담 사례를 보관하려면 로그인이 필요합니다. 구글 로그인을 진행할까요?')) {
        await signInWithGoogle();
      }
      return;
    }

    try {
      const caseId = `case-${Date.now()}`;
      await saveParentCaseDoc(
        caseId,
        currentUser.uid,
        selectedTag,
        parentMessage || '(상황 맥락 참조)',
        situationContext || '',
        result?.summary || '',
        responseOptionMessage
      );
      setSavedCaseIdx(index);
      setTimeout(() => setSavedCaseIdx(null), 2500);
    } catch (err) {
      console.error('Save case error:', err);
      alert('사례 저장 중 오류가 발생했습니다.');
    }
  };

  const situationTags = [
    '학생 간 다툼/교우관계',
    '퇴근 후 / 밤늦은 연락',
    '정당한 생활지도에 대한 반발',
    '자리 배치 및 모둠 불만',
    '학습/성적/평가 이의제기',
    '감정적 비난 및 무리한 요구'
  ];

  const handleGenerate = async () => {
    if (!parentMessage.trim() && !situationContext.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/parent-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentMessage,
          situationContext: `[카테고리: ${selectedTag}] ${situationContext}`,
          tonePreference: '교권 보호와 정중한 품격 유지',
        }),
      });

      if (!response.ok) {
        throw new Error('응답 생성 실패');
      }

      const data: ParentResponseResult = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Parent shield error:', error);
      alert('답변을 생성하는 도중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyPhone = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-semibold mb-3 border border-indigo-200">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
          <span>교권 보호 & 소통 안심 가이드</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
          학부모 민원 & 알림장 안전 답장 도우미
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
          손이 떨리고 심장이 내려앉는 학부모 메시지 앞에서 홀로 자책하지 마세요.<br className="hidden sm:inline" />
          교사의 존엄과 교육활동을 지키면서도, 품위 있고 명확하게 선을 긋는 답변을 다듬어드립니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Form (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-stone-200 p-5 sm:p-6 h-fit">
          <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>상황 및 메시지 입력</span>
          </h3>

          {/* Quick situation selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-stone-600 mb-2">
              상황 유형 선택:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {situationTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Parent Message Input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              받으신 학부모 메시지 / 문의 내용:
            </label>
            <textarea
              value={parentMessage}
              onChange={(e) => setParentMessage(e.target.value)}
              placeholder="예: '선생님, 우리 아이가 오늘 학교에서 친구한테 맞고 왔다는데 왜 담임선생님은 아무 연락도 안 주시나요? 확인하고 바로 전화 주세요.'"
              rows={4}
              className="w-full p-3 rounded-2xl border border-stone-300 text-xs sm:text-sm leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-stone-400"
            />
          </div>

          {/* Context Input */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              실제 상황 맥락 / 담임 선생님의 사실관계:
            </label>
            <textarea
              value={situationContext}
              onChange={(e) => setSituationContext(e.target.value)}
              placeholder="예: 점심시간에 둘이 장난치다 부딪힌 일이며 보건실 치료 완료 후 서로 사과하고 귀가함. 담임이 하교 직후 다른 업무 중이었음."
              rows={3}
              className="w-full p-3 rounded-2xl border border-stone-300 text-xs sm:text-sm leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-stone-400"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || (!parentMessage.trim() && !situationContext.trim())}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-indigo-200" />
                <span>안전한 답변 조합 중...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>안전 답장 3가지 버전 생성</span>
              </>
            )}
          </button>
        </div>

        {/* Results Area (7 cols on lg) */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Situation Summary & Teacher Protection Alert */}
              <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 mb-1">
                      상황 핵심 진단
                    </h4>
                    <p className="text-xs text-indigo-900 leading-relaxed">
                      {result.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Response Cards */}
              <div className="space-y-3">
                {result.options.map((option, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-stone-900">
                          {option.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSaveCase(option.message, idx)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer border ${
                            savedCaseIdx === idx
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium'
                              : 'bg-white text-stone-600 hover:bg-stone-100 border-stone-200'
                          }`}
                          title="상담 사례집에 보관"
                        >
                          {savedCaseIdx === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>저장됨</span>
                            </>
                          ) : (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>사례 저장</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(option.message, idx)}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          title="메시지 복사"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-medium">복사됨</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>복사하기</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-500 mb-2">
                      {option.desc}
                    </p>

                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70 text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                      {option.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Telephone Script */}
              {result.phoneScript && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200/80 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                      <PhoneCall className="w-4 h-4 text-amber-700" />
                      <span>전화 통화 필요 시 안심 오프닝 멘트</span>
                    </div>
                    <button
                      onClick={() => handleCopyPhone(result.phoneScript)}
                      className="text-xs text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPhone ? '복사됨' : '복사'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-amber-900 bg-white/80 p-3 rounded-xl border border-amber-200/50 leading-relaxed">
                    &quot;{result.phoneScript}&quot;
                  </p>
                </div>
              )}

              {/* Teacher Heart Advice */}
              {result.teacherAdvice && (
                <div className="bg-stone-100 rounded-2xl p-4 text-xs text-stone-700">
                  <span className="font-bold block mb-1 text-stone-800">선생님 마음 보호 팁:</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{result.teacherAdvice}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 p-8 text-center text-stone-400">
              <ShieldCheck className="w-12 h-12 text-stone-300 mb-3" />
              <p className="text-sm font-medium text-stone-600 mb-1">
                작성하신 메시지에 맞춰 안전한 답변 3가지가 생성됩니다.
              </p>
              <p className="text-xs text-stone-400 max-w-sm">
                교권 침해 소지를 사전에 예방하고, 감정적인 마찰 없이 공식 절차로 안내할 수 있도록 지원합니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
