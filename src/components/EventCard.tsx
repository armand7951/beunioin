import React, { useState } from "react";
import { motion } from "motion/react";
import { Calendar, ChevronRight, Clock, MapPin, User, Users } from "lucide-react";
import { getEventStatus, type EventStatus } from "../lib/eventStatus";
import { CARD_ITEM, CARD_MEDIA } from "../lib/cardLayout";
import type { EventItem } from "./EventCalendar";

// 首頁的活動區與 /events 總覽頁共用這張卡。分開各寫一份就是首頁的活動卡與文章卡
// 當初長得不一樣的原因 —— 只改其中一邊，另一邊就悄悄留在舊樣子。
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  ended: "活動已結束",
  full: "報名已額滿",
  closed: "目前未開放報名",
  open: "開放報名中",
};

export default function EventCard({
  event,
  index = 0,
  onOpen,
  // "scroll" 是首頁那條可左右滑的列（卡片要固定寬＋shrink-0）；
  // "grid" 是總覽頁的格線（寬度交給格子決定，套 CARD_ITEM 的 w-[85%] 反而
  // 會讓卡片只佔格子的 85%）。
  variant = "scroll",
}: {
  event: EventItem;
  index?: number;
  onOpen: (id: string) => void;
  variant?: "scroll" | "grid";
}) {
  // 壞掉的圖片各張自己記，不共用一個 Set —— 卡片自己管自己的狀態，
  // 拿出來放在列表層反而讓兩個使用端都得多維護一份。
  const [imageFailed, setImageFailed] = useState(false);
  const status = getEventStatus(event);
  const availableSeats = Math.max(0, event.maxSeats - event.registeredCount);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`${variant === "scroll" ? CARD_ITEM : ""} bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden bubbly-shadow-md flex flex-col`}
      id={`event-card-${event.id}`}
    >
      <div className={`${CARD_MEDIA} relative flex items-center justify-center`}>
        {event.imageUrl && !imageFailed ? (
          <img
            src={event.imageUrl}
            alt={`${event.title} 活動海報`}
            className="w-full h-full object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <p className="px-6 text-center text-sm font-black text-slate-500">活動海報暫時無法顯示</p>
        )}
        <span
          className={`absolute top-3 right-3 px-3 py-1 rounded-full border-2 border-[#1e293b] text-xs font-black ${
            status === "open"
              ? "bg-emerald-500 text-white"
              : status === "ended"
                ? "bg-slate-700 text-white"
                : "bg-amber-400"
          }`}
        >
          {EVENT_STATUS_LABELS[status]}
        </span>
      </div>

      <div className="p-6 flex-1 space-y-4">
        <h3 className="text-xl font-black">{event.title}</h3>
        <div className="space-y-2 text-xs font-bold text-slate-600">
          <p className="flex gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            {event.date}
          </p>
          <p className="flex gap-2">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            {event.time}
          </p>
          <p className="flex gap-2">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            {event.location}
          </p>
          {event.lecturer && (
            <p className="flex gap-2">
              <User className="w-4 h-4 text-amber-600 shrink-0" />
              {event.lecturer}
            </p>
          )}
        </div>
        <p className="text-sm font-semibold leading-relaxed text-slate-600 line-clamp-4">
          {event.description}
        </p>
      </div>

      <div className="p-5 border-t flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50">
        <p className="text-xs font-black flex gap-2">
          <Users className="w-4 h-4 text-emerald-600 shrink-0" />
          已報名 {event.registeredCount} / {event.maxSeats}（剩 {availableSeats}）
        </p>
        <button
          onClick={() => onOpen(event.id)}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl border-2 border-[#1e293b] text-xs font-black flex justify-center items-center gap-1"
        >
          {status === "open" ? "查看詳情並報名" : "查看活動詳情"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.article>
  );
}
