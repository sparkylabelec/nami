
import { doc, setDoc, serverTimestamp, getDocs, collection, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { User, UserLevel, Report, ReportBlock } from "../types";

// 팀명 -> 영문 키워드 매핑
const TEAM_TO_ENG: Record<string, string> = {
  "기획홍보팀": "plan",
  "MICE센터팀": "mice",
  "운항팀": "sail",
  "웰컴팀": "welcom",
  "총무팀": "gen",
  "안전보건팀": "safe",
  "인사팀": "hr",
  "수상레저팀": "water",
  "경리팀": "acc",
  "시설관리팀": "fac",
  "환경관리팀": "env",
  "공간기획팀": "space",
  "공예원팀": "craft",
  "관광조경팀": "land",
  "계열사업추진팀": "biz",
  "친환경선박연구팀": "ship"
};

// 고품질 리포트 HTML 템플릿
const REPORT_TEMPLATES = [
  {
    titlePrefix: "주간 업무 실적 및 계획",
    content: `
      <h2>1. 주요 업무 추진 현황</h2>
      <p>금주 진행된 프로젝트의 <strong>핵심 지표</strong>를 아래와 같이 보고합니다. 전반적인 공정률은 목표 대비 105% 달성 중입니다.</p>
      <ul>
        <li>전략 기획 수립 및 부서 간 협의 완료</li>
        <li><em>현장 리스크 관리 시스템</em> 고도화 작업 착수</li>
        <li>대외 협력사 계약 갱신 및 단가 조정 협상 종료</li>
      </ul>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="border: 1px solid #e5e7eb; padding: 12px;">항목</th>
            <th style="border: 1px solid #e5e7eb; padding: 12px;">달성률</th>
            <th style="border: 1px solid #e5e7eb; padding: 12px;">비고</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">운영 효율화</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; color: #4f46e5; font-weight: bold;">92%</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">정상 진행</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">고객 피드백 반영</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; color: #4f46e5; font-weight: bold;">100%</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">완료</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">예산 집행 점검</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; color: #ef4444; font-weight: bold;">75%</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">차주 집중 추진</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 16px;">상기 지표는 부서 내 통합 데이터베이스를 근거로 작성되었습니다.</p>
    `
  },
  {
    titlePrefix: "현장 안전 점검 및 시설물 관리 보고",
    content: `
      <h2>1. 정기 안전 점검 결과</h2>
      <p>금일 실시된 <strong>사업장 정기 점검</strong> 결과, 대부분의 구역에서 양호한 상태를 확인하였으나 일부 보수 작업이 필요한 지점이 식별되었습니다.</p>
      <ol>
        <li>A구역 소방 시설물 압력 체크 (정상)</li>
        <li>B구역 계류장 목재 데크 <em>부식 상태</em> 확인 (보수 필요)</li>
        <li>전 구역 방역 및 청소 상태 점검 (양호)</li>
      </ol>
      <h3>2. 유지 보수 소요 예산(안)</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="border: 1px solid #e5e7eb; padding: 12px;">구분</th>
            <th style="border: 1px solid #e5e7eb; padding: 12px;">수량</th>
            <th style="border: 1px solid #e5e7eb; padding: 12px;">예상 비용</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">데크 교체용 목재</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">20 EA</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">₩450,000</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">방수 도료</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">5 CAN</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">₩120,000</td>
          </tr>
        </tbody>
      </table>
    `
  },
  {
    titlePrefix: "시장 동향 분석 및 신규 사업 제안",
    content: `
      <h2>1. 경쟁사 분석 보고</h2>
      <p>최근 유입되는 <strong>관광 트렌드</strong> 분석 결과, 체험형 콘텐츠에 대한 수요가 전년 대비 40% 이상 증가한 것으로 나타났습니다.</p>
      <ul>
        <li>타사 A: 야간 개장 및 미디어 아트 전시 도입</li>
        <li>타사 B: <em>친환경 멤버십</em> 카드 출시를 통한 충성 고객 확보</li>
      </ul>
      <h3>2. 당사 대응 전략 (SWOT)</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
        <tr style="background-color: #f0fdf4;">
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold;">Strength</td>
          <td style="border: 1px solid #e5e7eb; padding: 12px;">압도적인 자연 경관 및 브랜드 인지도</td>
        </tr>
        <tr style="background-color: #fffbeb;">
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold;">Weakness</td>
          <td style="border: 1px solid #e5e7eb; padding: 12px;">디지털 전환 속도 및 온라인 예약 편의성 부족</td>
        </tr>
        <tr style="background-color: #eff6ff;">
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold;">Opportunity</td>
          <td style="border: 1px solid #e5e7eb; padding: 12px;">글로벌 크루즈 관광 재개 및 신규 노선 확보 가능성</td>
        </tr>
      </table>
    `
  }
];

const DUMMY_CAPTIONS = [
  "현장 점검 사진 1",
  "주요 시설물 현황",
  "리스크 식별 구역 상세",
  "개선 전/후 비교 이미지",
  "주요 지표 데이터 시각화",
  "부서 간 협의 회의 기록",
  "참고용 시장 조사 자료"
];

export interface DummyConfig {
  department: string;
  teamId: string;
  level: UserLevel;
  count: number;
}

export const dummyService = {
  /**
   * 더미 회원 생성
   */
  createDummyUsers: async (config: DummyConfig, onProgress?: (msg: string) => void) => {
    const { department, teamId, level, count } = config;
    const teamEng = TEAM_TO_ENG[teamId] || "staff";
    const levelStr = `lv${level}`;
    const results: string[] = [];

    onProgress?.(`${count}명의 더미 데이터 생성을 시작합니다...`);

    for (let i = 1; i <= count; i++) {
      const seq = i.toString().padStart(2, '0');
      const email = `${teamEng}_${seq}_${levelStr}@nami.com`;
      const name = `더미_${teamId}_${seq}`;
      
      const r1 = Math.floor(Math.random() * 9000 + 1000);
      const r2 = Math.floor(Math.random() * 9000 + 1000);
      const phone = `010-${r1}-${r2}`;
      const dummyUid = `dum_${teamEng}_${seq}_${Date.now()}`;
      
      const userData: User = {
        uid: dummyUid,
        email,
        name,
        phone,
        department,
        teamId,
        level,
        status: 'approved'
      };

      try {
        await setDoc(doc(db, "users", dummyUid), {
          ...userData,
          createdAt: serverTimestamp(),
          isDummy: true
        });
        results.push(email);
        onProgress?.(`[성공] ${email} 완료 (ID: ${dummyUid})`);
      } catch (error) {
        onProgress?.(`[실패] ${email} 생성 중 오류 발생`);
      }
    }

    return results;
  },

  /**
   * 대량의 고품질 더미 리포트 생성
   */
  createDummyReports: async (selectedUsers: User[], countPerUser: number, onProgress?: (msg: string, progress: number) => void) => {
    const totalReports = selectedUsers.length * countPerUser;
    let completed = 0;
    const results: string[] = [];

    onProgress?.(`선택된 ${selectedUsers.length}명의 회원에 대해 총 ${totalReports}개의 리포트 생성을 시작합니다.`, 0);

    for (const user of selectedUsers) {
      for (let i = 1; i <= countPerUser; i++) {
        const template = REPORT_TEMPLATES[Math.floor(Math.random() * REPORT_TEMPLATES.length)];
        const reportId = `rep_dum_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        // 랜덤 이미지 생성 (1~3장)
        const imageCount = Math.floor(Math.random() * 3) + 1;
        const randomImages = Array.from({ length: imageCount }).map((_, idx) => 
          `https://picsum.photos/seed/${reportId}_img${idx}/800/600`
        );
        const randomCaptions = randomImages.map(() => 
          DUMMY_CAPTIONS[Math.floor(Math.random() * DUMMY_CAPTIONS.length)]
        );

        const blocks: ReportBlock[] = [
          {
            id: `block_text_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: 'text',
            content: template.content
          },
          {
            id: `block_gallery_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: 'image_gallery',
            content: '',
            images: randomImages,
            imageCaptions: randomCaptions
          }
        ];

        const reportData: Report = {
          reportId,
          authorId: user.uid,
          authorName: user.name,
          department: user.department,
          teamId: user.teamId,
          title: `${template.titlePrefix} (No. ${i})`,
          content: { blocks },
          createdAt: new Date(Date.now() - (Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString(), // 최근 10일 내 랜덤 생성
          status: 'submitted'
        };

        try {
          await setDoc(doc(db, "reports", reportId), {
            ...reportData,
            isDummy: true
          });
          results.push(reportId);
          completed++;
          const progress = Math.round((completed / totalReports) * 100);
          onProgress?.(`[진행] ${user.name} - "${reportData.title}" 생성 완료 (${completed}/${totalReports})`, progress);
        } catch (error) {
          onProgress?.(`[오류] ${user.name}의 리포트 생성 중 문제가 발생했습니다.`, Math.round((completed / totalReports) * 100));
        }
      }
    }

    return results;
  },

  /**
   * 모든 더미 회원 일괄 삭제
   */
  deleteAllDummyUsers: async (onProgress?: (msg: string, progress: number) => void) => {
    onProgress?.("전체 사용자 목록을 스캔 중입니다...", 0);
    const querySnapshot = await getDocs(collection(db, "users"));
    const dummyDocs = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.isDummy === true || doc.id.startsWith("dum_");
    });

    if (dummyDocs.length === 0) {
      onProgress?.("삭제할 더미 회원이 없습니다.", 100);
      return 0;
    }

    onProgress?.(`총 ${dummyDocs.length}명의 더미 회원을 삭제합니다.`, 5);
    let deletedCount = 0;

    for (const dDoc of dummyDocs) {
      try {
        await deleteDoc(doc(db, "users", dDoc.id));
        deletedCount++;
        const prog = Math.round((deletedCount / dummyDocs.length) * 100);
        onProgress?.(`[삭제성공] ${dDoc.data().email || dDoc.id}`, prog);
      } catch (e) {
        onProgress?.(`[삭제실패] ${dDoc.id} 처리 중 오류`, Math.round((deletedCount / dummyDocs.length) * 100));
      }
    }

    return deletedCount;
  },

  /**
   * 모든 더미 리포트 일괄 삭제
   */
  deleteAllDummyReports: async (onProgress?: (msg: string, progress: number) => void) => {
    onProgress?.("전체 리포트 목록을 스캔 중입니다...", 0);
    const querySnapshot = await getDocs(collection(db, "reports"));
    const dummyDocs = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.isDummy === true || doc.id.startsWith("rep_dum_");
    });

    if (dummyDocs.length === 0) {
      onProgress?.("삭제할 더미 리포트가 없습니다.", 100);
      return 0;
    }

    onProgress?.(`총 ${dummyDocs.length}개의 더미 리포트를 삭제합니다.`, 5);
    let deletedCount = 0;

    for (const dDoc of dummyDocs) {
      try {
        await deleteDoc(doc(db, "reports", dDoc.id));
        deletedCount++;
        const prog = Math.round((deletedCount / dummyDocs.length) * 100);
        onProgress?.(`[삭제성공] ${dDoc.data().title || dDoc.id}`, prog);
      } catch (e) {
        onProgress?.(`[삭제실패] ${dDoc.id} 처리 중 오류`, Math.round((deletedCount / dummyDocs.length) * 100));
      }
    }

    return deletedCount;
  }
};
