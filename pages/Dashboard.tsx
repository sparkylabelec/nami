
import React, { useMemo, useState, useEffect } from 'react';
import { User, UserLevel, Report } from '../types';
import { reportService } from '../services/reportService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock as ClockIcon, 
  Calendar as CalendarIcon, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  RotateCcw
} from 'lucide-react';

interface Props {
  user: User;
}

// 실시간 시계 컴포넌트
const LiveClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('ko-KR', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center space-y-2">
      <div className="flex items-center gap-2 text-indigo-500 mb-2">
        <ClockIcon size={20} className="animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Real-time Status</span>
      </div>
      <h3 className="text-5xl font-black text-gray-900 tracking-tighter tabular-nums">
        {timeStr}
      </h3>
      <p className="text-sm font-bold text-gray-400">{dateStr}</p>
    </div>
  );
};

// 미니 캘린더 컴포넌트 (월 이동 및 오늘 기능 추가)
const MiniCalendar = () => {
  const actualToday = new Date();
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setViewDate(new Date());
  };

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const days = [];
  // 이전 달 빈칸
  for (let i = 0; i < firstDay; i++) days.push(null);
  // 현재 달 날짜
  for (let i = 1; i <= lastDate; i++) days.push(i);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const isActualToday = (day: number | null) => {
    return day === actualToday.getDate() && 
           month === actualToday.getMonth() && 
           year === actualToday.getFullYear();
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h4 className="text-lg font-black text-gray-900 min-w-[100px] text-center">
            {year}년 {month + 1}월
          </h4>
          <button 
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <button 
          onClick={handleGoToToday}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all active:scale-95"
        >
          <RotateCcw size={12} />
          오늘
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {weekDays.map((d, i) => (
          <span key={d} className={`text-[10px] font-black mb-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-300'}`}>
            {d}
          </span>
        ))}
        {days.map((day, i) => (
          <div key={i} className="flex items-center justify-center h-8">
            {day && (
              <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all
                ${isActualToday(day) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : 'text-gray-600 hover:bg-gray-50'}
                ${i % 7 === 0 && !isActualToday(day) ? 'text-red-400' : ''}
                ${i % 7 === 6 && !isActualToday(day) ? 'text-blue-400' : ''}
              `}>
                {day}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard: React.FC<Props> = ({ user }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await reportService.getReports();
        setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const myReports = useMemo(() => reports.filter(r => r.authorId === user.uid), [reports, user.uid]);
  const teamReports = useMemo(() => reports.filter(r => r.teamId === user.teamId), [reports, user.teamId]);
  
  const stats = [
    { label: '내 보고서', value: myReports.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '우리 팀 보고서', value: teamReports.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '완료 상태', value: reports.filter(r => r.status === 'submitted').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '검토 대기', value: 0, icon: ClockIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const teamStats = useMemo(() => {
    const uniqueTeams = Array.from(new Set(reports.map(r => r.teamId))).slice(0, 3);
    const displayTeams = uniqueTeams.length > 0 ? uniqueTeams : ['기획홍보팀', '운항팀', '인사팀'];
    
    return displayTeams.map(t => ({
      name: t,
      count: reports.filter(r => r.teamId === t).length
    }));
  }, [reports]);

  const COLORS = ['#4f46e5', '#2563eb', '#0891b2'];

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">안녕하세요, {user.name}님!</h2>
          <p className="text-gray-500 mt-1 font-medium">오늘도 멋진 하루 되세요. 시스템의 주요 지표입니다.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">
           <CheckCircle size={14} /> System Active
        </div>
      </div>

      {/* 실시간 시계 & 캘린더 위젯 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <LiveClock />
        </div>
        <div className="lg:col-span-5">
          <MiniCalendar />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">팀별 보고서 분포</h3>
            <div className="bg-gray-50 p-2 rounded-xl text-gray-400">
              <BarChart size={20} />
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{fontSize: 11, fontWeight: 600, fill: '#cbd5e1'}}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                  itemStyle={{fontWeight: 800, color: '#4f46e5'}}
                />
                <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={40}>
                  {teamStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">최근 업데이트</h3>
            <CalendarIcon className="text-indigo-400" size={20} />
          </div>
          <div className="space-y-4">
            {reports.slice(0, 5).map((report) => (
              <div key={report.reportId} className="flex flex-col p-4 bg-gray-50/50 hover:bg-indigo-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all cursor-pointer group">
                <p className="text-sm font-black text-gray-800 truncate mb-1 group-hover:text-indigo-600">{report.title}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{report.authorName}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-20 text-gray-400 italic font-bold">작성된 보고서가 없습니다.</div>
            )}
            {reports.length > 0 && (
              <button className="w-full py-3 mt-4 text-[10px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-[0.2em] border-t border-gray-50 transition-colors">
                View All Activity
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
