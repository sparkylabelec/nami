
export enum UserLevel {
  MEMBER = 1,      // 팀원
  LEADER = 2,      // 책임매니저
  REPORTER = 3,    // 리포터
  ADMIN = 4        // 관리자
}

// 사용자 상태 타입 정의
export type UserStatus = 'approved' | 'pending' | 'withdrawn';

// 조직 구조 상수 정의
export const ORG_STRUCTURE: Record<string, string[]> = {
  "마케팅": ["기획홍보팀", "MICE센터팀"],
  "랜딩사업": ["운항팀", "웰컴팀"],
  "경영기획": ["총무팀", "안전보건팀", "인사팀"],
  "수상레저사업": ["수상레저팀"],
  "경리실": ["경리팀"],
  "공원관리": ["시설관리팀", "환경관리팀"],
  "경관디자인실": ["공간기획팀", "공예원팀", "관광조경팀"],
  "계열사업추진실": ["계열사업추진팀"],
  "친환경선박연구실": ["친환경선박연구팀"]
};

export interface User {
  uid: string;
  email: string;
  name: string;
  phone: string;      // 연락처 추가
  department: string; // 사업부
  teamId: string;     // 팀 이름
  level: UserLevel;
  status: UserStatus; // 'approved' | 'pending' | 'withdrawn'
}

export type BlockType = 'text' | 'image_gallery' | 'info_header';

export interface ReportBlock {
  id: string;
  type: BlockType;
  content: string; 
  images?: string[];
  imageCaptions?: string[]; // 이미지별 설명 필드 추가
}

export interface ReportContent {
  blocks: ReportBlock[];
}

export interface Report {
  reportId: string;
  authorId: string;
  authorName: string;
  department: string;
  teamId: string;
  title: string;
  content: ReportContent;
  createdAt: string;
  status: 'submitted' | 'draft';
}
