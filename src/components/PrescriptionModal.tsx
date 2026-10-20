import React, { useRef, useState } from 'react';
import { 
  X, 
  FileHeart, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  Coffee, 
  Feather,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ComfortCardData } from '../types';

interface PrescriptionModalProps {
  cardData: ComfortCardData | null;
  onClose: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ cardData, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!cardData) return null;

  const handleCopyText = () => {
    const text = `[선생님을 위한 마음 처방전]
수신: 오늘 하루도 교실을 지킨 선생님께

위로의 문장:
"${cardData.quote}"

마음 진단:
${cardData.analysis}

오늘 학교에 두고 갈 짐:
${cardData.leaveBehind}

오늘 나에게 줄 작은 선물:
${cardData.giftForToday}

따뜻한 차 & 리추얼:
${cardData.teaOrRitual}

나를 향한 확언:
"${cardData.affirmation}"

- 티처스 허그 마음약국 -`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#ec4899', '#10b981'],
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 relative animate-in zoom-in-95 duration-300"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Card Area */}
        <div ref={cardRef} className="p-6 sm:p-8 bg-[#fdfbf7] border-b border-stone-200">
          
          {/* Header Seal */}
          <div className="text-center pb-5 border-b-2 border-dashed border-amber-200 mb-6 relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
              <FileHeart className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-amber-800 uppercase">
              Teacher&apos;s Mind Prescription
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight font-serif-kr mt-1">
              선생님을 위한 마음 처방전
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              처방 대상: 오늘 하루도 교실을 묵묵히 지켜내신 귀한 선생님
            </p>
          </div>

          {/* Quote Section */}
          <div className="mb-6 bg-amber-50/80 rounded-2xl p-4 border border-amber-200/80 text-center">
            <Feather className="w-4 h-4 text-amber-700 mx-auto mb-1.5 opacity-70" />
            <p className="text-sm sm:text-base font-serif-kr text-stone-800 font-semibold leading-relaxed">
              &quot;{cardData.quote}&quot;
            </p>
          </div>

          {/* Analysis */}
          <div className="mb-5">
            <h4 className="text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>마음 진단 및 온기</span>
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed bg-white p-3.5 rounded-xl border border-stone-200/70">
              {cardData.analysis}
            </p>
          </div>

          {/* Grid: Leave Behind & Gift for today */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/70">
              <span className="text-[11px] font-bold text-rose-800 block mb-1">
                🚪 오늘 교실에 두고 갈 짐
              </span>
              <p className="text-xs text-rose-950 font-medium leading-relaxed">
                {cardData.leaveBehind}
              </p>
            </div>

            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/70">
              <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                🎁 오늘 밤 나에게 줄 선물
              </span>
              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                {cardData.giftForToday}
              </p>
            </div>
          </div>

          {/* Tea / Ritual Recommendation */}
          <div className="mb-5 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/50">
            <h4 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-700" />
              <span>오늘 밤의 차 & 힐링 리추얼</span>
            </h4>
            <p className="text-xs text-amber-950 leading-relaxed">
              {cardData.teaOrRitual}
            </p>
          </div>

          {/* Mirror Affirmation */}
          <div className="text-center pt-3 border-t border-dashed border-stone-200">
            <span className="text-[11px] text-stone-400 block mb-1">
              오늘 밤 거울 속 나에게 건네는 한 마디
            </span>
            <p className="text-xs sm:text-sm font-bold text-stone-800 font-serif-kr">
              &quot;{cardData.affirmation}&quot;
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-stone-50 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            티처스 허그 공식 조제약국
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료' : '텍스트 복사'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>처방전 인쇄/저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
