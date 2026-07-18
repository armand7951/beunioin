import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Calendar, 
  Bookmark, 
  Megaphone, 
  ArrowRight, 
  X, 
  Clock, 
  AlertCircle
} from "lucide-react";
import { IMPORTED_NEWS, type NewsItem } from "../data/news";

export type { NewsItem } from "../data/news";

interface NewsBoardProps {
  onNavigateToAdmin?: () => void;
}

function mergeNews(managedNews: NewsItem[]) {
  const merged = new Map(
    IMPORTED_NEWS.map((item) => [item.id, item] as const),
  );
  managedNews.forEach((item) => merged.set(item.id, item));
  return [...merged.values()];
}

export default function NewsBoard({ onNavigateToAdmin }: NewsBoardProps) {
  const [news, setNews] = useState<NewsItem[]>(IMPORTED_NEWS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/news");
        if (response.ok) {
          const managedNews = (await response.json()) as NewsItem[];
          setNews(mergeNews(managedNews));
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedNews.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden bubbly-shadow-md hover:scale-[1.01] hover:shadow-[6px_6px_0px_0px_#1e293b] transition-all flex flex-col justify-between text-left ${
                  item.isPinned ? "relative ring-4 ring-amber-400/30" : ""
                }`}
              >
                <div>
                  {/* Banner image or fallback placeholder */}
                  {item.imageUrl ? (
                    <div className="h-48 w-full overflow-hidden border-b-3 border-[#1e293b] relative bg-slate-100">
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
                    onClick={() => setSelectedItem(item)}
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

      </div>

      {/* Detail News Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-[#1e293b]/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-3xl bg-[#fffdfa] rounded-[2.5rem] border-4 border-[#1e293b] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] text-left"
            >
              {/* Image banner or decorative bar */}
              {selectedItem.imageUrl ? (
                <div className="h-56 sm:h-64 w-full relative shrink-0 border-b-4 border-[#1e293b] bg-slate-100">
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 w-9 h-9 bg-white hover:bg-amber-100 text-[#1e293b] rounded-full border-2 border-[#1e293b] flex items-center justify-center transition-colors cursor-pointer z-20 shadow-md"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 left-6 right-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border mb-2 ${getCategoryStyles(selectedItem.category)}`}>
                      {selectedItem.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                      {selectedItem.title}
                    </h2>
                  </div>
                </div>
              ) : (
                <div className="p-6 pb-0 flex justify-between items-start shrink-0 relative">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border mb-2 ${getCategoryStyles(selectedItem.category)}`}>
                      {selectedItem.category}
                    </span>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[#1e293b] leading-tight pr-8">
                      {selectedItem.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 w-9 h-9 bg-white hover:bg-amber-100 text-[#1e293b] rounded-full border-2 border-[#1e293b] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Scrollable details */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#1e293b]">
                
                {/* Meta details */}
                <div className="flex flex-wrap gap-4 text-xs font-bold text-[#1e293b]/60 pb-4 border-b border-[#1e293b]/10 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>公告日期：{selectedItem.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>對象限制：全體工會成員與志工夥伴</span>
                  </div>
                  {selectedItem.isPinned && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Bookmark className="w-4 h-4 fill-amber-500" />
                      <span>重點公告</span>
                    </div>
                  )}
                </div>

                {/* Main rich text content */}
                <div className="prose prose-slate max-w-none text-sm sm:text-base font-medium leading-relaxed space-y-3">
                  {selectedItem.content.split("\n").map((line, index) => {
                    if (!line.trim()) return null;
                    if (line.startsWith("#### ")) {
                      return <h5 key={index} className="text-base font-black mt-5">{line.slice(5)}</h5>;
                    }
                    if (line.startsWith("### ")) {
                      return <h4 key={index} className="text-lg font-black mt-6 text-emerald-800">{line.slice(4)}</h4>;
                    }
                    if (line.startsWith("## ")) {
                      return <h3 key={index} className="text-xl font-black mt-8 border-l-4 border-amber-400 pl-3">{line.slice(3)}</h3>;
                    }
                    if (line.startsWith("• ")) {
                      return <p key={index} className="pl-5 relative before:content-['•'] before:absolute before:left-1 before:text-emerald-600">{line.slice(2)}</p>;
                    }
                    return <p key={index}>{line}</p>;
                  })}
                </div>

                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div className="pt-6 border-t-2 border-dashed border-[#1e293b]/15">
                    <h3 className="text-lg font-black mb-4">文章圖片</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedItem.images.map((block, index) =>
                        block.type === "image" ? (
                          <figure key={`${block.imageUrl}-${index}`} className="overflow-hidden rounded-2xl border-2 border-[#1e293b] bg-white">
                            <img
                              src={block.imageUrl}
                              alt={block.alt}
                              className="w-full h-auto object-contain"
                            />
                            {block.caption && (
                              <figcaption className="p-3 text-xs font-semibold text-[#1e293b]/65 leading-relaxed">
                                {block.caption}
                              </figcaption>
                            )}
                          </figure>
                        ) : null,
                      )}
                    </div>
                  </div>
                )}

                {selectedItem.sourceUrl && (
                  <a
                    href={selectedItem.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-xs font-black text-emerald-700 underline"
                  >
                    查看原始文章
                  </a>
                )}
              </div>

              {/* Close footer */}
              <div className="p-6 border-t-4 border-[#1e293b] bg-amber-50/40 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-[#1e293b]/40">
                  台灣環境共生工會 • 爭取環境勞工權益與環境正義
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl border-2 border-[#1e293b] bubbly-shadow-sm cursor-pointer transition-colors"
                >
                  關閉視窗
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
