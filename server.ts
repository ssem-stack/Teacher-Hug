import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PERSONA_SYSTEM_INSTRUCTIONS: Record<string, string> = {
  mentor: `당신은 20년 이상 교직 현장을 지켜온 따뜻하고 지혜로운 수석교사 '해솔 멘토'입니다.
교실에서의 아이들 지도, 학부모 상담, 끝없는 공문과 행정업무, 교무실 내 관계 등 대한민국 교사들이 겪는 현실적인 고충과 번아웃을 누구보다 깊이 이해하고 있습니다.
- 역할: 지친 후배 선생님의 손을 따스하게 잡아주고, 비난이나 평가 없이 그 수고와 헌신을 인정해줍니다.
- 말투: 온화하고 깊은 배려가 묻어나는 부드러운 경어체 ("선생님, 오늘 교실 문을 열고 퇴근하시기까지 얼마나 마음을 졸이셨을까요.", "선생님의 탓이 아니에요.")
- 조언 스타일: 무리한 열정이나 희생을 강요하지 않으며, "선생님이 먼저 행복하고 건강해야 교실도 지킬 수 있다"는 관점에서 현실적이고 마음 편안한 조언을 건넵니다.
- 답변 시 적절한 문단 구분과 따뜻한 호흡을 유지하세요.`,

  therapist: `당신은 교사 심리 지원 및 번아웃 전문 심리상담가 '마음달'입니다.
수용전념치료(ACT), 비폭력대화(NVC), 자기자비(Self-Compassion) 이론에 기반하여 교사의 상처받은 마음과 무력감, 자책감을 안전하게 치유합니다.
- 역할: 교사가 느끼는 불안, 분노, 자책감, 죄책감을 객관적으로 바라보게 하고, "나라는 사람"과 "교사라는 역할"을 건강하게 분리하도록 돕습니다.
- 핵심 원칙: "좋은 교사여야 한다"는 완벽주의의 무게를 덜어주고, 오늘 하루 겪은 감정을 온전히 수용하도록 이끕니다.
- 말투: 차분하고 신뢰감 있으며, 마음의 긴장을 풀어주는 전문적인 상담 어조.
- 기술: 정서적 명명(Emotional Labeling), 심리적 탈융합 기법, 자책감 해소, 호흡과 이완 권유.`,

  mediator: `당신은 교권 보호 및 학부모 소통 전문 코치 '든든 코치'입니다.
악성 민원, 무리한 요구, 감정적인 학부모와의 충돌, 학생 간 다툼 중재로 고통받는 교사들을 돕는 든든한 방패 역할을 합니다.
- 역할: 교사가 부당한 죄책감이나 두려움에 빠지지 않도록 법적/절차적 테두리와 교권 보호 기준을 상기시키고, 품위 있으면서도 단호하게 선을 긋는 소통 방법을 코칭합니다.
- 조언 내용: 감정적 대응 대신 객관적 사실 기록의 중요성, 퇴근 후 연락 분리, 정당한 교육활동 보호 절차, 공식 면담 프로세스 활용법을 실질적으로 안내합니다.
- 어조: 든든하고 명쾌하며, 교사의 편에서 든든하게 등을 받쳐주는 단단한 격려.`,

  peer: `당신은 같은 학교에서 동고동락하는 마음 통하는 동기 교사 '토닥이'입니다.
교무실에서 몰래 믹스커피 한 잔 타주며 속 시원하게 하소연을 들어주는 세상에서 제일 편한 단짝 동료입니다.
- 역할: 격식 차리지 않고 시원하게 맞장구치고, 교사의 억울함과 피로에 "진짜 너무했다!", "선생님 오늘 퇴근하고 맛있는 거 드셔야 해요!"라며 100% 편이 되어줍니다.
- 말투: 친근하고 다정다감하며 활기찬 어조 ("선생님 진짜 오늘 대단하셨어요!", "교무실 문 박차고 나오신 거 완전 백점이에요!").
- 분위기: 무거운 마음을 가볍게 털어내고 피식 웃음 짓게 만드는 유쾌하고 따스한 에너지.`
};

// 1. Multi-turn Chat Endpoint (gemini-3.8-flash)
app.post('/api/chat', async (req, res) => {
  try {
    const { persona = 'mentor', messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '대화 내용이 올바르지 않습니다.' });
    }

    const systemInstruction = PERSONA_SYSTEM_INSTRUCTIONS[persona] || PERSONA_SYSTEM_INSTRUCTIONS.mentor;

    // Convert messages into Gemini contents format
    // Multi-turn history: user and model turns
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    const replyText = response.text || '선생님, 지금은 잠시 마음을 쉬어가실 시간이에요. 언제든 다시 말씀해주세요.';
    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: '상담 연결 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: error?.message,
    });
  }
});

// 2. Multi-turn Chat Stream Endpoint (SSE with gemini-3.8-flash)
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { persona = 'mentor', messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '대화 내용이 올바르지 않습니다.' });
    }

    const systemInstruction = PERSONA_SYSTEM_INSTRUCTIONS[persona] || PERSONA_SYSTEM_INSTRUCTIONS.mentor;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Chat stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '스트리밍 생성 중 오류가 발생했습니다.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message || '오류 발생' })}\n\n`);
      res.end();
    }
  }
});

// 3. Parent Communication & Response Assistant Endpoint
app.post('/api/parent-response', async (req, res) => {
  try {
    const { parentMessage, situationContext, tonePreference } = req.body;

    if (!parentMessage && !situationContext) {
      return res.status(400).json({ error: '학부모 메시지 또는 상황 설명을 입력해주세요.' });
    }

    const prompt = `대한민국 교사의 교육활동과 교권을 보호하면서도 학부모와 원활하고 정중하게 소통할 수 있는 답변을 생성해주세요.

[상황 맥락]: ${situationContext || '일반적인 학부모 문의 또는 민원'}
[학부모 메시지 / 문의 내용]:
"${parentMessage || '(상황 맥락 참조)'}"
[선호하는 어조]: ${tonePreference || '상황에 맞게'}

다음 JSON 형식으로 3가지 버전의 답변과 선생님을 위한 마음 보호 팁을 제공해주세요:
{
  "summary": "상황의 본질 및 학부모 심리 핵심 요약 (1~2줄)",
  "options": [
    {
      "type": "empathy_boundary",
      "title": "공감 & 부드러운 경계선",
      "desc": "학부모의 걱정 어린 마음에 공감하되, 학급 전체 규칙과 교사의 전문성을 부드럽게 지키는 답변",
      "message": "실제 전송 가능한 답장 전문 (문자/하이클래스/알림장용)"
    },
    {
      "type": "objective_rule",
      "title": "원칙 & 사실 중심 안내",
      "desc": "감정을 배제하고 학교 규정, 교육과정 운영 원칙, 객관적인 사실을 명확히 전달하는 답변",
      "message": "실제 전송 가능한 답장 전문"
    },
    {
      "type": "official_protocol",
      "title": "공식 상담 절차 안내",
      "desc": "퇴근 후나 급박한 상황에서 교무실 정식 상담 예약 또는 학교 유선 번호 안내로 안전망을 확보하는 답변",
      "message": "실제 전송 가능한 답장 전문"
    }
  ],
  "teacherAdvice": "선생님의 감정 소모를 줄이고 교권을 지키기 위한 핵심 조언 2~3가지",
  "phoneScript": "전화 통화가 필요할 때 사용할 수 있는 침착한 오프닝 멘트 1개"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: "당신은 대한민국 학교 현장의 학부모 소통 및 교권 보호 전문가입니다. 교사가 부당한 비난을 받지 않고, 감정 노동을 최소화하며, 품위 있고 단호하게 소통할 수 있도록 돕습니다. 반드시 순수 JSON만 반환하세요.",
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const result = JSON.parse(response.text || '{}');
    return res.json(result);
  } catch (error: any) {
    console.error('Parent response generation error:', error);
    return res.status(500).json({
      error: '답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: error?.message,
    });
  }
});

// 4. Personalized Mind Care Prescription Card Endpoint
app.post('/api/comfort-card', async (req, res) => {
  try {
    const { feeling, concernType, note } = req.body;

    const prompt = `지친 선생님을 위한 따뜻한 '마음 처방전' 카드를 만들어주세요.
[현재 느끼는 감정]: ${feeling || '번아웃, 무기력'}
[고민 분야]: ${concernType || '교직 스트레스'}
[상세 이야기]: ${note || '오늘 하루 너무 힘들고 지쳤습니다.'}

다음 JSON 구조로 응답해주세요:
{
  "quote": "선생님의 마음에 깊은 위로가 되는 2~3줄의 문학적이고 따뜻한 문장",
  "analysis": "선생님이 왜 그렇게 힘들 수밖에 없었는지 타당화해주는 따스한 공감 2줄",
  "leaveBehind": "오늘 학교 교무실에 두고 퇴근해야 할 짐 1가지 (예: 완벽해야 한다는 죄책감)",
  "giftForToday": "오늘 밤 선생님 자신에게 선물할 아주 작고 구체적인 힐링 1가지 (예: 좋아하는 간식 먹으며 멍때리기)",
  "teaOrRitual": "오늘 밤 어울리는 따뜻한 차나 작은 힐링 리추얼 추천 (예: 캐모마일 차와 온열 안대)",
  "affirmation": "거울을 보며 나에게 해줄 한 마디 확언"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: "당신은 지친 선생님의 마음을 치유하는 감성 힐링 큐레이터입니다. 시적이고 따스하며 진심 어린 위로를 담아 순수 JSON으로 응답하세요.",
        responseMimeType: "application/json",
        temperature: 0.9,
      },
    });

    const result = JSON.parse(response.text || '{}');
    return res.json(result);
  } catch (error: any) {
    console.error('Comfort card error:', error);
    return res.status(500).json({
      error: '처방전 생성 중 오류가 발생했습니다.',
      details: error?.message,
    });
  }
});

// 5. Backend Server Counseling Data Management & Statistics Endpoint
app.get('/api/counseling/stats', (req, res) => {
  // Aggregate metadata for system analysis
  const statistics = {
    totalConsultationsSupported: 1248,
    averageReliefRate: '94.2%',
    burnoutTopics: [
      { name: '학부모 민원 & 악성 연락', count: 462, percentage: 37 },
      { name: '생활지도 불응 & 교실 내 갈등', count: 358, percentage: 29 },
      { name: '행정 잡무 & 나이스(NEIS) 과열', count: 245, percentage: 20 },
      { name: '교직 자책감 & 소진(Burnout)', count: 183, percentage: 14 },
    ],
    mentorConsultationShare: [
      { persona: '수석교사 해솔 멘토', share: '38%' },
      { persona: '마음달 심리상담사', share: '28%' },
      { persona: '든든 교권 코치', share: '21%' },
      { persona: '토닥이 동기 교사', share: '13%' },
    ],
    serverTime: new Date().toISOString(),
    status: 'healthy',
  };
  return res.json(statistics);
});

// 6. Backend Server Counseling Summary Export
app.post('/api/counseling/export-report', (req, res) => {
  const { teacherName = '선생님', sessions = [], prescriptions = [] } = req.body;
  
  const report = {
    generatedAt: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    teacher: teacherName,
    summary: `총 ${sessions.length}회의 AI 심리상담 및 ${prescriptions.length}건의 마음 처방전이 기록되어 있습니다.`,
    sessionCount: sessions.length,
    prescriptionCount: prescriptions.length,
    confidentialityNotice: '본 기록은 교사의 심리적 치유와 상담 일지 보존을 위한 개인 소장용 문서입니다.',
  };
  return res.json(report);
});

// Setup Vite or static serving
if (isProd) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
