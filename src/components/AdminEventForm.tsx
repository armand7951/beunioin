import React, { useState } from "react";
import { Loader2, Save, X } from "lucide-react";

export interface AdminEvent {
  id: string;
  title: string;
  date: string;
  startsAt: string;
  endsAt: string;
  time: string;
  location: string;
  lecturer: string;
  description: string;
  maxSeats: number;
  registeredCount: number;
  actualRegistrations: number;
  imageUrl: string;
  registrationOpen: boolean;
  lifecycleStatus: "scheduled" | "ended" | "cancelled";
  isPublished: boolean;
  updatedAt?: string;
}

export const BLANK_EVENT: AdminEvent = {
  id: "",
  title: "",
  date: "",
  startsAt: "",
  endsAt: "",
  time: "",
  location: "",
  lecturer: "",
  description: "",
  maxSeats: 30,
  registeredCount: 0,
  actualRegistrations: 0,
  imageUrl: "",
  registrationOpen: true,
  lifecycleStatus: "scheduled",
  // 新活動預設是草稿。上架是一個要刻意按下去的動作，不是手滑存檔的副作用。
  isPublished: false,
};

// <input type="datetime-local"> 只吃 "YYYY-MM-DDTHH:mm" 而且是**當地時間**，
// 但資料庫存的是 timestamptz。這兩支負責來回換算；少了它們，編輯既有活動時
// 時間欄位會是空的（瀏覽器對 ISO 字串直接無視）。
function toLocalInput(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

const FIELD =
  "w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl font-bold text-sm focus:border-emerald-600 focus:outline-none";
const LABEL = "block text-xs font-black text-slate-600 mb-1.5";

interface Props {
  initial: AdminEvent;
  isNew: boolean;
  onCancel: () => void;
  onSave: (event: AdminEvent) => Promise<void>;
}

export default function AdminEventForm({ initial, isNew, onCancel, onSave }: Props) {
  const [draft, setDraft] = useState<AdminEvent>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof AdminEvent>(key: K, value: AdminEvent[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!draft.id.trim()) return setError("活動代碼不可空白。");
    if (!draft.title.trim()) return setError("活動名稱不可空白。");
    if (!draft.startsAt || !draft.endsAt) return setError("請填寫開始與結束時間。");
    if (new Date(draft.endsAt) <= new Date(draft.startsAt))
      return setError("結束時間必須晚於開始時間。");
    if (draft.maxSeats < draft.registeredCount)
      return setError(`名額不能少於目前已報名的 ${draft.registeredCount} 人。`);

    setSaving(true);
    try {
      await onSave(draft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "儲存失敗。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border-3 border-[#1e293b] rounded-2xl p-6 mb-7">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-black">{isNew ? "新增活動" : `編輯：${initial.title}`}</h3>
        <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <p className="mb-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl font-bold text-sm">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>活動代碼（網址用，建立後不可更改）</label>
          <input
            className={`${FIELD} ${isNew ? "" : "bg-slate-100 text-slate-500"}`}
            value={draft.id}
            onChange={(e) => set("id", e.target.value)}
            disabled={!isNew}
            placeholder="volunteer-training-2026"
          />
        </div>
        <div>
          <label className={LABEL}>活動名稱</label>
          <input className={FIELD} value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </div>

        <div>
          <label className={LABEL}>活動日期</label>
          <input type="date" className={FIELD} value={draft.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>時間顯示文字</label>
          <input
            className={FIELD}
            value={draft.time}
            onChange={(e) => set("time", e.target.value)}
            placeholder="09:00 - 17:00"
          />
        </div>

        <div>
          <label className={LABEL}>開始時間</label>
          <input
            type="datetime-local"
            className={FIELD}
            value={toLocalInput(draft.startsAt)}
            onChange={(e) => set("startsAt", fromLocalInput(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL}>結束時間</label>
          <input
            type="datetime-local"
            className={FIELD}
            value={toLocalInput(draft.endsAt)}
            onChange={(e) => set("endsAt", fromLocalInput(e.target.value))}
          />
        </div>

        <div>
          <label className={LABEL}>地點</label>
          <input className={FIELD} value={draft.location} onChange={(e) => set("location", e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>講師／主持</label>
          <input className={FIELD} value={draft.lecturer} onChange={(e) => set("lecturer", e.target.value)} />
        </div>

        <div>
          <label className={LABEL}>
            名額上限
            {!isNew && (
              <span className="ml-2 font-bold text-slate-400">
                目前已報名 {draft.registeredCount} 人
              </span>
            )}
          </label>
          <input
            type="number"
            min={1}
            max={10000}
            className={FIELD}
            value={draft.maxSeats}
            onChange={(e) => set("maxSeats", Number(e.target.value))}
          />
        </div>
        <div>
          <label className={LABEL}>活動狀態</label>
          <select
            className={FIELD}
            value={draft.lifecycleStatus}
            onChange={(e) => set("lifecycleStatus", e.target.value as AdminEvent["lifecycleStatus"])}
          >
            <option value="scheduled">進行中／即將舉辦</option>
            <option value="ended">已結束</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL}>封面圖片網址</label>
          <input
            className={FIELD}
            value={draft.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="/events/EDM1.jpg"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL}>活動說明</label>
          <textarea
            rows={5}
            className={FIELD}
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-5 mt-5 pt-5 border-t-2 border-slate-100">
        <label className="flex items-center gap-2 font-black text-sm cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={draft.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
          />
          已上架（前台看得到）
        </label>
        <label className="flex items-center gap-2 font-black text-sm cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={draft.registrationOpen}
            onChange={(e) => set("registrationOpen", e.target.checked)}
          />
          開放報名
        </label>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "儲存中…" : "儲存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border-2 border-slate-300 font-black rounded-xl hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
