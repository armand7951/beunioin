import React, { useEffect, useRef, useState } from "react";
import { Heart, Menu, X } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import {
  createMobileHeaderScrollState,
  updateMobileHeaderScroll,
} from "../lib/mobileHeaderScroll";

interface HeaderProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export default function Header({ activeSection, onNavigate }: HeaderProps) {
  const { user, signOut, isAdmin } = useAuth();
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);
  const mobileScrollState = useRef(createMobileHeaderScrollState());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuItems = [
    { id: "home", label: "守護首頁", icon: "🏡" },
    { id: "events", label: "工會活動", icon: "🗓️" },
    { id: "blog", label: "工會文章", icon: "📰" },
    { id: "welfare", label: "志工福利", icon: "🎁" },
    { id: "shield", label: "暖心後盾", icon: "🛡️" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const next = updateMobileHeaderScroll(
        mobileScrollState.current,
        window.scrollY,
        window.innerWidth < 1024,
      );
      mobileScrollState.current = next;
      setIsMobileCollapsed(next.collapsed);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full px-4 bg-[#fdfbf7]/95 backdrop-blur-md border-b-4 border-[#1e293b] transition-[padding] duration-200 motion-reduce:transition-none lg:py-3 ${
        isMobileCollapsed ? "py-1.5" : "py-3"
      }`}
    >
      <div
        className={`max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between transition-[gap] duration-200 motion-reduce:transition-none lg:gap-4 ${
          isMobileCollapsed ? "gap-0" : "gap-4"
        }`}
      >
        {/* 手機版把 logo 與漢堡鈕綁成同一列。漢堡鈕原本是相對 <header> 絕對定位
            並用 top-1/2 置中，但抽屜展開後 header 會變高，按鈕就跟著飄到選單中央、
            壓在項目上面。 */}
        <div className="w-full lg:w-auto flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
          id="brand-logo-btn"
        >
          <img
            src="/logo.png"
            alt="台灣環境生態護育產業工會標誌"
            className={`w-auto sm:h-14 lg:h-16 shrink-0 object-contain transition-[height,transform] duration-200 motion-reduce:transition-none group-hover:rotate-2 ${
              isMobileCollapsed ? "h-10" : "h-12"
            }`}
          />
          <div className="text-left">
            <h1 className="text-sm sm:text-base lg:text-lg xl:text-xl font-black text-[#1e293b] tracking-tight flex items-center gap-1 leading-tight">
              <span>台灣環境生態護育產業工會</span>
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 fill-red-500 animate-pulse shrink-0" />
            </h1>
            <p className="text-[8px] sm:text-[9px] md:text-xs font-bold text-[#1e293b]/70 tracking-wider mt-0.5">BeUnion • 生態保育與志工的暖心後盾</p>
          </div>
        </button>

        {/* 手機：漢堡鈕 */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "關閉選單" : "開啟選單"}
          id="mobile-menu-toggle"
          className="lg:hidden shrink-0 p-2 rounded-xl border-2 border-[#1e293b] bg-white active:scale-95 transition-transform"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        </div>

        {/* 桌機：橫向導覽 */}
        <nav className="hidden lg:flex items-center gap-2" id="main-navigation">
          {menuItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`relative px-2.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer border-2 shrink-0 active:scale-95 ${
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

        {/* 桌機：帳號相關 */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={() => onNavigate("admin")}
              className="px-3 py-2 bg-amber-300 border-2 border-[#1e293b] rounded-xl text-xs font-black"
            >
              管理後台
            </button>
          )}
          <button
            onClick={() => onNavigate(user ? "member" : "auth")}
            className="px-3 py-2 bg-emerald-600 text-white border-2 border-[#1e293b] rounded-xl text-xs font-black"
            id="member-account-btn"
          >
            {user ? "會員中心" : "登入／註冊"}
          </button>
          {user && (
            <button
              onClick={() => void signOut()}
              className="px-3 py-2 bg-white border-2 border-[#1e293b] rounded-xl text-xs font-black"
            >
              登出
            </button>
          )}
        </div>

      </div>

      {/* 手機抽屜 */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden mt-3 pt-3 border-t-2 border-[#1e293b]/10 flex flex-col gap-1.5"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black border-2 text-left transition-colors ${
                activeSection === item.id
                  ? "bg-amber-300 border-[#1e293b]"
                  : "bg-white border-slate-200 text-[#1e293b]/80"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="flex flex-wrap gap-2 pt-2">
            {isAdmin && (
              <button
                onClick={() => {
                  onNavigate("admin");
                  setMenuOpen(false);
                }}
                className="flex-1 px-3 py-3 bg-amber-300 border-2 border-[#1e293b] rounded-xl text-xs font-black"
              >
                管理後台
              </button>
            )}
            <button
              onClick={() => {
                onNavigate(user ? "member" : "auth");
                setMenuOpen(false);
              }}
              className="flex-1 px-3 py-3 bg-emerald-600 text-white border-2 border-[#1e293b] rounded-xl text-xs font-black"
            >
              {user ? "會員中心" : "登入／註冊"}
            </button>
            {user && (
              <button
                onClick={() => {
                  void signOut();
                  setMenuOpen(false);
                }}
                className="flex-1 px-3 py-3 bg-white border-2 border-[#1e293b] rounded-xl text-xs font-black"
              >
                登出
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
