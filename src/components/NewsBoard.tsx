import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  Search, 
  Calendar, 
  Bookmark, 
  Megaphone, 
  ArrowRight, 
  X, 
  Clock, 
  AlertCircle,
} from "lucide-react";
import { type NewsItem } from "../data/news";
import { CARD_GRID, CARD_ITEM, CARD_MEDIA, HOME_CARD_LIMIT } from "../lib/cardLayout";

export type { NewsItem } from "../data/news";

interface NewsBoardProps {
  onNavigateToAdmin?: () => void;
  // 點文章由 App 決定要去哪 —— 公佈欄不自己管路由。
  onOpenPost: (id: string) => void;
  // 「看更多」帶去 /blog 總覽頁，而不是在首頁原地展開。
  onSeeAll: () => void;
}

// 後台的 post 轉成公佈欄卡片要的形狀。content 這裡用不到（點進去才讀內頁），
// 所以留空字串而不是把整篇內文也一併抓下來。
interface ApiPost {
  id: string;
  title: string;
  excerpt: string;
  categoryLabel: string | null;
  coverImageUrl: string;
  isPinned: boolean;
  publishedAt: string | null;
}

function toNewsItem(post: ApiPost): NewsItem {
  return {
    id: post.id,
    title: post.title,
    category: post.categoryLabel ?? "未分類",
    date: post.publishedAt ? post.publishedAt.slice(0, 10) : "",
    summary: post.excerpt,
    content: "",
    imageUrl: post.coverImageUrl || undefined,
    isPinned: post.isPinned,
  };
}

export default function NewsBoard({ onNavigateToAdmin, onOpenPost, onSeeAll }: NewsBoardProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        // 文章的單一真相在 posts 表。舊的 /api/news 從來沒被移植成 serverless
        // function，在正式站一直是 404，公佈欄靠打包進 bundle 的靜態備份撐著 ——
        // 那份備份會讓後台刪掉的文章又冒出來，所以連同備援一起拿掉。
        const response = await fetch("/api/posts");
        if (response.ok) {
          const posts = (await response.json()) as ApiPost[];
          setNews(posts.map(toNewsItem));
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchNews();
    window.addEventListener("focus", fetchNews);
    return () => window.removeEventListener("focus", fetchNews);
  }, []);

  const categories = ["全部", "活動紀錄", "工會公告", "知識分享"];

  const filteredNews = news.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "全部" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort: pinned first, then by date descending
  const sortedNews = [...filteredNews].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // 首頁只放兩排；其餘收在「看更多」後面，避免公佈欄把整頁吃掉。
  const visibleNews = sortedNews.slice(0, HOME_CARD_LIMIT);
  const hiddenCount = sortedNews.length - visibleNews.length;

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "活動紀錄":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "工會公告":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "知識分享":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="py-12 bg-white border-t-4 border-[#1e293b]">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
          <div className="text-left">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-300 uppercase tracking-widest flex items-center gap-1 w-max">
              <Megaphone className="w-3.5 h-3.5 animate-bounce" /> LATEST NEWS & EVENTS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e293b] mt-3">
              最新共生消息 ‧ 夥伴動態
            </h2>
            <p className="text-sm sm:text-base font-bold text-[#1e293b]/60 mt-2">
              即時追蹤台灣環境共生工會的第一手活動紀錄、重要公告與深度知識分享。
            </p>
          </div>

          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-[#1e293b] text-xs font-black rounded-xl border-2 border-[#1e293b] bubbly-shadow-sm flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              ⚙️ 進入後台管理
            </button>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#fdfbf7] p-5 rounded-[2rem] border-3 border-[#1e293b] mb-10 flex flex-col md:flex-row items-center justify-between gap-4 bubbly-shadow-md">
          {/* Categories Tab */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none scroll-smooth">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-[#1e293b] text-white border-[#1e293b]"
                    : "bg-white text-[#1e293b]/70 border-transparent hover:border-[#1e293b]/20 hover:text-[#1e293b]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <input
              type="text"
              placeholder="搜尋公告、活動或內容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none bg-white text-xs sm:text-sm font-semibold transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e293b]/40" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1e293b]/40 hover:text-[#1e293b]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* News Feed Cards Layout */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border-3 border-[#1e293b]/10 rounded-[2rem] p-6 space-y-4 animate-pulse">
                <div className="h-48 bg-slate-100 rounded-2xl w-full" />
                <div className="h-6 bg-slate-100 rounded-lg w-2/3" />
                <div className="h-4 bg-slate-100 rounded-lg w-full" />
                <div className="h-4 bg-slate-100 rounded-lg w-4/5" />
              </div>
            ))}
          </div>
        ) : sortedNews.length === 0 ? (
          <div className="text-center py-16 bg-[#fdfbf7] rounded-[2rem] border-3 border-dashed border-[#1e293b]/20 p-8">
            <AlertCircle className="w-12 h-12 text-[#1e293b]/30 mx-auto mb-4" />
            <h3 className="text-lg font-black text-[#1e293b]">找不到相關公告消息捏！</h3>
            <p className="text-sm font-semibold text-[#1e293b]/60 mt-1">
              可以嘗試更換篩選分類，或輸入其他關鍵字搜尋喔。
            </p>
          </div>
        ) : (
          <div className={CARD_GRID}>
            {visibleNews.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`${CARD_ITEM} bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden bubbly-shadow-md lg:hover:scale-[1.01] hover:shadow-[6px_6px_0px_0px_#1e293b] transition-all flex flex-col justify-between text-left ${
                  item.isPinned ? "relative ring-4 ring-amber-400/30" : ""
                }`}
              >
                <div>
                  {/* Banner image or fallback placeholder */}
                  {item.imageUrl ? (
                    <div className={`${CARD_MEDIA} relative`}>
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {item.isPinned && (
                        <span className="absolute top-3 left-3 bg-amber-400 text-[#1e293b] text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-[#1e293b] flex items-center gap-0.5 shadow-sm">
                          📌 置頂推薦
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-12 border-b-3 border-[#1e293b] bg-slate-50 relative">
                      {item.isPinned && (
                        <span className="absolute top-3 left-3 bg-amber-400 text-[#1e293b] text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-[#1e293b] flex items-center gap-0.5 shadow-sm">
                          📌 置頂推薦
                        </span>
                      )}
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1e293b]/60 mb-3">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.date}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getCategoryStyles(item.category)}`}>
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#1e293b] leading-tight mb-2 hover:text-emerald-700 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm font-semibold text-[#1e293b]/70 leading-relaxed line-clamp-3 mb-4">
                      {item.summary}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <button
                    onClick={() => onOpenPost(item.id)}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border-2 border-[#1e293b] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>閱讀全文</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {hiddenCount > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={onSeeAll}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border-3 border-[#1e293b] rounded-2xl font-black text-sm bubbly-shadow-md transition-colors"
            >
              看更多文章（還有 {hiddenCount} 篇）
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
