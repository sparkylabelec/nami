
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserLevel, UserStatus, ORG_STRUCTURE } from '../types';
import { userService } from '../services/userService';
import { 
  UsersRound, 
  Search, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  LayoutGrid, 
  List as ListIcon, 
  CheckCircle2, 
  Clock, 
  UserX,
  Mail,
  Building2,
  AlertCircle,
  AlertTriangle,
  X,
  Users,
  RotateCcw,
  Filter
} from 'lucide-react';

interface Props { user: User; }

const MemberManagement: React.FC<Props> = ({ user: currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 필터 상태 추가
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // 2단계 확인 상태
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // 1. 검색어 필터링
      const matchesSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.teamId.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. 사업부 필터링
      const matchesDept = deptFilter === 'ALL' || u.department === deptFilter;
      
      // 3. 팀 필터링
      const matchesTeam = teamFilter === 'ALL' || u.teamId === teamFilter;
      
      return matchesSearch && matchesDept && matchesTeam;
    });
  }, [users, searchTerm, deptFilter, teamFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setDeptFilter('ALL');
    setTeamFilter('ALL');
  };

  const handleDelete = async (uid: string) => {
    if (uid === currentUser.uid) return;
    
    if (confirmDeleteId !== uid) {
      setConfirmDeleteId(uid);
      setConfirmResetId(null);
      setTimeout(() => setConfirmDeleteId(prev => prev === uid ? null : prev), 3000);
      return;
    }

    setIsProcessing(uid);
    try {
      await userService.deleteUser(uid);
      setConfirmDeleteId(null);
      await fetchUsers();
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleResetPassword = async (uid: string) => {
    if (uid === currentUser.uid) return;
    
    if (confirmResetId !== uid) {
      setConfirmResetId(uid);
      setConfirmDeleteId(null);
      setTimeout(() => setConfirmResetId(prev => prev === uid ? null : prev), 3000);
      return;
    }

    setIsProcessing(uid);
    try {
      await userService.resetUserPassword(uid);
      setConfirmResetId(null);
      await fetchUsers();
    } catch (error) {
      alert('초기화 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(null);
    }
  };

  const getLevelBadge = (level: UserLevel) => {
    switch(level) {
      case UserLevel.ADMIN: return <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">ADMIN</span>;
      case UserLevel.REPORTER: return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">REPORTER</span>;
      case UserLevel.LEADER: return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">LEADER</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">MEMBER</span>;
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch(status) {
      case 'approved': return <span className="text-green-600 flex items-center gap-1 font-bold text-xs"><CheckCircle2 size={12} /> 정상</span>;
      case 'pending': return <span className="text-amber-500 flex items-center gap-1 font-bold text-xs"><Clock size={12} /> 대기</span>;
      case 'withdrawn': return <span className="text-red-500 flex items-center gap-1 font-bold text-xs"><UserX size={12} /> 탈퇴</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
            <UsersRound className="text-indigo-600" size={32} />
            회원관리
          </h2>
          <p className="text-gray-500 mt-1">사용자 계정 삭제 및 비밀번호 초기화 등 계정 설정을 관리합니다.</p>
        </div>
        
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="회원 검색 (이름, 이메일, 팀명)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-bold"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 transition-all focus-within:ring-2 focus-within:ring-indigo-100">
              <Building2 size={16} className="text-indigo-500" />
              <select 
                value={deptFilter} 
                onChange={(e) => { setDeptFilter(e.target.value); setTeamFilter('ALL'); }} 
                className="outline-none text-xs font-black text-gray-700 bg-transparent min-w-[120px]"
              >
                <option value="ALL">전체 사업부</option>
                {Object.keys(ORG_STRUCTURE).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 transition-all focus-within:ring-2 focus-within:ring-indigo-100">
              <Users size={16} className="text-indigo-500" />
              <select 
                value={teamFilter} 
                onChange={(e) => setTeamFilter(e.target.value)} 
                disabled={deptFilter === 'ALL'} 
                className="outline-none text-xs font-black text-gray-700 bg-transparent disabled:opacity-30 min-w-[120px]"
              >
                <option value="ALL">전체 팀</option>
                {deptFilter !== 'ALL' && ORG_STRUCTURE[deptFilter].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {(searchTerm || deptFilter !== 'ALL' || teamFilter !== 'ALL') && (
              <button 
                onClick={resetFilters}
                className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all shadow-sm flex items-center gap-2 text-xs font-black"
                title="필터 초기화"
              >
                <RotateCcw size={16} />
                초기화
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <Filter size={12} />
          Filtering: {filteredUsers.length} Users matched
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-indigo-300">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold">회원 목록을 불러오는 중입니다...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
            <Search size={32} />
          </div>
          <p className="text-gray-400 font-bold italic">조건에 맞는 검색 결과가 없습니다.</p>
          <button onClick={resetFilters} className="text-indigo-600 font-black text-sm underline underline-offset-4">모든 필터 해제</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((u) => (
            <div key={u.uid} className={`bg-white rounded-3xl p-6 border transition-all hover:shadow-xl group ${u.uid === currentUser.uid ? 'border-indigo-200 ring-4 ring-indigo-50 shadow-indigo-100' : 'border-gray-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg shadow-inner ring-1 ring-indigo-100">
                    {u.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{u.name}</h4>
                      {getLevelBadge(u.level)}
                    </div>
                    <div className="mt-0.5">{getStatusLabel(u.status)}</div>
                  </div>
                </div>
                {u.uid === currentUser.uid && (
                  <div className="bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md shadow-indigo-200">ME</div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={14} className="text-indigo-300" />
                  <span className="font-medium">{u.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Building2 size={14} className="text-indigo-300" />
                  <span className="font-bold text-gray-700">{u.department}</span>
                  <span className="text-gray-300">·</span>
                  <span className="font-medium text-gray-500">{u.teamId}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex gap-2">
                <button 
                  onClick={() => handleResetPassword(u.uid)}
                  disabled={isProcessing !== null || u.uid === currentUser.uid}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-20 ${
                    confirmResetId === u.uid 
                      ? 'bg-amber-600 text-white animate-pulse shadow-lg' 
                      : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100'
                  }`}
                >
                  {isProcessing === u.uid ? <Loader2 size={14} className="animate-spin" /> : confirmResetId === u.uid ? <CheckCircle2 size={14} /> : <RefreshCw size={14} />}
                  {confirmResetId === u.uid ? '정말요?' : 'PW 초기화'}
                </button>
                <button 
                  onClick={() => handleDelete(u.uid)}
                  disabled={isProcessing !== null || u.uid === currentUser.uid}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-20 ${
                    confirmDeleteId === u.uid 
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg ring-4 ring-rose-100' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                  }`}
                >
                  {isProcessing === u.uid ? <Loader2 size={14} className="animate-spin" /> : confirmDeleteId === u.uid ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                  {confirmDeleteId === u.uid ? '삭제확인' : '계정삭제'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">성명 / 계정</th>
                  <th className="px-8 py-5">사업부 / 팀</th>
                  <th className="px-8 py-5">권한</th>
                  <th className="px-8 py-5">상태</th>
                  <th className="px-8 py-5 text-center">제어</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className={`hover:bg-indigo-50/30 transition-colors ${u.uid === currentUser.uid ? 'bg-indigo-50/10' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-inner">
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            {u.name}
                            {u.uid === currentUser.uid && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-black">ME</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium tracking-tight">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-black text-gray-700">{u.department}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{u.teamId}</div>
                    </td>
                    <td className="px-8 py-5">
                      {getLevelBadge(u.level)}
                    </td>
                    <td className="px-8 py-5">
                      {getStatusLabel(u.status)}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleResetPassword(u.uid)}
                          disabled={isProcessing !== null || u.uid === currentUser.uid}
                          className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black ${
                            confirmResetId === u.uid 
                              ? 'bg-amber-600 text-white animate-pulse shadow-lg' 
                              : 'text-amber-500 hover:bg-amber-50 border border-transparent hover:border-amber-100'
                          } disabled:opacity-10`}
                          title="비밀번호 초기화"
                        >
                          {isProcessing === u.uid ? <Loader2 size={16} className="animate-spin" /> : confirmResetId === u.uid ? <CheckCircle2 size={16} /> : <RefreshCw size={16} />}
                          {confirmResetId === u.uid && '정말요?'}
                        </button>
                        <button 
                          onClick={() => handleDelete(u.uid)}
                          disabled={isProcessing !== null || u.uid === currentUser.uid}
                          className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black ${
                            confirmDeleteId === u.uid 
                              ? 'bg-rose-600 text-white animate-pulse shadow-lg ring-4 ring-rose-100' 
                              : 'text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100'
                          } disabled:opacity-10`}
                          title="계정 삭제"
                        >
                          {isProcessing === u.uid ? <Loader2 size={16} className="animate-spin" /> : confirmDeleteId === u.uid ? <AlertTriangle size={16} /> : <Trash2 size={16} />}
                          {confirmDeleteId === u.uid && '삭제확인'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-8 flex items-start gap-5 shadow-inner">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <AlertCircle size={28} />
        </div>
        <div className="text-xs text-indigo-800 leading-relaxed">
          <p className="font-black text-sm mb-2 text-indigo-950">회원 관리자 지침</p>
          <ul className="space-y-2 font-medium">
            <li className="flex gap-2">
              <span className="text-indigo-400 font-black">•</span>
              <span><strong>부서 및 팀 필터</strong>를 사용하여 대규모 인원을 효율적으로 관리할 수 있습니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-400 font-black">•</span>
              <span><strong>샌드박스 보안 정책</strong>으로 인해 삭제 시 버튼을 <strong>두 번 클릭</strong>해야 하며, 한 번 클릭 후 3초 이내에 재클릭하지 않으면 취소됩니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-400 font-black">•</span>
              <span><strong>비밀번호 초기화</strong> 시 회원의 비밀번호는 <code className="bg-white px-2 py-0.5 rounded-lg font-black text-indigo-600 shadow-sm">000000</code>으로 고정됩니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;
