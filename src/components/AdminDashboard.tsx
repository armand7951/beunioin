import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  Download,
  FileText,
  History,
  Loader2,
  LockKeyhole,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import AdminEventForm, { BLANK_EVENT, type AdminEvent } from "./AdminEventForm";
import AdminPostForm, {
  BLANK_POST,
  type AdminPost,
  type PostCategory,
} from "./AdminPostForm";

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

interface AdminAccount {
  userId: string;
  email: string;
  role: "admin" | "operator";
  isSelf: boolean;
  lastSignInAt: string | null;
}

interface AuditEntry {
  id: number;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  label: string | null;
  changedAt: string;
}

type Section = "events" | "posts" | "registrations" | "admins" | "audit";

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

const ACTION_LABELS: Record<string, string> = {
  insert: "新增",
  update: "修改",
  delete: "刪除",
};

const ENTITY_LABELS: Record<string, string> = {
  events: "活動",
  event_registrations: "報名",
  posts: "文章",
  admin_users: "人員",
};

const BADGE = "px-2 py-1 rounded-full text-xs font-black";

export default function AdminDashboard() {
  const { session, user, loading, isAdmin, adminRole } = useAuth();
  const isManager = adminRole === "admin";
  const [section, setSection] = useState<Section>("events");

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);

  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "operator">("operator");

  const token = session?.access_token;

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
      // 人員與日誌只有管理者叫得動，operator 拿到的會是 403。不先擋掉的話，
      // 操作者每次進後台都會看到一則沒有意義的錯誤訊息。
      const [eventList, postList, registrationList, categoryResult, adminList, auditList] =
        await Promise.all([
          call("/api/admin/events"),
          call("/api/admin/posts"),
          call("/api/admin/registrations"),
          supabase.from("post_categories").select("id,label").order("sort_order"),
          isManager ? call("/api/admin/admins") : Promise.resolve([]),
          isManager ? call("/api/admin/audit") : Promise.resolve([]),
        ]);
      setEvents(eventList);
      setPosts(postList);
      setRegistrations(registrationList);
      setCategories(categoryResult.data ?? []);
      setAdmins(adminList);
      setAudit(auditList);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "資料載入失敗。");
    } finally {
      setListLoading(false);
    }
  }, [call, isAdmin, isManager, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

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

  const act = async (run: () => Promise<void>, success: string) => {
    try {
      await run();
      setNotice(success);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失敗。");
    }
  };

  const saveEvent = async (draft: AdminEvent) => {
    await call("/api/admin/events", { method: "POST", body: JSON.stringify(draft) });
    setEditingEvent(null);
    setCreatingEvent(false);
    setNotice(`已儲存「${draft.title}」${draft.isPublished ? "並上架" : "為草稿"}。`);
    await reload();
  };

  const savePost = async (draft: AdminPost) => {
    await call("/api/admin/posts", { method: "POST", body: JSON.stringify(draft) });
    setEditingPost(null);
    setCreatingPost(false);
    setNotice(`已儲存「${draft.title}」${draft.status === "published" ? "並發布" : "為草稿"}。`);
    await reload();
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
    // ﻿ 是 BOM。少了它，Excel 會把 UTF-8 中文判成 Big5 而變成亂碼。
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

  const NAV: Array<[Section, string, number, typeof CalendarPlus]> = [
    ["events", "活動管理", events.length, CalendarPlus],
    ["posts", "文章管理", posts.length, FileText],
    ["registrations", "報名名單", registrations.length, Users],
    ...(isManager
      ? ([
          ["admins", "人員權限", admins.length, UserCog],
          ["audit", "操作紀錄", audit.length, History],
        ] as Array<[Section, string, number, typeof CalendarPlus]>)
      : []),
  ];

  return (
    <section className="py-12 px-4 bg-slate-50 min-h-[70vh]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
        <aside className="lg:w-56 lg:shrink-0">
          <p className="text-xs font-black text-emerald-700 flex gap-2 mb-1">
            <ShieldCheck className="w-4 h-4" />
            安全管理後台
          </p>
          <p className="text-xs font-bold text-slate-400 mb-3">
            {isManager ? "管理者" : "操作者"}
          </p>

          {/* 窄螢幕橫向並排、寬螢幕才變成直式側欄；lg 以下維持橫向是因為側欄佔掉
              寬度後，底下那幾張本來就要橫向捲動的表格會更難看。 */}
          <nav className="flex flex-wrap lg:flex-col gap-1.5 lg:sticky lg:top-24">
            {NAV.map(([key, label, count, Icon]) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                aria-current={section === key ? "page" : undefined}
                className={`flex flex-1 lg:flex-none items-center gap-2.5 px-4 py-3 rounded-xl font-black text-sm text-left transition-colors border-2 ${
                  section === key
                    ? "bg-[#1e293b] border-[#1e293b] text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 whitespace-nowrap">{label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    section === key ? "bg-white/20" : "bg-slate-100 text-slate-500"
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
            <p className="mb-5 p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl font-bold flex justify-between gap-4">
              {error}
              <button onClick={() => setError("")} className="underline shrink-0">
                關閉
              </button>
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
          ) : section === "events" ? (
            <>
              {(creatingEvent || editingEvent) && (
                <AdminEventForm
                  initial={editingEvent ?? BLANK_EVENT}
                  isNew={creatingEvent}
                  onCancel={() => {
                    setEditingEvent(null);
                    setCreatingEvent(false);
                  }}
                  onSave={saveEvent}
                  onUpload={uploadImage}
                />
              )}

              {!creatingEvent && !editingEvent && (
                <button
                  onClick={() => {
                    setCreatingEvent(true);
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
                            <div className="text-xs text-slate-500">
                              站上 {item.actualRegistrations} 筆
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`${BADGE} ${item.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
                            >
                              {item.isPublished ? "已上架" : "草稿"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`${BADGE} ${item.registrationOpen ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-500"}`}
                            >
                              {item.registrationOpen ? "開放" : "關閉"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`${BADGE} ${
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
                                  setEditingEvent(item);
                                  setCreatingEvent(false);
                                  setNotice("");
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-slate-300 rounded-lg font-black text-xs hover:bg-slate-50"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                編輯
                              </button>
                              <button
                                onClick={() => {
                                  const linked = registrations.filter(
                                    (r) => r.eventId === item.id,
                                  ).length;
                                  if (
                                    !window.confirm(
                                      `確定要刪除「${item.title}」嗎？${
                                        linked > 0
                                          ? `\n\n⚠️ 這會一併刪除 ${linked} 筆報名資料，且無法復原。`
                                          : "\n\n此操作無法復原。"
                                      }`,
                                    )
                                  )
                                    return;
                                  void act(async () => {
                                    await call(
                                      `/api/admin/events?id=${encodeURIComponent(item.id)}`,
                                      { method: "DELETE" },
                                    );
                                  }, `已刪除「${item.title}」。`);
                                }}
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
          ) : section === "posts" ? (
            <>
              {(creatingPost || editingPost) && (
                <AdminPostForm
                  initial={editingPost ?? BLANK_POST}
                  isNew={creatingPost}
                  categories={categories}
                  onCancel={() => {
                    setEditingPost(null);
                    setCreatingPost(false);
                  }}
                  onSave={savePost}
                  onUpload={uploadImage}
                />
              )}

              {!creatingPost && !editingPost && (
                <button
                  onClick={() => {
                    setCreatingPost(true);
                    setNotice("");
                  }}
                  className="flex items-center gap-2 mb-5 px-5 py-2.5 bg-[#1e293b] hover:bg-slate-700 text-white font-black rounded-xl"
                >
                  <FileText className="w-4 h-4" />
                  新增文章
                </button>
              )}

              {posts.length === 0 ? (
                <div className="py-16 bg-white rounded-3xl border-2 border-dashed text-center">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-500">尚無文章，點「新增文章」開始。</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border-3 border-[#1e293b] rounded-2xl">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead className="bg-[#1e293b] text-white text-left">
                      <tr>
                        <th className="p-3">標題</th>
                        <th className="p-3">分類</th>
                        <th className="p-3">作者</th>
                        <th className="p-3">狀態</th>
                        <th className="p-3">發布時間</th>
                        <th className="p-3">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((item) => (
                        <tr key={item.id} className="border-b align-top">
                          <td className="p-3 font-black">
                            <div className="flex items-start gap-2.5">
                              {item.coverImageUrl && (
                                <img
                                  src={item.coverImageUrl}
                                  alt=""
                                  className="w-14 h-10 object-cover rounded-lg border shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                {item.title}
                                <div className="text-xs font-bold text-slate-400 truncate">
                                  {item.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">{item.categoryLabel ?? "未分類"}</td>
                          <td className="p-3">{item.authorName || "—"}</td>
                          <td className="p-3">
                            <span
                              className={`${BADGE} ${item.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
                            >
                              {item.status === "published" ? "已發布" : "草稿"}
                            </span>
                          </td>
                          <td className="p-3 text-xs">
                            {item.publishedAt
                              ? new Date(item.publishedAt).toLocaleString("zh-TW")
                              : "—"}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingPost(item);
                                  setCreatingPost(false);
                                  setNotice("");
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-slate-300 rounded-lg font-black text-xs hover:bg-slate-50"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                編輯
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    !window.confirm(
                                      `確定要刪除「${item.title}」嗎？\n\n此操作無法復原。`,
                                    )
                                  )
                                    return;
                                  void act(async () => {
                                    await call(
                                      `/api/admin/posts?id=${encodeURIComponent(item.id)}`,
                                      { method: "DELETE" },
                                    );
                                  }, `已刪除「${item.title}」。`);
                                }}
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
          ) : section === "registrations" ? (
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
                              className={`${BADGE} ${item.userId ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}
                            >
                              {item.userId ? "會員" : "訪客"}
                            </span>
                          </td>
                          <td className="p-3">
                            {VOLUNTEER_LABELS[item.volunteerType] ?? item.volunteerType}
                            <div className="text-xs text-slate-500 max-w-52">
                              {item.notes || "—"}
                            </div>
                          </td>
                          <td className="p-3 text-xs">
                            {new Date(item.registeredAt).toLocaleString("zh-TW")}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `確定要取消「${item.name}」在「${item.eventTitle}」的報名嗎？\n\n名額會回收一個，此操作無法復原。`,
                                  )
                                )
                                  return;
                                void act(async () => {
                                  await call(
                                    `/api/admin/registrations?id=${encodeURIComponent(item.id)}`,
                                    { method: "DELETE" },
                                  );
                                }, `已取消 ${item.name} 的報名，名額已回收。`);
                              }}
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
          ) : section === "admins" ? (
            <>
              <div className="bg-white border-3 border-[#1e293b] rounded-2xl p-5 mb-5">
                <h3 className="font-black mb-1">新增後台人員</h3>
                <p className="text-xs font-bold text-slate-500 mb-4">
                  對方必須先在本站註冊過帳號，才能加入後台。管理者可調整人員權限，操作者只能管理活動、文章與報名。
                </p>
                <form
                  className="flex flex-col sm:flex-row gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const email = inviteEmail.trim();
                    if (!email) return;
                    void act(async () => {
                      await call("/api/admin/admins", {
                        method: "POST",
                        body: JSON.stringify({ email, role: inviteRole }),
                      });
                      setInviteEmail("");
                    }, `已將 ${email} 加入後台。`);
                  }}
                >
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="對方的 Email"
                    className="flex-1 px-4 py-2.5 border-2 rounded-xl font-bold text-sm"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "admin" | "operator")}
                    className="px-4 py-2.5 border-2 rounded-xl font-bold text-sm"
                  >
                    <option value="operator">操作者</option>
                    <option value="admin">管理者</option>
                  </select>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm"
                  >
                    加入
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto bg-white border-3 border-[#1e293b] rounded-2xl">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-[#1e293b] text-white text-left">
                    <tr>
                      <th className="p-3">Email</th>
                      <th className="p-3">角色</th>
                      <th className="p-3">最後登入</th>
                      <th className="p-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((item) => (
                      <tr key={item.userId} className="border-b align-top">
                        <td className="p-3 font-bold">
                          {item.email}
                          {item.isSelf && (
                            <span className="ml-2 text-xs font-black text-emerald-700">你</span>
                          )}
                        </td>
                        <td className="p-3">
                          <select
                            value={item.role}
                            disabled={item.isSelf}
                            onChange={(e) =>
                              void act(async () => {
                                await call("/api/admin/admins", {
                                  method: "PATCH",
                                  body: JSON.stringify({
                                    userId: item.userId,
                                    role: e.target.value,
                                  }),
                                });
                              }, `已將 ${item.email} 設為${e.target.value === "admin" ? "管理者" : "操作者"}。`)
                            }
                            className="px-3 py-1.5 border-2 rounded-lg font-black text-xs disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="operator">操作者</option>
                            <option value="admin">管理者</option>
                          </select>
                        </td>
                        <td className="p-3 text-xs">
                          {item.lastSignInAt
                            ? new Date(item.lastSignInAt).toLocaleString("zh-TW")
                            : "從未登入"}
                        </td>
                        <td className="p-3">
                          <button
                            disabled={item.isSelf}
                            onClick={() => {
                              if (!window.confirm(`確定要將 ${item.email} 移出後台嗎？`)) return;
                              void act(async () => {
                                await call(
                                  `/api/admin/admins?userId=${encodeURIComponent(item.userId)}`,
                                  { method: "DELETE" },
                                );
                              }, `已將 ${item.email} 移出後台。`);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-red-300 text-red-700 rounded-lg font-black text-xs hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            移除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {audit.length === 0 ? (
                <div className="py-16 bg-white rounded-3xl border-2 border-dashed text-center">
                  <History className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-500">還沒有任何操作紀錄。</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border-3 border-[#1e293b] rounded-2xl">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-[#1e293b] text-white text-left">
                      <tr>
                        <th className="p-3">時間</th>
                        <th className="p-3">操作者</th>
                        <th className="p-3">動作</th>
                        <th className="p-3">對象</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.map((item) => (
                        <tr key={item.id} className="border-b align-top">
                          <td className="p-3 text-xs whitespace-nowrap">
                            {new Date(item.changedAt).toLocaleString("zh-TW")}
                          </td>
                          {/* 帳號被刪掉之後仍看得出是誰做的 —— 日誌存的是 email 快照 */}
                          <td className="p-3 font-bold">{item.actorEmail ?? "（帳號已刪除）"}</td>
                          <td className="p-3">
                            <span
                              className={`${BADGE} ${
                                item.action === "delete"
                                  ? "bg-red-100 text-red-800"
                                  : item.action === "insert"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-sky-100 text-sky-800"
                              }`}
                            >
                              {ACTION_LABELS[item.action] ?? item.action}
                            </span>
                            <span className="ml-2 text-xs font-bold text-slate-500">
                              {ENTITY_LABELS[item.entity] ?? item.entity}
                            </span>
                          </td>
                          <td className="p-3">
                            {item.label || "—"}
                            <div className="text-xs text-slate-400 truncate max-w-xs">
                              {item.entityId}
                            </div>
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
