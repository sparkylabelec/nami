
import { 
  collection, 
  addDoc, 
  setDoc, 
  doc 
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Firestore에 문서를 저장하는 범용 서비스
 * @param collectionName 저장할 컬렉션 이름
 * @param data 저장할 데이터 객체
 * @param id (선택) 지정할 문서 ID. 없을 경우 자동 생성.
 * @returns 생성된 문서의 ID
 */
export const submissionService = {
  saveDocument: async (collectionName: string, data: any, id?: string): Promise<string> => {
    try {
      const collectionRef = collection(db, collectionName);
      const now = new Date().toISOString();
      
      if (id) {
        // ID가 제공된 경우 (수정 또는 지정된 ID 사용)
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, {
          ...data,
          updatedAt: now
        }, { merge: true });
        return id;
      } else {
        // ID가 없는 경우 (신규 추가)
        const docRef = await addDoc(collectionRef, {
          ...data,
          createdAt: now,
          updatedAt: now
        });
        return docRef.id;
      }
    } catch (error) {
      console.error(`Error saving document to ${collectionName}:`, error);
      throw error;
    }
  }
};
