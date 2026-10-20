import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  RotateCcw, 
  Heart, 
  Copy, 
  Check, 
  FileHeart, 
  HelpCircle,
  Lightbulb,
  Shield,
  Smile,
  Volume2,
  CloudUpload,
  CheckCircle2
} from 'lucide-react';
import { PersonaId, Persona, ChatMessage, ComfortCardData } from '../types';
import { PERSONAS } from '../data/personas';
import { soundManager } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { saveCounselingSession, savePrescriptionDoc } from '../services/counselingDb';

interface CounselingChatProps {
  onOpenPrescription: (cardData: ComfortCardData) => void;
}

export const CounselingChat: React.FC<CounselingChatProps> = ({ onOpenPrescription }) => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [selectedPersonaId, setSelectedPersonaId] = useState<PersonaId>('mentor');
  const [isSavingToCloud, setIsSavingToCloud] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [currentSessionId] = useState<string>(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('teachers_hug_chat');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    const currentP = PERSONAS.find(p => p.id === 'mentor')!;
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: currentP.welcomeMessage,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        personaId: 'mentor',
      },
    ];
  });

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPrescriptionLoading, setIsPrescriptionLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentPersona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('teachers_hug_chat', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle changing persona
  const handleSelectPersona = (id: PersonaId) => {
    if (id === selectedPersonaId) return;
    setSelectedPersonaId(id);
    const newPersona = PERSONAS.find(p => p.id === id)!;
    
    // Add a welcome prompt from the new persona
    const welcomeMsg: ChatMessage = {
      id: `change-${Date.now()}`,
      role: 'assistant',
      content: newPersona.welcomeMessage,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      personaId: id,
    };
    setMessages(prev => [...prev, welcomeMsg]);
  };

  // Reset conversation
  const handleResetChat = () => {
    if (window.confirm('대화 내용을 모두 정리하고 새로운 상담을 시작하시겠습니까?')) {
      const p = PERSONAS.find(item => item.id === selectedPersonaId)!;
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: p.welcomeMessage,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          personaId: selectedPersonaId,
        },
      ]);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Prepare assistant placeholder for streaming
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      personaId: selectedPersonaId,
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Use streaming SSE endpoint
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: selectedPersonaId,
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        // Fallback to standard chat endpoint if stream not available
        throw new Error('Streaming failed, fallback to standard');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                accumulatedText += data.text;
                setMessages(prev =>
                  prev.map(m => (m.id === assistantId ? { ...m, content: accumulatedText } : m))
                );
              }
            } catch (e) {
              // ignore parse errors on partial chunks
            }
          }
        }
      }

      if (!accumulatedText) {
        // In case stream ended empty, retry via standard endpoint
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            persona: selectedPersonaId,
            messages: newMessages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });
        const fallbackData = await fallbackRes.json();
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: fallbackData.reply || '선생님, 따뜻한 마음으로 함께하고 있습니다.' }
              : m
          )
        );
      }
    } catch (err: any) {
      console.warn('Chat error, trying standard POST:', err);
      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            persona: selectedPersonaId,
            messages: newMessages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });
        const fallbackData = await fallbackRes.json();
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  content: fallbackData.reply || '선생님, 오늘 하루 너무 고생 많으셨습니다. 차분하게 이야기 나눠요.',
                }
              : m
          )
        );
      } catch (finalError) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    '선생님, 일시적으로 연결에 차질이 생겼습니다. 잠시 숨을 고르신 후 다시 말씀해주시겠어요? 죄송합니다.',
                }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // Generate Prescription Card from conversation
  const handleGeneratePrescription = async (contextContent?: string) => {
    setIsPrescriptionLoading(true);
    soundManager.playSingingBowl();

    try {
      const recentChat = messages
        .slice(-4)
        .map(m => `${m.role === 'user' ? '선생님' : '상담사'}: ${m.content}`)
        .join('\n');

      const response = await fetch('/api/comfort-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeling: '교직 스트레스 및 피로',
          concernType: currentPersona.name,
          note: contextContent || recentChat || '하루 종일 지치고 마음이 무겁습니다.',
        }),
      });

      const cardData = await response.json();
      onOpenPrescription(cardData);

      // Auto-save to cloud if user is signed in
      if (currentUser) {
        try {
          const prescId = `presc-${Date.now()}`;
          await savePrescriptionDoc(prescId, currentUser.uid, cardData);
        } catch (dbErr) {
          console.warn('Prescription auto-save failed:', dbErr);
        }
      }
    } catch (error) {
      console.error('Prescription generation failed:', error);
      alert('처방전을 만드는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsPrescriptionLoading(false);
    }
  };

  // Save current conversation session to Cloud Firestore
  const handleSaveSessionToCloud = async () => {
    if (!currentUser) {
      if (window.confirm('상담 세션을 클라우드 데이터베이스에 보관하려면 로그인이 필요합니다. 구글 로그인을 진행할까요?')) {
        await signInWithGoogle();
      }
      return;
    }

    if (messages.length <= 1) {
      alert('상담 대화 내용이 없습니다. 대화를 나눈 후 저장해 주세요.');
      return;
    }

    setIsSavingToCloud(true);
    try {
      const firstUserMsg = messages.find(m => m.role === 'user')?.content || '선생님 상담 세션';
      const title = firstUserMsg.slice(0, 35) + (firstUserMsg.length > 35 ? '...' : '');

      await saveCounselingSession(
        currentSessionId,
        currentUser.uid,
        currentUser.email || '',
        selectedPersonaId,
        title,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Session save error:', error);
      alert('세션 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // Copy message
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Like / Heart message
  const handleToggleLike = (id: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, liked: !m.liked } : m))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      
      {/* Persona Selection Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-800 flex items-center gap-2">
              <span>상담 멘토 선택</span>
              <span className="text-xs font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                지금 선생님 마음에 가장 필요한 위로를 골라보세요
              </span>
            </h2>
          </div>
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="새 대화 시작하기"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">새로 대화하기</span>
          </button>
        </div>

        {/* 4 Persona Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {PERSONAS.map(p => {
            const isSelected = p.id === selectedPersonaId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPersona(p.id)}
                className={`text-left p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                    : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${p.avatarBg}`}>
                    {p.name.slice(0, 2)}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                    {p.name}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-amber-700 mb-1 line-clamp-1">
                  {p.role}
                </div>
                <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                  {p.shortDesc}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 overflow-hidden flex flex-col h-[650px] sm:h-[700px]">
        
        {/* Active Persona Banner */}
        <div className="px-4 py-3 bg-gradient-to-r from-amber-50/80 via-amber-100/40 to-stone-50 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs ${currentPersona.avatarBg}`}>
              {currentPersona.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-stone-800">{currentPersona.name}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 font-medium">
                  {currentPersona.badge}
                </span>
              </div>
              <span className="text-xs text-stone-500">{currentPersona.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cloud Session Save */}
            <button
              onClick={handleSaveSessionToCloud}
              disabled={isSavingToCloud}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200'
              }`}
              title="현재 상담 내용을 클라우드 DB에 안전하게 보관"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>저장 완료</span>
                </>
              ) : (
                <>
                  <CloudUpload className={`w-3.5 h-3.5 ${isSavingToCloud ? 'animate-bounce text-indigo-600' : 'text-stone-500'}`} />
                  <span className="hidden sm:inline">{isSavingToCloud ? '저장 중...' : '세션 DB 저장'}</span>
                </>
              )}
            </button>

            {/* Quick Prescription trigger */}
            <button
              onClick={() => handleGeneratePrescription()}
              disabled={isPrescriptionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl text-xs font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <FileHeart className="w-3.5 h-3.5 text-amber-200" />
              <span>{isPrescriptionLoading ? '처방전 조제 중...' : '마음 처방전 받기'}</span>
            </button>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/30">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const msgPersona = PERSONAS.find(p => p.id === message.personaId) || currentPersona;

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${msgPersona.avatarBg}`}>
                    {msgPersona.name.slice(0, 2)}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  
                  {/* Sender Name */}
                  <span className="text-[11px] text-stone-400 mb-1 px-1">
                    {isUser ? '선생님' : msgPersona.name}
                  </span>

                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-amber-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-stone-800 border border-stone-200/90 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {message.content ? (
                      message.content
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-stone-400 italic">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                        <span>선생님의 마음에 귀 기울이고 있습니다...</span>
                      </span>
                    )}
                  </div>

                  {/* Message Footnotes & Actions */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-stone-400">
                    <span>{message.timestamp}</span>

                    {!isUser && message.content && (
                      <div className="flex items-center gap-1 ml-2">
                        {/* Copy */}
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="p-1 hover:text-stone-700 rounded-md transition-colors cursor-pointer"
                          title="답변 복사"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Heart */}
                        <button
                          onClick={() => handleToggleLike(message.id)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            message.liked ? 'text-rose-500 font-bold' : 'hover:text-rose-400'
                          }`}
                          title="위로 받았어요"
                        >
                          <Heart className={`w-3.5 h-3.5 ${message.liked ? 'fill-rose-500' : ''}`} />
                        </button>

                        {/* Care Card for this response */}
                        <button
                          onClick={() => handleGeneratePrescription(message.content)}
                          className="p-1 hover:text-amber-700 rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
                          title="이 답변으로 처방전 만들기"
                        >
                          <FileHeart className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[10px] hidden sm:inline text-amber-700">처방전</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-stone-200 text-stone-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-3 sm:px-4 py-2 bg-stone-100/80 border-t border-stone-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 whitespace-nowrap pl-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            빠른 고민 질문:
          </span>
          {currentPersona.sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-xs bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 hover:border-amber-300 px-3 py-1 rounded-full whitespace-nowrap transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${currentPersona.name}에게 털어놓고 싶은 일이나 고민을 자유롭게 적어보세요... (Shift+Enter로 줄바꿈)`}
                rows={2}
                disabled={isLoading}
                className="w-full resize-none rounded-2xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-stone-50 placeholder:text-stone-400"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-11 px-4 sm:px-5 rounded-2xl bg-amber-600 text-white font-medium text-sm flex items-center justify-center gap-1.5 hover:bg-amber-700 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">보내기</span>
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-stone-400">
            <span>* 본 상담은 교사의 감정적 회복과 소통 지원을 위한 AI 안식처입니다.</span>
            <span>Gemini 3.8 Flash 탑재</span>
          </div>
        </div>
      </div>
    </div>
  );
};
