export type PersonaId = 'mentor' | 'therapist' | 'mediator' | 'peer';

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  badge: string;
  avatarBg: string;
  accentColor: string;
  shortDesc: string;
  welcomeMessage: string;
  sampleQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  personaId?: PersonaId;
  liked?: boolean;
}

export interface ComfortCardData {
  quote: string;
  analysis: string;
  leaveBehind: string;
  giftForToday: string;
  teaOrRitual: string;
  affirmation: string;
}

export interface ParentResponseOption {
  type: string;
  title: string;
  desc: string;
  message: string;
}

export interface ParentResponseResult {
  summary: string;
  options: ParentResponseOption[];
  teacherAdvice: string;
  phoneScript: string;
}

export interface CommunityNote {
  id: string;
  author: string;
  gradeLevel: string; // 초등, 중등, 고등, 특수, 유치원, 보건/상담/영양 등
  content: string;
  likes: number;
  tags: string[];
  date: string;
}
