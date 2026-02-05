
import { ref, uploadBytes, getDownloadURL, uploadString } from "firebase/storage";
import { storage } from "./firebase";

export const storageService = {
  /**
   * 파일을 Firebase Storage에 업로드하고 다운로드 URL을 반환합니다.
   */
  uploadImage: async (file: File, path: string): Promise<string> => {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `${path}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Storage upload error:", error);
      throw new Error("이미지 업로드에 실패했습니다.");
    }
  },

  /**
   * Base64 데이터 문자열을 업로드하고 URL을 반환합니다.
   * @param base64Data 'data:image/png;base64,...' 형태의 문자열
   */
  uploadBase64: async (base64Data: string, path: string): Promise<string> => {
    try {
      const format = base64Data.split(';')[0].split('/')[1]; // png, jpeg 등
      const fileName = `inline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${format}`;
      const storageRef = ref(storage, `${path}/${fileName}`);
      
      // base64 부분만 추출
      const base64Content = base64Data.split(',')[1];
      const snapshot = await uploadString(storageRef, base64Content, 'base64', {
        contentType: `image/${format}`
      });
      
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Base64 upload error:", error);
      throw new Error("인라인 이미지 변환에 실패했습니다.");
    }
  }
};
