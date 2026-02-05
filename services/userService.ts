
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { User, UserLevel } from "../types";

export const userService = {
  // 전체 사용자 목록 가져오기
  getAllUsers: async (): Promise<User[]> => {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error fetching users: ", error);
      throw error;
    }
  },

  // 사용자 정보 업데이트 (관리자용: 레벨, 팀, 승인여부)
  updateUser: async (uid: string, data: Partial<User>) => {
    try {
      const userDoc = doc(db, "users", uid);
      await updateDoc(userDoc, data);
    } catch (error) {
      console.error("Error updating user: ", error);
      throw error;
    }
  },

  // 비밀번호 초기화 (MVP: 필드 업데이트로 기록)
  resetUserPassword: async (uid: string) => {
    try {
      const userDoc = doc(db, "users", uid);
      // 실제 비밀번호 변경은 Admin SDK가 필요하므로, 
      // 여기서는 초기화 플래그와 임시 비밀번호 안내를 기록합니다.
      await updateDoc(userDoc, {
        passwordResetAt: serverTimestamp(),
        tempPasswordSet: "000000",
        status: 'pending' // 초기화 후 재승인이 필요할 경우를 대비
      });
    } catch (error) {
      console.error("Error resetting password: ", error);
      throw error;
    }
  },

  // 사용자 계정 삭제 (관리자용)
  deleteUser: async (uid: string) => {
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (error) {
      console.error("Error deleting user: ", error);
      throw error;
    }
  }
};
