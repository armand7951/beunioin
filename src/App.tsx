import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MascotSelector from "./components/MascotSelector";
import VolunteerWelfare from "./components/VolunteerWelfare";
import ShieldHub from "./components/ShieldHub";
import RightsQuiz from "./components/RightsQuiz";
import AIConsultation from "./components/AIConsultation";
import ReportForm from "./components/ReportForm";
import NewsBoard from "./components/NewsBoard";
import EventCalendar from "./components/EventCalendar";
import AdminDashboard from "./components/AdminDashboard";
import AuthPage from "./components/AuthPage";
import MemberCenter from "./components/MemberCenter";
import ResetPassword from "./components/ResetPassword";
import Footer from "./components/Footer";
import { Shield, Sparkles, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedMascotId, setSelectedMascotId] = useState("animal");

  useEffect(() => {
    // Read and parse URL pathname routing (clean URLs)
    const handleLocationChange = () => {
      const pathName = window.location.pathname;
      const path = pathName.replace(/^\/+|\/+$/g, "");
      const validSections = ["home", "mascots", "welfare", "shield", "quiz", "chat", "report", "admin", "auth", "member", "reset-password"];
      if (validSections.includes(path)) {
        setActiveSection(path);
      } else if (path === "") {
        setActiveSection("home");
      } else {
        setActiveSection("home");
      }
    };

    // Run once on load
    handleLocationChange();

    window.addEventListener("popstate", handleLocationChange);
    // Custom event to handle programmatical path change
    window.addEventListener("pushstate_change", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("pushstate_change", handleLocationChange);
    };
  }, []);

  const handleNavigation = (sectionId: string) => {
    const path = sectionId === "home" ? "/" : `/${sectionId}`;
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event("pushstate_change"));
    // Smooth scroll to top when switching pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectMascotForChat = (mascotId: string) => {
    setSelectedMascotId(mascotId);
    // Programmatically navigate to the chat page
    window.history.pushState({}, "", "/chat");
    window.dispatchEvent(new Event("pushstate_change"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#fefdfb] text-[#1e293b] font-sans antialiased flex flex-col selection:bg-amber-200">
      
      {/* Dynamic Cute Top Alert Banner */}
      <div className="bg-amber-400 py-2.5 px-4 text-center text-[#1e293b] text-xs font-black border-b-4 border-[#1e293b] flex items-center justify-center gap-1.5 overflow-hidden">
        <Sparkles className="w-4 h-4 fill-[#1e293b] text-[#1e293b] animate-spin" />
        <span>當你用愛守護受傷動物、植樹復育、淨化海灘與山林，台灣環境生態護育產業工會是你最溫馨的防禦盾牌！</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
      </div>

      {/* Modern Bubbly Header */}
      <Header activeSection={activeSection} onNavigate={handleNavigation} />

      {/* Main Multi-Page Content Experience */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full"
          >
            {activeSection === "home" && (
              <div>
                <Hero onNavigate={handleNavigation} />
                
                {/* Interactive Event Calendar & Volunteer Sign Up */}
                <EventCalendar />

                {/* Dynamic Activities News Board Section */}
                <NewsBoard onNavigateToAdmin={() => handleNavigation("admin")} />
                
                {/* Home Page Highlights & Portals */}
                <div className="bg-amber-50/20 border-t-4 border-[#1e293b] py-16 px-4">
                  <div className="max-w-6xl mx-auto text-center">
                    <span className="text-emerald-600 font-extrabold tracking-wider text-xs uppercase">✨ 工會三大核心服務 Quick Entry</span>
                    <h3 className="text-3xl font-black text-[#1e293b] mt-2 mb-10">保障、福利與關懷，一鍵即達</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Card 1 */}
                      <div className="bg-white border-3 border-[#1e293b] p-6 rounded-3xl bubbly-shadow-md text-left flex flex-col justify-between hover:scale-[1.02] transition-transform">
                        <div>
                          <span className="text-4xl block mb-4">🐾</span>
                          <h4 className="text-lg font-black text-[#1e293b] mb-2">1. 志工家族與守護指南</h4>
                          <p className="text-sm font-semibold text-[#1e293b]/70 leading-relaxed">
                            動物、植物、環境與永續工程守護者各有專屬安全準則與救護規範。
                          </p>
                        </div>
                        <button 
                          onClick={() => handleNavigation("mascots")}
                          className="mt-6 w-full py-2.5 bg-emerald-300 hover:bg-emerald-400 text-xs font-black rounded-xl border-2 border-[#1e293b] cursor-pointer text-center block transition-colors"
                        >
                          前往志工家族 🐾
                        </button>
                      </div>

                      {/* Card 2 */}
                      <div className="bg-white border-3 border-[#1e293b] p-6 rounded-3xl bubbly-shadow-md text-left flex flex-col justify-between hover:scale-[1.02] transition-transform">
                        <div>
                          <span className="text-4xl block mb-4">🎁</span>
                          <h4 className="text-lg font-black text-[#1e293b] mb-2">2. 志工夥伴福利總覽</h4>
                          <p className="text-sm font-semibold text-[#1e293b]/70 leading-relaxed">
                            全程意外保險、豐富線上課程、法律錄案諮詢、心理諮商及社群連結福利。
                          </p>
                        </div>
                        <button 
                          onClick={() => handleNavigation("welfare")}
                          className="mt-6 w-full py-2.5 bg-amber-300 hover:bg-amber-400 text-xs font-black rounded-xl border-2 border-[#1e293b] cursor-pointer text-center block transition-colors"
                        >
                          解鎖福利總覽 🎁
                        </button>
                      </div>

                      {/* Card 3 */}
                      <div className="bg-white border-3 border-[#1e293b] p-6 rounded-3xl bubbly-shadow-md text-left flex flex-col justify-between hover:scale-[1.02] transition-transform">
                        <div>
                          <span className="text-4xl block mb-4">💬</span>
                          <h4 className="text-lg font-black text-[#1e293b] mb-2">3. AI 守護獸智能諮詢</h4>
                          <p className="text-sm font-semibold text-[#1e293b]/70 leading-relaxed">
                            遇見權益漏報、工具危險或心理壓力？AI 家族小守護獸 24H 在線為您解答。
                          </p>
                        </div>
                        <button 
                          onClick={() => handleNavigation("chat")}
                          className="mt-6 w-full py-2.5 bg-sky-300 hover:bg-sky-400 text-xs font-black rounded-xl border-2 border-[#1e293b] cursor-pointer text-center block transition-colors"
                        >
                          開啟 AI 諮詢 💬
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "mascots" && (
              <MascotSelector onSelectMascot={handleSelectMascotForChat} />
            )}

            {activeSection === "welfare" && (
              <VolunteerWelfare />
            )}

            {activeSection === "shield" && (
              <ShieldHub />
            )}

            {activeSection === "quiz" && (
              <RightsQuiz />
            )}

            {activeSection === "chat" && (
              <AIConsultation initialMascotId={selectedMascotId} />
            )}

            {activeSection === "report" && (
              <ReportForm />
            )}

            {activeSection === "admin" && (
              <AdminDashboard />
            )}

            {activeSection === "auth" && (
              <AuthPage onNavigate={handleNavigation} />
            )}

            {activeSection === "member" && (
              <MemberCenter onNavigate={handleNavigation} />
            )}

            {activeSection === "reset-password" && (
              <ResetPassword onNavigate={handleNavigation} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Beautiful Footer */}
      <Footer onNavigate={handleNavigation} />

    </div>
  );
}
