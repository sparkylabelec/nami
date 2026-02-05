
import { 
  collection, 
  setDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { Report } from "../types";

export const reportService = {
  // 보고서 저장 (신규 생성 및 수정)
  saveReport: async (report: Report) => {
    try {
      const sanitizedReport = JSON.parse(JSON.stringify(report));
      await setDoc(doc(db, "reports", report.reportId), sanitizedReport);
    } catch (error) {
      console.error("Error saving report: ", error);
      throw error;
    }
  },

  // 모든 보고서 가져오기
  getReports: async (): Promise<Report[]> => {
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Report);
    } catch (error) {
      console.error("Error fetching reports: ", error);
      throw error;
    }
  },

  // 특정 팀의 보고서 가져오기
  getReportsByTeam: async (teamId: string): Promise<Report[]> => {
    try {
      const q = query(
        collection(db, "reports"), 
        where("teamId", "==", teamId)
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => doc.data() as Report);
      
      return reports.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (error) {
      console.error("Error fetching team reports: ", error);
      throw error;
    }
  },

  // 특정 사용자의 보고서 가져오기
  getReportsByUser: async (userId: string): Promise<Report[]> => {
    try {
      const q = query(
        collection(db, "reports"), 
        where("authorId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => doc.data() as Report);
      
      return reports.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (error) {
      console.error("Error fetching user reports: ", error);
      throw error;
    }
  },

  // 보고서 삭제
  deleteReport: async (reportId: string) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
    } catch (error) {
      console.error("Error deleting report: ", error);
      throw error;
    }
  }
};
