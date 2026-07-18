import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  MapPin, 
  User, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight,
  Info,
  ChevronRight,
  Heart,
  Loader2
} from "lucide-react";

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  lecturer?: string;
  description: string;
  maxSeats: number;
  registeredCount: number;
  imageUrl?: string;
}

interface EventCalendarProps {
  onRefreshTrigger?: number;
}

export default function EventCalendar({ onRefreshTrigger }: EventCalendarProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  
  // Registration Form State
  const [showRegModal, setShowRegModal] = useState<boolean>(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regType, setRegType] = useState("animal");
  const [regNotes, setRegNotes] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [onRefreshTrigger]);

  const handleOpenRegister = (event: EventItem) => {
    setSelectedEvent(event);
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegType("animal");
    setRegNotes("");
    setSubmitSuccess(false);
    setSubmitError(null);
    setShowRegModal(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setSubmitError("請填寫姓名、Email 與聯絡電話喔捏！");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          volunteerType: regType,
          notes: regNotes
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitSuccess(true);
        // Refresh events count
        fetchEvents();
        setTimeout(() => {
          setShowRegModal(false);
          setSelectedEvent(null);
          setSubmitSuccess(false);
        }, 2200);
      } else {
        setSubmitError(data.error || "報名失敗，請稍候重試。");
      }
    } catch (err) {
      console.error("Error registering:", err);
      setSubmitError("伺服器連線中斷，請確認您的網路連線。");
    } finally {
      setSubmitting(false);
    }
  };

  // Sort events: closest upcoming first
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="py-16 bg-[#faf8f4] border-t-4 border-[#1e293b]" id="activities-calendar-section">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Title Block */}
        <div className="text-center mb-12">
          <span className="bg-amber-100 text-amber-800 text-xs font-black px-4 py-1 rounded-full border border-amber-300 uppercase tracking-widest inline-flex items-center gap-1">
            🗓️ UPCOMING EVENTS CALENDAR
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e293b] mt-3">
            工會近期守護活動 ‧ 志工報名
          </h2>
          <p className="text-sm sm:text-base font-bold text-[#1e293b]/60 mt-2 max-w-2xl mx-auto">
            與守護夥伴們一同走入現場！我們定期舉辦專業技能訓練、生態農法體驗及動保培訓，歡迎您點擊查看並直接線上卡位報名。
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">正在加載精彩活動行事曆，請稍候...</p>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-3 border-dashed border-slate-300 p-8 max-w-md mx-auto">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500">目前暫時無新活動，請密切留意工會公告！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sortedEvents.map((ev, idx) => {
              const availableSeats = ev.maxSeats - ev.registeredCount;
              const isFull = availableSeats <= 0;
              
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-white border-3 border-[#1e293b] rounded-[2.5rem] overflow-hidden bubbly-shadow-md flex flex-col justify-between hover:scale-[1.01] hover:shadow-[6px_6px_0px_0px_#1e293b] transition-all"
                  id={`event-card-${ev.id}`}
                >
                  <div>
                    {/* Event Banner */}
                    {ev.imageUrl ? (
                      <div className="h-44 w-full overflow-hidden border-b-3 border-[#1e293b] relative bg-slate-100">
                        <img 
                          src={ev.imageUrl} 
                          alt={ev.title} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-3 left-3 bg-white text-[#1e293b] text-xs font-black px-3 py-1 rounded-full border-2 border-[#1e293b] shadow-sm">
                          📅 {ev.date}
                        </span>
                        
                        {isFull ? (
                          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-[#1e293b] shadow-sm">
                            🈵 額滿
                          </span>
                        ) : availableSeats <= 5 ? (
                          <span className="absolute top-3 right-3 bg-amber-400 text-[#1e293b] text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-[#1e293b] shadow-sm animate-pulse">
                            🔥 僅剩 {availableSeats} 名額
                          </span>
                        ) : (
                          <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-[#1e293b] shadow-sm">
                            開放報名中
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-12 border-b-3 border-[#1e293b] bg-slate-50 relative flex items-center justify-between px-6">
                        <span className="text-xs font-black text-[#1e293b]">📅 {ev.date}</span>
                        {isFull ? (
                          <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-[#1e293b] shadow-sm">
                            🈵 額滿
                          </span>
                        ) : (
                          <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-[#1e293b] shadow-sm">
                            開放報名
                          </span>
                        )}
                      </div>
                    )}

                    {/* Event Info Details */}
                    <div className="p-6 text-left space-y-4">
                      <h3 className="text-lg sm:text-xl font-black text-[#1e293b] leading-tight line-clamp-2 hover:text-emerald-700 transition-colors">
                        {ev.title}
                      </h3>

                      {/* Info grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-[#1e293b]/80 bg-amber-50/30 p-4 rounded-2xl border border-[#1e293b]/5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{ev.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="truncate" title={ev.location}>{ev.location}</span>
                        </div>
                        {ev.lecturer && (
                          <div className="flex items-center gap-1.5 sm:col-span-2 text-slate-700">
                            <User className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="truncate">主講/引導：{ev.lecturer}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm font-medium text-[#1e293b]/70 leading-relaxed whitespace-pre-line line-clamp-4">
                        {ev.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer seating and button */}
                  <div className="p-6 pt-2 border-t border-[#1e293b]/10 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-black text-[#1e293b]/60">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>
                        報名人數：<span className="text-[#1e293b]">{ev.registeredCount}</span> / {ev.maxSeats} 人
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenRegister(ev)}
                      disabled={isFull}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-[#1e293b] text-xs font-black flex items-center justify-center gap-1.5 transition-transform hover:-translate-y-0.5 cursor-pointer bubbly-shadow-xs ${
                        isFull
                          ? "bg-slate-200 text-slate-400 border-slate-300 hover:translate-y-0 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                      id={`register-btn-${ev.id}`}
                    >
                      {isFull ? "報名已額滿 🈵" : "立即報名卡位 🚀"}
                      {!isFull && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Online Registration Modal */}
      <AnimatePresence>
        {showRegModal && selectedEvent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!submitting) setShowRegModal(false); }}
              className="absolute inset-0 bg-[#1e293b]/60 backdrop-blur-sm"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-lg bg-[#fffdfa] rounded-[2.5rem] border-4 border-[#1e293b] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] text-left"
            >
              {/* Modal Banner Header */}
              <div className="bg-[#1e293b] text-white p-6 relative shrink-0">
                <button
                  onClick={() => setShowRegModal(false)}
                  disabled={submitting}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="bg-amber-400 text-[#1e293b] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500 uppercase inline-block mb-1.5">
                  ✍️ 線上報名系統
                </span>
                <h3 className="font-black text-base sm:text-lg text-amber-300 leading-snug truncate pr-8">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>活動日期：{selectedEvent.date}</span>
                </p>
              </div>

              {/* Success Screen */}
              {submitSuccess ? (
                <div className="p-8 text-center space-y-4 flex-1 flex flex-col justify-center items-center py-16">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 border-2 border-emerald-500"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <h4 className="text-lg font-black text-[#1e293b]">🎉 報名成功！期待與您相見！</h4>
                  <p className="text-xs sm:text-sm font-semibold text-[#1e293b]/70 max-w-xs leading-relaxed">
                    我們已經成功收到您的報名，並保留了名額。工會秘書處將會在活動前以 Email 或簡訊發送行前通知給您喔。
                  </p>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-semibold">
                    🛡️ <span className="font-black text-emerald-950">工會安心安全提示：</span>
                    工會主辦之現場活動皆會為出席志工免費投保一日意外傷害保險！請務必填寫正確的真實姓名，以便後續投保作業捏。
                  </div>

                  {/* Real name */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                      <span>1. 真實姓名</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="請輸入您的真實姓名"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-bold bg-white"
                      disabled={submitting}
                      id="volunteer-name-input"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                      <span>2. 聯絡電話</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="例如：0912-345678"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-bold bg-white"
                      disabled={submitting}
                      id="volunteer-phone-input"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                      <span>3. 電子信箱</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="例如：yourname@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-bold bg-white"
                      disabled={submitting}
                      id="volunteer-email-input"
                    />
                  </div>

                  {/* Volunteer Category Interest */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b]">4. 您目前主要關注或參與的志工領域</label>
                    <select
                      value={regType}
                      onChange={(e) => setRegType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-black bg-white"
                      disabled={submitting}
                    >
                      <option value="animal">🐾 動物保護組 (流浪動物、野保、案件錄案)</option>
                      <option value="plant">🌱 植物綠化組 (復育老樹、種樹、棲地防護)</option>
                      <option value="eco">💧 環境與淨灘組 (海灘淨灘、減塑宣導、水質監測)</option>
                      <option value="other">💼 其他/跨領域支持者 (文書、美編、活動企劃)</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b]">5. 備註與特殊飲食習慣 (可選)</label>
                    <textarea
                      rows={2}
                      maxLength={150}
                      placeholder="例如：素食、有急救證照、或是當日需要交通共乘指引等..."
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-semibold bg-white resize-none"
                      disabled={submitting}
                    />
                  </div>

                  {/* Submit footer control */}
                  <div className="pt-4 border-t border-[#1e293b]/10 flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowRegModal(false)}
                      className="px-4 py-2 text-xs font-black text-slate-500 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-black rounded-xl border-2 border-[#1e293b] flex items-center gap-1.5 bubbly-shadow-xs cursor-pointer transition-colors"
                      id="submit-registration-btn"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>正在儲存報名...</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-3.5 h-3.5 fill-white" />
                          <span>確認送出、卡位活動 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
