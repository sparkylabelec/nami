
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Report, ReportBlock, BlockType } from '../types';
import { reportService } from '../services/reportService';
import { storageService } from '../services/storageService';
import { exportToDocx } from '../services/exportService';
import { exportToPptx } from '../services/pptxService';
import ReactQuill from 'react-quill-new';
import { 
  Plus, 
  Trash2, 
  ImageIcon, 
  Type as TypeIcon,
  X, 
  Loader2, 
  Save, 
  CheckCircle,
  ChevronLeft,
  Calendar as CalendarIcon,
  Upload,
  FileDown,
  User as UserIcon,
  Shield,
  Clock,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  MessageSquareText,
  Presentation,
  ChevronUp,
  ChevronDown,
  Search,
  RotateCcw
} from 'lucide-react';

interface Props { user: User; }

const ReportHeaderClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const day = now.getDate();
  const month = now.getMonth() + 1;
  const weekday = now.toLocaleDateString('ko-KR', { weekday: 'short' });
  const time = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex flex-col items-center justify-center bg-indigo-50 w-12 h-14 rounded-2xl border border-indigo-100 shrink-0">
        <span className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-1">{weekday}</span>
        <span className="text-xl font-black text-indigo-600 leading-none">{day}</span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-gray-400">
           <Clock size={12} className="text-indigo-300" />
           <span className="text-[10px] font-black uppercase tracking-widest">{month}월 {day}일 현황</span>
        </div>
        <span className="text-xl font-black text-gray-800 tabular-nums">{time}</span>
      </div>
    </div>
  );
};

const ReportBoard: React.FC<Props> = ({ user }) => {
  const location = useLocation();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isAdding, setIsAdding] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isExporting, setIsExporting] = useState<'word' | 'pptx' | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [titleFilter, setTitleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [uploadingBlockIds, setUploadingBlockIds] = useState<Set<string>>(new Set());
  const quillRefs = useRef<{ [key: string]: any }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeBlockIdForUpload = useRef<string | null>(null);

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ReportBlock[]>([]);

  useEffect(() => {
    if (!editingReport && !isAdding) {
      if (location.state?.initialBlocks) {
        const dateStr = new Date().toLocaleDateString();
        setTitle(`취합 보고서 (${dateStr})`);
        setBlocks(location.state.initialBlocks);
        setIsAdding(true);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, editingReport, isAdding]);

  const handleStartNewReport = () => {
    setEditingReport(null);
    setTitle('');
    const defaultBlock: ReportBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: '',
    };
    setBlocks([defaultBlock]);
    setIsAdding(true);
  };

  const handleExportToWord = async () => {
    if (!title.trim()) { alert('제목을 먼저 입력해주세요.'); return; }
    setIsExporting('word');
    try {
      await exportToDocx({
        title,
        author: user.name,
        blocks: blocks,
        fileName: `[Report]_${title}_${new Date().toISOString().split('T')[0]}`
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportToPptx = async () => {
    if (!title.trim()) { alert('제목을 먼저 입력해주세요.'); return; }
    setIsExporting('pptx');
    try {
      await exportToPptx(title, user.name, blocks);
    } catch (err) {
      console.error("PPTX Download Failed:", err);
      alert('PPTX 변환 중 오류가 발생했습니다. 브라우저의 팝업 차단이나 네트워크 상태를 확인해주세요.');
    } finally {
      setIsExporting(null);
    }
  };

  const syncImagesToStorage = async (currentBlocks: ReportBlock[]): Promise<ReportBlock[]> => {
    const syncedBlocks = [...currentBlocks];
    const path = `reports/${user.uid}/inlines`;

    for (let i = 0; i < syncedBlocks.length; i++) {
      const block = syncedBlocks[i];
      if (block.type === 'text') {
        const div = document.createElement('div');
        div.innerHTML = block.content;
        const imgs = Array.from(div.querySelectorAll('img'));
        let hasChanges = false;

        for (const img of imgs) {
          if (img.src.startsWith('data:image/')) {
            try {
              const remoteUrl = await storageService.uploadBase64(img.src, path);
              img.src = remoteUrl;
              hasChanges = true;
            } catch (err) {
              console.error("Inline image sync failed:", err);
            }
          }
        }

        if (hasChanges) {
          syncedBlocks[i] = { ...block, content: div.innerHTML };
        }
      }
    }
    return syncedBlocks;
  };

  const headerHandler = (value: any, blockId: string) => {
    const quill = quillRefs.current[blockId]?.getEditor();
    if (!quill) return;
    quill.format('header', value);
  };

  const listHandler = (value: any, blockId: string) => {
    const quill = quillRefs.current[blockId]?.getEditor();
    if (!quill) return;
    quill.format('list', value);
  };

  const getQuillModules = (blockId: string) => ({
    toolbar: {
      container: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], [{ 'indent': '-1' }, { 'indent': '+1' }], ['table'], ['link', 'clean']],
      handlers: { 'header': (val: any) => headerHandler(val, blockId), 'list': (val: any) => listHandler(val, blockId) }
    },
    table: true,
  });

  useEffect(() => { fetchReports(); }, [user.uid]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const userReports = await reportService.getReportsByUser(user.uid);
      setReports(userReports);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesTitle = r.title.toLowerCase().includes(titleFilter.toLowerCase());
      const matchesDate = dateFilter ? r.createdAt.startsWith(dateFilter) : true;
      return matchesTitle && matchesDate;
    });
  }, [reports, titleFilter, dateFilter]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const addBlock = (type: BlockType) => {
    const newBlock: ReportBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: '',
    };
    
    if (type === 'image_gallery') {
      newBlock.images = [];
      newBlock.imageCaptions = [];
    }
    
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const updateImageCaption = (blockId: string, imageIndex: number, caption: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId && b.imageCaptions) {
        const newCaptions = [...b.imageCaptions];
        newCaptions[imageIndex] = caption;
        return { ...b, imageCaptions: newCaptions };
      }
      return b;
    }));
  };

  const removeImage = (blockId: string, imageIndex: number) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId && b.images && b.imageCaptions) {
        const newImages = b.images.filter((_, idx) => idx !== imageIndex);
        const newCaptions = b.imageCaptions.filter((_, idx) => idx !== imageIndex);
        return { ...b, images: newImages, imageCaptions: newCaptions };
      }
      return b;
    }));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (quillRefs.current[id]) delete quillRefs.current[id];
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const triggerImageUpload = (blockId: string) => {
    activeBlockIdForUpload.current = blockId;
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const blockId = activeBlockIdForUpload.current;
    if (!files || !blockId) return;
    
    const block = blocks.find(b => b.id === blockId);
    if (!block || block.type !== 'image_gallery') return;

    setUploadingBlockIds(prev => new Set(prev).add(blockId));
    try {
      const uploadPromises = (Array.from(files) as File[]).map(file => 
        storageService.uploadImage(file, `reports/${user.uid}/images`)
      );
      const uploadedUrls = await Promise.all(uploadPromises);
      
      setBlocks(prev => prev.map(b => {
        if (b.id === blockId) {
          const newImages = [...(b.images || []), ...uploadedUrls];
          const newCaptions = [...(b.imageCaptions || [])];
          uploadedUrls.forEach(() => newCaptions.push(''));
          return { ...b, images: newImages, imageCaptions: newCaptions };
        }
        return b;
      }));
    } catch (error) {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingBlockIds(prev => { const next = new Set(prev); next.delete(blockId); return next; });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const safeTitle = title.trim();
    if (!safeTitle) { alert('제목을 입력해주세요.'); return; }
    if (blocks.length === 0) { alert('내용을 작성해주세요.'); return; }
    
    setStatus('saving');
    try {
      const cleanBlocks = await syncImagesToStorage(blocks);
      
      const reportData: Report = {
        reportId: editingReport?.reportId || Math.random().toString(36).substr(2, 9),
        authorId: user.uid,
        authorName: user.name,
        department: user.department, 
        teamId: user.teamId,         
        title: safeTitle,
        content: { blocks: cleanBlocks },
        createdAt: editingReport?.createdAt || new Date().toISOString(),
        status: 'submitted'
      };
      
      await reportService.saveReport(reportData);
      setStatus('success');
      setTimeout(() => { 
        setIsAdding(false); 
        setEditingReport(null); 
        setTitle(''); 
        setBlocks([]); 
        fetchReports(); 
        setStatus('idle'); 
      }, 1000);
    } catch (error) {
      setStatus('error');
      alert('저장 중 오류가 발생했습니다.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report); setTitle(report.title); setBlocks(report.content.blocks || []); setIsAdding(true);
  };

  const renderInfoHeader = (content: string) => {
    try {
      const data = JSON.parse(content);
      return (
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 bg-gradient-to-br from-white to-slate-50 border border-slate-200 py-6 px-10 rounded-[2.5rem] shadow-sm">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1.5">
              <UserIcon size={12} className="text-indigo-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">작성자 이름</span>
            </div>
            <span className="text-base font-extrabold text-slate-800">{data.writer}</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield size={12} className="text-indigo-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">소속팀</span>
            </div>
            <span className="text-base font-extrabold text-slate-800">{data.team}</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock size={12} className="text-indigo-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">작성일시</span>
            </div>
            <span className="text-sm font-bold text-slate-500">{data.date}</span>
          </div>
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  if (isAdding) {
    return (
      <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/80 backdrop-blur-md py-4 z-10 px-4 rounded-b-3xl">
          <button onClick={() => { setIsAdding(false); setEditingReport(null); setTitle(''); setBlocks([]); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
          
          <div className="hidden md:block">
            <ReportHeaderClock />
          </div>

          <div className="flex gap-2">
            <button onClick={handleExportToPptx} disabled={!!isExporting} className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-amber-50 border border-amber-100 text-amber-700 rounded-full font-bold shadow-sm hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-50 text-[10px] md:text-sm">
              {isExporting === 'pptx' ? <Loader2 className="animate-spin" size={14} /> : <Presentation size={14} className="md:w-4 md:h-4" />}
              <span className="hidden xs:inline">PPTX 저장</span>
              <span className="xs:hidden">PPTX</span>
            </button>
            <button onClick={handleExportToWord} disabled={!!isExporting} className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-200 text-gray-700 rounded-full font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 text-[10px] md:text-sm">
              {isExporting === 'word' ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} className="md:w-4 md:h-4" />}
              <span className="hidden xs:inline">Word 저장</span>
              <span className="xs:hidden">Word</span>
            </button>
            <button onClick={handleSave} disabled={status === 'saving'} className={`flex items-center gap-1.5 md:gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-full font-bold shadow-lg transition-all active:scale-95 ${status === 'success' ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:opacity-50 text-[10px] md:text-sm ml-1 md:ml-2`}>
              {status === 'saving' ? <Loader2 className="animate-spin" size={16} /> : status === 'success' ? <CheckCircle size={16} /> : <Save size={16} />}
              {status === 'saving' ? '저장 중' : status === 'success' ? '완료' : '저장하기'}
            </button>
          </div>
        </div>
        
        <div className="mb-10 px-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="보고서 제목" className="w-full text-4xl font-extrabold text-gray-900 border-none bg-transparent outline-none" />
        </div>

        {/* 편집 캔버스 영역 */}
        <div className="flex flex-col px-4">
          <div className="space-y-10 w-full">
            {blocks.map((block, index) => (
              <div key={block.id} className={`relative group overflow-hidden ${block.type === 'info_header' ? '' : 'bg-white rounded-2xl shadow-sm border border-gray-100'}`}>
                {block.type !== 'info_header' && (
                  <div className="flex items-center justify-between px-6 py-3 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{block.type}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-20 transition-colors">
                          <ChevronUp size={16} />
                        </button>
                        <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-20 transition-colors">
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => removeBlock(block.id)} className="text-gray-300 hover:text-red-400"><X size={16} /></button>
                  </div>
                )}
                
                {block.type === 'info_header' ? (
                  <div className="relative group/info">
                    {renderInfoHeader(block.content)}
                    <button onClick={() => removeBlock(block.id)} className="absolute -top-2 -right-2 bg-white text-gray-300 hover:text-red-400 shadow-sm border border-gray-100 p-1 rounded-full opacity-0 group-hover/info:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ) : block.type === 'text' ? (
                  <ReactQuill ref={(el) => (quillRefs.current[block.id] = el)} theme="snow" value={block.content} onChange={(val) => updateBlock(block.id, val)} modules={getQuillModules(block.id)} />
                ) : (
                  <div className="p-8 bg-gray-50/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-4">
                      {block.images?.map((img, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 group/img">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                            <img src={img} className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(block.id, idx)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="relative">
                            <MessageSquareText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                            <input type="text" placeholder="사진에 대한 설명을 입력하세요..." value={block.imageCaptions?.[idx] || ''} onChange={(e) => updateImageCaption(block.id, idx, e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => triggerImageUpload(block.id)} disabled={uploadingBlockIds.has(block.id)} className="aspect-[4/3] bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-indigo-50 hover:border-indigo-300 transition-all group/add">
                        {uploadingBlockIds.has(block.id) ? (
                          <Loader2 className="animate-spin text-indigo-400" size={32} />
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover/add:bg-indigo-100 group-hover/add:text-indigo-600 transition-colors">
                              <Upload size={24} />
                            </div>
                            <span className="text-sm font-bold group-hover/add:text-indigo-600">이미지 추가</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 블록 추가 영역 - 아이콘만 노출되도록 최적화된 컴팩트 디자인 */}
          <div className="mt-14 mb-20 flex justify-center w-full animate-in fade-in slide-in-from-top-2 duration-700 delay-150">
            <div className="bg-white/90 backdrop-blur-md border border-gray-100 shadow-[0_12px_45px_rgba(0,0,0,0.06)] rounded-full p-2 flex items-center gap-2 ring-1 ring-black/[0.02]">
              <button 
                onClick={() => addBlock('text')} 
                className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-full transition-all active:scale-90 group"
                title="텍스트 블록 추가"
              >
                <TypeIcon size={20} className="transition-transform group-hover:scale-110" />
              </button>
              
              <div className="w-[1px] h-6 bg-gray-100 mx-1"></div>
              
              <button 
                onClick={() => addBlock('image_gallery')} 
                className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-full transition-all active:scale-90 group"
                title="이미지 블록 추가"
              >
                <ImageIcon size={20} className="transition-transform group-hover:scale-110" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">업무 보고</h2>
          <p className="text-gray-500 mt-2 font-medium italic">사업부: {user.department} | 팀: {user.teamId}</p>
        </div>
        
        <div className="hidden xl:block">
           <ReportHeaderClock />
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="bg-white/60 backdrop-blur-md border border-gray-200 rounded-2xl p-1 flex shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="그리드 보기"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="리스트 보기"
            >
              <ListIcon size={20} />
            </button>
          </div>
          <button onClick={handleStartNewReport} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
            <Plus size={20} /> 새 보고서 작성
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="제목으로 보고서 검색..." 
            value={titleFilter}
            onChange={(e) => { setTitleFilter(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold transition-all"
            />
          </div>
          {(titleFilter || dateFilter) && (
            <button 
              onClick={() => { setTitleFilter(''); setDateFilter(''); setCurrentPage(1); }}
              className="p-2.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-2xl transition-all"
              title="필터 초기화"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-300" size={48} />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl font-bold italic bg-white/50">
          {reports.length === 0 ? "작성된 보고서가 없습니다." : "조건에 맞는 보고서가 없습니다."}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedReports.map((report) => (
            <div key={report.reportId} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group" onClick={() => handleEdit(report)}>
              <div className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <CalendarIcon size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{report.title}</h3>
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                <CalendarIcon size={14} />{new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          <div className="grid grid-cols-12 px-8 py-4 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <div className="col-span-1">No.</div>
            <div className="col-span-6">제목</div>
            <div className="col-span-3">작성일시</div>
            <div className="col-span-2 text-right">상태</div>
          </div>
          {paginatedReports.map((report, idx) => (
            <div 
              key={report.reportId} 
              onClick={() => handleEdit(report)}
              className="grid grid-cols-12 px-8 py-6 items-center hover:bg-indigo-50 transition-colors cursor-pointer group"
            >
              <div className="col-span-1 text-sm font-bold text-gray-300 group-hover:text-indigo-300">
                {filteredReports.length - ((currentPage - 1) * itemsPerPage) - idx}
              </div>
              <div className="col-span-6">
                <h3 className="text-base font-bold text-gray-800 group-hover:text-indigo-600 truncate mr-4">
                  {report.title}
                </h3>
              </div>
              <div className="col-span-3 flex items-center gap-2 text-sm text-gray-400 font-medium">
                <Clock size={14} className="text-gray-300" />
                {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="col-span-2 text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase">
                  <CheckCircle size={10} />
                  Submitted
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                currentPage === i + 1 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportBoard;
