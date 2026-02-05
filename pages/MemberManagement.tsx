
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserLevel, UserStatus } from '../types';
import { userService } from '../services/userService';
import { 
  UsersRound, 
  Search, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  ShieldCheck,
  MoreVertical,
  Mail,
  Building2,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Clock,
  UserX
} from 'lucide-react';

interface Props { user: User; }

const MemberManagement: React.FC<Props> = ({ user: currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.teamId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleDelete = async (uid: string, name: string) => {
    if (uid === currentUser.uid) {
      alert('본인 계정은 삭제할 수 없습니다.');
      return;
    }
    if (!window.confirm(`[${name}]님의 계정을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

    setIsProcessing(uid);
    try {
      await userService.deleteUser(uid);
      await fetchUsers();
      alert('삭제되었습니다.');
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleResetPassword = async (uid: string, name: string) => {
    if (uid === currentUser.uid) {
      alert('본인 비밀번호는 초기화할 수 없습니다.');
      return;
    }
    if (!window.confirm(`[${name}]님의 비밀번호를 "000000"으로 초기화하시겠습니까?`)) return;

    setIsProcessing(uid);
    try {
      await userService.resetUserPassword(uid);
      alert(`${name}님의 비밀번호가 "000000"으로 초기화 요청되었습니다.\n(현재 대기 상태로 변경되었습니다)`);
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
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UsersRound className="text-indigo-600" size={32} />
            회원관리
          </h2>
          <p className="text-gray-500 mt-1">사용자 계정 삭제 및 비밀번호 초기화 등 계정 설정을 관리합니다.</p>
        </div>
        
        <div className="flex items-center gap-4">
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
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="회원 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-sm"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-indigo-300">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold">회원 목록을 불러오는 중입니다...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <p className="text-gray-400 font-bold italic">검색 결과가 없습니다.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((u) => (
            <div key={u.uid} className={`bg-white rounded-3xl p-6 border transition-all hover:shadow-xl group ${u.uid === currentUser.uid ? 'border-indigo-200 ring-2 ring-indigo-50' : 'border-gray-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
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
                  <div className="bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">ME</div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={14} className="text-gray-300" />
                  {u.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Building2 size={14} className="text-gray-300" />
                  {u.department} · {u.teamId}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex gap-2">
                <button 
                  onClick={() => handleResetPassword(u.uid, u.name)}
                  disabled={isProcessing !== null || u.uid === currentUser.uid}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all disabled:opacity-20 active:scale-95"
                >
                  {isProcessing === u.uid ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  초기화
                </button>
                <button 
                  onClick={() => handleDelete(u.uid, u.name)}
                  disabled={isProcessing !== null || u.uid === currentUser.uid}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-20 active:scale-95"
                >
                  {isProcessing === u.uid ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  삭제
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
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-4">성명 / 계정</th>
                  <th className="px-8 py-4">사업부 / 팀</th>
                  <th className="px-8 py-4">권한</th>
                  <th className="px-8 py-4">상태</th>
                  <th className="px-8 py-4 text-center">제어</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className={`hover:bg-indigo-50/30 transition-colors ${u.uid === currentUser.uid ? 'bg-indigo-50/10' : ''}`}>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            {u.name}
                            {u.uid === currentUser.uid && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">ME</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium tracking-tight">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="text-xs font-bold text-gray-600">{u.department}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{u.teamId}</div>
                    </td>
                    <td className="px-8 py-4">
                      {getLevelBadge(u.level)}
                    </td>
                    <td className="px-8 py-4">
                      {getStatusLabel(u.status)}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleResetPassword(u.uid, u.name)}
                          disabled={isProcessing !== null || u.uid === currentUser.uid}
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-10"
                          title="비밀번호 초기화"
                        >
                          {isProcessing === u.uid ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(u.uid, u.name)}
                          disabled={isProcessing !== null || u.uid === currentUser.uid}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-10"
                          title="계정 삭제"
                        >
                          {isProcessing === u.uid ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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

      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4">
        <AlertCircle className="text-indigo-600 shrink-0" size={24} />
        <div className="text-xs text-indigo-700 leading-relaxed">
          <p className="font-bold mb-1">관리자 지침</p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li><strong>비밀번호 초기화</strong> 시 회원의 비밀번호는 즉시 <code className="bg-white px-1.5 py-0.5 rounded font-black text-indigo-600">000000</code>으로 변경됩니다.</li>
            <li>계정 삭제는 복구가 불가능하며, 해당 사용자는 더 이상 시스템에 로그인할 수 없습니다.</li>
            <li>보안상의 이유로 관리자 자신의 계정은 직접 초기화하거나 삭제할 수 없습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;
