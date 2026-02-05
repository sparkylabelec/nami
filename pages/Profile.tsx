
import React, { useState } from 'react';
import { User, UserLevel } from '../types';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';

interface Props { user: User; }

const Profile: React.FC<Props> = ({ user }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 비밀번호 확인 핸들러
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPassword.trim()) return;

    setIsVerifying(true);
    setVerifyError('');
    try {
      await authService.signIn(user.email, verifyPassword);
      setIsVerified(true);
    } catch (error: any) {
      setVerifyError('비밀번호가 일치하지 않습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 핸드폰 번호 자동 포맷팅
  const formatPhoneNumber = (value: string) => {
    const rawValue = value.replace(/[^0-9]/g, '');
    if (rawValue.length <= 3) return rawValue;
    if (rawValue.length <= 7) return `${rawValue.slice(0, 3)}-${rawValue.slice(3)}`;
    const limited = rawValue.slice(0, 11);
    return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (phone.length < 12) {
      alert('유효한 핸드폰 번호를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setStatus('idle');
    try {
      await userService.updateUser(user.uid, { name, phone });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      alert('정보 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const getLevelName = (level: UserLevel) => {
    switch(level) {
      case UserLevel.ADMIN: return '관리자';
      case UserLevel.REPORTER: return '리포터';
      case UserLevel.LEADER: return '책임매니저';
      default: return '팀원';
    }
  };

  // 1단계: 비밀번호 확인 화면
  if (!isVerified) {
    return (
      <div className="max-w-md mx-auto py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8 text-center">
          <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">비밀번호 확인</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">
              개인정보 보호를 위해 비밀번호를<br />한 번 더 확인합니다.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Password</label>
              <input 
                type="password" 
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold"
                required
              />
              {verifyError && (
                <p className="text-[10px] text-red-500 font-bold pl-2 animate-bounce mt-2 flex items-center gap-1">
                  <AlertCircle size={10} /> {verifyError}
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={isVerifying}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isVerifying ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  확인 후 진행하기 <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2단계: 실제 정보 수정 화면
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <UserIcon size={32} className="text-indigo-600" />
            개인정보 관리
          </h2>
          <p className="text-gray-500 mt-1 font-medium italic">회원님의 소속 정보 및 연락처를 확인하고 수정할 수 있습니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 flex flex-col items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit">
           <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-3xl shadow-inner">
             {name[0]}
           </div>
           <div className="text-center">
             <h3 className="text-xl font-black text-gray-900 leading-tight">{name}</h3>
             <p className="text-xs font-bold text-indigo-500 mt-1 uppercase tracking-widest">{user.teamId}</p>
           </div>
           <div className="w-full pt-6 border-t border-gray-50 space-y-3">
             <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
               <ShieldCheck size={14} className="text-indigo-400" />
               Level: {getLevelName(user.level)}
             </div>
             <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
               <Building2 size={14} className="text-indigo-400" />
               Dept: {user.department}
             </div>
           </div>
        </div>

        <form onSubmit={handleSave} className="md:col-span-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">성함</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">이메일 (수정 불가)</label>
              <input 
                type="email" 
                value={user.email} 
                disabled
                className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-sm font-bold text-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">연락처</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={handlePhoneChange}
                maxLength={13}
                placeholder="010-0000-0000"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className={`w-full py-5 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-30 shadow-xl ${status === 'success' ? 'bg-green-600 shadow-green-100' : 'bg-indigo-600 shadow-indigo-100'} text-white hover:brightness-110`}
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={24} />
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 size={24} />
                  수정 완료되었습니다
                </>
              ) : (
                <>
                  <Save size={24} />
                  정보 수정하기
                </>
              )}
            </button>
          </div>

          <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4 items-start">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-amber-800 leading-relaxed font-medium">
              <p className="font-black text-sm mb-1">안내 사항</p>
              <p>이메일, 소속 사업부 및 팀 정보는 시스템 관리자만 변경할 수 있습니다. 정보 변경이 필요한 경우 관리자에게 문의하시기 바랍니다.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
