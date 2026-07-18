import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  MapPin,
  User,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getEventStatus, type EventStatus } from "../lib/eventStatus";

export interface EventItem {
  id: string;
  title: string;
  date: string;
  startsAt: string;
  endsAt: string;
  time: string;
  location: string;
  lecturer?: string;
  description: string;
  maxSeats: number;
  registeredCount: number;
  imageUrl?: string;
  registrationOpen: boolean;
  lifecycleStatus?: "scheduled" | "ended" | "cancelled";
}

const statusLabels: Record<EventStatus, string> = {
  ended: "活動已結束",
  full: "報名已額滿",
  closed: "目前未開放報名",
  open: "開放報名中",
};

export default function EventCalendar({ onRefreshTrigger }: { onRefreshTrigger?: number }) {
  const { session, user, profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regType, setRegType] = useState("animal");
  const [regNotes, setRegNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imageFailures, setImageFailures] = useState<Set<string>>(new Set());

  const fetchEvents = async () => {
    setLoadError("");
    try {
      const response = await fetch("/api/events");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setEvents(body);
    } catch {
      setLoadError("活動資料暫時無法載入，請稍候再試。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, [onRefreshTrigger]);

  const openRegistration = (event: EventItem) => {
    setSelectedEvent(event);
    setRegName(profile?.full_name ?? "");
    setRegEmail(user?.email ?? "");
    setRegPhone(profile?.phone ?? "");
    setRegType("animal");
    setRegNotes("");
    setSubmitSuccess(false);
    setSubmitError("");
  };

  const submitRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEvent) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          volunteerType: regType,
          notes: regNotes,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setSubmitSuccess(true);
      void fetchEvents();
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "報名失敗，請稍候重試。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-[#faf8f4] border-t-4 border-[#1e293b]" id="activities-calendar-section">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="bg-amber-100 text-amber-800 text-xs font-black px-4 py-1 rounded-full border border-amber-300">
            🗓️ GUARDIAN EVENTS
          </span>
          <h2 className="text-3xl md:text-4xl font-black mt-3">工會近期守護活動 ‧ 線上報名</h2>
          <p className="text-sm font-bold text-slate-500 mt-2">
            訪客可直接報名；登入會員會自動帶入資料，並保留個人報名紀錄。
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>
        ) : loadError ? (
          <div className="max-w-lg mx-auto p-6 rounded-2xl border-2 border-red-300 bg-red-50 text-red-800 text-center font-black">
            <AlertTriangle className="w-7 h-7 mx-auto mb-2" />{loadError}
            <button onClick={() => void fetchEvents()} className="block mx-auto mt-4 px-4 py-2 rounded-xl bg-white border-2 border-red-700">重新載入</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((ev, index) => {
              const status = getEventStatus(ev);
              const availableSeats = ev.maxSeats - ev.registeredCount;
              return (
                <motion.article
                  key={ev.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden bubbly-shadow-md flex flex-col"
                  id={`event-card-${ev.id}`}
                >
                  <div className="aspect-[2/3] w-full bg-slate-100 border-b-3 border-[#1e293b] relative flex items-center justify-center">
                    {ev.imageUrl && !imageFailures.has(ev.id) ? (
                      <img
                        src={ev.imageUrl}
                        alt={`${ev.title} 活動海報`}
                        className="w-full h-full object-contain"
                        onError={() => setImageFailures((current) => new Set(current).add(ev.id))}
                      />
                    ) : (
                      <p className="px-6 text-center text-sm font-black text-slate-500">活動海報暫時無法顯示</p>
                    )}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full border-2 border-[#1e293b] text-xs font-black ${
                      status === "open" ? "bg-emerald-500 text-white" : status === "ended" ? "bg-slate-700 text-white" : "bg-amber-400"
                    }`}>
                      {statusLabels[status]}
                    </span>
                  </div>
                  <div className="p-6 flex-1 space-y-4">
                    <h3 className="text-xl font-black">{ev.title}</h3>
                    <div className="space-y-2 text-xs font-bold text-slate-600">
                      <p className="flex gap-2"><Calendar className="w-4 h-4 text-emerald-600" />{ev.date}</p>
                      <p className="flex gap-2"><Clock className="w-4 h-4 text-emerald-600" />{ev.time}</p>
                      <p className="flex gap-2"><MapPin className="w-4 h-4 text-indigo-600 shrink-0" />{ev.location}</p>
                      {ev.lecturer && <p className="flex gap-2"><User className="w-4 h-4 text-amber-600 shrink-0" />{ev.lecturer}</p>}
                    </div>
                    <p className="text-sm font-semibold leading-relaxed text-slate-600">{ev.description}</p>
                  </div>
                  <div className="p-5 border-t flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50">
                    <p className="text-xs font-black flex gap-2"><Users className="w-4 h-4 text-emerald-600" />已報名 {ev.registeredCount} / {ev.maxSeats}（剩 {Math.max(0, availableSeats)}）</p>
                    <button
                      onClick={() => openRegistration(ev)}
                      disabled={status !== "open"}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white disabled:bg-slate-300 disabled:text-slate-500 rounded-xl border-2 border-[#1e293b] text-xs font-black flex justify-center items-center gap-1"
                    >
                      {status === "open" ? "立即報名" : statusLabels[status]}
                      {status === "open" && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[110] p-4 flex items-center justify-center">
            <motion.button aria-label="關閉報名表" className="absolute inset-0 bg-slate-900/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !submitting && setSelectedEvent(null)} />
            <motion.div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border-4 border-[#1e293b] rounded-[2rem] shadow-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <div className="p-5 bg-[#1e293b] text-white sticky top-0 z-10">
                <button onClick={() => setSelectedEvent(null)} className="absolute right-4 top-4"><X /></button>
                <p className="text-xs text-amber-300 font-black">線上活動報名</p>
                <h3 className="font-black pr-8">{selectedEvent.title}</h3>
              </div>
              {submitSuccess ? (
                <div className="p-10 text-center">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-600 mb-3" />
                  <h4 className="text-xl font-black">報名成功！</h4>
                  <p className="text-sm font-bold text-slate-500 mt-2">名額已為您保留，活動前將以 Email 或電話聯絡。</p>
                  <button onClick={() => setSelectedEvent(null)} className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black">完成</button>
                </div>
              ) : (
                <form onSubmit={submitRegistration} className="p-6 space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900">
                    {user ? "已登入會員，資料已自動帶入；可在會員中心查看紀錄。" : "一般訪客也可以報名，請留下姓名、Email 與電話。"}
                  </div>
                  {submitError && <p className="p-3 bg-red-50 border border-red-300 rounded-xl text-sm font-bold text-red-800">{submitError}</p>}
                  <label className="block text-xs font-black">姓名 *<input required value={regName} onChange={(e) => setRegName(e.target.value)} className="mt-1 w-full p-3 border-2 rounded-xl" /></label>
                  <label className="block text-xs font-black">Email *<input required type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="mt-1 w-full p-3 border-2 rounded-xl" /></label>
                  <label className="block text-xs font-black">聯絡電話 *<input required type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="mt-1 w-full p-3 border-2 rounded-xl" /></label>
                  <label className="block text-xs font-black">關注領域<select value={regType} onChange={(e) => setRegType(e.target.value)} className="mt-1 w-full p-3 border-2 rounded-xl bg-white"><option value="animal">動物保護</option><option value="plant">植物綠化</option><option value="eco">環境與淨灘</option><option value="other">其他／跨領域</option></select></label>
                  <label className="block text-xs font-black">備註<textarea maxLength={500} value={regNotes} onChange={(e) => setRegNotes(e.target.value)} className="mt-1 w-full p-3 border-2 rounded-xl" rows={3} /></label>
                  <button disabled={submitting} className="w-full py-3 bg-emerald-600 text-white rounded-xl border-2 border-[#1e293b] font-black flex justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" /> : <Heart className="fill-white" />}確認報名
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
