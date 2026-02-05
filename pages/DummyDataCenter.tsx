
import React, { useState, useEffect } from 'react';
import { User, UserLevel, ORG_STRUCTURE } from '../types';
import { dummyService } from '../services/dummyService';
import { userService } from '../services/userService';
import { 
  Database, 
  UserPlus, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Terminal,
  Zap,
  FileText,
  Search,
  CheckSquare,
  Square,
  Users,
  Trash2,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';

interface Props { user: User; }

const DummyDataCenter: React.FC<Props> = ({ user: currentUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'cleanup'>('users');
  
  // User Generation States
  const [dept, setDept] = useState('');
  const [team, setTeam] = useState('');
  const [level, setLevel] = useState<UserLevel>(UserLevel.MEMBER);
  const [userCount, setUserCount] = useState(5);
  
  // Report Generation States
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [reportCountPerUser, setReportCountPerUser] = useState(2);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // Shared Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalCreated, setTotalCreated] = useState(0);
  const [actionType, setActionType] = useState<'create' | 'delete' | 'idle'>('idle');

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchAvailableUsers();
    }
  }, [activeTab]);

  const fetchAvailableUsers = async () => {
    try {
      const all = await userService.getAllUsers();
      setAvailableUsers(all);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredUsers = availableUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.teamId.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const toggleUserSelection = (uid: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelectedUserIds(next);
  };

  const handleCreateUsers = async () => {
    if (!dept || !team) { alert('사업부와 팀을 선택해주세요.'); return; }
    setLogs([]);
    setIsProcessing(true);
    setProgress(0);
    setActionType('create');

    try {
      const results = await dummyService.createDummyUsers({
        department: dept, teamId: team, level: level, count: userCount
      }, (msg) => {
        setLogs(prev => [msg, ...prev].slice(0, 50));
      });
      setTotalCreated(results.length);
    } catch (error) {
      alert('생성 중 오류 발생');
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleCreateReports = async () => {
    if (selectedUserIds.size === 0) { alert('리포트를 작성할 대상을 선택해주세요.'); return; }
    
    setLogs([]);
    setIsProcessing(true);
    setProgress(0);
    setTotalCreated(0);
    setActionType('create');

    const targetUsers = availableUsers.filter(u => selectedUserIds.has(u.uid));

    try {
      const results = await dummyService.createDummyReports(
        targetUsers, 
        reportCountPerUser, 
        (msg, prog) => {
          setLogs(prev => [msg, ...prev].slice(0, 50));
          setProgress(prog);
        }
      );
      setTotalCreated(results.length);
    } catch (error) {
      alert('리포트 생성 중 오류 발생');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAllDummies = async (type: 'users' | 'reports') => {
    const confirmMsg = type === 'users' ? "모든 더미 회원 데이터를 삭제하시겠습니까?" : "모든 더미 리포트 데이터를 삭제하시겠습니까?";
    if (!window.confirm(confirmMsg + "\n이 작업은 복구가 불가능합니다.")) return;

    setLogs([]);
    setIsProcessing(true);
    setProgress(0);
    setTotalCreated(0);
    setActionType('delete');

    try {
      let count = 0;
      if (type === 'users') {
        count = await dummyService.deleteAllDummyUsers((msg, prog) => {
          setLogs(prev => [msg, ...prev].slice(0, 50));
          setProgress(prog);
        });
      } else {
        count = await dummyService.deleteAllDummyReports((msg, prog) => {
          setLogs(prev => [msg, ...prev].slice(0, 50));
          setProgress(prog);
        });
      }
      setTotalCreated(count);
    } catch (err) {
      alert("삭제 작업 중 치명적 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 flex items-center gap-4 tracking-tighter">
            <Database className="text-amber-500" size={40} />
            데이터 시뮬레이터
          </h2>
          <p className="text-gray-500 mt-1 font-medium italic">QA 및 시스템 부하 테스트를 위한 고품질 더미 데이터 팩토리</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-[2rem] w-fit shadow-inner gap-1">
        <button 
          onClick={() => { setActiveTab('users'); setActionType('idle'); setLogs([]); setProgress(0); }}
          className={`px-6 md:px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <UserPlus size={18} />
          더미 회원 생성
        </button>
        <button 
          onClick={() => { setActiveTab('reports'); setActionType('idle'); setLogs([]); setProgress(0); }}
          className={`px-6 md:px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <FileText size={18} />
          리포트 벌크 생성
        </button>
        <button 
          onClick={() => { setActiveTab('cleanup'); setActionType('idle'); setLogs([]); setProgress(0); }}
          className={`px-6 md:px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'cleanup' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-rose-500'}`}
        >
          <RefreshCcw size={18} />
          데이터 정리
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Settings Area */}
        <div className="xl:col-span-7 space-y-8">
          {activeTab === 'users' ? (
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm ring-1 ring-amber-100">
                  <UserPlus size={24} />
                </div>
                <h3 className="text-2xl font-black text-gray-900">회원 생성 파라미터</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">사업부</label>
                  <select value={dept} onChange={(e) => { setDept(e.target.value); setTeam(''); }} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-sm font-bold">
                    <option value="">사업부 선택</option>
                    {Object.keys(ORG_STRUCTURE).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">소속 팀</label>
                  <select value={team} onChange={(e) => setTeam(e.target.value)} disabled={!dept} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-sm font-bold disabled:opacity-30">
                    <option value="">팀 선택</option>
                    {dept && ORG_STRUCTURE[dept].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">권한 등급</label>
                  <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-sm font-bold">
                    <option value={UserLevel.MEMBER}>LV1 팀원</option>
                    <option value={UserLevel.LEADER}>LV2 책임매니저</option>
                    <option value={UserLevel.REPORTER}>LV3 리포터</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">생성 수량</label>
                  <input type="number" min={1} max={50} value={userCount} onChange={(e) => setUserCount(Number(e.target.value))} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-sm font-bold" />
                </div>
              </div>
              <button 
                onClick={handleCreateUsers} 
                disabled={isProcessing} 
                className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-95 disabled:opacity-30 shadow-2xl shadow-gray-200"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} className="text-amber-400" />}
                인력 투입 시작
              </button>
            </div>
          ) : activeTab === 'reports' ? (
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">리포트 벌크 생성</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-400">1인당 생성 수:</span>
                  <input 
                    type="number" 
                    value={reportCountPerUser} 
                    onChange={(e) => setReportCountPerUser(Number(e.target.value))} 
                    className="w-16 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-center font-black text-sm outline-none" 
                  />
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="대상 회원 검색 (이름, 팀, 이메일)..." 
                  value={userSearchTerm} 
                  onChange={(e) => setUserSearchTerm(e.target.value)} 
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold transition-all" 
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {filteredUsers.map(u => (
                  <div 
                    key={u.uid} 
                    onClick={() => toggleUserSelection(u.uid)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${selectedUserIds.has(u.uid) ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100/50' : 'bg-white border-gray-50 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      {selectedUserIds.has(u.uid) ? <CheckSquare className="text-indigo-600" size={20} /> : <Square className="text-gray-300" size={20} />}
                      <div>
                        <p className="text-sm font-black text-gray-800">{u.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{u.department} · {u.teamId}</p>
                      </div>
                    </div>
                    <div className="text-[10px] font-black px-2 py-1 bg-white border border-gray-100 rounded-md text-gray-400">LV.{u.level}</div>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleCreateReports} 
                disabled={isProcessing || selectedUserIds.size === 0} 
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-30 shadow-2xl shadow-indigo-100"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} className="text-white" />}
                고품질 리포트 {selectedUserIds.size * reportCountPerUser}건 자동 작성
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-10 border border-rose-100 shadow-sm space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm ring-1 ring-rose-100">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-2xl font-black text-gray-900">시스템 데이터 정리</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-rose-50/50 border border-rose-100 p-8 rounded-[2rem] space-y-6 flex flex-col items-center text-center">
                  <Users className="text-rose-500" size={48} />
                  <div>
                    <h4 className="font-black text-lg text-gray-900 mb-2">더미 회원 일괄 삭제</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">ID가 <span className="text-rose-600 font-bold">'dum_'</span>으로 시작하거나 <span className="text-rose-600 font-bold">더미 플래그</span>가 설정된 모든 사용자 프로필을 영구 삭제합니다.</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteAllDummies('users')}
                    disabled={isProcessing}
                    className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 disabled:opacity-30"
                  >
                    더미 회원 청소
                  </button>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 p-8 rounded-[2rem] space-y-6 flex flex-col items-center text-center">
                  <FileText className="text-rose-500" size={48} />
                  <div>
                    <h4 className="font-black text-lg text-gray-900 mb-2">더미 리포트 일괄 삭제</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">ID가 <span className="text-rose-600 font-bold">'rep_dum_'</span>으로 시작하거나 <span className="text-rose-600 font-bold">더미 플래그</span>가 설정된 모든 업무 보고서를 영구 삭제합니다.</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteAllDummies('reports')}
                    disabled={isProcessing}
                    className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 disabled:opacity-30"
                  >
                    더미 리포트 청소
                  </button>
                </div>
              </div>
              <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex gap-4 items-start">
                <AlertCircle className="text-amber-600 shrink-0" size={24} />
                <div className="text-xs text-amber-800 leading-relaxed font-medium">
                  <p className="font-black text-sm mb-1">주의 사항</p>
                  <p>일괄 삭제 기능은 테스트 데이터를 정리하기 위해 설계되었습니다. 실제 사용자가 생성한 데이터는 삭제되지 않도록 ID 접두사와 플래그를 엄격히 대조합니다. 삭제된 데이터는 복구할 수 없습니다.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Monitoring Area */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm overflow-hidden">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 px-2 flex items-center gap-2">
              <Terminal size={16} /> Status Monitor
            </h4>
            <div className="space-y-6">
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${actionType === 'delete' ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 via-indigo-500 to-indigo-600'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-end px-2">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">{progress}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{actionType === 'delete' ? 'Deleted' : 'Created'}</p>
                  <p className={`text-3xl font-black tracking-tighter ${actionType === 'delete' ? 'text-rose-600' : 'text-indigo-600'}`}>
                    {totalCreated} <span className="text-sm font-bold text-gray-400 uppercase">Items</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl border border-gray-800 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6 px-2">
              <div className={`flex items-center gap-2 ${actionType === 'delete' ? 'text-rose-400' : 'text-indigo-400'}`}>
                <Terminal size={18} />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">{actionType === 'delete' ? 'Cleanup Log' : 'Console Output'}</h4>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 custom-scrollbar pr-4">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-700 italic font-medium">
                  System IDLE... Waiting for parameters
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
                    <span className="text-gray-600 shrink-0 font-bold">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                    <span className={`leading-relaxed ${log.includes('[오류]') || log.includes('[삭제실패]') || log.includes('[실패]') ? 'text-red-400' : log.includes('[성공]') || log.includes('[진행]') || log.includes('[삭제성공]') ? (actionType === 'delete' ? 'text-rose-300' : 'text-indigo-300') : 'text-amber-200'}`}>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {totalCreated > 0 && !isProcessing && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-700">
          <div className={`text-white rounded-[2.5rem] px-10 py-6 shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl ring-4 ${actionType === 'delete' ? 'bg-rose-900 ring-rose-500/20' : 'bg-gray-900 ring-indigo-500/20'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ring-8 shadow-lg ${actionType === 'delete' ? 'bg-rose-600 ring-rose-600/20' : 'bg-indigo-600 ring-indigo-600/20'}`}>
              {actionType === 'delete' ? <Trash2 size={32} /> : <CheckCircle size={32} />}
            </div>
            <div>
              <h4 className="text-xl font-black tracking-tight">{actionType === 'delete' ? 'Cleanup Complete!' : 'Operation Complete!'}</h4>
              <p className={`font-bold text-sm ${actionType === 'delete' ? 'text-rose-300' : 'text-indigo-300'}`}>총 {totalCreated}개의 데이터 유닛이 {actionType === 'delete' ? '삭제' : '업로드'}되었습니다.</p>
            </div>
            <button 
              onClick={() => { setTotalCreated(0); setActionType('idle'); }} 
              className="p-3 hover:bg-white/10 rounded-2xl transition-all text-gray-400 hover:text-white"
            >
              <Users size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DummyDataCenter;
