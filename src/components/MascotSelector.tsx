import React, { useState } from "react";
import { Mascot } from "../types";
import { MASCOTS } from "../data";
import { Shield, Check, Heart, Sparkles, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MascotSelectorProps {
  onSelectMascot: (mascotId: string) => void;
}

export default function MascotSelector({ onSelectMascot }: MascotSelectorProps) {
  const [selectedMascot, setSelectedMascot] = useState<Mascot>(MASCOTS[0]);

  return (
    <section className="py-16 px-4 bg-[#fbf9f4] border-t-4 border-b-4 border-[#1e293b]" id="mascots-section">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-red-500 font-extrabold text-lg mb-2">
            <Heart className="w-5 h-5 fill-red-500 text-red-500 animate-ping" />
            <span>三大志工家族，由我們來守護！</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-[#1e293b]">各式各樣的生命與守護天使</h3>
          <p className="text-md md:text-lg font-bold text-[#1e293b]/70 mt-2 max-w-2xl mx-auto">
            動植物和自然環境不會說話，全靠志工挺身而出。我們有守護毛孩、種下綠林、海洋減塑三大家族，點選下方家族，查看專屬安全權益守則！
          </p>
        </div>

        {/* Mascot Selection Row (3 cute cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" id="mascot-selection-grid">
          {MASCOTS.map((mascot) => {
            const isSelected = selectedMascot.id === mascot.id;
            const cardColorClasses = {
              animal: "hover:bg-amber-100/40 border-amber-500 text-amber-900",
              plant: "hover:bg-emerald-100/40 border-emerald-500 text-emerald-900",
              eco: "hover:bg-sky-100/40 border-sky-500 text-sky-900",
            }[mascot.id as "animal" | "plant" | "eco"];

            return (
              <button
                key={mascot.id}
                id={`mascot-card-${mascot.id}`}
                onClick={() => setSelectedMascot(mascot)}
                className={`relative p-6 rounded-[2.5rem] border-4 cursor-pointer text-left transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between ${
                  isSelected
                    ? `bg-${mascot.color}-100 bubbly-shadow-xl border-[#1e293b] scale-102`
                    : `bg-white border-[#1e293b]/40 hover:border-[#1e293b] bubbly-shadow`
                }`}
              >
                {/* Cute Badge */}
                {isSelected && (
                  <div className="absolute -top-3 -right-3 bg-red-400 text-white border-2 border-[#1e293b] px-3 py-1 rounded-full text-xs font-black rotate-6 shadow-[2px_2px_0px_0px_#1e293b]">
                    正在瀏覽 🌟
                  </div>
                )}

                {/* Avatar and Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-[#1e293b] shrink-0 bg-white">
                    <img
                      src={mascot.avatar}
                      alt={mascot.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 bg-[#1e293b]/10 text-[#1e293b] rounded-full">
                      {mascot.role}
                    </span>
                    <h4 className="text-2xl font-black text-[#1e293b] mt-1">{mascot.name}</h4>
                  </div>
                </div>

                {/* Quote Short */}
                <p className="text-sm font-bold text-[#1e293b]/70 line-clamp-2 italic mb-4">
                  "{mascot.quote}"
                </p>

                {/* Explore Safety button */}
                <div className="w-full flex items-center justify-between mt-auto pt-4 border-t-2 border-[#1e293b]/10">
                  <span className="text-xs font-bold text-[#1e293b]/60">點擊查看 📖 專屬守護守則</span>
                  <div className={`w-8 h-8 rounded-full border-2 border-[#1e293b] flex items-center justify-center bg-${mascot.color}-300`}>
                    <Shield className="w-4 h-4 text-[#1e293b]" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Mascot Details and Guidelines (Cute Bento Area) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMascot.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            id="mascot-detail-panel"
            className={`p-8 md:p-10 rounded-[3rem] border-4 border-[#1e293b] bubbly-shadow-xl ${selectedMascot.bgColor}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Mascot Intro Card (Col: 5) */}
              <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="relative mb-6">
                  <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] overflow-hidden border-4 border-[#1e293b] bg-white bubbly-shadow-lg">
                    <img
                      src={selectedMascot.avatar}
                      alt={selectedMascot.name}
                      className="w-full h-full object-cover animate-bounce-slow"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-amber-400 p-2.5 rounded-2xl border-2 border-[#1e293b] text-xs font-bold rotate-12">
                    {selectedMascot.id === "animal" ? "🐶 旺汪汪！" : selectedMascot.id === "plant" ? "🌱 嗶嗶！" : "💧 呼哈！"}
                  </div>
                </div>

                <h4 className="text-3xl font-black text-[#1e293b] mb-1">{selectedMascot.name}</h4>
                <div className="inline-block px-3 py-1 bg-[#1e293b] text-white text-xs font-black rounded-lg mb-4">
                  {selectedMascot.role}
                </div>
                <p className="text-md font-bold text-[#1e293b]/80 leading-relaxed mb-6">
                  {selectedMascot.description}
                </p>

                {/* Mascot Quote Banner */}
                <div className="p-4 bg-white/80 rounded-2xl border-2 border-[#1e293b] bubbly-shadow text-sm font-bold text-[#1e293b] relative">
                  <div className="absolute -top-3 left-4 bg-red-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-[#1e293b]">
                    守護誓言
                  </div>
                  <p className="italic">"{selectedMascot.quote}"</p>
                </div>

                {/* Interactive Consultation CTA */}
                <button
                  onClick={() => onSelectMascot(selectedMascot.id)}
                  className={`mt-6 px-6 py-3 bg-${selectedMascot.color}-300 hover:bg-${selectedMascot.color}-400 text-[#1e293b] font-black rounded-xl border-3 border-[#1e293b] bubbly-shadow text-sm cursor-pointer hover:-translate-y-0.5 transition-transform flex items-center gap-2`}
                  id="mascot-chat-cta"
                >
                  <Sparkles className="w-4 h-4 text-[#1e293b] fill-[#1e293b]" />
                  <span>和{selectedMascot.name}聊聊諮詢 💬</span>
                </button>
              </div>

              {/* Guidelines Area (Col: 7) */}
              <div className="lg:col-span-7">
                <div className="bg-white/70 p-6 rounded-[2rem] border-3 border-[#1e293b]">
                  <h5 className="text-xl font-black text-[#1e293b] mb-6 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-[#1e293b] fill-amber-300" />
                    <span>志工權益與安全守護規範</span>
                  </h5>

                  <div className="space-y-6">
                    {selectedMascot.guidelines.map((guide, idx) => (
                      <div key={idx} className="flex gap-4 items-start border-b-2 border-[#1e293b]/10 pb-4 last:border-b-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-[#1e293b] flex items-center justify-center shrink-0 font-black text-sm text-[#1e293b] shadow-[1px_1px_0px_0px_#1e293b]">
                          {idx + 1}
                        </div>
                        <div className="text-left">
                          <h6 className="font-extrabold text-[#1e293b] text-base mb-1">{guide.title}</h6>
                          <p className="text-sm font-bold text-[#1e293b]/70 leading-relaxed">{guide.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning Box */}
                  <div className="mt-6 p-4 bg-red-100 rounded-xl border-2 border-[#1e293b] text-left flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-black text-red-800 leading-normal">
                      工會提醒：任何聘僱或主辦單位若違反上述守則（如不投保、不提供基本安全護具、惡劣氣候下強行要求上工），從業者與志工有絕對權利「現場拒絕服務」，並可透過本站進行「權益申訴」，台灣環境生態護育產業工會秘書處將全力介入協助！
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
