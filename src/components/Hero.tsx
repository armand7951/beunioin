import React from "react";
import { Shield, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onNavigate: (sectionId: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="py-12 md:py-20 px-4 bg-[#fffdfa] relative overflow-hidden" id="hero-section">
      {/* Dynamic cute floating background elements */}
      <div className="absolute top-12 left-6 w-12 h-12 bg-amber-200 rounded-full opacity-40 blur-sm animate-bounce-slow" />
      <div className="absolute bottom-16 right-10 w-16 h-16 bg-emerald-200 rounded-full opacity-40 blur-sm animate-bounce-slow" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-sky-200 rounded-full opacity-40 blur-sm animate-bounce-slow" style={{ animationDelay: "0.8s" }} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Text Content */}
        <div className="lg:col-span-7 text-center lg:text-left">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fef3c7] rounded-full border-2 border-[#1e293b] font-bold text-amber-800 text-sm mb-6 shadow-[2px_2px_0px_0px_#1e293b]">
            <Sparkles className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>生態護育工會：守護環境保育者的專屬後盾 🛡️</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1e293b] leading-tight mb-6">
            當你用愛守護生命與土地， <br />
            <span className="text-red-500 relative inline-block">
              我們用盾守護你！
              <svg className="absolute left-0 -bottom-2 w-full h-3 text-amber-400 fill-amber-400" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,0 Q50,10 100,0 L100,10 L0,10 Z" />
              </svg>
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl font-bold text-[#1e293b]/70 mb-8 max-w-2xl leading-relaxed">
            志工與從業者有各式各樣的動物、植物、環境保護者。當你在第一線清理海灘、種下希望樹苗或安撫收容所毛孩子時，
            <strong className="text-[#1e293b]"> 台灣環境生態護育產業工會就是你最溫暖的保障！ </strong>
            我們提供法規申訴、意外保險把關與安全裝備指南，絕不讓你孤軍奮戰。
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
            <button
              onClick={() => onNavigate("chat")}
              className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-500 text-[#1e293b] text-lg font-black rounded-2xl border-4 border-[#1e293b] bubbly-shadow-xl transform hover:-translate-y-1 transition-transform cursor-pointer flex items-center justify-center gap-2"
              id="hero-chat-btn"
            >
              <span>尋找你的 AI 守護獸 💬</span>
              <ArrowRight className="w-5 h-5 text-[#1e293b] stroke-[3]" />
            </button>
            <button
              onClick={() => onNavigate("quiz")}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-300 hover:bg-emerald-400 text-[#1e293b] text-lg font-black rounded-2xl border-4 border-[#1e293b] bubbly-shadow-xl transform hover:-translate-y-1 transition-transform cursor-pointer flex items-center justify-center gap-2"
              id="hero-quiz-btn"
            >
              <span>權益檢測挑戰 🎓</span>
            </button>
          </div>

          {/* Core Concept Pill list */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm font-bold text-[#1e293b]">
            <span className="px-3.5 py-1.5 bg-amber-100 rounded-xl border-2 border-[#1e293b]">🐾 守護浪浪</span>
            <span className="px-3.5 py-1.5 bg-emerald-100 rounded-xl border-2 border-[#1e293b]">🌱 種樹育苗</span>
            <span className="px-3.5 py-1.5 bg-sky-100 rounded-xl border-2 border-[#1e293b]">🌊 淨灘淨山</span>
            <span className="px-3.5 py-1.5 bg-red-100 rounded-xl border-2 border-[#1e293b]">🛡️ 權益後盾率 100%</span>
          </div>
        </div>

        {/* Right Column: Hero Graphic */}
        <div className="lg:col-span-5 relative" id="hero-banner-container">
          {/* Main Hero Image */}
          <div className="relative z-10 rounded-[3xl] overflow-hidden border-4 border-[#1e293b] bubbly-shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
            <img
              src="/src/assets/images/volunteer_shield_hero_1784352794806.jpg"
              alt="台灣環境生態護育產業工會，守護志工與保育者的安全後盾"
              className="w-full h-auto object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Cute gradient bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1e293b]/70 to-transparent p-6 text-white pt-24 text-left">
              <h4 className="text-xl font-extrabold tracking-wide">當你守護世界，我們守護你！</h4>
              <p className="text-xs font-medium text-white/90">台灣環境生態護育產業工會 • BeUnion 2026</p>
            </div>
          </div>

          {/* Floaty Badge 1: Insurance */}
          <div className="absolute -top-6 -left-6 z-20 bg-rose-400 text-white font-black p-4 rounded-2xl border-3 border-[#1e293b] bubbly-shadow-lg text-center transform -rotate-12 animate-bounce-slow">
            <Shield className="w-5 h-5 mx-auto mb-1 fill-white text-rose-400" />
            <div className="text-xs">意外保險</div>
            <div className="text-sm font-black">上工必備！</div>
          </div>

          {/* Floaty Badge 2: Warning Alert */}
          <div className="absolute bottom-6 -right-6 z-20 bg-amber-300 text-[#1e293b] font-black py-2 px-4 rounded-xl border-3 border-[#1e293b] bubbly-shadow-lg flex items-center gap-2 transform rotate-6 hover:-rotate-3 transition-transform">
            <AlertTriangle className="w-5 h-5 text-red-500 fill-amber-300 animate-pulse" />
            <div className="text-left text-xs leading-tight">
              <div className="font-extrabold text-[#1e293b]">謝絕免錢勞工</div>
              <div className="font-bold text-[#1e293b]/80">拒絕超時危險</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
