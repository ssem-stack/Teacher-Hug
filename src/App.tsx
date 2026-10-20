import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CounselingChat } from './components/CounselingChat';
import { EmotionVent } from './components/EmotionVent';
import { ParentShield } from './components/ParentShield';
import { MindfulnessBreathing } from './components/MindfulnessBreathing';
import { CommunityBoard } from './components/CommunityBoard';
import { CounselingDataManager } from './components/CounselingDataManager';
import { PrescriptionModal } from './components/PrescriptionModal';
import { ComfortCardData } from './types';
import { AuthProvider } from './context/AuthContext';
import { Heart, PhoneCall, ShieldAlert, Coffee } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'vent' | 'shield' | 'breathe' | 'community' | 'data'>('chat');
  const [prescriptionData, setPrescriptionData] = useState<ComfortCardData | null>(null);

  const handleOpenPrescription = (data: ComfortCardData) => {
    setPrescriptionData(data);
  };

  const handleClosePrescription = () => {
    setPrescriptionData(null);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#faf8f5] text-stone-800 selection:bg-amber-200 selection:text-amber-900">
        
        {/* Top Navigation */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 pb-16">
          {activeTab === 'chat' && (
            <CounselingChat onOpenPrescription={handleOpenPrescription} />
          )}
          {activeTab === 'vent' && <EmotionVent />}
          {activeTab === 'shield' && <ParentShield />}
          {activeTab === 'breathe' && <MindfulnessBreathing />}
          {activeTab === 'community' && <CommunityBoard />}
          {activeTab === 'data' && (
            <CounselingDataManager onViewPrescription={handleOpenPrescription} />
          )}
        </main>

        {/* Prescription Modal */}
        {prescriptionData && (
          <PrescriptionModal
            cardData={prescriptionData}
            onClose={handleClosePrescription}
          />
        )}

        {/* Footer with Teacher Support Helpline & Dignity Statement */}
        <footer className="border-t border-amber-200/60 bg-amber-50/70 py-8 px-4 text-xs text-stone-500">
          <div className="max-w-5xl mx-auto space-y-4">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-stone-700 font-bold">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>티처스 허그 (Teacher&apos;s Hug)</span>
                <span className="text-stone-400 font-normal">| 교사의 심리적 회복과 교권을 응원합니다</span>
              </div>

              {/* Helpline Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700">
                  <PhoneCall className="w-3 h-3 text-emerald-600" />
                  <span>교원치유지원센터: 시도교육청별 전담상담</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  <span>정신건강위기상담: 1577-0199</span>
                </div>
              </div>
            </div>

            <div className="text-center sm:text-left text-stone-400 text-[11px] leading-relaxed border-t border-amber-200/40 pt-4">
              * 티처스 허그는 교사들의 감정적 환기와 일상 회복을 돕는 심리 지원 AI 서비스입니다. 심각한 교권 침해 및 응급 위기 상황에서는 각 교육청 교원치유지원센터와 전문 의료기관의 공식 지원을 받으시길 권장합니다.
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
