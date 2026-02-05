
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;

export const postService = {
  // 게시글 작성
  createPost: async (data: PostInput) => {
    try {
      const docRef = await addDoc(collection(db, "posts"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding document: ", error);
      throw error;
    }
  },

  // 게시글 전체 가져오기 (최신순)
  getPosts: async (): Promise<Post[]> => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
    } catch (error) {
      console.error("Error getting documents: ", error);
      throw error;
    }
  },

  // 게시글 수정
  updatePost: async (id: string, data: Partial<PostInput>) => {
    try {
      const docRef = doc(db, "posts", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating document: ", error);
      throw error;
    }
  },

  // 게시글 삭제
  deletePost: async (id: string) => {
    try {
      await deleteDoc(doc(db, "posts", id));
    } catch (error) {
      console.error("Error deleting document: ", error);
      throw error;
    }
  }
};
