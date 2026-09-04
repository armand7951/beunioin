import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  Download,
  Loader2,
  LockKeyhole,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AdminEventForm, { BLANK_EVENT, type AdminEvent } from "./AdminEventForm";

interface AdminRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  volunteerType: string;
  notes: string;
  registeredAt: string;
}

const VOLUNTEER_LABELS: Record<string, string> = {
  animal: "動物保護",
  plant: "植物保育",
  eco: "生態環境",
  other: "其他",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  scheduled: "進行中",
  ended: "已結束",
  cancelled: "已取消",
};

export default function AdminDashboard() {
  const { session, user, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState<"events" | "registrations">("events");

  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [creating, setCreating] = useState(false);

  const token = session?.access_token;

  // 所有後台請求都走這裡，確保沒有任何一條路徑忘記帶 Authorization。
  const call = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const response = await fetch(path, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "操作失敗，請稍後再試。");
      return body;
    },
    [token],
  );

  const reload = useCallback(async () => {
    if (!isAdmin || !token) return;
    setListLoading(true);
    setError("");
    try {
      const [eventList, registrationList] = await Promise.all([
        call("/api/admin/events"),
        call("/api/admin/registrations"),
      ]);
      setEvents(eventList);
      setRegistrations(registrationList);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "資料載入失敗。");
    } finally {
      setListLoading(false);
    }
  }, [call, isAdmin, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // 圖片走 base64 而不是 multipart：Vercel serverless 沒有內建的 multipart 解析，
  // 為了封面圖多拉一個套件不划算。代價是體積膨脹約 33%，所以兩端都卡在 3MB。
  const uploadImage = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("讀取檔案失敗。"));
      reader.readAsDataURL(file);
    });
    const body = await call("/api/admin/upload", {
      method: "POST",
      body: JSON.stringify({ contentType: file.type, data: dataUrl }),
    });
    return body.url as string;
  };

  const saveEvent = async (draft: AdminEvent) => {
    await call("/api/admin/events", { method: "POST", body: JSON.stringify(draft) });
    setEditing(null);
    setCreating(false);
    setNotice(`已儲存「${draft.title}」${draft.isPublished ? "並上架" : "為草稿"}。`);
    await reload();
  };

  const deleteEvent = async (target: AdminEvent) => {
    const linked = registrations.filter((r) => r.eventId === target.id).length;
    const warning =
      linked > 0
        ? `\n\n⚠️ 這會一併刪除 ${linked} 筆報名資料，且無法復原。`
        : "\n\n此操作無法復原。";
    if (!window.confirm(`確定要刪除「${target.title}」嗎？${warning}`)) return;

    try {
      const result = await call(`/api/admin/events?id=${encodeURIComponent(target.id)}`, {
        method: "DELETE",
      });
      setNotice(
        `已刪除「${target.title}」${result.deletedRegistrations ? `，連帶移除 ${result.deletedRegistrations} 筆報名。` : "。"}`,
      );
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "刪除失敗。");
    }
  };

  const cancelRegistration = async (target: AdminRegistration) => {
    if (
      !window.confirm(
        `確定要取消「${target.name}」在「${target.eventTitle}」的報名嗎？\n\n名額會回收一個，此操作無法復原。`,
      )
    )
      return;

    try {
      await call(`/api/admin/registrations?id=${encodeURIComponent(target.id)}`, {
        method: "DELETE",
      });
      setNotice(`已取消 ${target.name} 的報名，名額已回收。`);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "取消報名失敗。");
    }
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return registrations.filter((item) => {
      if (eventFilter !== "all" && item.eventId !== eventFilter) return false;
      if (!normalized) return true;
      return [item.name, item.email, item.phone, item.eventTitle]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, eventFilter, registrations]);

  const exportCsv = () => {
    const header = ["活動", "活動日期", "姓名", "Email", "電話", "身分", "領域", "備註", "報名時間"];
    const escape = (value: string) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((r) =>
      [
        r.eventTitle,
        r.eventDate,
        r.name,
        r.email,
        r.phone,
        r.userId ? "會員" : "訪客",
        VOLUNTEER_LABELS[r.volunteerType] ?? r.volunteerType,
        r.notes,
        new Date(r.registeredAt).toLocaleString("zh-TW"),
      ]
        .map(escape)
        .join(","),
    );
    // ﻿ 是 BOM。少了它，Excel 開啟時會把 UTF-8 中文判成 Big5 而變成亂碼。
    const blob = new Blob(["﻿" + [header.map(escape).join(","), ...rows].join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `報名名單_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!user) {
    return (
      <section className="py-24 text-center px-4">
        <LockKeyhole className="w-14 h-14 mx-auto text-amber-500 mb-3" />
        <h2 className="text-2xl font-black">管理後台需要先登入</h2>
        <p className="mt-2 text-sm font-bold text-slate-500">請使用已授權的管理員帳號登入。</p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="py-24 text-center px-4">
        <LockKeyhole className="w-14 h-14 mx-auto text-red-500 mb-3" />
        <h2 className="text-2xl font-black">沒有管理員權限</h2>
        <p className="mt-2 text-sm font-bold text-slate-500">
          為保護報名者個資，此頁只開放管理員使用。
        </p>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-slate-50 min-h-[70vh]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
        <aside className="lg:w-56 lg:shrink-0">
          <p className="text-xs font-black text-emerald-700 flex gap-2 mb-3">
            <ShieldCheck className="w-4 h-4" />
            安全管理後台
          </p>

          {/* 窄螢幕橫向並排、寬螢幕才變成直式側欄；lg 以下維持橫向是因為側欄佔掉
              寬度後，底下那幾張本來就要橫向捲動的表格會更難看。 */}
          <nav className="flex lg:flex-col gap-1.5 lg:sticky lg:top-24">
            {(
              [
                ["events", "活動管理", events.length, CalendarPlus],
                ["registrations", "報名名單", registrations.length, Users],
              ] as const
            ).map(([key, label, count, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key ? "page" : undefined}
                className={`flex flex-1 lg:flex-none items-center gap-2.5 px-4 py-3 rounded-xl font-black text-sm text-left transition-colors border-2 ${
                  tab === key
                    ? "bg-[#1e293b] border-[#1e293b] text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    tab === key ? "bg-white/20" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* min-w-0 不能拿掉：flex 子項的預設 min-width 是 auto，底下表格的
            overflow-x-auto 會失效，整個版面被最寬的表格撐開而出現橫向捲軸。 */}
        <div className="flex-1 min-w-0">
        {error && (
          <p className="mb-5 p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl font-bold">
            {error}
          </p>
        )}
        {notice && (
          <p className="mb-5 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex justify-between gap-4">
            {notice}
            <button onClick={() => setNotice("")} className="underline shrink-0">
              關閉
            </button>
          </p>
        )}

        {listLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="animate-spin text-emerald-600" />
          </div>
        ) : tab === "events" ? (
          <>
            {(creating || editing) && (
              <AdminEventForm
                initial={editing ?? BLANK_EVENT}
                isNew={creating}
                onCancel={() => {
                  setEditing(null);
                  setCreating(false);
                }}
                onSave={saveEvent}
                onUpload={uploadImage}
              />
            )}

            {!creating && !editing && (
              <button
                onClick={() => {
                  setCreating(true);
                  setNotice("");
                }}
                className="flex items-center gap-2 mb-5 px-5 py-2.5 bg-[#1e293b] hover:bg-slate-700 text-white font-black rounded-xl"
              >
                <CalendarPlus className="w-4 h-4" />
                新增活動
              </button>
            )}

            {events.length === 0 ? (
              <div className="py-16 bg-white rounded-3xl border-2 border-dashed text-center">
                <CalendarPlus className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-500">尚無活動，點「新增活動」開始。</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border-3 border-[#1e293b] rounded-2xl">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-[#1e293b] text-white text-left">
                    <tr>
                      <th className="p-3">活動</th>
                      <th className="p-3">日期</th>
                      <th className="p-3">名額</th>
                      <th className="p-3">上架</th>
                      <th className="p-3">報名</th>
                      <th className="p-3">狀態</th>
                      <th className="p-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((item) => (
                      <tr key={item.id} className="border-b align-top">
                        <td className="p-3 font-black">
                          {item.title}
                          <div className="text-xs font-bold text-slate-400">{item.id}</div>
                        </td>
                        <td className="p-3">
                          {item.date}
                          <div className="text-xs text-slate-500">{item.time}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-black">
                            {item.registeredCount} / {item.maxSeats}
                          </span>
                          {/* registered_count 含線下既有人數，跟站上實際報名筆數刻意分開顯示 */}
                          <div className="text-xs text-slate-500">站上 {item.actualRegistrations} 筆</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-black ${
                              item.isPublished
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {item.isPublished ? "已上架" : "草稿"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-black ${
                              item.registrationOpen
                                ? "bg-sky-100 text-sky-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {item.registrationOpen ? "開放" : "關閉"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-black ${
                              item.lifecycleStatus === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : item.lifecycleStatus === "ended"
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {LIFECYCLE_LABELS[item.lifecycleStatus] ?? item.lifecycleStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditing(item);
                                setCreating(false);
                                setNotice("");
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-slate-300 rounded-lg font-black text-xs hover:bg-slate-50"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              編輯
                            </button>
                            <button
                              onClick={() => deleteEvent(item)}
                              className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-red-300 text-red-700 rounded-lg font-black text-xs hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜尋姓名、Email、電話、活動"
                  className="w-full pl-10 pr-4 py-2.5 border-2 rounded-xl font-bold text-sm"
                />
              </div>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-4 py-2.5 border-2 rounded-xl font-bold text-sm"
              >
                <option value="all">全部活動</option>
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <button
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black rounded-xl text-sm"
              >
                <Download className="w-4 h-4" />
                匯出 CSV（{filtered.length}）
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 bg-white rounded-3xl border-2 border-dashed text-center">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-500">目前沒有符合的報名資料。</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border-3 border-[#1e293b] rounded-2xl">
                <table className="w-full min-w-[1060px] text-sm">
                  <thead className="bg-[#1e293b] text-white text-left">
                    <tr>
                      <th className="p-3">活動</th>
                      <th className="p-3">姓名</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">電話</th>
                      <th className="p-3">身分</th>
                      <th className="p-3">領域／備註</th>
                      <th className="p-3">報名時間</th>
                      <th className="p-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-b align-top">
                        <td className="p-3 font-black">
                          {item.eventTitle}
                          <div className="text-xs text-slate-500">{item.eventDate}</div>
                        </td>
                        <td className="p-3 font-bold">{item.name}</td>
                        <td className="p-3">{item.email}</td>
                        <td className="p-3">{item.phone}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-black ${
                              item.userId
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.userId ? "會員" : "訪客"}
                          </span>
                        </td>
                        <td className="p-3">
                          {VOLUNTEER_LABELS[item.volunteerType] ?? item.volunteerType}
                          <div className="text-xs text-slate-500 max-w-52">{item.notes || "—"}</div>
                        </td>
                        <td className="p-3 text-xs">
                          {new Date(item.registeredAt).toLocaleString("zh-TW")}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => cancelRegistration(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-red-300 text-red-700 rounded-lg font-black text-xs hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            取消
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </section>
  );
}
