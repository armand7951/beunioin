import React, { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MascotSelector from "./components/MascotSelector";
import ShieldHub from "./components/ShieldHub";
import RightsQuiz from "./components/RightsQuiz";
import AIConsultation from "./components/AIConsultation";
import ReportForm from "./components/ReportForm";
import Footer from "./components/Footer";
import { Shield, Sparkles, Heart } from "lucide-react";

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedMascotId, setSelectedMascotId] = useState("animal");

  const handleNavigation = (sectionId: string) => {
    setActiveSection(sectionId);
    
    // Smooth scroll to element
    const element = document.getElementById(`${sectionId}-section`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSelectMascotForChat = (mascotId: string) => {
    setSelectedMascotId(mascotId);
    // Programmatically navigate to the chat section
    setActiveSection("chat");
    const element = document.getElementById("chat-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

      {/* Main Single-Page Content Experience */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <div id="home-section">
          <Hero onNavigate={handleNavigation} />
        </div>

        {/* Mascot Selector & Volunteer Guidelines */}
        <div id="mascots-section">
          <MascotSelector onSelectMascot={handleSelectMascotForChat} />
        </div>

        {/* Core Shield Bento Hub */}
        <div id="shield-section">
          <ShieldHub />
        </div>

        {/* Rights Quiz & Certificate Generator */}
        <div id="quiz-section">
          <RightsQuiz />
        </div>

        {/* AI Mascot Chat powered by Gemini */}
        <div id="chat-section">
          <AIConsultation initialMascotId={selectedMascotId} />
        </div>

        {/* Complaints Form & Case progress board */}
        <div id="report-section">
          <ReportForm />
        </div>

      </main>

      {/* Beautiful Footer */}
      <Footer onNavigate={handleNavigation} />

    </div>
  );
}
