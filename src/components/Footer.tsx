import React from "react";
import { Heart, Mail, Phone } from "lucide-react";

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#1e293b] text-white py-16 px-4 border-t-8 border-amber-400" id="footer">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 text-left">
        
        {/* Brand Column (Col: 5) */}
        <div className="md:col-span-5 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/logo.png"
              alt="台灣環境生態護育產業工會標誌"
              className="h-16 w-auto shrink-0 object-contain"
            />
            <div>
              <h4 className="text-lg font-black tracking-wider text-white">台灣環境生態護育產業工會</h4>
              <p className="text-[9px] font-black tracking-wider text-white/50 uppercase">Taiwan Environmental Ecology and Conservation Industry Union</p>
            </div>
          </div>

          <p className="text-sm font-medium text-white/70 leading-relaxed mb-6">
            我們是台灣專門為「動植物保育、山林復育、海洋淨灘與環境教育」之工作人員、志工及從業者提供權益保障、勞動保障、意外險加保把關與法律申訴輔導的專業護育產業工會。當你在前線用愛照顧生命與大地時，工會永遠在身後做你最強大的防禦防護盾牌！
          </p>

          <div className="flex items-center gap-2 text-xs font-black text-amber-400">
            <span>當你守護世界，我們守護你</span>
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          </div>
        </div>

        {/* Quick Links Column (Col: 3) */}
        <div className="md:col-span-3">
          <h5 className="font-black text-sm uppercase tracking-widest text-white/50 mb-6">更多服務</h5>
          <ul className="space-y-3 text-sm font-bold">
            <li>
              <button onClick={() => onNavigate("quiz")} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                🎓 權益學堂 (Quiz Challenge)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("chat")} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                💬 諮詢守護獸 (AI Mascot Chat)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("report")} className="hover:text-amber-400 transition-colors text-left cursor-pointer">
                💌 權益申訴 (Report Form)
              </button>
            </li>
          </ul>
        </div>

        {/* Contact info column (Col: 4) */}
        <div className="md:col-span-4">
          <h5 className="font-black text-sm uppercase tracking-widest text-white/50 mb-6">權益關懷專線</h5>
          <ul className="space-y-4 text-sm font-medium text-white/80">
            <li className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white">服務與申訴熱線</p>
                <p className="text-xs text-white/60">(02)8666-8111（週一至週五 09:00 - 18:00）</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white">申訴調查電子信箱</p>
                <p className="text-xs text-white/60">volt02332@gmail.com</p>
              </div>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 text-center text-xs font-bold text-white/40">
        <p>© 2026 台灣環境生態護育產業工會 Taiwan Environmental Ecology and Conservation Industry Union (BeUnion). All Rights Reserved.</p>
        <div className="mt-2 text-[10px] text-white/20 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <span>工會登記字號：府勞資字第 1120155234 號 • 全台環境生態、動植物工作者與志工權益捍衛熱血守護中 🐾🌱💧</span>
          <span className="hidden sm:inline text-white/10">•</span>
          <button 
            onClick={() => onNavigate("admin")} 
            className="text-white/10 hover:text-white/40 transition-colors cursor-pointer text-[9px] font-normal underline decoration-white/10"
            id="hidden-admin-btn"
          >
            系統管理
          </button>
        </div>
      </div>
    </footer>
  );
}
