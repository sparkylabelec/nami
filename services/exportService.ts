
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType, 
  HeadingLevel,
  ImageRun,
  AlignmentType,
  ShadingType,
  VerticalAlign,
  ThematicBreak
} from "docx";
import { ReportBlock } from "../types";

/**
 * Word 내보내기를 위한 데이터 인터페이스
 */
export interface IExportData {
  title: string;
  author: string;
  htmlContent?: string;
  blocks?: ReportBlock[];
  fileName: string;
}

/**
 * 유효성 검사 로직
 */
export const validateExportData = (data: IExportData): boolean => {
  if (!data.title.trim()) throw new Error("제목이 없습니다.");
  if (!data.author.trim()) throw new Error("작성자 정보가 없습니다.");
  if (!data.htmlContent && (!data.blocks || data.blocks.length === 0)) {
    throw new Error("내보낼 내용이 없습니다.");
  }
  return true;
};

/**
 * 노드에서 제목 레벨 추출
 */
const getHeadingLevel = (node: Node): HeadingLevel | undefined => {
  const el = node as HTMLElement;
  const tag = el.tagName?.toLowerCase();
  
  if (tag === 'h1' || el.classList?.contains('ql-as-heading-1')) return HeadingLevel.HEADING_1;
  if (tag === 'h2' || el.classList?.contains('ql-as-heading-2')) return HeadingLevel.HEADING_2;
  if (tag === 'h3' || el.classList?.contains('ql-as-heading-3')) return HeadingLevel.HEADING_3;
  
  return undefined;
};

/**
 * RGB(A) 문자열을 6자리 Hex 문자열로 변환
 */
const colorToHex = (color: string): string => {
  if (!color) return "";
  if (color.startsWith('#')) return color.replace('#', '').toUpperCase();
  
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  
  return color.replace('#', '').toUpperCase();
};

/**
 * HTML 요소에서 인라인 스타일 추출
 */
const getStylesFromNode = (node: Node) => {
  const styles: any = {};
  let current: Node | null = node.parentElement;

  while (current && current.nodeName !== 'BODY') {
    const el = current as HTMLElement;
    const tag = el.tagName.toLowerCase();
    
    if (tag === 'strong' || tag === 'b') styles.bold = true;
    if (tag === 'em' || tag === 'i') styles.italic = true;
    if (tag === 'u') styles.underline = { type: 'single' };
    if (tag === 's' || tag === 'strike') styles.strike = true;
    
    if (el.style && el.style.color) {
      styles.color = colorToHex(el.style.color);
    }
    
    current = current.parentElement;
  }
  return styles;
};

const getAlignment = (node: Node): AlignmentType => {
  const el = node as HTMLElement;
  if (!el.classList) return AlignmentType.LEFT;
  if (el.classList.contains('ql-align-center')) return AlignmentType.CENTER;
  if (el.classList.contains('ql-align-right')) return AlignmentType.RIGHT;
  if (el.classList.contains('ql-align-justify')) return AlignmentType.JUSTIFY;
  return AlignmentType.LEFT;
};

/**
 * 이미지 URL을 ArrayBuffer로 변환
 */
const fetchImageBuffer = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch (e) {
    console.warn("이미지 로드 실패:", url, e);
    return null;
  }
};

/**
 * HTML 노드를 순회하며 Runs 생성
 */
const processNodeToRuns = async (node: Node): Promise<any[]> => {
  const items: any[] = [];
  const traverse = async (currentNode: Node) => {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const text = currentNode.textContent || "";
      if (text.length > 0) {
        items.push(new TextRun({ text, ...getStylesFromNode(currentNode) }));
      }
    } else if (currentNode.nodeName.toLowerCase() === 'br') {
      items.push(new TextRun({ break: 1 }));
    } else if (currentNode.nodeName.toLowerCase() === 'img') {
      const img = currentNode as HTMLImageElement;
      const buffer = await fetchImageBuffer(img.src);
      if (buffer) {
        items.push(new ImageRun({
          data: buffer,
          transformation: { width: 400, height: 300 }
        }));
      }
    } else {
      for (const child of Array.from(currentNode.childNodes)) {
        await traverse(child);
      }
    }
  };
  await traverse(node);
  return items;
};

/**
 * HTML 본문을 docx 요소로 변환
 */
const parseHtmlToElements = async (html: string): Promise<any[]> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || "", 'text/html');
  const body = doc.body;
  const elements: any[] = [];

  for (const node of Array.from(body.childNodes)) {
    const tag = node.nodeName.toLowerCase();
    const el = node as HTMLElement;
    
    if (node.nodeType === Node.TEXT_NODE && !(node.textContent || "").trim()) continue;

    if (tag === 'table') {
      const trs = Array.from(el.querySelectorAll('tr'));
      elements.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: await Promise.all(trs.map(async (tr, rowIndex) => new TableRow({
          children: await Promise.all(Array.from(tr.querySelectorAll('td, th')).map(async (td) => {
            return new TableCell({
              children: [new Paragraph({ 
                children: await processNodeToRuns(td),
                alignment: getAlignment(td)
              })],
              shading: rowIndex === 0 ? { fill: "F3F4F6", type: ShadingType.CLEAR } : undefined,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
              }
            });
          }))
        })))
      }));
    } else if (/^h[1-6]$/.test(tag)) {
      elements.push(new Paragraph({
        text: el.innerText || "",
        heading: getHeadingLevel(el),
        spacing: { before: 240, after: 120 }
      }));
    } else {
      const runs = await processNodeToRuns(node);
      if (runs.length > 0) {
        elements.push(new Paragraph({
          children: runs,
          spacing: { after: 120, line: 360 },
          alignment: getAlignment(node)
        }));
      }
    }
  }
  return elements;
};

/**
 * 메인 Export 함수
 */
export const exportToDocx = async (data: IExportData) => {
  try {
    validateExportData(data);
    
    let allElements: any[] = [];
    
    // 1. 블록 구조인 경우
    if (data.blocks) {
      for (const block of data.blocks) {
        if (block.type === 'info_header') {
          try {
            const info = JSON.parse(block.content);
            // 텍스트 헤더 레이아웃
            allElements.push(new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 600, after: 100 },
              children: [
                new TextRun({ text: "작성자 이름", size: 14, bold: true, color: "4F46E5", font: "Inter" }),
                new TextRun({ text: "  " + info.writer, size: 24, bold: true, color: "1E293B", font: "Inter" }),
                new TextRun({ text: "    |    ", size: 16, color: "E2E8F0" }),
                new TextRun({ text: "소속팀", size: 14, bold: true, color: "4F46E5", font: "Inter" }),
                new TextRun({ text: "  " + info.team, size: 24, bold: true, color: "1E293B", font: "Inter" }),
                new TextRun({ text: "    |    ", size: 16, color: "E2E8F0" }),
                new TextRun({ text: "작성일시", size: 14, bold: true, color: "4F46E5", font: "Inter" }),
                new TextRun({ text: "  " + info.date, size: 18, color: "64748B", font: "Inter" }),
              ]
            }));
            
            allElements.push(new Paragraph({
              border: {
                bottom: {
                  color: "E2E8F0",
                  space: 5,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              spacing: { after: 400 }
            }));
            
          } catch (e) { console.error("Info header parse fail", e); }
        } else if (block.type === 'text') {
          const els = await parseHtmlToElements(block.content);
          allElements.push(...els);
        } else if (block.type === 'image_gallery' && block.images) {
          allElements.push(new Paragraph({ text: "[이미지 갤러리]", heading: HeadingLevel.HEADING_3, spacing: { before: 400, after: 200 } }));
          for (let i = 0; i < block.images.length; i++) {
            const imgUrl = block.images[i];
            const caption = block.imageCaptions?.[i] || "";
            const buffer = await fetchImageBuffer(imgUrl);
            
            if (buffer) {
              allElements.push(new Paragraph({
                children: [new ImageRun({ data: buffer, transformation: { width: 450, height: 338 } })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 }
              }));
              
              if (caption) {
                allElements.push(new Paragraph({
                  children: [new TextRun({ text: `▲ ${caption}`, size: 18, color: "64748B", italic: true })],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100, after: 400 }
                }));
              } else {
                allElements.push(new Paragraph({ spacing: { after: 400 } }));
              }
            }
          }
        }
      }
    } 
    else if (data.htmlContent) {
      allElements = await parseHtmlToElements(data.htmlContent);
    }

    const doc = new Document({
      title: data.title,
      creator: data.author,
      sections: [{
        children: [
          new Paragraph({ 
            text: data.title, 
            heading: HeadingLevel.TITLE, 
            alignment: AlignmentType.CENTER, 
            spacing: { before: 800, after: 600 } 
          }),
          ...allElements
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.fileName.replace(/[<>:"/\\|?*]/g, '')}.docx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
    return true;
  } catch (error: any) {
    console.error("Export Error:", error);
    alert(`내보내기 실패: ${error.message}`);
    return false;
  }
};
