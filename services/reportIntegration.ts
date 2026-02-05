
import { Report, ReportBlock } from "../types";

/**
 * 선택된 보고서들의 원본 블록(텍스트, 이미지 갤러리) 구조를 그대로 유지하며 
 * 각 보고서 경계(시작점)에 전용 'info_header' 블록을 추가하여 취합합니다.
 */
export const reportsToBlocks = (reports: Report[]): ReportBlock[] => {
  const aggregatedBlocks: ReportBlock[] = [];
  
  reports.forEach((report, index) => {
    const reportDate = new Date(report.createdAt).toLocaleString();
    
    // 1. 전용 info_header 블록 추가 (JSON 형태로 데이터 보관)
    aggregatedBlocks.push({
      id: `info-header-${report.reportId}-${Date.now()}`,
      type: 'info_header',
      content: JSON.stringify({
        writer: report.authorName,
        team: report.teamId,
        date: reportDate
      })
    });

    // 2. 보고서 제목 헤더 블록 추가 (텍스트 타입 유지하되 스타일 적용)
    aggregatedBlocks.push({
      id: `title-header-${report.reportId}-${Date.now()}`,
      type: 'text',
      content: `<h2 class="ql-as-heading-2" style="text-align: center; margin: 32px 0 24px 0; color: #1e293b;">${index + 1}. ${report.title}</h2>`
    });

    // 3. 해당 보고서의 원본 블록들 추가
    report.content.blocks.forEach((block) => {
      // 기존에 포함되어 있을 수 있는 info_header나 spacer는 제외하고 알맹이만 가져옴
      if (block.type === 'text' || block.type === 'image_gallery') {
        aggregatedBlocks.push({
          ...block,
          id: `aggregated-${report.reportId}-${block.id}-${Math.random().toString(36).substr(2, 5)}`
        });
      }
    });

    // 4. 보고서 간 간격 (마지막 보고서 제외)
    if (index < reports.length - 1) {
      aggregatedBlocks.push({
        id: `spacer-${report.reportId}-${index}`,
        type: 'text',
        content: '<p><br></p><hr style="border: none; border-top: 1px dashed #cbd5e1; opacity: 0.3; margin: 40px 0;"/><p><br></p>'
      });
    }
  });

  return aggregatedBlocks;
};

/**
 * (참고) HTML 변환 방식도 최신 디자인 반영
 */
export const reportsToHtml = (reports: Report[]): string => {
  if (reports.length === 0) return "";
  const dateStr = new Date().toLocaleDateString();
  let html = `<h1 class="ql-as-heading-1">업무 보고 취합 (${dateStr})</h1><hr>`;

  reports.forEach((report, index) => {
    const reportDate = new Date(report.createdAt).toLocaleString();
    html += `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <span style="color: #6366f1; font-weight: 800;">${report.authorName}</span> | 
        <span style="color: #475569;">${report.teamId}</span> | 
        <span style="color: #94a3b8;">${reportDate}</span>
      </div>
      <h2 class="ql-as-heading-2">${index + 1}. ${report.title}</h2>
    `;
    report.content.blocks.forEach(block => {
      if (block.type === 'text') html += block.content;
    });
    if (index < reports.length - 1) html += '<hr>';
  });
  return html;
};
