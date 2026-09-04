import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, FileText, Loader2, User } from "lucide-react";
import { CARD_MEDIA } from "../lib/cardLayout";

interface PostSummary {
  id: string;
  title: string;
  excerpt: string;
  category: string | null;
  categoryLabel: string | null;
  coverImageUrl: string;
  authorName: string;
  publishedAt: string | null;
}

interface PostDetail extends PostSummary {
  contentHtml: string;
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" }) : "";

function Spinner() {
  return (
    <div className="py-24 flex justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
    </div>
  );
}

export function BlogList({ onOpen }: { onOpen: (id: string) => void }) {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const [active, setActive] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/posts")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setPosts(body);
        // 分類直接從已發布的文章推導，而不是列出資料庫裡全部的分類 ——
        // 否則會出現點了沒有任何文章的分類、看到一片空白。
        const seen = new Map<string, string>();
        for (const post of body as PostSummary[]) {
          if (post.category && post.categoryLabel) seen.set(post.category, post.categoryLabel);
        }
        setCategories([...seen].map(([id, label]) => ({ id, label })));
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "文章載入失敗。"))
      .finally(() => setLoading(false));
  }, []);

  const shown = active === "all" ? posts : posts.filter((post) => post.category === active);

  if (loading) return <Spinner />;

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-2">工會文章</h1>
        <p className="font-bold text-slate-500 mb-8">
          保育知識、權益倡議與志工故事，都在這裡。
        </p>

        {error && (
          <p className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl font-bold">
            {error}
          </p>
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {[{ id: "all", label: "全部" }, ...categories].map((category) => (
              <button
                key={category.id}
                onClick={() => setActive(category.id)}
                className={`px-4 py-2 rounded-full font-black text-sm border-2 transition-colors ${
                  active === category.id
                    ? "bg-[#1e293b] border-[#1e293b] text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        )}

        {shown.length === 0 ? (
          <div className="py-20 bg-slate-50 rounded-3xl border-2 border-dashed text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-500">目前還沒有文章。</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((post) => (
              <button
                key={post.id}
                onClick={() => onOpen(post.id)}
                className="text-left bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden bubbly-shadow-md hover:-translate-y-1 transition-transform flex flex-col"
              >
                {post.coverImageUrl ? (
                  <div className={CARD_MEDIA}>
                  <img
                    src={post.coverImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  </div>
                ) : (
                  <div className={`${CARD_MEDIA} flex items-center justify-center`}>
                    <FileText className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="p-5">
                  {post.categoryLabel && (
                    <span className="inline-block mb-2 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                      {post.categoryLabel}
                    </span>
                  )}
                  <h2 className="text-lg font-black leading-snug mb-2">{post.title}</h2>
                  <p className="text-sm font-bold text-slate-500 line-clamp-3">{post.excerpt}</p>
                  <p className="mt-3 text-xs font-bold text-slate-400">
                    {formatDate(post.publishedAt)}
                    {post.authorName && ` · ${post.authorName}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function BlogPost({ id, onBack }: { id: string; onBack: () => void }) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setPost(body);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "文章載入失敗。"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  if (error || !post) {
    return (
      <section className="py-24 px-4 text-center">
        <FileText className="w-14 h-14 mx-auto text-slate-300 mb-3" />
        <h1 className="text-2xl font-black">{error || "找不到這篇文章。"}</h1>
        <button onClick={onBack} className="mt-5 px-5 py-2.5 border-2 font-black rounded-xl">
          回文章列表
        </button>
      </section>
    );
  }

  return (
    <article className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 mb-6 font-black text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          回文章列表
        </button>

        {post.categoryLabel && (
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
            {post.categoryLabel}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">{post.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500 mb-8 pb-6 border-b-2">
          {post.publishedAt && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </span>
          )}
          {post.authorName && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.authorName}
            </span>
          )}
        </div>

        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt=""
            className="w-full rounded-2xl border-3 border-[#1e293b] mb-8"
          />
        )}

        {/* content_html 只由後台管理員透過編輯器產生，而編輯器的連結擴充已限制
            協定為 http/https/mailto（RichTextEditor.tsx），所以這裡不再過濾。
            日後若開放非管理員投稿，這一行必須先接上淨化處理。 */}
        <div
          className="prose prose-slate max-w-none prose-headings:font-black prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </div>
    </article>
  );
}
