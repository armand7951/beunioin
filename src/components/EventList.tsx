import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, Loader2, Search } from "lucide-react";
import { getEventStatus } from "../lib/eventStatus";
import EventCard from "./EventCard";
import type { EventItem } from "./EventCalendar";

// 活動總覽。跟首頁的活動區的差別只有兩點：這裡不截斷（首頁只放兩排），
// 而且多了關鍵字搜尋。卡片本身共用 EventCard，所以兩邊長得一樣。
export default function EventList({ onOpen }: { onOpen: (id: string) => void }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<"ongoing" | "ended">("ongoing");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/events")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (!cancelled) setEvents(body);
      })
      .catch(() => {
        if (!cancelled) setLoadError("活動資料暫時無法載入，請稍候再試。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 「已結束」是算出來的：getEventStatus 同時看 lifecycleStatus 與 endsAt，
  // 所以活動時間一過就自己歸位，不需要排程也不必後台手動標記。
  const { ongoing, ended } = useMemo(
    () => ({
      ongoing: events.filter((ev) => getEventStatus(ev) !== "ended"),
      ended: events.filter((ev) => getEventStatus(ev) === "ended"),
    }),
    [events],
  );

  const shown = useMemo(() => {
    const pool = tab === "ongoing" ? ongoing : ended;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pool;
    return pool.filter((ev) =>
      [ev.title, ev.location, ev.lecturer ?? "", ev.description]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [tab, ongoing, ended, query]);

  return (
    <section className="py-12 px-4 bg-[#faf8f4] min-h-[70vh]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-2">工會活動</h1>
        <p className="font-bold text-slate-500 mb-8">
          守護行動、教育訓練與座談會，歡迎報名參加。
        </p>

        {loadError && (
          <div className="mb-8 p-6 rounded-2xl border-2 border-red-300 bg-red-50 text-red-800 text-center font-black">
            <AlertTriangle className="w-7 h-7 mx-auto mb-2" />
            {loadError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <div className="flex gap-2">
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋活動名稱、地點或講師"
              className="w-full pl-10 pr-4 py-2.5 border-2 border-[#1e293b] rounded-xl font-bold text-sm bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : shown.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border-2 border-dashed text-center">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-500">
              {query.trim()
                ? "沒有符合的活動，換個關鍵字試試。"
                : tab === "ongoing"
                  ? "目前沒有進行中的活動，敬請期待。"
                  : "還沒有已結束的活動。"}
            </p>
          </div>
        ) : (
          // 總覽頁不截斷，也不需要手機橫向捲動 —— 這裡是「看全部」的地方，
          // 直向堆疊比左右滑更好瀏覽。
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((ev, index) => (
              <EventCard key={ev.id} event={ev} index={index} onOpen={onOpen} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
