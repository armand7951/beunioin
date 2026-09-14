import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { parseYouTubeId } from "../lib/youtube";

// 課程管理整個自成一區，不再往 AdminDashboard 裡塞 —— 那支已經夠大了。
// 它只從外面拿兩樣東西：帶 token 的 call() 與 uploadImage()。

export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  status: "draft" | "published";
  sortOrder: number;
  lessonCount: number;
  studentCount: number;
  updatedAt?: string;
}

interface LessonDraft {
  id?: string;
  title: string;
  youtubeUrl: string;
  durationMin: number;
  durationSec: number;
  body: string;
  isFreePreview: boolean;
}

interface Enrollment {
  userId: string;
  email: string;
  fullName: string;
  grantedAt: string;
  expiresAt: string | null;
  source: "admin" | "legacy_import";
  completedLessons: number;
}

const BLANK: AdminCourse = {
  id: "",
  title: "",
  description: "",
  coverImageUrl: "",
  status: "draft",
  sortOrder: 0,
  lessonCount: 0,
  studentCount: 0,
};

const FIELD =
  "w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl font-bold text-sm focus:border-emerald-600 focus:outline-none";
const LABEL = "block text-xs font-black text-slate-600 mb-1.5";
const BADGE = "px-2 py-1 rounded-full text-xs font-black";
const MAX_BYTES = 3 * 1024 * 1024;

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `course-${Date.now()}`;
}

interface Props {
  call: (path: string, init?: RequestInit) => Promise<any>;
  uploadImage: (file: File) => Promise<string>;
  notify: (message: string) => void;
  onError: (message: string) => void;
}

export default function AdminCourses({ call, uploadImage, notify, onError }: Props) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCourses(await call("/api/admin/courses"));
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "課程列表載入失敗。");
    } finally {
      setLoading(false);
    }
  }, [call, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading)
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );

  if (editing) {
    return (
      <CourseEditor
        initial={editing}
        isNew={isNew}
        call={call}
        uploadImage={uploadImage}
        notify={notify}
        onError={onError}
        onBack={() => {
          setEditing(null);
          setIsNew(false);
          void load();
        }}
      />
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setEditing(BLANK);
          setIsNew(true);
        }}
        className="flex items-center gap-2 mb-5 px-5 py-2.5 bg-[#1e293b] hover:bg-slate-700 text-white font-black rounded-xl"
      >
        <Plus className="w-4 h-4" />
        新增課程
      </button>

      {courses.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border-2 border-dashed text-center">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-500">尚無課程，點「新增課程」開始。</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border-3 border-[#1e293b] rounded-2xl">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-[#1e293b] text-white text-left">
              <tr>
                <th className="p-3">課程</th>
                <th className="p-3">狀態</th>
                <th className="p-3">單元</th>
                <th className="p-3">學員</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b align-top">
                  <td className="p-3 font-black">
                    <div className="flex items-start gap-2.5">
                      {course.coverImageUrl && (
                        <img
                          src={course.coverImageUrl}
                          alt=""
                          className="w-14 h-10 object-cover rounded-lg border shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        {course.title}
                        <div className="text-xs font-bold text-slate-400 truncate">{course.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`${BADGE} ${course.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
                    >
                      {course.status === "published" ? "已發布" : "草稿"}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{course.lessonCount}</td>
                  <td className="p-3 font-bold">{course.studentCount}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(course);
                          setIsNew(false);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-slate-300 rounded-lg font-black text-xs hover:bg-slate-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        編輯
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `確定要刪除「${course.title}」嗎？\n\n⚠️ 會一併刪除 ${course.lessonCount} 個單元與 ${course.studentCount} 位學員的觀看權限，且無法復原。`,
                            )
                          )
                            return;
                          try {
                            await call(`/api/admin/courses?id=${encodeURIComponent(course.id)}`, {
                              method: "DELETE",
                            });
                            notify(`已刪除「${course.title}」。`);
                            await load();
                          } catch (caught) {
                            onError(caught instanceof Error ? caught.message : "刪除失敗。");
                          }
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
  );
}

// ─────────────────────────────────────────────────────────────────────────

function CourseEditor({
  initial,
  isNew,
  call,
  uploadImage,
  notify,
  onError,
  onBack,
}: Props & { initial: AdminCourse; isNew: boolean; onBack: () => void }) {
  const [draft, setDraft] = useState<AdminCourse>(initial);
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : initial.id);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const set = <K extends keyof AdminCourse>(key: K, value: AdminCourse[K]) =>
    setDraft((c) => ({ ...c, [key]: value }));

  const saveCourse = async () => {
    if (!draft.title.trim()) return onError("課程名稱不可空白。");
    if (!draft.id.trim()) return onError("課程代碼不可空白。");
    setSaving(true);
    try {
      const { id } = await call("/api/admin/courses", { method: "POST", body: JSON.stringify(draft) });
      setSavedId(id);
      notify(`已儲存「${draft.title}」${draft.status === "published" ? "並發布" : "為草稿"}。`);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "儲存失敗。");
    } finally {
      setSaving(false);
    }
  };

  const handleCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) return onError("圖片超過 3MB，請先壓縮。");
    setUploading(true);
    try {
      set("coverImageUrl", await uploadImage(file));
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "圖片上傳失敗。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 font-black text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        回課程列表
      </button>

      {/* 課程基本資料 */}
      <div className="bg-white border-3 border-[#1e293b] rounded-2xl p-6">
        <h3 className="text-xl font-black mb-5">{isNew && !savedId ? "新增課程" : `編輯：${draft.title}`}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={LABEL}>課程名稱</label>
            <input
              className={FIELD}
              value={draft.title}
              onChange={(e) => {
                const title = e.target.value;
                setDraft((c) => ({ ...c, title, id: slugTouched ? c.id : slugify(title) }));
              }}
            />
          </div>
          <div>
            <label className={LABEL}>課程代碼（網址用，建立後不可更改）</label>
            <input
              className={`${FIELD} ${savedId ? "bg-slate-100 text-slate-500" : ""}`}
              value={draft.id}
              disabled={!!savedId}
              onChange={(e) => {
                setSlugTouched(true);
                set("id", e.target.value);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>狀態</label>
              <select
                className={FIELD}
                value={draft.status}
                onChange={(e) => set("status", e.target.value as AdminCourse["status"])}
              >
                <option value="draft">草稿</option>
                <option value="published">已發布</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>排序</label>
              <input
                type="number"
                className={FIELD}
                value={draft.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>課程說明</label>
            <textarea
              rows={4}
              className={FIELD}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>封面圖片</label>
            <div className="flex gap-4 items-start">
              {draft.coverImageUrl ? (
                <img src={draft.coverImageUrl} alt="" className="w-40 h-28 object-cover rounded-xl border-2 shrink-0" />
              ) : (
                <div className="w-40 h-28 rounded-xl border-2 border-dashed flex items-center justify-center text-slate-300 shrink-0">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm border-2 border-slate-300 hover:bg-slate-50 cursor-pointer">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "上傳中…" : draft.coverImageUrl ? "更換圖片" : "選擇圖片"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleCover}
                  />
                </label>
                {draft.coverImageUrl && (
                  <button
                    type="button"
                    onClick={() => set("coverImageUrl", "")}
                    className="px-4 py-2.5 rounded-xl font-black text-sm border-2 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    移除
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={saveCourse}
          disabled={saving}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          儲存課程資料
        </button>
      </div>

      {/* 單元與學員只有在課程已存在（有代碼）後才能編 */}
      {savedId ? (
        <>
          <LessonEditor courseId={savedId} call={call} notify={notify} onError={onError} />
          <EnrollmentPanel courseId={savedId} call={call} notify={notify} onError={onError} />
        </>
      ) : (
        <p className="text-sm font-bold text-slate-500 px-1">先儲存課程資料，之後才能新增單元與學員。</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function LessonEditor({
  courseId,
  call,
  notify,
  onError,
}: {
  courseId: string;
  call: Props["call"];
  notify: Props["notify"];
  onError: Props["onError"];
}) {
  const [lessons, setLessons] = useState<LessonDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    call(`/api/admin/courses?id=${encodeURIComponent(courseId)}`)
      .then((rows: Array<Record<string, unknown>>) =>
        setLessons(
          rows.map((r) => ({
            id: String(r.id),
            title: String(r.title ?? ""),
            youtubeUrl: r.youtubeId ? `https://youtu.be/${r.youtubeId}` : "",
            durationMin: Math.floor(Number(r.durationSec ?? 0) / 60),
            durationSec: Number(r.durationSec ?? 0) % 60,
            body: String(r.body ?? ""),
            isFreePreview: r.isFreePreview === true,
          })),
        ),
      )
      .catch((caught) => onError(caught instanceof Error ? caught.message : "單元載入失敗。"))
      .finally(() => setLoading(false));
  }, [call, courseId, onError]);

  const update = (index: number, patch: Partial<LessonDraft>) =>
    setLessons((list) => list.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const move = (index: number, delta: number) =>
    setLessons((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      await call("/api/admin/courses", {
        method: "PUT",
        body: JSON.stringify({
          courseId,
          lessons: lessons.map((l) => ({
            id: l.id,
            title: l.title,
            youtubeUrl: l.youtubeUrl,
            durationSec: l.durationMin * 60 + l.durationSec,
            body: l.body,
            isFreePreview: l.isFreePreview,
          })),
        }),
      });
      notify(`已儲存 ${lessons.length} 個單元。`);
      // 重新載入拿回新建單元的 id，否則再存一次會變成重複新增
      const rows: Array<Record<string, unknown>> = await call(
        `/api/admin/courses?id=${encodeURIComponent(courseId)}`,
      );
      setLessons(
        rows.map((r) => ({
          id: String(r.id),
          title: String(r.title ?? ""),
          youtubeUrl: r.youtubeId ? `https://youtu.be/${r.youtubeId}` : "",
          durationMin: Math.floor(Number(r.durationSec ?? 0) / 60),
          durationSec: Number(r.durationSec ?? 0) % 60,
          body: String(r.body ?? ""),
          isFreePreview: r.isFreePreview === true,
        })),
      );
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "單元儲存失敗。");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );

  return (
    <div className="bg-white border-3 border-[#1e293b] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-black">課程單元（{lessons.length}）</h3>
        <button
          onClick={() =>
            setLessons((l) => [
              ...l,
              { title: "", youtubeUrl: "", durationMin: 0, durationSec: 0, body: "", isFreePreview: false },
            ])
          }
          className="flex items-center gap-1.5 px-3 py-2 border-2 border-slate-300 rounded-xl font-black text-xs hover:bg-slate-50"
        >
          <Plus className="w-3.5 h-3.5" />
          新增單元
        </button>
      </div>
      <p className="text-xs font-black text-red-700 mb-5">
        ⚠️ 影片在 YouTube 上必須設成「不公開」（unlisted），不要設「私人」——私人影片嵌入後無法播放；也不要設「公開」，否則任何人搜得到。
      </p>

      {lessons.length === 0 ? (
        <p className="text-sm font-bold text-slate-500">尚無單元，點右上角「新增單元」。</p>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => {
            const parsed = lesson.youtubeUrl.trim() ? parseYouTubeId(lesson.youtubeUrl) : null;
            return (
              <div key={lesson.id ?? `new-${index}`} className="border-2 border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-xs font-black text-slate-400 text-center">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                      aria-label="上移"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === lessons.length - 1}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                      aria-label="下移"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className={LABEL}>單元標題</label>
                      <input
                        className={FIELD}
                        value={lesson.title}
                        onChange={(e) => update(index, { title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>YouTube 網址</label>
                      <input
                        className={`${FIELD} ${lesson.youtubeUrl.trim() && !parsed ? "border-red-400" : ""}`}
                        value={lesson.youtubeUrl}
                        onChange={(e) => update(index, { youtubeUrl: e.target.value })}
                        placeholder="https://youtu.be/…"
                      />
                      <p className={`mt-1 text-xs font-bold ${parsed ? "text-emerald-700" : lesson.youtubeUrl.trim() ? "text-red-700" : "text-slate-400"}`}>
                        {parsed ? `影片 ID：${parsed}` : lesson.youtubeUrl.trim() ? "無法辨識這個網址" : "留空代表此單元只有文字"}
                      </p>
                    </div>
                    <div>
                      <label className={LABEL}>片長</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          className={FIELD}
                          value={lesson.durationMin}
                          onChange={(e) => update(index, { durationMin: Math.max(0, Number(e.target.value) || 0) })}
                        />
                        <span className="text-xs font-black shrink-0">分</span>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          className={FIELD}
                          value={lesson.durationSec}
                          onChange={(e) => update(index, { durationSec: Math.min(59, Math.max(0, Number(e.target.value) || 0)) })}
                        />
                        <span className="text-xs font-black shrink-0">秒</span>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={LABEL}>單元說明／講義文字</label>
                      <textarea
                        rows={3}
                        className={FIELD}
                        value={lesson.body}
                        onChange={(e) => update(index, { body: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between">
                      <label className="flex items-center gap-2 font-black text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={lesson.isFreePreview}
                          onChange={(e) => update(index, { isFreePreview: e.target.checked })}
                        />
                        開放試看（不用登入也能看）
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (lesson.id && !window.confirm(`移除「${lesson.title || "此單元"}」？學員在這個單元的完成紀錄也會一併清除。`)) return;
                          setLessons((l) => l.filter((_, i) => i !== index));
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-red-300 text-red-700 rounded-lg font-black text-xs hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        移除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        儲存全部單元
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function EnrollmentPanel({
  courseId,
  call,
  notify,
  onError,
}: {
  courseId: string;
  call: Props["call"];
  notify: Props["notify"];
  onError: Props["onError"];
}) {
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailsText, setEmailsText] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await call(`/api/admin/enrollments?courseId=${encodeURIComponent(courseId)}`));
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "學員名單載入失敗。");
    } finally {
      setLoading(false);
    }
  }, [call, courseId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const grant = async () => {
    // 一行一個或逗號分隔都吃，方便從試算表整欄貼過來
    const emails = emailsText
      .split(/[\n,;，；\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) return onError("請輸入至少一個 Email。");
    setBusy(true);
    try {
      const result = await call("/api/admin/enrollments", {
        method: "POST",
        body: JSON.stringify({
          courseId,
          emails,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const failed = (result.results as Array<{ email: string; ok: boolean; error?: string }>).filter((r) => !r.ok);
      notify(
        `已開通 ${result.granted} 位學員` +
          (result.createdAccounts ? `（其中 ${result.createdAccounts} 位是新建帳號，請提醒他們用「忘記密碼」設定密碼）` : "") +
          (failed.length ? `；${failed.length} 筆失敗：${failed.map((f) => `${f.email}（${f.error}）`).join("、")}` : "。"),
      );
      setEmailsText("");
      await load();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "開通失敗。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border-3 border-[#1e293b] rounded-2xl p-6">
      <h3 className="text-xl font-black mb-1 flex items-center gap-2">
        <Users className="w-5 h-5" />
        學員名單（{rows.length}）
      </h3>
      <p className="text-xs font-bold text-slate-500 mb-4">
        輸入 Email 即可開通。已有帳號的直接開通；沒有帳號的會自動建立（已驗證、無密碼），學員第一次用「忘記密碼」設定密碼後登入。
      </p>

      <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end mb-6">
        <div>
          <label className={LABEL}>Email（一行一個，或用逗號分隔）</label>
          <textarea
            rows={3}
            className={FIELD}
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            placeholder={"a@example.com\nb@example.com"}
          />
        </div>
        <div>
          <label className={LABEL}>到期日（留空＝永久）</label>
          <input type="date" className={FIELD} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <button
          onClick={grant}
          disabled={busy}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-sm h-[46px]"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          開通
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="animate-spin text-emerald-600" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm font-bold text-slate-500">還沒有學員。</p>
      ) : (
        <div className="overflow-x-auto border-2 border-slate-200 rounded-xl">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">姓名</th>
                <th className="p-3">來源</th>
                <th className="p-3">到期</th>
                <th className="p-3">完成</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-t">
                  <td className="p-3 font-bold">{row.email}</td>
                  <td className="p-3">{row.fullName || "—"}</td>
                  <td className="p-3">
                    <span className={`${BADGE} ${row.source === "legacy_import" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                      {row.source === "legacy_import" ? "舊平台匯入" : "後台開通"}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{row.expiresAt ? new Date(row.expiresAt).toLocaleDateString("zh-TW") : "永久"}</td>
                  <td className="p-3 text-xs">{row.completedLessons} 個單元</td>
                  <td className="p-3">
                    <button
                      onClick={async () => {
                        if (!window.confirm(`移除 ${row.email} 的觀看權限？`)) return;
                        try {
                          await call(
                            `/api/admin/enrollments?courseId=${encodeURIComponent(courseId)}&userId=${encodeURIComponent(row.userId)}`,
                            { method: "DELETE" },
                          );
                          notify(`已移除 ${row.email}。`);
                          await load();
                        } catch (caught) {
                          onError(caught instanceof Error ? caught.message : "移除失敗。");
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 border-2 border-red-300 text-red-700 rounded-lg font-black text-xs hover:bg-red-50"
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
      )}
    </div>
  );
}
