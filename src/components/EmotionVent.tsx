import React, { useState } from 'react';
import { 
  DoorClosed, 
  Trash2, 
  Send, 
  Flame, 
  Sparkles, 
  Lock, 
  RotateCcw,
  Coffee,
  CheckCircle2,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';

export const EmotionVent: React.FC = () => {
  const [ventText, setVentText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('학부모 민원');
  const [isLettingGo, setIsLettingGo] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [letGoMode, setLetGoMode] = useState<'burn' | 'plane' | 'lock'>('plane');

  const categories = [
    '학부모 민원 & 통화 스트레스',
    '생활지도 & 말 안 듣는 학생',
    '끝없는 나이스 공문 & 행정잡무',
    '교직원 간 소통 & 교무실 분위기',
    '나의 부족함에 대한 자책감',
    '원인 모를 피로 & 무기력'
  ];

  const handleLetGo = (mode: 'burn' | 'plane' | 'lock') => {
    if (!ventText.trim()) return;
    setLetGoMode(mode);
    setIsLettingGo(true);

    soundManager.playSingingBowl();

    setTimeout(() => {
      setIsLettingGo(false);
      setIsCompleted(true);

      if (mode === 'plane') {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      }
    }, 1400);
  };

  const handleReset = () => {
    setVentText('');
    setIsCompleted(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Intro Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-3 border border-amber-200">
          <DoorClosed className="w-3.5 h-3.5 text-amber-700" />
          <span>퇴근 의식 (Detachment Ritual)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
          퇴근길 감정 분리실
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
          학교 교문을 나설 때, 무거운 감정과 죄책감까지 집에 들고 가지 마세요.<br className="hidden sm:inline" />
          오늘 교실에서 있었던 속상함을 이곳에 쏟아내고 말끔하게 지워보내세요.
        </p>
      </div>

      {!isCompleted ? (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-5 sm:p-8">
          
          {/* Category Selector */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-stone-600 mb-2">
              오늘 나를 가장 힘들게 했던 무게:
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white border-amber-600 font-semibold shadow-2xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-stone-500">
                비밀은 절대 저장되지 않으며, 비우는 즉시 영원히 소멸됩니다.
              </span>
              <span className="text-xs text-stone-400">
                {ventText.length}자
              </span>
            </div>

            <div className="relative">
              <textarea
                value={ventText}
                onChange={(e) => setVentText(e.target.value)}
                placeholder="오늘 나를 억울하게 했던 말, 화나게 했던 일, 미안함이나 자책감... 누구의 눈치도 보지 말고 마음에 맺힌 그대로 다 털어놓아 보세요."
                rows={7}
                disabled={isLettingGo}
                className={`w-full p-4 rounded-2xl border border-stone-300 text-sm leading-relaxed focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder:text-stone-400 transition-all ${
                  isLettingGo ? 'animate-dissolve opacity-20 pointer-events-none' : ''
                }`}
              />

              {isLettingGo && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xs rounded-2xl">
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-bold text-stone-800">
                      {letGoMode === 'plane' && '종이비행기가 되어 하늘 저 멀리 날아가는 중...'}
                      {letGoMode === 'burn' && '연기가 되어 가볍게 흩어지는 중...'}
                      {letGoMode === 'lock' && '교무실 서랍에 안전하게 봉인하는 중...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Ritual Buttons */}
          <div className="space-y-3">
            <div className="text-center text-xs font-medium text-stone-500 mb-1">
              어떤 방법으로 내려놓으시겠습니까?
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleLetGo('plane')}
                disabled={!ventText.trim() || isLettingGo}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4 text-amber-600" />
                <span>종이비행기로 날려보내기</span>
              </button>

              <button
                onClick={() => handleLetGo('burn')}
                disabled={!ventText.trim() || isLettingGo}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 font-semibold text-xs transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-rose-600" />
                <span>흔적도 없이 태워 날리기</span>
              </button>

              <button
                onClick={() => handleLetGo('lock')}
                disabled={!ventText.trim() || isLettingGo}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold text-xs transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>교무실 서랍에 봉인하기</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Completion View */
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2">
            깨끗하게 비워졌습니다
          </h3>
          <p className="text-sm text-stone-600 max-w-md mx-auto mb-6 leading-relaxed">
            선생님이 방금 적어내린 고민과 상처는 깨끗이 소멸되었습니다.<br />
            학교의 문은 이미 닫혔습니다. 학교의 무게는 학교에 남겨두고, 지금 이 순간부터는 오직 나 자신만을 위한 온전한 저녁을 맞이하세요.
          </p>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 max-w-md mx-auto mb-8 text-left">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-xs mb-1">
              <Coffee className="w-4 h-4 text-amber-700" />
              <span>오늘 퇴근 후 선생님을 위한 처방약</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              &quot;아이들에게 준 친절만큼, 오늘 밤은 나 자신에게도 가장 너그러운 친구가 되어주기.&quot;
            </p>
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>다른 감정도 비워내기</span>
          </button>
        </div>
      )}
    </div>
  );
};
