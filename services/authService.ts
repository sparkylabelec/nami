
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User, UserLevel } from "../types";

export const authService = {
  signUp: async (email: string, password: string, name: string, phone: string, department: string, teamId: string, level: UserLevel): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const newUser: User = {
        uid: fbUser.uid,
        email: fbUser.email!,
        name,
        phone,
        department,
        teamId,
        level,
        status: 'pending' // 초기 상태는 '대기'
      };

      await setDoc(doc(db, "users", fbUser.uid), newUser);
      return newUser;
    } catch (error: any) {
      throw new Error(translateAuthError(error.code));
    }
  },

  signIn: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, "users", fbUser.uid));
      if (!userDoc.exists()) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }
      
      return userDoc.data() as User;
    } catch (error: any) {
      throw new Error(translateAuthError(error.code));
    }
  },

  signOut: async () => {
    await signOut(auth);
  },

  observeAuthState: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        if (userDoc.exists()) {
          callback(userDoc.data() as User);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
};

const translateAuthError = (code: string) => {
  switch (code) {
    case "auth/email-already-in-use": return "이미 사용 중인 이메일입니다.";
    case "auth/invalid-email": return "유효하지 않은 이메일 형식입니다.";
    case "auth/weak-password": return "비밀번호가 너무 취약합니다.";
    default: return "로그인 정보가 올바르지 않습니다.";
  }
};
