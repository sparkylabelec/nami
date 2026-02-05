
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User, UserLevel, ORG_STRUCTURE } from '../types';
import { Briefcase, User as UserIcon, Mail, ShieldCheck, Lock, Loader2, ChevronDown, Building2, Users, Phone } from 'lucide-react';

interface Props { onLogin: (user: User) => void; }

const Register: React.FC<Props> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [team, setTeam] = useState('');
  const [level, setLevel] = useState<UserLevel>(UserLevel.MEMBER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 핸드폰 번호 자동 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    const rawValue = value.replace(/[^0-9]/g, ''); // 숫자만 남기기
    if (rawValue.length <= 3) {
      return rawValue;
    } else if (rawValue.length <= 7) {
      return `${rawValue.slice(0, 3)}-${rawValue.slice(3)}`;
    } else if (rawValue.length <= 11) {
      return `${rawValue.slice(0, 3)}-${rawValue.slice(3, 7)}-${rawValue.slice(7)}`;
    } else {
      // 11자 초과 시 잘라내기
      const limited = rawValue.slice(0, 11);
      return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartment(e.target.value);
    setTeam(''); // 사업부 변경 시 팀 초기화
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !team) { setError('소속 사업부와 팀을 선택해주세요.'); return; }
    if (phone.length < 12) { setError('유효한 핸드폰 번호를 입력해주세요.'); return; }
    
    setError('');
    setIsLoading(true);

    try {
      const user = await authService.signUp(email, password, name, phone, department, team, level);
      onLogin(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = name && email && password.length >= 6 && phone.length >= 12 && department && team;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-2xl mb-4">
            <Briefcase size={32} />
          </div>
          <h2 className="text-3xl font-bold">인재 영입</h2>
          <p className="mt-2 text-indigo-100 opacity-80">조직 정보를 입력하고 가입을 신청하세요</p>
        </div>
        
        <form onSubmit={handleRegister} className="p-8 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center animate-pulse">{error}</div>}
          
          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="이름" />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="이메일" />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="비밀번호 (6자 이상)" />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="tel" 
                value={phone} 
                onChange={handlePhoneChange} 
                required 
                maxLength={13}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" 
                placeholder="핸드폰 번호 (예: 01012345678)" 
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select value={department} onChange={handleDepartmentChange} className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-sm transition-all">
                  <option value="">사업부 선택</option>
                  {Object.keys(ORG_STRUCTURE).map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select value={team} onChange={(e) => setTeam(e.target.value)} disabled={!department} className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-sm transition-all disabled:opacity-50">
                  <option value="">{department ? "팀 선택" : "사업부를 먼저 선택하세요"}</option>
                  {department && ORG_STRUCTURE[department].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-sm font-bold text-indigo-600 transition-all">
                  <option value={UserLevel.MEMBER}>LV1 팀원 (보고서 작성)</option>
                  <option value={UserLevel.LEADER}>LV2 책임매니저 (팀 취합)</option>
                  <option value={UserLevel.REPORTER}>LV3 리포터 (전사 취합)</option>
                  <option value={UserLevel.ADMIN}>LV4 관리자 (시스템 운영)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={!isFormValid || isLoading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : '가입 승인 요청'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            이미 계정이 있으신가요? <Link to="/login" className="text-indigo-600 font-bold hover:underline">로그인하기</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
