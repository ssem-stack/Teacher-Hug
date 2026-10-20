import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Wind, 
  BellRing, 
  MessageSquareHeart, 
  DoorClosed, 
  ShieldCheck, 
  Sparkles, 
  UsersRound,
  Coffee,
  Database
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface NavbarProps {
  activeTab: 'chat' | 'vent' | 'shield' | 'breathe' | 'community' | 'data';
  setActiveTab: (tab: 'chat' | 'vent' | 'shield' | 'breathe' | 'community' | 'data') => void;
  onRequestPrescription?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [soundType, setSoundType] = useState<'rain' | 'breeze' | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.3);
  const [showSoundMenu, setShowSoundMenu] = useState<boolean>(false);
  const [offWorkStatus, setOffWorkStatus] = useState<boolean>(true);

  const toggleSound = (type: 'rain' | 'breeze') => {
    if (isPlaying && soundType === type) {
      soundManager.stop();
      setIsPlaying(false);
      setSoundType(null);
    } else {
      if (type === 'rain') soundManager.playRain(volume);
      if (type === 'breeze') soundManager.playBreeze(volume);
      setIsPlaying(true);
      setSoundType(type);
    }
  };

  const playSingingBowlOnce = () => {
    soundManager.playSingingBowl();
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundManager.setVolume(newVol);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundManager.stop();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/60 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl text-amber-950 tracking-tight">
                  티처스 허그
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-200/70 text-amber-900 border border-amber-300/60">
                  교사 마음 안식처
                </span>
              </div>
              <p className="text-xs text-amber-800/80 line-clamp-1">
                오늘도 교실을 지킨 선생님, 참 애쓰셨습니다
              </p>
            </div>
          </div>

          {/* Quick Actions: Sound & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Sing Bowl Quick Ring */}
            <button
              onClick={playSingingBowlOnce}
              title="마음을 맑게 하는 싱잉볼 차임 듣기"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200/80 transition-colors flex items-center gap-1.5 border border-amber-200 cursor-pointer"
            >
              <BellRing className="w-4 h-4 text-amber-700" />
              <span className="hidden md:inline">싱잉볼 타종</span>
            </button>

            {/* Ambient Sound Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSoundMenu(!showSoundMenu)}
                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                  isPlaying 
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-2 ring-emerald-400/30' 
                    : 'bg-white/80 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
                title="마음 이완 앰비언트 사운드"
              >
                {isPlaying ? <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
                <span className="hidden sm:inline">
                  {isPlaying ? (soundType === 'rain' ? '빗소리 재생 중' : '바람소리 재생 중') : '자연의 소리'}
                </span>
              </button>

              {showSoundMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-3 z-50 text-stone-800 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                    <span className="text-xs font-bold text-stone-700">마음 안정 사운드</span>
                    {isPlaying && (
                      <button
                        onClick={() => {
                          soundManager.stop();
                          setIsPlaying(false);
                          setSoundType(null);
                        }}
                        className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                      >
                        정지
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <button
                      onClick={() => toggleSound('rain')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        soundType === 'rain' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CloudRain className="w-4 h-4 text-blue-500" />
                        <span>교실 창밖 잔잔한 빗소리</span>
                      </div>
                      {soundType === 'rain' && <span className="text-[10px] text-emerald-600">ON</span>}
                    </button>

                    <button
                      onClick={() => toggleSound('breeze')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        soundType === 'breeze' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-teal-500" />
                        <span>교정 숲길 부드러운 바람</span>
                      </div>
                      {soundType === 'breeze' && <span className="text-[10px] text-emerald-600">ON</span>}
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span>음량 조절</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-amber-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Off Work Mode Toggle */}
            <button
              onClick={() => setOffWorkStatus(!offWorkStatus)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border flex items-center gap-1.5 cursor-pointer ${
                offWorkStatus
                  ? 'bg-amber-900 text-amber-100 border-amber-950 shadow-xs'
                  : 'bg-stone-100 text-stone-600 border-stone-300'
              }`}
              title="퇴근 스위치: 학교 모드를 끄고 나 자신으로 돌아가는 심리적 선언"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>{offWorkStatus ? '퇴근 모드 ON' : '교무실 모드'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar border-t border-amber-200/40 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-stone-700 hover:bg-amber-100/60'
            }`}
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span>선생님 AI 상담실</span>
          </button>

          <button
            onClick={() => setActiveTab('vent')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'vent'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-stone-700 hover:bg-amber-100/60'
            }`}
          >
            <DoorClosed className="w-4 h-4" />
            <span>퇴근길 감정 분리실</span>
          </button>

          <button
            onClick={() => setActiveTab('shield')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shield'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-stone-700 hover:bg-amber-100/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>학부모 민원 & 알림장 도우미</span>
          </button>

          <button
            onClick={() => setActiveTab('breathe')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'breathe'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-stone-700 hover:bg-amber-100/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>1분 호흡 & 마음챙김</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'community'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-stone-700 hover:bg-amber-100/60'
            }`}
          >
            <UsersRound className="w-4 h-4" />
            <span>전국 교사 토닥임 광장</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'data'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/60'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-500" />
            <span>상담 데이터 관리 센터</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
