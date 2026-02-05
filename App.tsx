
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, UserLevel } from './types';
import { authService } from './services/authService';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportBoard from './pages/ReportBoard';
import PostManager from './pages/PostManager';
import AdminCenter from './pages/AdminCenter';
import MemberManagement from './pages/MemberManagement';
import DummyDataCenter from './pages/DummyDataCenter';
import AggregationView from './pages/AggregationView';
import Profile from './pages/Profile';
import Footer from './components/Footer';
import { LayoutDashboard, FileText, Users, Briefcase, LogOut, Menu, X, Loader2, MessageSquare, ShieldCheck, UserCog, UsersRound, Database, UserPlus, User as UserIcon, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.observeAuthState((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
  };

  const getLevelName = (level: UserLevel) => {
    switch(level) {
      case UserLevel.ADMIN: return '관리자';
      case UserLevel.REPORTER: return '리포터';
      case UserLevel.LEADER: return '책임매니저';
      default: return '팀원';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-white border-r border-gray-200 shadow-sm`}>
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <Briefcase size={28} />
            ReportFlow
          </h1>
          <Link 
            to="/profile" 
            onClick={() => setIsSidebarOpen(false)}
            className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <UserIcon size={18} />
               </div>
               <div className="overflow-hidden">
                  <p className="text-sm font-black text-gray-800 truncate">{user?.name}</p>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider truncate">
                    {user?.teamId}
                  </p>
               </div>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400" />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-8">
          <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-medium">대시보드</span>
          </Link>
          <Link to="/reports" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
            <FileText size={20} />
            <span className="font-medium">업무 보고</span>
          </Link>
          <Link to="/posts" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
            <MessageSquare size={20} />
            <span className="font-medium">전사 게시판</span>
          </Link>
          
          {user && user.level >= UserLevel.LEADER && user.level < UserLevel.ADMIN && (
            <Link to="/aggregation" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
              <Users size={20} />
              <span className="font-medium">팀 보고 취합</span>
            </Link>
          )}

          {user && user.level === UserLevel.ADMIN && (
            <>
              <div className="mt-6 px-3 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Administration</div>
              <Link to="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                <UserCog size={20} className="text-indigo-600" />
                <span className="font-medium">가입승인관리</span>
              </Link>
              <Link to="/members" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                <UsersRound size={20} className="text-indigo-600" />
                <span className="font-medium">회원관리</span>
              </Link>
              
              <div className="mt-6 px-3 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Test Tools</div>
              <Link to="/dummy" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors">
                <Database size={20} className="text-amber-500" />
                <span className="font-medium">더미 데이터 생성</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <HashRouter>
      {user ? (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
              <h1 className="text-xl font-bold text-indigo-600">ReportFlow</h1>
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </header>
            <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
              <div className="flex-1 p-4 md:p-8">
                <Routes>
                  <Route path="/" element={<Dashboard user={user} />} />
                  <Route path="/reports" element={<ReportBoard user={user} />} />
                  <Route path="/posts" element={<PostManager user={user} />} />
                  <Route path="/profile" element={<Profile user={user} />} />
                  <Route path="/aggregation" element={user.level >= UserLevel.LEADER && user.level < UserLevel.ADMIN ? <AggregationView user={user} /> : <Navigate to="/" />} />
                  <Route path="/admin" element={user.level === UserLevel.ADMIN ? <AdminCenter user={user} /> : <Navigate to="/" />} />
                  <Route path="/members" element={user.level === UserLevel.ADMIN ? <MemberManagement user={user} /> : <Navigate to="/" />} />
                  <Route path="/dummy" element={user.level === UserLevel.ADMIN ? <DummyDataCenter user={user} /> : <Navigate to="/" />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
              <Footer />
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register onLogin={setUser} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </HashRouter>
  );
};

export default App;
