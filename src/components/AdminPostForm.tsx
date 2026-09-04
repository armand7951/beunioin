import React, { useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { Image as ImageIcon, Loader2, Save, Upload, X } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

export interface AdminPost {
  id: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  contentJson: JSONContent | null;
  category: string;
  categoryLabel?: string | null;
  coverImageUrl: string;
  authorName: string;
  status: "draft" | "published";
  isPinned: boolean;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export interface PostCategory {
  id: string;
  label: string;
}

export const BLANK_POST: AdminPost = {
  id: "",
  title: "",
  excerpt: "",
  contentHtml: "",
  contentJson: null,
  category: "",
  coverImageUrl: "",
  authorName: "",
  status: "draft",
  isPinned: false,
};

const MAX_BYTES = 3 * 1024 * 1024;

const FIELD =
  "w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl font-bold text-sm focus:border-emerald-600 focus:outline-none";
const LABEL = "block text-xs font-black text-slate-600 mb-1.5";

// 標題轉網址代碼。中文不會被 [a-z0-9] 留下，所以純中文標題會得到空字串 ——
// 那時候就退回時間戳，讓使用者至少有個能用的預設值，再自己改。
function slugify(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `post-${Date.now()}`;
}

interface Props {
  initial: AdminPost;
  isNew: boolean;
  categories: PostCategory[];
  onCancel: () => void;
  onSave: (post: AdminPost) => Promise<void>;
  onUpload: (file: File) => Promise<string>;
}

export default function AdminPostForm({
  initial,
  isNew,
  categories,
  onCancel,
  onSave,
  onUpload,
}: Props) {
  const [draft, setDraft] = useState<AdminPost>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // 只在使用者從沒手動碰過代碼欄位時，才跟著標題自動更新。
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const set = <K extends keyof AdminPost>(key: K, value: AdminPost[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const handleCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError("");
    if (file.size > MAX_BYTES) {
      setUploadError(`圖片 ${(file.size / 1024 / 1024).toFixed(1)}MB，超過 3MB 上限。`);
      return;
    }
    setUploading(true);
    try {
      set("coverImageUrl", await onUpload(file));
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "圖片上傳失敗。");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: React.FormEvent, status?: AdminPost["status"]) => {
    event.preventDefault();
    setError("");
    const next = status ? { ...draft, status } : draft;

    if (!next.title.trim()) return setError("文章標題不可空白。");
    if (!next.id.trim()) return setError("文章代碼不可空白。");

    setSaving(true);
    try {
      await onSave(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "儲存失敗。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => submit(e)}
      className="bg-white border-3 border-[#1e293b] rounded-2xl p-6 mb-7"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-black">{isNew ? "新增文章" : `編輯：${initial.title}`}</h3>
        <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <p className="mb-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl font-bold text-sm">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className={LABEL}>標題</label>
          <input
            className={FIELD}
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value;
              setDraft((current) => ({
                ...current,
                title,
                id: slugTouched ? current.id : slugify(title),
              }));
            }}
          />
        </div>

        <div>
          <label className={LABEL}>文章代碼（網址用，建立後不可更改）</label>
          <input
            className={`${FIELD} ${isNew ? "" : "bg-slate-100 text-slate-500"}`}
            value={draft.id}
            disabled={!isNew}
            onChange={(e) => {
              setSlugTouched(true);
              set("id", e.target.value);
            }}
          />
        </div>
        <div>
          <label className={LABEL}>分類</label>
          <select
            className={FIELD}
            value={draft.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">未分類</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>作者署名</label>
          <input
            className={FIELD}
            value={draft.authorName}
            onChange={(e) => set("authorName", e.target.value)}
            placeholder="工會秘書處"
          />
        </div>
        <div>
          <label className={LABEL}>狀態</label>
          <select
            className={FIELD}
            value={draft.status}
            onChange={(e) => set("status", e.target.value as AdminPost["status"])}
          >
            <option value="draft">草稿</option>
            <option value="published">已發布</option>
          </select>
          <label className="flex items-center gap-2 mt-2.5 font-black text-sm cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={draft.isPinned}
              onChange={(e) => set("isPinned", e.target.checked)}
            />
            置頂（首頁公佈欄優先顯示）
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL}>摘要（列表頁顯示，最多 500 字）</label>
          <textarea
            rows={2}
            className={FIELD}
            value={draft.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL}>封面圖片</label>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {draft.coverImageUrl ? (
              <img
                src={draft.coverImageUrl}
                alt="封面預覽"
                className="w-40 h-28 object-cover rounded-xl border-2 border-slate-300 shrink-0"
              />
            ) : (
              <div className="w-40 h-28 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 shrink-0">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2">
                <label
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm border-2 cursor-pointer ${
                    uploading ? "border-slate-200 text-slate-400 cursor-wait" : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? "上傳中…" : draft.coverImageUrl ? "更換圖片" : "選擇圖片"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleCover}
                  />
                </label>
                {draft.coverImageUrl && !uploading && (
                  <button
                    type="button"
                    onClick={() => set("coverImageUrl", "")}
                    className="px-4 py-2.5 rounded-xl font-black text-sm border-2 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    移除
                  </button>
                )}
              </div>
              {uploadError && (
                <p className="mt-1.5 text-xs font-black text-red-700">{uploadError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <label className={LABEL}>內文</label>
      <RichTextEditor
        contentJson={initial.contentJson}
        contentHtml={initial.contentHtml}
        onChange={({ html, json }) =>
          setDraft((current) => ({ ...current, contentHtml: html, contentJson: json }))
        }
        onUploadImage={onUpload}
      />

      <div className="flex flex-wrap gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "儲存中…" : "儲存"}
        </button>
        {draft.status === "draft" && (
          <button
            type="button"
            disabled={saving}
            onClick={(e) => submit(e, "published")}
            className="px-5 py-2.5 bg-[#1e293b] hover:bg-slate-700 disabled:opacity-50 text-white font-black rounded-xl"
          >
            儲存並發布
          </button>
        )}
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
