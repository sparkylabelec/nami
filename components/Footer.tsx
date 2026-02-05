
import React from 'react';
import { COMPANY_INFO } from '../constants/company';
import { MapPin, Phone, Mail, FileText, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-indigo-600 tracking-tighter">
              {COMPANY_INFO.name}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              {COMPANY_INFO.brand}
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <Globe size={14} />
              <span className="text-[11px] font-medium">Official Corporate System</span>
            </div>
          </div>

          {/* Business Info 1 */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Company Info</h4>
            <div className="flex items-start gap-3 text-slate-600">
              <MapPin size={16} className="text-slate-300 mt-0.5" />
              <span className="text-xs font-medium leading-relaxed">{COMPANY_INFO.address}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <FileText size={16} className="text-slate-300" />
              <span className="text-xs font-medium">대표이사: {COMPANY_INFO.ceo}</span>
            </div>
          </div>

          {/* Business Info 2 */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Legal Info</h4>
            <div className="text-xs font-medium text-slate-600 space-y-2">
              <p>사업자등록번호: {COMPANY_INFO.brn}</p>
              <p>통신판매업 신고번호: {COMPANY_INFO.teleSales}</p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Contact US</h4>
            <div className="flex items-center gap-3 text-slate-600">
              <Phone size={16} className="text-slate-300" />
              <span className="text-xs font-bold">{COMPANY_INFO.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Mail size={16} className="text-slate-300" />
              <span className="text-xs font-medium">{COMPANY_INFO.email}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-medium text-slate-400">
            {COMPANY_INFO.copyright}
          </p>
          <div className="flex gap-6">
            <button className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">이용약관</button>
            <button className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">개인정보처리방침</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
