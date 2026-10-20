import React, { useState } from 'react';
import { 
  UsersRound, 
  Heart, 
  MessageCircle, 
  Plus, 
  Send, 
  Tag, 
  Sparkles,
  Coffee,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommunityNote } from '../types';
import { INITIAL_COMMUNITY_NOTES } from '../data/mockNotes';

export const CommunityBoard: React.FC = () => {
  const [notes, setNotes] = useState<CommunityNote[]>(() => {
    const saved = localStorage.getItem('teachers_hug_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_COMMUNITY_NOTES;
  });

  const [selectedTag, setSelectedTag] = useState<string>('전체');
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [author, setAuthor] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('초등');
  const [content, setContent] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('토닥토닥');

  const tags = ['전체', '학부모상담', '생활지도', '신규교사', '번아웃탈출', '칼퇴응원', '토닥토닥'];

  const handleLike = (id: string) => {
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, likes: n.likes + 1 } : n);
      localStorage.setItem('teachers_hug_notes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const newNote: CommunityNote = {
      id: `note-${Date.now()}`,
      author: author.trim() || '익명의 동료 교사',
      gradeLevel: gradeLevel || '선생님',
      content: content.trim(),
      likes: 1,
      tags: [tagInput.trim() || '토닥토닥'],
      date: '방금 전',
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem('teachers_hug_notes', JSON.stringify(updated));

    setContent('');
    setAuthor('');
    setIsWriting(false);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#ec4899', '#10b981'],
    });
  };

  const filteredNotes = selectedTag === '전체' 
    ? notes 
    : notes.filter(n => n.tags.some(t => t.includes(selectedTag)));

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-semibold mb-3 border border-rose-200">
          <UsersRound className="w-3.5 h-3.5 text-rose-700" />
          <span>전국 교사 온기 나눔</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
          전국 교사 토닥임 광장
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
          교실 문 안에서 홀로 외로워하지 마세요.<br className="hidden sm:inline" />
          같은 고민을 겪어낸 전국의 동료 교사들이 보내는 온기 어린 위로를 나눕니다.
        </p>
      </div>

      {/* Action Bar & Tag Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs">
        {/* Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                selectedTag === t
                  ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>

        {/* Write Note Button */}
        <button
          onClick={() => setIsWriting(!isWriting)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>동료에게 토닥임 한 줄 남기기</span>
        </button>
      </div>

      {/* Writing Form (Collapsible) */}
      {isWriting && (
        <form
          onSubmit={handleSubmitNote}
          className="bg-rose-50/60 border border-rose-200 rounded-3xl p-5 sm:p-6 mb-6 animate-in fade-in duration-300"
        >
          <h3 className="text-sm font-bold text-rose-950 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>오늘 지친 동료 선생님께 건네는 따뜻한 한 줄</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                닉네임 (익명)
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="예: 7년차 초등쌤"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-rose-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                소속 / 직무
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-rose-500 bg-white cursor-pointer"
              >
                <option value="초등교사">초등교사</option>
                <option value="중학교교사">중학교교사</option>
                <option value="고등학교교사">고등학교교사</option>
                <option value="특수교사">특수교사</option>
                <option value="유치원교사">유치원교사</option>
                <option value="보건·상담·영양교사">보건·상담·영양교사</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                키워드 태그
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="예: 힘내요선생님"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-rose-500 bg-white"
              />
            </div>
          </div>

          <div className="mb-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="선생님의 따뜻한 위로 한마디가 오늘 밤 누군가의 교직 생활을 지탱해 주는 등불이 됩니다..."
              rows={3}
              className="w-full p-3 rounded-2xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-rose-500 bg-white placeholder:text-stone-400"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>따스함 남기기</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs hover:shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-stone-900">
                    {note.author}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                    {note.gradeLevel}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">{note.date}</span>
              </div>

              <p className="text-xs sm:text-sm text-stone-700 font-serif-kr leading-relaxed whitespace-pre-wrap mb-4">
                &quot;{note.content}&quot;
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {note.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleLike(note.id)}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                title="마음에 와닿았어요"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                <span className="font-bold">{note.likes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
