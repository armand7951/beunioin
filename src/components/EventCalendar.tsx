import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Calendar,
  ArrowRight,
  Clock,
  Loader2,
  MapPin,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getEventStatus } from "../lib/eventStatus";
import { CARD_GRID, HOME_CARD_LIMIT } from "../lib/cardLayout";
import EventCard from "./EventCard";

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

export default function EventCalendar({
  onRefreshTrigger,
  onOpenEvent,
  onSeeAll,
}: {
  onRefreshTrigger?: number;
  // 點活動由 App 決定去哪 —— 跟公佈欄一樣，元件不自己管路由。
  onOpenEvent: (id: string) => void;
  // 「看更多」帶去 /events 總覽頁，而不是在首頁原地展開 —— 總覽頁有搜尋與
  // 完整清單，原地展開會讓首頁無限拉長。
  onSeeAll: () => void;
}) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [imageFailures, setImageFailures] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"ongoing" | "ended">("ongoing");

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
  const shown = inTab.slice(0, HOME_CARD_LIMIT);
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
              onClick={() => setTab(key)}
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
            {shown.map((ev, index) => (
              <EventCard key={ev.id} event={ev} index={index} onOpen={onOpenEvent} />
            ))}
          </div>
        ))}

        {hiddenCount > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={onSeeAll}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border-3 border-[#1e293b] rounded-2xl font-black text-sm bubbly-shadow-md transition-colors"
            >
              看更多活動（還有 {hiddenCount} 場）
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </section>
  );
}
