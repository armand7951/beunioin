import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getEventStatus, type EventStatus } from "../lib/eventStatus";
import { CARD_GRID, CARD_ITEM, CARD_MEDIA, HOME_CARD_LIMIT } from "../lib/cardLayout";

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

export default function EventCalendar({
  onRefreshTrigger,
  onOpenEvent,
}: {
  onRefreshTrigger?: number;
  // 點活動由 App 決定去哪 —— 跟公佈欄一樣，元件不自己管路由。
  onOpenEvent: (id: string) => void;
}) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [imageFailures, setImageFailures] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"ongoing" | "ended">("ongoing");
  const [showAll, setShowAll] = useState(false);

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

  // 「已結束」不是靠後台手動標記 —— getEventStatus 的 ended 同時看
  // lifecycleStatus 與 endsAt，所以活動時間一過就自己歸到已結束那一組。
  const ongoing = events.filter((ev) => getEventStatus(ev) !== "ended");
  const ended = events.filter((ev) => getEventStatus(ev) === "ended");
  const inTab = tab === "ongoing" ? ongoing : ended;
  // 跟公佈欄一樣，首頁只放兩排。
  const shown = showAll ? inTab : inTab.slice(0, HOME_CARD_LIMIT);
  const hiddenCount = inTab.length - shown.length;

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

        <div className="flex justify-center gap-2 mb-8">
          {(
            [
              ["ongoing", "進行中", ongoing.length],
              ["ended", "已結束", ended.length],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setShowAll(false); }}
              aria-current={tab === key ? "page" : undefined}
              className={`px-5 py-2.5 rounded-full font-black text-sm border-2 border-[#1e293b] transition-colors ${
                tab === key ? "bg-[#1e293b] text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {label}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  tab === key ? "bg-white/20" : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>
        ) : loadError ? (
          <div className="max-w-lg mx-auto p-6 rounded-2xl border-2 border-red-300 bg-red-50 text-red-800 text-center font-black">
            <AlertTriangle className="w-7 h-7 mx-auto mb-2" />{loadError}
            <button onClick={() => void fetchEvents()} className="block mx-auto mt-4 px-4 py-2 rounded-xl bg-white border-2 border-red-700">重新載入</button>
          </div>
        ) : (
          shown.length === 0 ? (
          <div className="py-16 bg-white rounded-3xl border-2 border-dashed text-center">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-500">
              {tab === "ongoing" ? "目前沒有進行中的活動，敬請期待。" : "還沒有已結束的活動。"}
            </p>
          </div>
        ) : (
          <div className={CARD_GRID}>
            {shown.map((ev, index) => {
              const status = getEventStatus(ev);
              const availableSeats = ev.maxSeats - ev.registeredCount;
              return (
                <motion.article
                  key={ev.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
className={`${CARD_ITEM} bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden bubbly-shadow-md flex flex-col`}
                  id={`event-card-${ev.id}`}
                >
                  <div className={`${CARD_MEDIA} relative flex items-center justify-center`}>
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
                      onClick={() => onOpenEvent(ev.id)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl border-2 border-[#1e293b] text-xs font-black flex justify-center items-center gap-1"
                    >
                      {status === "open" ? "查看詳情並報名" : "查看活動詳情"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ))}

        {hiddenCount > 0 && !showAll && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border-3 border-[#1e293b] rounded-2xl font-black text-sm bubbly-shadow-md transition-colors"
            >
              看更多活動（還有 {hiddenCount} 場）
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </section>
  );
}
