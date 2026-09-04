import React, { lazy, Suspense, useEffect, useState } from "react";
import { AI_PARTNERS } from "./lib/aiPartners";
import Header from "./components/Header";
import Hero from "./components/Hero";
import VolunteerWelfare from "./components/VolunteerWelfare";
import ShieldHub from "./components/ShieldHub";
import ReportForm from "./components/ReportForm";
import NewsBoard from "./components/NewsBoard";
import EventCalendar from "./components/EventCalendar";
import { BlogList, BlogPost } from "./components/Blog";
import EventDetail from "./components/EventDetail";
import EventList from "./components/EventList";

// 後台（含 TipTap 編輯器）約佔 450KB，只有管理員會用到。用 lazy 切出去，
// 一般訪客的首頁就不必為了一個他們進不去的頁面多下載半個 MB。
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
import AuthPage from "./components/AuthPage";
import MemberCenter from "./components/MemberCenter";
import ResetPassword from "./components/ResetPassword";
import Footer from "./components/Footer";
import { Shield, Sparkles, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  // 文章內頁的代碼。其餘頁面都是固定字串路徑，只有 /blog/<代碼> 帶參數。
  const [postId, setPostId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    // Read and parse URL pathname routing (clean URLs)
    const handleLocationChange = () => {
      const pathName = window.location.pathname;
      const path = pathName.replace(/^\/+|\/+$/g, "");
      const validSections = ["home", "welfare", "shield", "report", "admin", "auth", "member", "reset-password", "blog", "events"];

      // 帶參數的路徑要在比對固定清單之前先攔下來。
      if (path.startsWith("blog/")) {
        const slug = path.slice("blog/".length);
        if (slug) {
          setPostId(decodeURIComponent(slug));
          setEventId(null);
          setActiveSection("blog-post");
          return;
        }
      }
      if (path.startsWith("events/")) {
        const slug = path.slice("events/".length);
        if (slug) {
          setEventId(decodeURIComponent(slug));
          setPostId(null);
          setActiveSection("event-detail");
          return;
        }
      }

      setPostId(null);
      setEventId(null);
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
                <EventCalendar
                  onOpenEvent={(id) => handleNavigation(`events/${id}`)}
                  onSeeAll={() => handleNavigation("events")}
                />

                {/* Dynamic Activities News Board Section */}
                <NewsBoard
                  onNavigateToAdmin={() => handleNavigation("admin")}
                  onOpenPost={(id) => handleNavigation(`blog/${id}`)}
                  onSeeAll={() => handleNavigation("blog")}
                />
                
                {/* Home Page Highlights & Portals */}
                <div className="bg-amber-50/20 border-t-4 border-[#1e293b] py-16 px-4">
                  <div className="max-w-6xl mx-auto text-center">
                    <span className="text-emerald-600 font-extrabold tracking-wider text-xs uppercase">✨ 工會三大核心服務 Quick Entry</span>
                    <h3 className="text-3xl font-black text-[#1e293b] mt-2 mb-10">保障、福利與關懷，一鍵即達</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Card 1 */}
                      <div className="bg-white border-3 border-[#1e293b] p-6 rounded-3xl bubbly-shadow-md text-left flex flex-col justify-between hover:scale-[1.02] transition-transform">
                        <div>
                          <span className="text-4xl block mb-4">🛡️</span>
                          <h4 className="text-lg font-black text-[#1e293b] mb-2">1. 權益申訴與暖心後盾</h4>
                          <p className="text-sm font-semibold text-[#1e293b]/70 leading-relaxed">
                            遇到勞動權益爭議、職安疑慮或裝備問題，工會陪你一起處理。
                          </p>
                        </div>
                        <button
                          onClick={() => handleNavigation("shield")}
                          className="mt-6 w-full py-2.5 bg-emerald-300 hover:bg-emerald-400 text-xs font-black rounded-xl border-2 border-[#1e293b] cursor-pointer text-center block transition-colors"
                        >
                          前往暖心後盾 🛡️
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
                          <span className="text-4xl block mb-4">💎</span>
                          <h4 className="text-lg font-black text-[#1e293b] mb-2">3. AI 小夥伴陪你想清楚</h4>
                          <p className="text-sm font-semibold text-[#1e293b]/70 leading-relaxed">
                            兩種說話方式，挑一個順你當下心情的，隨時可以問。
                          </p>
                        </div>
                        <div className="mt-6 space-y-2">
                          {AI_PARTNERS.map((partner) => (
                            <a
                              key={partner.id}
                              href={partner.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 bg-sky-300 hover:bg-sky-400 text-xs font-black rounded-xl border-2 border-[#1e293b] cursor-pointer text-center block transition-colors"
                            >
                              {partner.emoji}
                              {partner.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeSection === "welfare" && (
              <VolunteerWelfare />
            )}

            {activeSection === "shield" && (
              <ShieldHub />
            )}



            {activeSection === "report" && (
              <ReportForm />
            )}

            {activeSection === "blog" && (
              <BlogList onOpen={(id) => handleNavigation(`blog/${id}`)} />
            )}

            {activeSection === "events" && (
              <EventList onOpen={(id) => handleNavigation(`events/${id}`)} />
            )}

            {activeSection === "blog-post" && postId && (
              <BlogPost id={postId} onBack={() => handleNavigation("blog")} />
            )}

            {activeSection === "event-detail" && eventId && (
              <EventDetail id={eventId} onBack={() => handleNavigation("events")} />
            )}

            {activeSection === "admin" && (
              <Suspense
                fallback={
                  <div className="py-24 flex justify-center">
                    <span className="w-6 h-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                  </div>
                }
              >
                <AdminDashboard />
              </Suspense>
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
