import React, { useState, useRef, useEffect } from "react";
import { MASCOTS } from "../data";
import { ChatMessage, Mascot } from "../types";
import { Send, Sparkles, User, Shield, HelpCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIConsultationProps {
  initialMascotId?: string;
}

export default function AIConsultation({ initialMascotId = "animal" }: AIConsultationProps) {
  const [selectedMascot, setSelectedMascot] = useState<Mascot>(
    MASCOTS.find((m) => m.id === initialMascotId) || MASCOTS[0]
  );
  
  // Keep selectedMascot in sync if prop changes
  useEffect(() => {
    const found = MASCOTS.find((m) => m.id === initialMascotId);
    if (found) setSelectedMascot(found);
  }, [initialMascotId]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Set initial greeting whenever mascot changes
  useEffect(() => {
    setMessages([
      {
        id: "greet",
        role: "model",
        text: selectedMascot.quote,
        timestamp: new Date()
      }
    ]);
  }, [selectedMascot]);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Build history for backend (maximum 6 turns to prevent token overhead)
      const chatHistory = messages
        .filter((m) => m.id !== "greet")
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch("/api/gemini/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          volunteerType: selectedMascot.id
        })
      });

      if (!response.ok) {
        throw new Error("伺服器連線失敗，請檢查環境變數是否正確。");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: data.text || "嗶嗶！守護神獸開小差了，請再跟我說一次喔！🌱",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "跟神獸說話時斷線了，請再試一次！");
    } finally {
      setIsLoading(false);
    }
  };

  const getLoadingText = () => {
    if (selectedMascot.id === "animal") return "🐾 阿旺正在搖尾巴，努力幫你翻查《志願服務法》條款...";
    if (selectedMascot.id === "plant") return "🌱 芽芽正在搬運安全防護盾牌，等我發芽三秒鐘...";
    return "💧 滴滴超人正在過濾河川垃圾，一邊幫你諮詢法規顧問...";
  };

  return (
    <section className="py-16 px-4 bg-[#fffdfa] border-b-4 border-[#1e293b]" id="chat-section">
      <div className="max-w-5xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-amber-500 font-extrabold text-lg mb-2">
            <Sparkles className="w-5 h-5 fill-amber-500 text-amber-500 animate-spin" />
            <span>AI 線上溫暖諮詢中心</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-[#1e293b]">AI 志工守護神獸諮詢室 💬</h3>
          <p className="text-sm md:text-base font-bold text-[#1e293b]/70 mt-2 max-w-2xl mx-auto">
            我們把枯燥的法規與保險權益，託付給三位可愛活潑的守護神獸。點選你服務的類別，向專屬神獸提問關於保險、契約、受傷申訴或心理疲憊的各種問題吧！
          </p>
        </div>

        {/* Outer Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Panel: Mascot Switcher (Col: 4) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="p-6 bg-amber-50 rounded-3xl border-3 border-[#1e293b] bubbly-shadow text-left">
              <h4 className="font-black text-lg text-[#1e293b] mb-4 flex items-center gap-1.5">
                <span>選擇諮詢對象：</span>
              </h4>
              <div className="space-y-3">
                {MASCOTS.map((mascot) => {
                  const isSelected = selectedMascot.id === mascot.id;
                  return (
                    <button
                      key={mascot.id}
                      id={`chat-mascot-btn-${mascot.id}`}
                      onClick={() => setSelectedMascot(mascot)}
                      className={`w-full p-3 rounded-2xl border-3 flex items-center gap-3 text-left font-bold cursor-pointer transition-all ${
                        isSelected
                          ? "bg-white border-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b]"
                          : "bg-white/40 border-transparent hover:border-[#1e293b]/30"
                      }`}
                    >
                      <img
                        src={mascot.avatar}
                        alt={mascot.name}
                        className="w-12 h-12 rounded-full border-2 border-[#1e293b] object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="leading-tight">
                        <div className="text-sm font-black text-[#1e293b]">{mascot.name}</div>
                        <div className="text-[10px] font-bold text-[#1e293b]/60">{mascot.role}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mascot description card */}
            <div className={`p-6 rounded-3xl border-3 border-[#1e293b] bubbly-shadow text-left flex-1 flex flex-col justify-between ${selectedMascot.bgColor}`}>
              <div>
                <h5 className="font-black text-base text-[#1e293b] mb-2">🐾 {selectedMascot.name} 介紹</h5>
                <p className="text-xs font-bold text-[#1e293b]/70 leading-relaxed mb-4">
                  {selectedMascot.description}
                </p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border-2 border-[#1e293b] text-xs font-bold text-[#1e293b]/80 relative mt-4">
                <span className="absolute -top-2.5 left-2 bg-[#1e293b] text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">神獸密技</span>
                專長：志工意外保險法規、現場安全維護、心理溫馨抱抱與打氣！
              </div>
            </div>
          </div>

          {/* Right Panel: Active Chat Box (Col: 8) */}
          <div className="lg:col-span-8 flex flex-col rounded-[2.5rem] border-4 border-[#1e293b] bg-[#fbfbf9] bubbly-shadow-xl overflow-hidden min-h-[500px]">
            {/* Chat header */}
            <div className="px-6 py-4 border-b-4 border-[#1e293b] bg-[#1e293b] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-white">
                  <img
                    src={selectedMascot.avatar}
                    alt={selectedMascot.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-left">
                  <h4 className="font-black text-md leading-tight">{selectedMascot.name}</h4>
                  <p className="text-[10px] font-bold text-white/75">台灣環境生態護育產業工會 • 線上諮詢室</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-red-400 text-white border border-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-ping" />
                <span>後盾連線中</span>
              </div>
            </div>

            {/* Chat Messages scroll window */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[360px] space-y-4" id="chat-messages-container">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    {/* Avatar icon */}
                    <div className="w-8 h-8 rounded-full border-2 border-[#1e293b] bg-white shrink-0 overflow-hidden flex items-center justify-center">
                      {isUser ? (
                        <User className="w-4 h-4 text-[#1e293b]" />
                      ) : (
                        <img
                          src={selectedMascot.avatar}
                          alt={selectedMascot.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    {/* Speech bubble */}
                    <div className="text-left">
                      <div className={`p-4 rounded-2xl border-2 font-bold text-sm leading-relaxed ${
                        isUser
                          ? "bg-amber-100 border-[#1e293b] rounded-tr-none text-[#1e293b]"
                          : "bg-white border-[#1e293b] rounded-tl-none text-[#1e293b]"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 mt-1 block">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Bouncy Loading Bubble */}
              {isLoading && (
                <div className="flex gap-3 mr-auto max-w-[85%] items-start animate-pulse">
                  <div className="w-8 h-8 rounded-full border-2 border-[#1e293b] bg-white shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedMascot.avatar}
                      alt={selectedMascot.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="p-4 bg-white border-2 border-dashed border-[#1e293b] rounded-2xl rounded-tl-none font-bold text-xs text-gray-500 leading-normal">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                        <span className="ml-1 font-black text-[#1e293b]">{getLoadingText()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Box */}
              {errorMsg && (
                <div className="p-4 bg-red-100 border-2 border-red-400 text-red-800 font-bold text-xs rounded-xl flex items-start gap-2 max-w-md mx-auto" id="chat-error-box">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black">{errorMsg}</p>
                    <button
                      onClick={() => handleSendMessage(messages[messages.length - 1]?.text || "")}
                      className="underline font-bold text-red-600 mt-1 hover:text-red-800 cursor-pointer"
                    >
                      重新發送上一個提問 🔄
                    </button>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Suggested pre-defined Questions row */}
            <div className="p-3 bg-gray-50 border-t-2 border-[#1e293b]/10 border-b-2 flex flex-wrap gap-2 text-left">
              <span className="text-xs font-black text-[#1e293b]/50 flex items-center gap-1 py-1.5 pl-1.5 shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>熱門提問：</span>
              </span>
              {selectedMascot.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  id={`suggested-q-btn-${idx}`}
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 border-2 border-[#1e293b] hover:border-amber-400 rounded-lg text-xs font-bold text-[#1e293b] cursor-pointer active:translate-y-0.5 transition-transform"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Typing input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-4 bg-white border-t-4 border-[#1e293b] flex gap-3"
              id="chat-input-form"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder={`輸入提問給${selectedMascot.name}...（例：志工意外保險怎麼申訴？）`}
                className="flex-1 px-4 py-3 rounded-2xl border-3 border-[#1e293b] bg-[#fffdfc] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                id="chat-text-input"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`px-5 py-3 rounded-2xl border-3 border-[#1e293b] bubbly-shadow font-black text-sm flex items-center gap-1.5 cursor-pointer ${
                  !inputValue.trim() || isLoading
                    ? "bg-gray-100 border-gray-300 text-gray-400 shadow-none cursor-not-allowed"
                    : "bg-amber-400 hover:bg-amber-500 text-[#1e293b]"
                }`}
                id="chat-send-btn"
              >
                <span>發送</span>
                <Send className="w-4 h-4 text-[#1e293b]" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
}
