import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Heart, 
  Wind, 
  ChevronRight, 
  ChevronLeft,
  Volume2
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { TEACHER_AFFIRMATIONS } from '../data/mockNotes';

export const MindfulnessBreathing: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timerCount, setTimerCount] = useState<number>(4);
  const [affirmationIdx, setAffirmationIdx] = useState<number>(0);

  // 4-7-8 Breathing Technique (Inhale 4s -> Hold 7s -> Exhale 8s)
  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimerCount((prev) => {
          if (prev <= 1) {
            if (phase === 'inhale') {
              setPhase('hold');
              return 7;
            } else if (phase === 'hold') {
              setPhase('exhale');
              soundManager.playSingingBowl();
              return 8;
            } else {
              setPhase('inhale');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, phase]);

  const handleToggle = () => {
    if (!isActive) {
      soundManager.playSingingBowl();
      setPhase('inhale');
      setTimerCount(4);
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setTimerCount(4);
  };

  const nextAffirmation = () => {
    setAffirmationIdx((prev) => (prev + 1) % TEACHER_AFFIRMATIONS.length);
  };

  const prevAffirmation = () => {
    setAffirmationIdx((prev) => (prev - 1 + TEACHER_AFFIRMATIONS.length) % TEACHER_AFFIRMATIONS.length);
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold mb-3 border border-emerald-200">
          <Wind className="w-3.5 h-3.5 text-emerald-700" />
          <span>4-7-8 신경계 안정 호흡</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
          선생님을 위한 1분 안식처
        </h2>
        <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          어깨와 턱에 들어간 긴장을 풀고, 복잡한 교실 소음에서 잠시 로그아웃하세요.
        </p>
      </div>

      {/* Main Breathing Circle Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 sm:p-10 text-center flex flex-col items-center">
        
        {/* Animated Circle Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4">
          
          {/* Outer glow ring */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              phase === 'inhale'
                ? 'scale-110 bg-emerald-200/40 ring-8 ring-emerald-300/30'
                : phase === 'hold'
                ? 'scale-110 bg-amber-200/40 ring-8 ring-amber-300/30'
                : 'scale-90 bg-stone-200/40 ring-4 ring-stone-300/20'
            }`}
          />

          {/* Inner Breathing Core */}
          <div
            className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-1000 ${
              phase === 'inhale'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white scale-105'
                : phase === 'hold'
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white scale-105'
                : 'bg-gradient-to-br from-stone-600 to-stone-700 text-white scale-90'
            }`}
          >
            <span className="text-xs uppercase tracking-widest font-semibold opacity-90 mb-1">
              {isActive ? (
                phase === 'inhale' ? '코로 천천히 들이마시기' : phase === 'hold' ? '잠시 편안히 멈추기' : '입으로 천천히 내쉬기'
              ) : (
                '호흡 시작하기'
              )}
            </span>

            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight my-1">
              {isActive ? timerCount : '4-7-8'}
            </span>

            <span className="text-xs opacity-80 px-4 text-center">
              {isActive ? (
                phase === 'inhale' ? '맑은 공기를 가득 채우세요' : phase === 'hold' ? '어깨의 힘을 툭 빼세요' : '교실의 긴장을 다 내보내세요'
              ) : (
                '아래 버튼을 눌러보세요'
              )}
            </span>
          </div>
        </div>

        {/* Breathing Controls */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleToggle}
            className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
              isActive
                ? 'bg-stone-800 text-white hover:bg-stone-900'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isActive ? '잠시 멈춤' : '호흡 시작하기'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
            title="처음부터 다시"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Affirmation Carousel Banner */}
        <div className="w-full mt-8 pt-6 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2 px-1">
            <span className="flex items-center gap-1 font-semibold text-stone-600">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              오늘의 마음 지킴 확언
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={prevAffirmation}
                className="p-1 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{affirmationIdx + 1} / {TEACHER_AFFIRMATIONS.length}</span>
              <button
                onClick={nextAffirmation}
                className="p-1 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-amber-950 font-serif-kr leading-relaxed">
              &quot;{TEACHER_AFFIRMATIONS[affirmationIdx]}&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
