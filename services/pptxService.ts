
import pptxgen from "pptxgenjs";
import { ReportBlock } from "../types";

/**
 * PPTX 슬라이드 설정 상수
 */
const SLIDE_WIDTH = 10; // inches
const SLIDE_HEIGHT = 5.625; // inches (16:9)
const MARGIN = 0.5;
const CONTENT_WIDTH = SLIDE_WIDTH - (MARGIN * 2);
const FOOTER_TEXT = "(주)남이섬 | 나미나라공화국";

/**
 * HTML 특수 문자 디코딩 (&nbsp; 등 처리)
 */
const decodeHtml = (html: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value.replace(/\u00A0/g, ' '); // Non-breaking space를 일반 space로 변경
};

/**
 * 이미지 URL을 Base64 데이터 스트링으로 변환
 */
const imageUrlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("PPTX Export: Failed to fetch image:", url);
    return null;
  }
};

/**
 * 이미지 크기 계산
 */
const getScaledImageDim = async (url: string): Promise<{ w: number, h: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => resolve({ w: 4, h: 3 }), 4000);

    img.onload = () => {
      clearTimeout(timeout);
      const naturalRatio = (img.naturalWidth / img.naturalHeight) || 1;
      const targetW = CONTENT_WIDTH;
      let targetH = targetW / naturalRatio;
      const maxH = SLIDE_HEIGHT - 1.8;
      if (targetH > maxH) {
        targetH = maxH;
        resolve({ w: targetH * naturalRatio, h: targetH });
      } else {
        resolve({ w: targetW, h: targetH });
      }
    };
    img.onerror = () => { clearTimeout(timeout); resolve({ w: 4, h: 3 }); };
    img.src = url;
  });
};

export const exportToPptx = async (title: string, author: string, blocks: ReportBlock[]) => {
  try {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = author;
    pptx.title = title;

    // 1. 표지 슬라이드
    const titleSlide = pptx.addSlide();
    titleSlide.background = { fill: 'F8FAFC' };
    titleSlide.addText(title, {
      x: 0, y: '35%', w: '100%', align: 'center',
      fontSize: 44, bold: true, color: '1E293B', fontFace: 'Malgun Gothic'
    });
    titleSlide.addText(`${author} | ${new Date().toLocaleDateString()}`, {
      x: 0, y: '55%', w: '100%', align: 'center',
      fontSize: 18, color: '64748B', fontFace: 'Malgun Gothic'
    });
    titleSlide.addText(FOOTER_TEXT, {
      x: 0, y: '90%', w: '100%', align: 'center', fontSize: 10, color: '94A3B8'
    });

    // 2. 본문 블록 순회
    for (const block of blocks) {
      if (block.type === 'info_header') continue;

      if (block.type === 'text') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(block.content, 'text/html');
        const nodes = Array.from(doc.body.childNodes);
        
        let currentSlide = pptx.addSlide();
        currentSlide.addText(FOOTER_TEXT, { x: 0.5, y: 5.3, w: 9, fontSize: 9, color: '94A3B8' });
        let yOffset = MARGIN;

        for (const node of nodes) {
          const tag = node.nodeName.toLowerCase();
          
          // 텍스트 노드인 경우
          if (node.nodeType === Node.TEXT_NODE) {
            const text = decodeHtml(node.textContent || "").trim();
            if (!text) continue;
            currentSlide.addText(text, { x: MARGIN, y: yOffset, w: CONTENT_WIDTH, fontSize: 14, fontFace: 'Malgun Gothic' });
            yOffset += 0.4;
          } 
          // 테이블인 경우
          else if (tag === 'table') {
            const rows: any[] = [];
            const trs = (node as HTMLElement).querySelectorAll('tr');
            
            trs.forEach((tr, rowIndex) => {
              const rowData: any[] = [];
              const tds = tr.querySelectorAll('td, th');
              tds.forEach(td => {
                rowData.push({
                  text: decodeHtml(td.textContent || "").trim(),
                  options: {
                    fill: rowIndex === 0 ? 'F3F4F6' : undefined,
                    bold: rowIndex === 0,
                    fontSize: 10,
                    border: { type: 'solid', color: 'E2E8F0', size: 1 },
                    align: 'center',
                    valign: 'middle'
                  }
                });
              });
              if (rowData.length > 0) rows.push(rowData);
            });

            if (rows.length > 0) {
              // 테이블 높이 대략 계산 (행당 0.3인치)
              const tableHeight = rows.length * 0.35;
              
              // 슬라이드 범위를 초과하면 새 슬라이드 생성
              if (yOffset + tableHeight > SLIDE_HEIGHT - 1) {
                currentSlide = pptx.addSlide();
                currentSlide.addText(FOOTER_TEXT, { x: 0.5, y: 5.3, w: 9, fontSize: 9, color: '94A3B8' });
                yOffset = MARGIN;
              }

              currentSlide.addTable(rows, {
                x: MARGIN,
                y: yOffset,
                w: CONTENT_WIDTH,
                colW: Array(rows[0].length).fill(CONTENT_WIDTH / rows[0].length)
              });
              yOffset += tableHeight + 0.3;
            }
          } 
          // 기타 일반 태그 (p, h1, h2 등)
          else {
            const el = node as HTMLElement;
            const text = decodeHtml(el.innerText || "").trim();
            if (!text) continue;

            const isHeading = /^h[1-6]$/.test(tag);
            const fontSize = tag === 'h1' ? 24 : tag === 'h2' ? 20 : tag === 'h3' ? 18 : 14;

            if (yOffset + 0.5 > SLIDE_HEIGHT - 1) {
              currentSlide = pptx.addSlide();
              currentSlide.addText(FOOTER_TEXT, { x: 0.5, y: 5.3, w: 9, fontSize: 9, color: '94A3B8' });
              yOffset = MARGIN;
            }

            currentSlide.addText(text, {
              x: MARGIN,
              y: yOffset,
              w: CONTENT_WIDTH,
              fontSize: fontSize,
              bold: isHeading,
              color: isHeading ? '1E293B' : '333333',
              fontFace: 'Malgun Gothic'
            });
            yOffset += (fontSize / 72) * 2 + 0.2;
          }
        }
      }

      if (block.type === 'image_gallery' && block.images) {
        for (let i = 0; i < block.images.length; i++) {
          const imgUrl = block.images[i];
          const base64Data = await imageUrlToBase64(imgUrl);
          if (!base64Data) continue;

          const slide = pptx.addSlide();
          slide.addText(FOOTER_TEXT, { x: 0.5, y: 5.3, w: 9, fontSize: 9, color: '94A3B8' });
          const dim = await getScaledImageDim(imgUrl);

          slide.addImage({
            data: base64Data,
            x: (SLIDE_WIDTH - dim.w) / 2,
            y: (SLIDE_HEIGHT - dim.h - 0.5) / 2,
            w: dim.w,
            h: dim.h
          });

          const caption = block.imageCaptions?.[i];
          if (caption) {
            slide.addText(caption, {
              x: 0, y: SLIDE_HEIGHT - 0.8, w: '100%',
              align: 'center', fontSize: 12, color: '64748B', italic: true, fontFace: 'Malgun Gothic'
            });
          }
        }
      }
    }

    const safeFileName = `${title.replace(/[<>:"/\\|?*]/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
    await pptx.writeFile({ fileName: safeFileName });
    return true;
  } catch (err) {
    console.error("PPTX Export Error:", err);
    throw err;
  }
};
