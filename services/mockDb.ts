
import { User, Report, UserLevel } from '../types';

const USERS_KEY = 'reportflow_users';
const REPORTS_KEY = 'reportflow_reports';
const SESSION_KEY = 'reportflow_session';

export const mockDb = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User) => {
    const users = mockDb.getUsers();
    const existingIndex = users.findIndex(u => u.uid === user.uid);
    if (existingIndex > -1) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getReports: (): Report[] => {
    const data = localStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveReport: (report: Report) => {
    const reports = mockDb.getReports();
    const existingIndex = reports.findIndex(r => r.reportId === report.reportId);
    if (existingIndex > -1) {
      reports[existingIndex] = report;
    } else {
      reports.push(report);
    }
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  },

  deleteReport: (reportId: string) => {
    const reports = mockDb.getReports();
    const filtered = reports.filter(r => r.reportId !== reportId);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
  },

  setCurrentSession: (user: User | null) => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  getCurrentSession: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }
};