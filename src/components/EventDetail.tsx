import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  Loader2,
  MapPin,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getEventStatus } from "../lib/eventStatus";
import type { EventItem } from "./EventCalendar";

const STATUS_LABELS: Record<string, string> = {
  ended: "活動已結束",
  full: "報名已額滿",
  closed: "目前未開放報名",
  open: "開放報名中",
};

export default function EventDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { session, user, profile } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regType, setRegType] = useState("animal");
  const [regNotes, setRegNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  // 沒有單一活動的端點，直接從列表裡挑。活動數量是個位數，而列表本來就有
  // s-maxage=30 的邊緣快取，多開一支 serverless function 不划算 ——
  // 何況 Vercel Hobby 的 12 支上限已經踩過一次（見 api/admin/[resource].ts）。
  const load = async () => {
    setLoadError("");
    try {
      const response = await fetch("/api/events");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      const found = (body as EventItem[]).find((item) => item.id === id) ?? null;
      setEvent(found);
      if (!found) setLoadError("找不到這場活動，可能已下架。");
    } catch {
      setLoadError("活動資料暫時無法載入，請稍候再試。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setRegName(profile?.full_name ?? "");
    setRegEmail(user?.email ?? "");
    setRegPhone(profile?.phone ?? "");
  }, [profile, user]);

  const submitRegistration = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!event) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
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
      void load();
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "報名失敗，請稍候重試。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );

  if (loadError || !event) {
    return (
      <section className="py-24 px-4 text-center">
        <AlertTriangle className="w-14 h-14 mx-auto text-amber-500 mb-3" />
        <h1 className="text-2xl font-black">{loadError || "找不到這場活動。"}</h1>
        <button onClick={onBack} className="mt-5 px-5 py-2.5 border-2 font-black rounded-xl">
          回活動列表
        </button>
      </section>
    );
  }

  const status = getEventStatus(event);
  const availableSeats = Math.max(0, event.maxSeats - event.registeredCount);

  return (
    <section className="py-12 px-4 bg-[#faf8f4]">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 mb-6 font-black text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          回活動列表
        </button>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
          <div className="bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden">
            <div className="bg-slate-100 border-b-3 border-[#1e293b] flex items-center justify-center min-h-[240px]">
              {event.imageUrl && !imageFailed ? (
                <img
                  src={event.imageUrl}
                  alt={`${event.title} 活動海報`}
                  className="w-full object-contain"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <p className="px-6 py-16 text-center text-sm font-black text-slate-500">
                  活動海報暫時無法顯示
                </p>
              )}
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full border-2 border-[#1e293b] text-xs font-black ${
                    status === "open"
                      ? "bg-emerald-500 text-white"
                      : status === "ended"
                        ? "bg-slate-700 text-white"
                        : "bg-amber-400"
                  }`}
                >
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-xs font-black flex items-center gap-1.5 text-slate-600">
                  <Users className="w-4 h-4 text-emerald-600" />
                  已報名 {event.registeredCount} / {event.maxSeats}（剩 {availableSeats}）
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black leading-tight">{event.title}</h1>

              <div className="grid sm:grid-cols-2 gap-3 text-sm font-bold text-slate-600">
                <p className="flex gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  {event.date}
                </p>
                <p className="flex gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  {event.time}
                </p>
                <p className="flex gap-2 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                  {event.location}
                </p>
                {event.lecturer && (
                  <p className="flex gap-2 sm:col-span-2">
                    <User className="w-4 h-4 text-amber-600 shrink-0" />
                    {event.lecturer}
                  </p>
                )}
              </div>

              {event.description && (
                <p className="text-sm font-semibold leading-relaxed text-slate-600 whitespace-pre-line">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden lg:sticky lg:top-24">
            <div className="p-5 bg-[#1e293b] text-white">
              <p className="text-xs text-amber-300 font-black">線上活動報名</p>
              <h2 className="font-black">{event.title}</h2>
            </div>

            {submitSuccess ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-600 mb-3" />
                <h3 className="text-xl font-black">報名成功！</h3>
                <p className="text-sm font-bold text-slate-500 mt-2">
                  名額已為您保留，活動前將以 Email 或電話聯絡。
                </p>
                <button
                  onClick={onBack}
                  className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black"
                >
                  回活動列表
                </button>
              </div>
            ) : status !== "open" ? (
              <div className="p-10 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <h3 className="text-lg font-black">{STATUS_LABELS[status]}</h3>
                <p className="text-sm font-bold text-slate-500 mt-2">
                  {status === "ended"
                    ? "這場活動已經結束，感謝每一位夥伴的參與。"
                    : status === "full"
                      ? "名額已滿，歡迎關注下一場活動。"
                      : "目前尚未開放報名，請稍後再回來看看。"}
                </p>
              </div>
            ) : (
              <form onSubmit={submitRegistration} className="p-6 space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900">
                  {user
                    ? "已登入會員，資料已自動帶入；可在會員中心查看紀錄。"
                    : "一般訪客也可以報名，請留下姓名、Email 與電話。"}
                </div>
                {submitError && (
                  <p className="p-3 bg-red-50 border border-red-300 rounded-xl text-sm font-bold text-red-800">
                    {submitError}
                  </p>
                )}
                <label className="block text-xs font-black">
                  姓名 *
                  <input
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="mt-1 w-full p-3 border-2 rounded-xl"
                  />
                </label>
                <label className="block text-xs font-black">
                  Email *
                  <input
                    required
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="mt-1 w-full p-3 border-2 rounded-xl"
                  />
                </label>
                <label className="block text-xs font-black">
                  聯絡電話 *
                  <input
                    required
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="mt-1 w-full p-3 border-2 rounded-xl"
                  />
                </label>
                <label className="block text-xs font-black">
                  關注領域
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value)}
                    className="mt-1 w-full p-3 border-2 rounded-xl bg-white"
                  >
                    <option value="animal">動物保護</option>
                    <option value="plant">植物綠化</option>
                    <option value="eco">環境與淨灘</option>
                    <option value="other">其他／跨領域</option>
                  </select>
                </label>
                <label className="block text-xs font-black">
                  備註
                  <textarea
                    maxLength={500}
                    value={regNotes}
                    onChange={(e) => setRegNotes(e.target.value)}
                    className="mt-1 w-full p-3 border-2 rounded-xl"
                    rows={3}
                  />
                </label>
                <button
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl border-2 border-[#1e293b] font-black flex justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <Heart className="fill-white" />}
                  確認報名
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
