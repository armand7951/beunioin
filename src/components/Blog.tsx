import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, FileText, Loader2, User } from "lucide-react";
import { CARD_MEDIA } from "../lib/cardLayout";
import { prepareArticle } from "../lib/articleHtml";
import { usePageMeta } from "../lib/pageMeta";
import ArticleToc from "./ArticleToc";
import Breadcrumbs from "./Breadcrumbs";

interface PostSummary {
  id: string;
  title: string;
  excerpt: string;
  category: string | null;
  categoryLabel: string | null;
  coverImageUrl: string;
  authorName: string;
  isPinned?: boolean;
  publishedAt: string | null;
}

interface PostDetail extends PostSummary {
  contentHtml: string;
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" }) : "";

// 列表頁的分類記在 ?category=，重新整理或從內頁回來都停在同一個分類。
const readCategoryParam = () =>
  new URLSearchParams(window.location.search).get("category")?.trim() || "all";

const writeCategoryParam = (category: string) => {
  const url = new URL(window.location.href);
  if (category === "all") url.searchParams.delete("category");
  else url.searchParams.set("category", category);
  // replace 而不是 push：切分類不算換頁，按返回應該離開列表，不是退回上一個分類
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
};

// 上下篇用發布時間排，忽略置頂：置頂是列表的陳列順序，不是文章的時間順序，
// 照它排「上一篇」會跳到半年前的置頂公告。
const publishedTime = (post: PostSummary) => (post.publishedAt ? Date.parse(post.publishedAt) : 0) || 0;

const sortNewestFirst = (posts: PostSummary[]) =>
  [...posts].sort((a, b) => publishedTime(b) - publishedTime(a) || a.id.localeCompare(b.id));

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
  const [active, setActive] = useState(readCategoryParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/posts")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (cancelled) return;
        setPosts(body);
        // 分類直接從已發布的文章推導，而不是列出資料庫裡全部的分類 ——
        // 否則會出現點了沒有任何文章的分類、看到一片空白。
        const seen = new Map<string, string>();
        for (const post of body as PostSummary[]) {
          if (post.category && post.categoryLabel) seen.set(post.category, post.categoryLabel);
        }
        setCategories([...seen].map(([id, label]) => ({ id, label })));
        // 網址帶了不存在（或已沒有文章）的分類就退回全部，同時把網址清乾淨
        setActive((current) => {
          if (current === "all" || seen.has(current)) return current;
          writeCategoryParam("all");
          return "all";
        });
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "文章載入失敗。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // 元件卸載後不再碰 state，也不改網址 —— 這時網址已經是別頁的了
    return () => {
      cancelled = true;
    };
  }, []);

  const selectCategory = (category: string) => {
    setActive(category);
    writeCategoryParam(category);
  };

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
                onClick={() => selectCategory(category.id)}
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

// 文末的上一篇／下一篇卡片。真的 <a href> 而不是 button：搜尋引擎能沿著它爬到
// 其他文章，讀者也能中鍵開新分頁；一般點擊攔下來走站內換頁。
function SiblingCard({
  post,
  direction,
  onNavigate,
}: {
  post: PostSummary;
  direction: "prev" | "next";
  onNavigate: (path: string) => void;
}) {
  const next = direction === "next";
  return (
    <a
      href={`/blog/${encodeURIComponent(post.id)}`}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(`blog/${post.id}`);
      }}
      className={`flex flex-col gap-1.5 p-4 bg-white border-3 border-[#1e293b] rounded-2xl bubbly-shadow hover:-translate-y-0.5 transition-transform ${
        next ? "text-right items-end" : "text-left items-start"
      }`}
    >
      <span className="flex items-center gap-1 text-xs font-black text-slate-500">
        {!next && <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />}
        {next ? "下一篇" : "上一篇"}
        {next && <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />}
      </span>
      <span className="font-black leading-snug line-clamp-2 text-[#1e293b]">{post.title}</span>
    </a>
  );
}

export function BlogPost({
  id,
  onBack,
  onNavigate,
}: {
  id: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
}) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [siblings, setSiblings] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    // 上下篇切換走同一個元件（App 的 key 是 activeSection，不含文章代碼），
    // 先把舊文清掉，否則會先看到舊文、再整頁跳成新文。
    setPost(null);
    setError("");
    setLoading(true);
    fetch(`/api/posts/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (!cancelled) setPost(body);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "文章載入失敗。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    // 上下篇只是導覽輔助：列表拿不到就不顯示，不該讓整篇文章跟著失敗
    fetch("/api/posts")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (!cancelled) setSiblings(sortNewestFirst(body));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const prepared = useMemo(() => (post ? prepareArticle(post.contentHtml) : null), [post?.contentHtml]);

  usePageMeta(
    post
      ? { title: post.title, description: post.excerpt || prepared?.text.slice(0, 160) }
      : null,
  );

  // 帶 #錨點 進來（例如從目錄複製的連結）就捲到那一節。要等內文掛上 DOM 才找得到 id。
  useEffect(() => {
    if (!post || !window.location.hash) return;
    const raw = window.location.hash.slice(1);
    let anchor = raw;
    try {
      anchor = decodeURIComponent(raw);
    } catch {
      // 不是合法的百分比編碼就照原字串找
    }
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [post]);

  if (loading) return <Spinner />;

  if (error || !post || !prepared) {
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

  const index = siblings.findIndex((sibling) => sibling.id === post.id);
  // 陣列是新到舊：前一個是較新的「下一篇」，後一個是較早的「上一篇」
  const newer = index > 0 ? siblings[index - 1] : null;
  const older = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  const crumbs = [
    { label: "首頁", onClick: () => onNavigate("home") },
    { label: "工會文章", onClick: () => onNavigate("blog") },
    ...(post.category && post.categoryLabel
      ? [{ label: post.categoryLabel, onClick: () => onNavigate(`blog?category=${post.category}`) }]
      : []),
    { label: post.title },
  ];

  return (
    <article className="py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Breadcrumbs items={crumbs} />
        </div>

        <header>
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
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </span>
            )}
            {post.authorName && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {post.authorName}
              </span>
            )}
          </div>
        </header>

        {/* 封面維持原始比例：現有封面有 3:2 的照片也有直式的活動海報，
            硬裁 16:9 會把海報上的文字切掉。 */}
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt=""
            loading="eager"
            fetchPriority="high"
            className="w-full h-auto rounded-2xl border-3 border-[#1e293b] bubbly-shadow mb-8"
          />
        )}

        {/* content_html 由後台編輯器產生，但渲染前仍經 prepareArticle 用 DOMPurify
            淨化一次：只靠「只有管理員能寫」擋 XSS 太薄。 */}
        {prepared.intro && (
          <div className="article-body" dangerouslySetInnerHTML={{ __html: prepared.intro }} />
        )}

        <ArticleToc entries={prepared.toc} />

        {prepared.body && (
          <div className="article-body" dangerouslySetInnerHTML={{ __html: prepared.body }} />
        )}

        <hr className="my-10 border-0 border-t-3 border-dashed border-slate-300" />

        {(older || newer) && (
          <nav aria-label="上一篇與下一篇" className="grid sm:grid-cols-2 gap-4 mb-8">
            {older ? <SiblingCard post={older} direction="prev" onNavigate={onNavigate} /> : <div aria-hidden="true" />}
            {newer ? <SiblingCard post={newer} direction="next" onNavigate={onNavigate} /> : <div aria-hidden="true" />}
          </nav>
        )}

        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-black text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          回文章列表
        </button>
      </div>
    </article>
  );
}
