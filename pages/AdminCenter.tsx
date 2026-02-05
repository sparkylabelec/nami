
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserLevel, UserStatus, ORG_STRUCTURE } from '../types';
import { userService } from '../services/userService';
import { COMPANY_INFO } from '../constants/company';
import { 
  Shield, 
  Settings, 
  UserMinus, 
  Loader2, 
  X, 
  CheckCircle2,
  Square,
  CheckSquare,
  UserCheck,
  Trash2,
  ArrowUpDown,
  UserX,
  Clock,
  Building2,
  Info,
  AlertTriangle
} from 'lucide-react';

interface Props { user: User; }

// Renamed user prop to currentUser to fix the reference error and ensure consistency with other components
const AdminCenter: React.FC<Props> = ({ user: currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null); // 삭제 확인 상태
  
  const [sortConfig, setSortConfig] = useState<{ key: 'department' | 'teamId' | 'name', direction: 'asc' | 'desc' }>({ key: 'department', direction: 'asc' });
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const sortedUsers = useMemo(() => {
    const sorted = [...users];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      let compareResult = 0;
      if (aVal < bVal) compareResult = -1;
      if (aVal > bVal) compareResult = 1;
      return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    });
    return sorted;
  }, [users, sortConfig]);

  const requestSort = (key: 'department' | 'teamId' | 'name') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSingleDelete = async (uid: string) => {
    if (confirmDeleteUid !== uid) {
      setConfirmDeleteUid(uid);
      // 3초 후 자동 취소
      setTimeout(() => setConfirmDeleteUid(prev => prev === uid ? null : prev), 3000);
      return;
    }

    try {
      setIsBatchProcessing(true);
      await userService.deleteUser(uid);
      setConfirmDeleteUid(null);
      await fetchUsers();
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const toggleStatus = async (targetUser: User) => {
    let nextStatus: UserStatus = 'approved';
    if (targetUser.status === 'approved') nextStatus = 'withdrawn';
    else if (targetUser.status === 'withdrawn') nextStatus = 'pending';
    else nextStatus = 'approved';

    try {
      await userService.updateUser(targetUser.uid, { status: nextStatus });
      await fetchUsers();
    } catch (error) { alert('상태 변경 실패'); }
  };

  const toggleSelectAll = () => {
    if (selectedUids.size === users.length && users.length > 0) {
      setSelectedUids(new Set());
    } else {
      setSelectedUids(new Set(users.map(u => u.uid)));
    }
  };

  const toggleSelect = (uid: string) => {
    const next = new Set(selectedUids);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelectedUids(next);
  };

  const handleBatchVerify = async () => {
    const uids = Array.from(selectedUids);
    if (uids.length === 0) return;
    setIsBatchProcessing(true);
    try {
      const promises = uids.map((uid: string) => userService.updateUser(uid, { status: 'approved' }));
      await Promise.all(promises);
      setSelectedUids(new Set());
      await fetchUsers();
    } catch (err) { alert('일괄 승인 중 오류가 발생했습니다.'); }
    finally { setIsBatchProcessing(false); }
  };

  const handleBatchWithdraw = async () => {
    const uids = Array.from(selectedUids);
    // Fixed: changed from user.uid to currentUser.uid
    const targets = uids.filter((uid: string) => uid !== currentUser.uid);
    if (targets.length === 0) return;
    
    // Batch용 인라인 확인 로직은 이미 하단 바에 버튼 변화로 구현되어 있음
    setIsBatchProcessing(true);
    try {
      const promises = targets.map((uid: string) => userService.updateUser(uid, { status: 'withdrawn' }));
      await Promise.all(promises);
      setSelectedUids(new Set());
      await fetchUsers();
    } catch (err) { alert('일괄 탈퇴 처리 중 오류가 발생했습니다.'); }
    finally { setIsBatchProcessing(false); }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch(status) {
      case 'approved': return <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-[10px] font-black flex items-center gap-1.5"><CheckCircle2 size={12} /> 승인됨</span>;
      case 'pending': return <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black flex items-center gap-1.5"><Clock size={12} /> 대기중</span>;
      case 'withdrawn': return <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-[10px] font-black flex items-center gap-1.5"><UserX size={12} /> 탈퇴</span>;
      default: return null;
    }
  };

  const getLevelBadge = (level: UserLevel) => {
    switch(level) {
      case UserLevel.ADMIN: return <span className="px-2 py-1 bg-indigo-600 text-white rounded-md text-[10px] font-bold">LV4 관리자</span>;
      case UserLevel.REPORTER: return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold">LV3 리포터</span>;
      case UserLevel.LEADER: return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">LV2 책임매니저</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">LV1 팀원</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">가입승인관리</h2>
          <p className="text-gray-500 mt-1">회원의 소속 사업부, 팀 및 권한 등급을 정밀 관리합니다.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-indigo-600 px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-3 text-white">
            <Shield size={18} />
            <span className="text-sm font-black">시스템 총괄 관리</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Building2 size={240} />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Info size={20} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Corporate Entity</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter">{COMPANY_INFO.name}</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              {COMPANY_INFO.brand}
            </p>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-l border-white/10 pl-0 lg:pl-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</p>
              <p className="text-sm font-bold">{COMPANY_INFO.address}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Representative</p>
              <p className="text-sm font-bold">{COMPANY_INFO.ceo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Business Reg No.</p>
              <p className="text-sm font-bold">{COMPANY_INFO.brn}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Contact</p>
              <p className="text-sm font-bold">{COMPANY_INFO.phone}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="px-6 py-6 w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-gray-300 hover:text-indigo-600 transition-colors inline-flex items-center justify-center">
                    {selectedUids.size === users.length && users.length > 0 ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                  </button>
                </th>
                <th className="px-8 py-6 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-2">성함 / 계정 <ArrowUpDown size={12} className={sortConfig.key === 'name' ? 'text-indigo-600' : 'text-gray-300'} /></div>
                </th>
                <th className="px-8 py-6 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('department')}>
                  <div className="flex items-center gap-2">사업부 <ArrowUpDown size={12} className={sortConfig.key === 'department' ? 'text-indigo-600' : 'text-gray-300'} /></div>
                </th>
                <th className="px-8 py-6 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('teamId')}>
                  <div className="flex items-center gap-2">팀 <ArrowUpDown size={12} className={sortConfig.key === 'teamId' ? 'text-indigo-600' : 'text-gray-300'} /></div>
                </th>
                <th className="px-8 py-6">권한</th>
                <th className="px-8 py-6">상태/제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center"><Loader2 className="animate-spin text-indigo-300 mx-auto" size={40} /></td></tr>
              ) : sortedUsers.map((u) => (
                <tr key={u.uid} className={`hover:bg-indigo-50/10 transition-colors ${selectedUids.has(u.uid) ? 'bg-indigo-50/20' : ''}`}>
                  <td className="px-6 py-5 text-center">
                    <button onClick={() => toggleSelect(u.uid)} className="text-gray-300 hover:text-indigo-600 transition-colors inline-flex items-center justify-center">
                      {selectedUids.has(u.uid) ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-inner">{u.name[0]}</div>
                      <div>
                        <p className="text-sm font-black text-gray-800">{u.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-600">{u.department}</td>
                  <td className="px-8 py-5 text-sm text-gray-500">{u.teamId}</td>
                  <td className="px-8 py-5">{getLevelBadge(u.level)}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleStatus(u)} className="transition-all hover:scale-105 active:scale-95">
                        {getStatusBadge(u.status)}
                      </button>
                      <div className="h-4 w-[1px] bg-gray-100"></div>
                      <button className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"><Settings size={16} /></button>
                      
                      {/* 2단계 삭제 확인 버튼 */}
                      <button 
                        onClick={() => handleSingleDelete(u.uid)} 
                        /* Fixed the reference error for currentUser */
                        disabled={u.uid === currentUser.uid || isBatchProcessing} 
                        className={`p-2 rounded-lg transition-all flex items-center gap-2 font-black text-[10px] ${
                          confirmDeleteUid === u.uid 
                            ? 'bg-rose-600 text-white shadow-lg animate-pulse' 
                            : 'text-gray-300 hover:text-red-500 hover:bg-white'
                        } disabled:opacity-10`}
                      >
                        {confirmDeleteUid === u.uid ? (
                          <>
                            <AlertTriangle size={14} />
                            삭제확인
                          </>
                        ) : (
                          <UserMinus size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUids.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500 w-max max-w-full px-4">
          <div className="bg-gray-900 text-white rounded-[2.5rem] px-8 py-4 shadow-2xl flex items-center gap-6 border border-white/20 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-sm ring-4 ring-indigo-500/30">
                {selectedUids.size}
              </div>
              <p className="font-bold text-xs whitespace-nowrap">명의 회원 선택됨</p>
            </div>
            <div className="h-6 w-[1px] bg-white/20"></div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={handleBatchVerify}
                disabled={isBatchProcessing}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-green-700 transition-all active:scale-95 shadow-lg disabled:opacity-50"
              >
                {isBatchProcessing ? <Loader2 className="animate-spin" size={18} /> : <UserCheck size={18} />}
                일괄 승인
              </button>
              <button 
                type="button"
                onClick={handleBatchWithdraw}
                disabled={isBatchProcessing}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-700 transition-all active:scale-95 shadow-lg disabled:opacity-50"
              >
                {isBatchProcessing ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                일괄 탈퇴
              </button>
              <button 
                type="button"
                onClick={() => setSelectedUids(new Set())}
                className="ml-2 p-2.5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCenter;
