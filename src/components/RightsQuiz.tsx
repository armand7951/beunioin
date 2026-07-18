import React, { useState } from "react";
import { QUIZ_QUESTIONS } from "../data";
import { Shield, Award, RotateCcw, CheckCircle, XCircle, Heart, Sparkles, Printer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function RightsQuiz() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const [volunteerName, setVolunteerName] = useState("");
  const [selectedMascot, setSelectedMascot] = useState("animal");

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];

  const handleOptionSelect = (optionIdx: number) => {
    if (hasSubmitted) return;
    setSelectedOption(optionIdx);
  };

  const handleNextQuestion = () => {
    if (selectedOption === currentQuestion.correctIndex) {
      setScore((prev) => prev + 1);
    }

    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasSubmitted(false);
    } else {
      // Finalize quiz
      setScore((prev) => {
        const finalScore = selectedOption === currentQuestion.correctIndex ? prev + 1 : prev;
        setShowCertificate(true);
        return finalScore;
      });
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setHasSubmitted(false);
    setScore(0);
    setShowCertificate(false);
    setVolunteerName("");
  };

  const getMascotName = (id: string) => {
    if (id === "animal") return "守護犬阿旺 🐶";
    if (id === "plant") return "小發芽芽芽 🌱";
    return "小滴滴超人 💧";
  };

  const getMascotBgColor = (id: string) => {
    if (id === "animal") return "bg-amber-100 border-amber-500 text-amber-900";
    if (id === "plant") return "bg-emerald-100 border-emerald-500 text-emerald-900";
    return "bg-sky-100 border-sky-500 text-sky-900";
  };

  const getCertificateTheme = (id: string) => {
    if (id === "animal") return { primary: "bg-amber-50 text-amber-900 border-amber-500", accent: "bg-amber-400 text-[#1e293b]" };
    if (id === "plant") return { primary: "bg-emerald-50 text-emerald-900 border-emerald-500", accent: "bg-emerald-300 text-[#1e293b]" };
    return { primary: "bg-sky-50 text-sky-900 border-sky-500", accent: "bg-sky-300 text-[#1e293b]" };
  };

  return (
    <section className="py-16 px-4 bg-[#fcfaf5] border-b-4 border-[#1e293b]" id="quiz-section">
      <div className="max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border-2 border-emerald-500 text-emerald-800 rounded-full text-xs font-black mb-3 shadow-[1px_1px_0px_0px_#1e293b]">
            <Award className="w-4 h-4" />
            <span>互動權益挑戰</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-[#1e293b]">生態與勞動權益學堂 🎓</h3>
          <p className="text-sm md:text-base font-bold text-[#1e293b]/70 mt-2 max-w-xl mx-auto">
            你知道在第一線守護動植物與生態時，有哪些不可妥協的法定與職安權益嗎？完成測試，立刻獲得台灣環境生態護育產業工會頒發的「生態護育安全守護證書」！
          </p>
        </div>

        {/* Dynamic Quiz Card */}
        <div className="bg-white rounded-[2.5rem] border-4 border-[#1e293b] bubbly-shadow-xl overflow-hidden p-8 md:p-10 text-left">
          {!showCertificate ? (
            <div id="quiz-question-container">
              {/* Progress and Score */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-black text-[#1e293b]/60 uppercase tracking-widest">
                  問題 {currentQuestionIndex + 1} / {QUIZ_QUESTIONS.length}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 rounded-xl border-2 border-[#1e293b] text-xs font-black text-[#1e293b]">
                  <span>目前得分：</span>
                  <span className="text-[#1e293b]">{score} 分</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-gray-100 rounded-full border-2 border-[#1e293b] mb-8 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex) / QUIZ_QUESTIONS.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <h4 className="text-xl md:text-2xl font-black text-[#1e293b] mb-8 leading-snug">
                {currentQuestion.question}
              </h4>

              {/* Options */}
              <div className="space-y-4 mb-8">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const showCorrect = hasSubmitted && idx === currentQuestion.correctIndex;
                  const showIncorrect = hasSubmitted && isSelected && idx !== currentQuestion.correctIndex;

                  let optionStyle = "border-gray-200 hover:border-[#1e293b]/50 hover:bg-gray-50/50";
                  if (isSelected) optionStyle = "border-[#1e293b] bg-amber-50 shadow-[2px_2px_0px_0px_#1e293b]";
                  if (showCorrect) optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-[2px_2px_0px_0px_#10b981]";
                  if (showIncorrect) optionStyle = "border-red-500 bg-red-50 text-red-900 shadow-[2px_2px_0px_0px_#f43f5e]";

                  return (
                    <button
                      key={idx}
                      id={`quiz-option-${idx}`}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={hasSubmitted}
                      className={`w-full p-5 rounded-2xl border-3 font-bold text-base text-left transition-all cursor-pointer flex items-center justify-between ${optionStyle}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full border-2 border-[#1e293b] flex items-center justify-center font-black text-sm shrink-0 ${
                          isSelected ? "bg-amber-300 text-[#1e293b]" : "bg-white text-[#1e293b]/60"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-relaxed">{option}</span>
                      </div>

                      {showCorrect && <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />}
                      {showIncorrect && <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Panel */}
              <AnimatePresence>
                {hasSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-5 rounded-2xl bg-slate-50 border-2 border-[#1e293b] mb-6"
                    id="quiz-explanation-box"
                  >
                    <h5 className="font-extrabold text-[#1e293b] mb-1.5 flex items-center gap-1.5 text-sm">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>守護獸芽芽解答：</span>
                    </h5>
                    <p className="text-sm font-medium text-[#1e293b]/80 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Nav Row */}
              <div className="flex justify-end pt-4 border-t-2 border-gray-100">
                {!hasSubmitted ? (
                  <button
                    onClick={() => setHasSubmitted(true)}
                    disabled={selectedOption === null}
                    className={`px-8 py-3.5 font-black rounded-xl border-3 border-[#1e293b] bubbly-shadow text-base cursor-pointer flex items-center gap-2 ${
                      selectedOption === null
                        ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed shadow-none"
                        : "bg-amber-400 hover:bg-amber-500 text-[#1e293b]"
                    }`}
                    id="quiz-submit-btn"
                  >
                    <span>確認答案 ✔️</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-8 py-3.5 bg-emerald-300 hover:bg-emerald-400 text-[#1e293b] font-black rounded-xl border-3 border-[#1e293b] bubbly-shadow text-base cursor-pointer flex items-center gap-2"
                    id="quiz-next-btn"
                  >
                    <span>
                      {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? "下一題 ➡️" : "生成守護證書 🎓"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Certificate Generator View
            <div id="certificate-generator-panel" className="text-center py-4">
              <div className="max-w-md mx-auto mb-8 bg-[#fffcf5] p-6 rounded-3xl border-3 border-[#1e293b] text-left">
                <h4 className="text-xl font-black text-[#1e293b] mb-4">恭喜完成挑戰！🎉</h4>
                
                {/* User Input Name */}
                <div className="mb-4">
                  <label className="block text-xs font-black text-[#1e293b] mb-1.5 uppercase tracking-wider">
                    ✍️ 輸入你的守護志工姓名：
                  </label>
                  <input
                    type="text"
                    value={volunteerName}
                    onChange={(e) => setVolunteerName(e.target.value)}
                    placeholder="例如：林小志"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#1e293b] bg-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    id="cert-name-input"
                  />
                </div>

                {/* Select Mascot Background */}
                <div>
                  <label className="block text-xs font-black text-[#1e293b] mb-1.5 uppercase tracking-wider">
                    🐾 選擇你喜愛的守護神獸背景：
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["animal", "plant", "eco"].map((id) => (
                      <button
                        key={id}
                        id={`cert-mascot-select-${id}`}
                        onClick={() => setSelectedMascot(id)}
                        className={`py-2 px-1 text-center rounded-lg border-2 font-black text-xs cursor-pointer transition-all ${
                          selectedMascot === id
                            ? "bg-amber-300 border-[#1e293b] scale-105"
                            : "bg-white border-gray-300 text-gray-500 hover:border-gray-400"
                        }`}
                      >
                        {id === "animal" ? "阿旺" : id === "plant" ? "芽芽" : "滴滴"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DYNAMIC CERTIFICATE PREVIEW CARD */}
              <div
                className={`max-w-2xl mx-auto p-8 rounded-[2.5rem] border-6 border-double border-[#1e293b] relative overflow-hidden text-center transition-all duration-300 bubbly-shadow-xl ${
                  getCertificateTheme(selectedMascot).primary
                }`}
                id="printable-certificate-card"
              >
                {/* Shiny star shapes */}
                <div className="absolute top-4 left-4 text-amber-500 text-lg">✨</div>
                <div className="absolute top-4 right-4 text-amber-500 text-lg">✨</div>
                <div className="absolute bottom-4 left-4 text-amber-500 text-lg">✨</div>
                <div className="absolute bottom-4 right-4 text-amber-500 text-lg">✨</div>

                {/* Certificate Content */}
                <div className="border-2 border-dashed border-[#1e293b]/40 rounded-2xl p-6 md:p-8">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full border-3 border-[#1e293b] ${getCertificateTheme(selectedMascot).accent}`}>
                      <Shield className="w-10 h-10 fill-white text-[#1e293b]" />
                    </div>
                  </div>

                  <h5 className="text-3xl font-black text-[#1e293b] tracking-wider mb-2">生態護育安全守護證書</h5>
                  <p className="text-xs font-bold text-[#1e293b]/60 tracking-widest uppercase mb-6">
                    BeUnion Environmental Ecology Safety Certificate
                  </p>

                  <div className="my-8 leading-loose">
                    <p className="text-sm font-bold text-[#1e293b]/70">茲證明生態與動保夥伴</p>
                    <p className="text-2xl md:text-3xl font-black text-[#1e293b] underline decoration-amber-400 decoration-wavy underline-offset-8 py-2">
                      {volunteerName.trim() || "第一線生態守護者"}
                    </p>
                    <p className="text-sm font-bold text-[#1e293b]/80 max-w-lg mx-auto leading-relaxed mt-4">
                      參與台灣環境生態護育產業工會《生態與勞動權益小學堂》挑戰，確實理解在守護大自然與動植物時應享有的職安防護、保險保障與法定福利。特頒此證。
                    </p>
                  </div>

                  {/* Stamp and Date */}
                  <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t-2 border-dashed border-[#1e293b]/20">
                    <div className="text-left">
                      <div className="text-xs font-bold text-[#1e293b]/50">頒發神獸：</div>
                      <div className="text-sm font-black text-[#1e293b]">{getMascotName(selectedMascot)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#1e293b]/50">認證得分：</div>
                      <div className="text-sm font-black text-red-500 flex items-center justify-end gap-1">
                        <span>{score * 25} / 100</span>
                        <span>🌟</span>
                      </div>
                    </div>
                  </div>

                  {/* Stamp graphic seal overlay */}
                  <div className="absolute right-10 bottom-20 w-24 h-24 border-3 border-red-500 rounded-full flex items-center justify-center transform rotate-12 opacity-65 pointer-events-none">
                    <div className="border border-red-500 rounded-full p-1 text-[10px] font-black text-red-500 leading-none">
                      環境生態工會 <br />
                      認證章
                    </div>
                  </div>

                </div>
              </div>

              {/* Control row */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => {
                    alert("✨ 嗶嗶！證書已成功生成，你可以使用瀏覽器的列印功能 (Ctrl+P) 來儲存或列印這張可愛證書喔！");
                  }}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-[#1e293b] font-black rounded-xl border-3 border-[#1e293b] bubbly-shadow text-sm cursor-pointer flex items-center gap-2"
                  id="print-cert-btn"
                >
                  <Printer className="w-4 h-4" />
                  <span>列印證書 📄</span>
                </button>
                <button
                  onClick={handleResetQuiz}
                  className="px-6 py-3 bg-white hover:bg-gray-100 text-[#1e293b] font-black rounded-xl border-3 border-[#1e293b] bubbly-shadow text-sm cursor-pointer flex items-center gap-2"
                  id="reset-quiz-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>重新測試 🔄</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
