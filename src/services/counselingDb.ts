import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ComfortCardData, ParentResponseResult } from '../types';

export interface SavedSession {
  id: string;
  teacherUid: string;
  teacherEmail: string;
  personaId: 'mentor' | 'therapist' | 'mediator' | 'peer';
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: any;
  updatedAt: any;
  messages?: SavedMessage[];
}

export interface SavedMessage {
  id: string;
  sessionId: string;
  teacherUid: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: any;
}

export interface SavedPrescription extends ComfortCardData {
  id: string;
  teacherUid: string;
  createdAt: any;
}

export interface SavedParentCase {
  id: string;
  teacherUid: string;
  category: string;
  parentMessage: string;
  situationContext: string;
  summary: string;
  selectedResponse: string;
  createdAt: any;
}

// 1. Session Operations
export async function saveCounselingSession(
  sessionId: string,
  teacherUid: string,
  teacherEmail: string,
  personaId: 'mentor' | 'therapist' | 'mediator' | 'peer',
  title: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<void> {
  const sessionPath = `counseling_sessions/${sessionId}`;
  try {
    const sessionRef = doc(db, 'counseling_sessions', sessionId);
    const lastMsg = messages[messages.length - 1]?.content.slice(0, 400) || '';

    // Check if session exists to preserve createdAt
    const existingSnap = await getDoc(sessionRef);
    const isNew = !existingSnap.exists();

    const sessionPayload: any = {
      teacherUid,
      teacherEmail: teacherEmail || '',
      personaId,
      title: title.slice(0, 200) || '선생님 상담 기록',
      lastMessage: lastMsg,
      messageCount: messages.length,
      updatedAt: serverTimestamp(),
    };

    if (isNew) {
      sessionPayload.createdAt = serverTimestamp();
    } else {
      sessionPayload.createdAt = existingSnap.data()?.createdAt || serverTimestamp();
    }

    await setDoc(sessionRef, sessionPayload, { merge: true });

    // Save latest messages in subcollection
    const messagesCollectionRef = collection(db, 'counseling_sessions', sessionId, 'messages');
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgId = `msg-${i + 1}`;
      const msgRef = doc(messagesCollectionRef, msgId);
      await setDoc(msgRef, {
        sessionId,
        teacherUid,
        role: msg.role,
        content: msg.content.slice(0, 4000),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, sessionPath);
  }
}

export async function getTeacherSessions(teacherUid: string): Promise<SavedSession[]> {
  const path = 'counseling_sessions';
  try {
    const q = query(
      collection(db, path),
      where('teacherUid', '==', teacherUid)
    );
    const snap = await getDocs(q);
    const sessions: SavedSession[] = [];
    snap.forEach((docSnap) => {
      sessions.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as SavedSession);
    });

    // Sort descending by updatedAt / createdAt
    return sessions.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getSessionMessages(sessionId: string, teacherUid: string): Promise<SavedMessage[]> {
  const path = `counseling_sessions/${sessionId}/messages`;
  try {
    const q = query(
      collection(db, 'counseling_sessions', sessionId, 'messages'),
      where('teacherUid', '==', teacherUid)
    );
    const snap = await getDocs(q);
    const messages: SavedMessage[] = [];
    snap.forEach((docSnap) => {
      messages.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as SavedMessage);
    });
    return messages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteCounselingSession(sessionId: string): Promise<void> {
  const path = `counseling_sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'counseling_sessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 2. Prescription Operations
export async function savePrescriptionDoc(
  prescriptionId: string,
  teacherUid: string,
  data: ComfortCardData
): Promise<void> {
  const path = `prescriptions/${prescriptionId}`;
  try {
    const ref = doc(db, 'prescriptions', prescriptionId);
    await setDoc(ref, {
      teacherUid,
      quote: data.quote.slice(0, 500),
      analysis: data.analysis.slice(0, 1000),
      leaveBehind: data.leaveBehind.slice(0, 500),
      giftForToday: data.giftForToday.slice(0, 500),
      teaOrRitual: data.teaOrRitual.slice(0, 500),
      affirmation: data.affirmation.slice(0, 300),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getTeacherPrescriptions(teacherUid: string): Promise<SavedPrescription[]> {
  const path = 'prescriptions';
  try {
    const q = query(
      collection(db, path),
      where('teacherUid', '==', teacherUid)
    );
    const snap = await getDocs(q);
    const items: SavedPrescription[] = [];
    snap.forEach((docSnap) => {
      items.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as SavedPrescription);
    });
    return items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deletePrescriptionDoc(id: string): Promise<void> {
  const path = `prescriptions/${id}`;
  try {
    await deleteDoc(doc(db, 'prescriptions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 3. Parent Cases Operations
export async function saveParentCaseDoc(
  caseId: string,
  teacherUid: string,
  category: string,
  parentMessage: string,
  situationContext: string,
  summary: string,
  selectedResponse: string
): Promise<void> {
  const path = `parent_cases/${caseId}`;
  try {
    const ref = doc(db, 'parent_cases', caseId);
    await setDoc(ref, {
      teacherUid,
      category: category.slice(0, 100),
      parentMessage: parentMessage.slice(0, 2000),
      situationContext: situationContext.slice(0, 2000),
      summary: summary.slice(0, 1000),
      selectedResponse: selectedResponse.slice(0, 4000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getTeacherParentCases(teacherUid: string): Promise<SavedParentCase[]> {
  const path = 'parent_cases';
  try {
    const q = query(
      collection(db, path),
      where('teacherUid', '==', teacherUid)
    );
    const snap = await getDocs(q);
    const items: SavedParentCase[] = [];
    snap.forEach((docSnap) => {
      items.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as SavedParentCase);
    });
    return items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteParentCaseDoc(id: string): Promise<void> {
  const path = `parent_cases/${id}`;
  try {
    await deleteDoc(doc(db, 'parent_cases', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
