
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Report, UserLevel, ORG_STRUCTURE } from '../types';
import { reportService } from '../services/reportService';
import { reportsToBlocks } from '../services/reportIntegration';
import { 
  Calendar, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Building2, 
  CheckSquare, 
  Square, 
  X,
  FilePlus,
  SortAsc,
  CalendarRange,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Navigation,
  Filter
} from 'lucide-react';

interface Props { user: User; }

const AggregationView: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string | null>(new Date().toISOString().split('T')[0]);
  
  const [deptFilter, setDeptFilter] = useState<string>(user.level >= UserLevel.REPORTER ? 'ALL' : user.department);
  const [teamFilter, setTeamFilter] = useState<string>(user.level >= UserLevel.REPORTER ? 'ALL' : user.teamId);
  const [sortBy, setSortBy] = useState<'date' | 'dept' | 'team'>('dept'); 
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [jumpPage, setJumpPage] = useState('');
  
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { 
    fetchReports(); 
    setCurrentPage(1); 
  }, [dateFilter, deptFilter, teamFilter]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let data: Report[] = [];
      const all = await reportService.getReports();
      
      if (deptFilter === 'ALL') {
        data = all;
      } else {
        data = all.filter(r => r.department === deptFilter);
        if (teamFilter !== 'ALL') {
          data = data.filter(r => r.teamId === teamFilter);
        }
      }
      
      if (user.level === UserLevel.REPORTER) {
        data = data.filter(r => r.authorId !== user.uid);
      }
      
      const filtered = dateFilter 
        ? data.filter(r => (r.createdAt || '').startsWith(dateFilter))
        : data;
        
      setReports(filtered);
      setSelectedIds(new Set());
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const sortedReports = useMemo(() => {
    const sorted = [...reports];
    sorted.sort((a, b) => {
      const aDept = a.department || '';
      const bDept = b.department || '';
      const aTeam = a.teamId || '';
      const bTeam = b.teamId || '';
      const aDate = a.createdAt || '';
      const bDate = b.createdAt || '';

      if (sortBy === 'dept') {
        const deptComp = aDept.localeCompare(bDept);
        if (deptComp !== 0) return deptComp;
        return aTeam.localeCompare(bTeam);
      }
      if (sortBy === 'team') {
        const teamComp = aTeam.localeCompare(bTeam);
        if (teamComp !== 0) return teamComp;
        return aDept.localeCompare(bDept);
      }
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
    return sorted;
  }, [reports, sortBy]);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedReports.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedReports, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(reports.length / itemsPerPage);

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPage('');
    } else {
      alert(`1에서 ${totalPages} 사이의 페이지 번호를 입력해주세요.`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reports.length && reports.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reports.map(r => r.reportId)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleIntegrateReports = () => {
    if (selectedIds.size === 0) return;
    const finalReports = sortedReports.filter(r => selectedIds.has(r.reportId));
    const blocks = reportsToBlocks(finalReports);
    navigate('/reports', { state: { initialBlocks: blocks } });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
            currentPage === i 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' 
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32 animate-in fade-in duration-500 relative">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row xl:items-start justify-between gap-8">
        <div className="shrink-0">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">보고서 취합</h2>
          <p className="text-gray-500 mt-1 font-medium text-sm">
            {deptFilter === 'ALL' ? '전사 조직' : `${deptFilter} 사업부`} 업무 현황
          </p>
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          {/* Row 1: Main Selection Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {user.level >= UserLevel.REPORTER && (
              <>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100 transition-all focus-within:ring-2 focus-within:ring-indigo-100">
                  <Building2 size={15} className="text-indigo-500" />
                  <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setTeamFilter('ALL'); }} className="outline-none text-[11px] font-black text-gray-700 bg-transparent">
                    <option value="ALL">전체 사업부</option>
                    {Object.keys(ORG_STRUCTURE).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100 transition-all focus-within:ring-2 focus-within:ring-indigo-100">
                  <Users size={15} className="text-indigo-500" />
                  <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} disabled={deptFilter === 'ALL'} className="outline-none text-[11px] font-black text-gray-700 bg-transparent disabled:opacity-30">
                    <option value="ALL">전체 팀</option>
                    {deptFilter !== 'ALL' && ORG_STRUCTURE[deptFilter].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100 transition-all focus-within:ring-2 focus-within:ring-indigo-100">
              <LayoutList size={15} className="text-indigo-500" />
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                className="outline-none text-[11px] font-black text-gray-700 bg-transparent"
              >
                <option value={10}>10개씩 보기</option>
                <option value={20}>20개씩 보기</option>
                <option value={50}>50개씩 보기</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100 transition-all focus-within:ring-2 focus-within:ring-indigo-100">
              <SortAsc size={15} className="text-indigo-500" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="outline-none text-[11px] font-black text-gray-700 bg-transparent">
                <option value="dept">사업부순</option>
                <option value="team">팀순</option>
                <option value="date">최신순</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date Filters */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-4 bg-gray-50 px-5 py-2.5 rounded-full border transition-all ${!dateFilter ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-100 shadow-inner'}`}>
              <div className="flex items-center gap-2">
                <Calendar size={15} className={dateFilter ? "text-gray-400" : "text-indigo-500"} />
                <input 
                  type="date" 
                  value={dateFilter || ""} 
                  onChange={(e) => setDateFilter(e.target.value || null)} 
                  className="outline-none text-[11px] font-black text-gray-700 bg-transparent" 
                />
              </div>
              <div className="w-[1px] h-4 bg-gray-200"></div>
              <button 
                onClick={() => setDateFilter(null)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all ${!dateFilter ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
              >
                <CalendarRange size={12} />
                전체 날짜
              </button>
            </div>
            
            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-auto flex items-center gap-2">
              <Filter size={12} />
              Aggregation Filter Active
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black text-gray-800 flex items-center gap-4">
              <div className="w-2.5 h-8 bg-indigo-600 rounded-full"></div>
              대상 리스트 ({reports.length})
            </h3>
            {reports.length > 0 && (
              <button 
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black text-gray-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all"
              >
                {selectedIds.size === reports.length ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
                전체 선택
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-4 min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-indigo-300" size={48} />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-24 text-gray-400 font-bold italic border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white/50">
              조건에 맞는 보고서가 없습니다.
            </div>
          ) : (
            <>
              {paginatedReports.map((report) => (
                <div 
                  key={report.reportId} 
                  className={`bg-white rounded-[2rem] border transition-all hover:shadow-md overflow-hidden group ${selectedIds.has(report.reportId) ? 'border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/10' : 'border-gray-100 shadow-sm'}`}
                >
                  <div className="flex items-stretch">
                    <div 
                      onClick={(e) => toggleSelect(report.reportId, e)}
                      className="px-8 flex items-center justify-center cursor-pointer hover:bg-indigo-50/50 transition-colors"
                    >
                      {selectedIds.has(report.reportId) ? (
                        <CheckSquare size={26} className="text-indigo-600 animate-in zoom-in-75 duration-200" />
                      ) : (
                        <Square size={26} className="text-gray-300 group-hover:text-indigo-300" />
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setExpandedReport(expandedReport === report.reportId ? null : report.reportId)} 
                      className="flex-1 py-8 pr-10 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-[1.5rem] transition-all shadow-sm flex items-center justify-center ${selectedIds.has(report.reportId) ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                          <Users size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className={`text-base font-black ${selectedIds.has(report.reportId) ? 'text-indigo-800' : 'text-indigo-600'}`}>{report.authorName}</span>
                            <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em]">{report.department} · {report.teamId}</span>
                          </div>
                          <p className={`text-xl font-black leading-tight tracking-tight ${selectedIds.has(report.reportId) ? 'text-indigo-950' : 'text-gray-800'}`}>{report.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-[11px] font-black text-gray-400 tracking-wider bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">{new Date(report.createdAt || Date.now()).toLocaleDateString()}</span>
                        {expandedReport === report.reportId ? (
                          <ChevronUp size={28} className="text-indigo-400" />
                        ) : (
                          <ChevronDown size={28} className="text-gray-300 group-hover:text-indigo-400" />
                        )}
                      </div>
                    </button>
                  </div>

                  {expandedReport === report.reportId && (
                    <div className="px-20 pb-12 pt-6 border-t border-gray-50 bg-gray-50/30 animate-in slide-in-from-top-4 duration-500">
                      {report.content.blocks.map((block) => (
                        <div key={block.id} className="mb-10 last:mb-0">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-1.5 h-4 bg-indigo-300 rounded-full"></div>
                            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.25em]">
                              {block.type === 'text' ? '업무 보고 상세 내역' : '현장 첨부 이미지'}
                            </p>
                          </div>
                          
                          {block.type === 'text' ? (
                            <div 
                              className="text-lg text-gray-700 ql-editor !p-0 !min-h-0 leading-relaxed font-medium" 
                              dangerouslySetInnerHTML={{ __html: block.content }} 
                            />
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                              {block.images?.map((img, idx) => (
                                <div key={idx} className="space-y-4">
                                  <div className="aspect-[16/10] rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg">
                                    <img 
                                      src={img} 
                                      alt={`첨부 이미지 ${idx + 1}`} 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                  {block.imageCaptions?.[idx] && (
                                    <div className="flex items-start gap-3 px-4">
                                      <MessageSquareText size={16} className="text-indigo-400 mt-1 shrink-0" />
                                      <p className="text-sm font-bold text-gray-500 italic leading-relaxed">
                                        {block.imageCaptions[idx]}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* 페이지네이션 컨트롤 */}
              {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-center gap-10 mt-16 py-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {renderPageNumbers()}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  <div className="h-10 w-px bg-gray-100 hidden md:block"></div>

                  <form onSubmit={handleJumpPage} className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                      <Navigation size={16} className="text-gray-400" />
                      <input 
                        type="text" 
                        value={jumpPage}
                        onChange={(e) => setJumpPage(e.target.value)}
                        placeholder={currentPage.toString()}
                        className="w-12 bg-transparent text-center text-base font-black text-indigo-600 outline-none"
                      />
                      <span className="text-xs font-black text-gray-300">/ {totalPages}</span>
                    </div>
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                      이동
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-20 duration-700 w-max max-w-full px-4">
          <div className="bg-gray-900/95 text-white rounded-[3rem] px-10 py-5 shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl ring-4 ring-indigo-500/20">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-black text-lg ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/40">
                {selectedIds.size}
              </div>
              <div>
                <p className="font-black text-sm tracking-tight">선택된 보고서</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ready to Aggregate</p>
              </div>
            </div>
            
            <div className="h-8 w-[1px] bg-white/10"></div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleIntegrateReports}
                className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-3.5 rounded-[1.5rem] font-black text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
              >
                <FilePlus size={20} />
                취합 보고서 작성 시작
              </button>

              <button 
                onClick={() => setSelectedIds(new Set())}
                className="p-3.5 hover:bg-white/10 rounded-[1.25rem] transition-all text-gray-400 hover:text-white"
                title="선택 해제"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AggregationView;
