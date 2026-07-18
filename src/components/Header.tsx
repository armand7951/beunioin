import React from "react";
import { Shield, Sparkles, Heart } from "lucide-react";
import { motion } from "motion/react";

interface HeaderProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export default function Header({ activeSection, onNavigate }: HeaderProps) {
  const menuItems = [
    { id: "home", label: "守護首頁", icon: "🏡" },
    { id: "mascots", label: "志工家族", icon: "🐾" },
    { id: "welfare", label: "志工福利", icon: "🎁" },
    { id: "shield", label: "暖心後盾", icon: "🛡️" },
    { id: "quiz", label: "權益學堂", icon: "🎓" },
    { id: "chat", label: "AI守護獸", icon: "💬" },
    { id: "report", label: "權益申訴", icon: "💌" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3 bg-[#fdfbf7]/95 backdrop-blur-md border-b-4 border-[#1e293b] transition-all">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
          id="brand-logo-btn"
        >
          <div className="relative p-1.5 bg-amber-400 rounded-2xl border-3 border-[#1e293b] bubbly-shadow-lg transform group-hover:rotate-6 transition-transform shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#1e293b] fill-white" />
            <span className="absolute -top-1 -right-1 text-[8px] sm:text-[10px]">✨</span>
          </div>
          <div className="text-left">
            <h1 className="text-sm sm:text-base lg:text-lg xl:text-xl font-black text-[#1e293b] tracking-tight flex items-center gap-1 leading-tight">
              <span>台灣環境生態護育產業工會</span>
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 fill-red-500 animate-pulse shrink-0" />
            </h1>
            <p className="text-[8px] sm:text-[9px] md:text-xs font-bold text-[#1e293b]/70 tracking-wider mt-0.5">BeUnion • 生態保育與志工的暖心後盾</p>
          </div>
        </button>

        {/* Bouncy Navigation Links */}
        <div className="relative w-full lg:w-auto overflow-hidden flex-1 lg:flex-initial">
          {/* Mobile Swipe Hint */}
          <div className="flex lg:hidden items-center justify-center gap-1.5 text-[10px] font-black text-amber-600/90 mb-1 animate-pulse bg-amber-500/5 py-0.5 px-3 rounded-full w-max mx-auto border border-amber-500/10">
            <span>👈 左右滑動選單 👉</span>
          </div>

          {/* Left/Right scroll indicators (gradient shades) */}
          <div className="absolute left-0 bottom-1.5 top-auto h-[38px] w-6 bg-gradient-to-r from-[#fdfbf7] to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 bottom-1.5 top-auto h-[38px] w-6 bg-gradient-to-l from-[#fdfbf7] to-transparent pointer-events-none z-10" />

          <nav className="flex items-center gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto flex-nowrap w-full lg:w-auto justify-start lg:justify-center px-4 py-1.5 whitespace-nowrap scrollbar-none snap-x snap-mandatory scroll-smooth" id="main-navigation">
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer border-2 shrink-0 snap-start active:scale-95 ${
                    isActive
                      ? "bg-amber-300 border-[#1e293b] text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] -translate-y-0.5"
                      : "border-transparent text-[#1e293b]/80 hover:text-[#1e293b] hover:bg-amber-100/50 hover:border-[#1e293b]/30"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="header-active-pill"
                      className="absolute -top-1 -right-1 text-[8px] bg-red-400 text-white rounded-full px-1 py-0.2 font-bold scale-75 border border-[#1e293b]"
                    >
                      ON
                    </motion.span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Help Button */}
        <div className="hidden xl:flex items-center gap-2">
          <button
            onClick={() => onNavigate("chat")}
            className="px-4 py-2 bg-red-400 hover:bg-red-500 text-white font-bold rounded-2xl border-3 border-[#1e293b] bubbly-shadow-lg text-sm flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-transform"
            id="header-quick-chat-btn"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            諮詢守護獸
          </button>
        </div>
      </div>
    </header>
  );
}
