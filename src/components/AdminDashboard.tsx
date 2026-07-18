import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Bookmark, 
  Layers, 
  Calendar, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft,
  Image,
  AlertCircle,
  Eye
} from "lucide-react";
import { NewsItem } from "./NewsBoard";

export default function AdminDashboard() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("活動公告");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  // Success/Error Feedback State
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Recommendations for images
  const imagePresets = [
    { name: "動保現場", url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800" },
    { name: "山林植樹", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800" },
    { name: "海洋保護", url: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=800" },
    { name: "綠能環保", url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800" }
  ];

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        setNewsList(data);
      }
    } catch (err) {
      console.error("Error fetching news list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("活動公告");
    setDate(new Date().toISOString().split("T")[0]);
    setImageUrl("");
    setSummary("");
    setContent("");
    setIsPinned(false);
    setPreviewMode(false);
  };

  const handleEditClick = (item: NewsItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setDate(item.date);
    setImageUrl(item.imageUrl || "");
    setSummary(item.summary);
    setContent(item.content);
    setIsPinned(item.isPinned);
    setActiveTab("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !summary.trim() || !content.trim()) {
      setStatusMessage({ type: "error", text: "請填寫所有必要欄位（標題、摘要、全文內容）捏！" });
      return;
    }

    const payload = {
      title,
      category,
      date,
      summary,
      content,
      imageUrl,
      isPinned
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/news/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: editingId ? "🎉 消息修改成功！已更新至首頁。" : "🎉 消息上架成功！已即時發布至首頁。"
        });
        resetForm();
        fetchNews();
        // Return to list after 1.5 seconds
        setTimeout(() => {
          setActiveTab("list");
          setStatusMessage(null);
        }, 1500);
      } else {
        setStatusMessage({ type: "error", text: "儲存消息失敗，請再試一次。" });
      }
    } catch (err) {
      console.error("Error saving news:", err);
      setStatusMessage({ type: "error", text: "網路傳輸失敗，請確認伺服器連線。" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMessage({ type: "success", text: "🗑️ 消息已成功下架刪除。" });
        fetchNews();
        setShowDeleteConfirm(null);
        setTimeout(() => setStatusMessage(null), 2000);
      } else {
        setStatusMessage({ type: "error", text: "下架刪除失敗，請再試一次。" });
      }
    } catch (err) {
      console.error("Error deleting news:", err);
    }
  };

  const togglePinStatus = async (item: NewsItem) => {
    try {
      const res = await fetch(`/api/news/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !item.isPinned })
      });
      if (res.ok) {
        fetchNews();
        setStatusMessage({ 
          type: "success", 
          text: !item.isPinned ? "📌 該消息已成功置頂！" : "📍 該消息已取消置頂。" 
        });
        setTimeout(() => setStatusMessage(null), 2000);
      }
    } catch (err) {
      console.error("Error toggling pin status:", err);
    }
  };

  return (
    <div className="bg-[#fffdfa] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Admin Header Title banner */}
        <div className="relative rounded-[3rem] border-4 border-[#1e293b] bg-[#1e293b] text-white p-8 sm:p-12 mb-12 text-left overflow-hidden bubbly-shadow-xl">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400 rounded-full blur-3xl opacity-15 translate-x-12 -translate-y-12" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl opacity-10 -translate-x-16 translate-y-16" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="bg-amber-400 text-[#1e293b] text-xs font-black px-3.5 py-1 rounded-full border-2 border-[#1e293b] uppercase tracking-wider mb-4 inline-block">
                ⚙️ BEUNION WEB MANAGER
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-300">
                工會網站訊息發布與管理後台
              </h1>
              <p className="text-sm font-semibold text-white/70 mt-2 max-w-2xl leading-relaxed">
                此處為台灣環境生態護育產業工會的核心管理控制台。在此發布最新活动公告、現場安全指引、權益申訴通知、或工會即時動態，一鍵儲存即可同步在首頁展示。
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Statistics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border-3 border-[#1e293b] p-5 rounded-3xl text-left bubbly-shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-[#1e293b] text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-[#1e293b]/50 uppercase">公告消息總數</p>
              <p className="text-2xl font-black text-[#1e293b]">{newsList.length} 篇</p>
            </div>
          </div>

          <div className="bg-white border-3 border-[#1e293b] p-5 rounded-3xl text-left bubbly-shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-[#1e293b] text-emerald-600 flex items-center justify-center shrink-0">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-[#1e293b]/50 uppercase">置頂重要公告</p>
              <p className="text-2xl font-black text-[#1e293b]">
                {newsList.filter(item => item.isPinned).length} 篇
              </p>
            </div>
          </div>

          <div className="bg-white border-3 border-[#1e293b] p-5 rounded-3xl text-left bubbly-shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-[#1e293b] text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-[#1e293b]/50 uppercase">涵蓋業務分類</p>
              <p className="text-2xl font-black text-[#1e293b]">
                {new Set(newsList.map(item => item.category)).size} 類
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback Status Banner */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border-2 mb-8 font-bold text-sm text-left flex items-center gap-2 ${
                statusMessage.type === "success" 
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800" 
                  : "bg-rose-50 border-rose-500 text-rose-800"
              }`}
            >
              {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
              <span>{statusMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Work Area Tabs */}
        <div className="flex border-b-4 border-[#1e293b] mb-8">
          <button
            onClick={() => { setActiveTab("list"); resetForm(); }}
            className={`px-6 py-3 font-black text-sm sm:text-base border-t-4 border-x-4 border-transparent rounded-t-2xl -mb-1 transition-all cursor-pointer ${
              activeTab === "list"
                ? "bg-white border-[#1e293b] text-[#1e293b] px-8"
                : "text-[#1e293b]/60 hover:text-[#1e293b]"
            }`}
          >
            📋 最新公告列表
          </button>
          <button
            onClick={() => { resetForm(); setActiveTab("form"); }}
            className={`px-6 py-3 font-black text-sm sm:text-base border-t-4 border-x-4 border-transparent rounded-t-2xl -mb-1 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "form" && !editingId
                ? "bg-white border-[#1e293b] text-[#1e293b] px-8"
                : activeTab === "form" && editingId
                ? "bg-white border-amber-500 border-[#1e293b] text-[#1e293b] px-8"
                : "text-[#1e293b]/60 hover:text-[#1e293b]"
            }`}
          >
            {editingId ? <Edit3 className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-emerald-600" />}
            {editingId ? "✍️ 編輯公告消息" : "🆕 上架新公告消息"}
          </button>
        </div>

        {/* Workspace views content */}
        <div>
          {activeTab === "list" ? (
            /* NEWS LIST VIEW */
            <div className="bg-white rounded-[2rem] border-4 border-[#1e293b] overflow-hidden bubbly-shadow-md text-left">
              {loading ? (
                <div className="p-16 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#1e293b]/60">正在讀取雲端最新公告，請稍候...</p>
                </div>
              ) : newsList.length === 0 ? (
                <div className="p-16 text-center">
                  <AlertCircle className="w-12 h-12 text-[#1e293b]/30 mx-auto mb-4" />
                  <h3 className="text-lg font-black text-[#1e293b]">目前沒有任何上架的消息公告喔！</h3>
                  <p className="text-sm font-semibold text-[#1e293b]/60 mt-1">
                    點擊上方「上架新公告消息」頁籤，建立第一篇熱門活動公告吧。
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#1e293b] text-white">
                        <th className="p-4 font-black text-sm text-center w-20">置頂</th>
                        <th className="p-4 font-black text-sm">公告分類</th>
                        <th className="p-4 font-black text-sm">公告標題 / 摘要</th>
                        <th className="p-4 font-black text-sm w-36">發布日期</th>
                        <th className="p-4 font-black text-sm text-center w-36">管理操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-3 divide-[#1e293b]/10">
                      {newsList.map((item) => (
                        <tr key={item.id} className="hover:bg-amber-50/10 transition-colors">
                          <td className="p-4 text-center">
                            <button
                              onClick={() => togglePinStatus(item)}
                              title={item.isPinned ? "取消置頂" : "設為置頂公告"}
                              className="focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                            >
                              <Bookmark 
                                className={`w-5 h-5 mx-auto ${
                                  item.isPinned ? "text-amber-500 fill-amber-400" : "text-[#1e293b]/30 hover:text-amber-400"
                                }`} 
                              />
                            </button>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                              item.category === "教育訓練" ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
                              item.category === "工會動態" ? "bg-indigo-50 text-indigo-800 border-indigo-300" :
                              item.category === "權益申訴" ? "bg-rose-50 text-rose-800 border-rose-300" :
                              "bg-amber-50 text-amber-800 border-amber-300"
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4 text-left">
                            <h4 className="font-black text-sm sm:text-base text-[#1e293b] line-clamp-1 mb-1">
                              {item.title}
                            </h4>
                            <p className="text-xs font-semibold text-[#1e293b]/60 line-clamp-1">
                              {item.summary}
                            </p>
                          </td>
                          <td className="p-4 font-semibold text-xs text-[#1e293b]/80 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{item.date}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditClick(item)}
                                className="p-2 bg-slate-50 hover:bg-amber-100 text-[#1e293b] rounded-lg border border-[#1e293b]/20 hover:border-amber-500 transition-colors cursor-pointer"
                                title="編輯此消息"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              {showDeleteConfirm === item.id ? (
                                <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 p-1.5 rounded-lg shrink-0">
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="px-2 py-1 bg-rose-600 text-white text-[10px] font-black rounded cursor-pointer"
                                  >
                                    確定
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-2 py-1 bg-slate-200 text-[#1e293b] text-[10px] font-black rounded cursor-pointer"
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowDeleteConfirm(item.id)}
                                  className="p-2 bg-slate-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-[#1e293b]/20 hover:border-rose-400 transition-colors cursor-pointer"
                                  title="下架刪除此消息"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ADD / EDIT FORM VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
              {/* Form Input fields (Col: 7) */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[2rem] border-4 border-[#1e293b] bubbly-shadow-md space-y-6">
                
                <div className="flex items-center justify-between border-b pb-4 border-[#1e293b]/10">
                  <h3 className="font-black text-lg text-[#1e293b] flex items-center gap-2">
                    {editingId ? "✍️ 正在編輯公告" : "🆕 上架新公告公告"}
                  </h3>
                  
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> 放棄修改、返回新增
                    </button>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-black text-[#1e293b] flex items-center gap-1">
                    <span>1. 公告標題</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="請輸入吸引人的消息標題 (例如：🛡️ 新增志工意外加保方案)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-sm font-bold bg-[#fffdfa]"
                  />
                </div>

                {/* Category, Date & Pinned Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Category select */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-black text-[#1e293b]">2. 消息分類</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-black bg-[#fffdfa]"
                    >
                      <option value="活動公告">活動公告 🌍</option>
                      <option value="工會動態">工會動態 📣</option>
                      <option value="教育訓練">教育訓練 🎓</option>
                      <option value="權益申訴">權益申訴 💌</option>
                    </select>
                  </div>

                  {/* Date picker */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-black text-[#1e293b]">3. 發布日期</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-bold bg-[#fffdfa]"
                    />
                  </div>

                  {/* Pin toggle */}
                  <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer bg-amber-50 border-2 border-dashed border-[#1e293b]/20 p-2 rounded-xl">
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-2 border-[#1e293b] rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-black text-[#1e293b] flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        置頂本則公告
                      </span>
                    </label>
                  </div>
                </div>

                {/* Image URL with Preset Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-black text-[#1e293b] flex items-center gap-1">
                    <Image className="w-4 h-4 text-emerald-600" />
                    <span>4. 橫幅封面圖片網址 (可選)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="輸入圖片網址 (https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-semibold bg-[#fffdfa]"
                  />
                  
                  {/* Preset picker container */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 mb-2">💡 推薦的生態背景圖 (點擊直接代入)：</p>
                    <div className="flex flex-wrap gap-2">
                      {imagePresets.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className={`px-2.5 py-1 text-[10px] font-black rounded-lg border-2 transition-all cursor-pointer ${
                            imageUrl === preset.url 
                              ? "bg-emerald-100 text-emerald-800 border-emerald-500" 
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary Text Area */}
                <div className="space-y-1.5">
                  <label className="text-sm font-black text-[#1e293b] flex items-center gap-1">
                    <span>5. 消息摘要 (精簡短文，首頁卡片中展示)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    maxLength={200}
                    placeholder="請輸入約 80 ~ 120 字的消息摘要，用於首頁動態訊息卡片的快速預覽..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-semibold bg-[#fffdfa] resize-none"
                  />
                </div>

                {/* Content Text Area */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-black text-[#1e293b] flex items-center gap-1">
                      <span>6. 詳細公告全文</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="text-xs font-black text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> {previewMode ? "關閉編譯預覽" : "開啟全文預覽"}
                    </button>
                  </div>

                  {previewMode ? (
                    <div className="w-full h-64 overflow-y-auto px-4 py-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/20 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap text-[#1e293b] text-left">
                      {content || <span className="text-slate-400 italic">尚未輸入全文，請於右側關閉預覽進行編寫喔。</span>}
                    </div>
                  ) : (
                    <textarea
                      rows={8}
                      required
                      placeholder="請填寫詳細的公告細則。您可以採用一般斷行或編排條列式的文字格式（例如：1. 課程亮點 2. 場次資訊 3. 報名規範）。"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-semibold bg-[#fffdfa]"
                    />
                  )}
                </div>

                {/* Buttons controls */}
                <div className="pt-4 border-t border-[#1e293b]/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setActiveTab("list"); }}
                    className="px-5 py-2.5 rounded-xl border-2 border-[#1e293b]/60 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-black cursor-pointer transition-colors"
                  >
                    取消並回列表
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-xl border-2 border-[#1e293b] bubbly-shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    {editingId ? "儲存修改消息" : "立即發布上架 🚀"}
                  </button>
                </div>

              </form>

              {/* Realtime Live Preview (Col: 5) */}
              <div className="lg:col-span-5 space-y-6">
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" /> 首頁卡片即時排版預覽
                </h3>

                <div className="bg-[#fdfbf7] p-6 rounded-[2.5rem] border-3 border-[#1e293b] bubbly-shadow-sm">
                  {/* Mock card layout */}
                  <div className="bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden shadow-sm flex flex-col justify-between text-left">
                    <div>
                      {imageUrl ? (
                        <div className="h-40 w-full overflow-hidden border-b-3 border-[#1e293b]">
                          <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 border-b-3 border-[#1e293b] bg-slate-50 flex items-center px-4">
                          <p className="text-[10px] font-bold text-slate-400 italic">封面圖未設定</p>
                        </div>
                      )}

                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>{date}</span>
                          <span>•</span>
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                            {category}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-[#1e293b] leading-tight line-clamp-2">
                          {title || "請於左側輸入標題..."}
                        </h4>

                        <p className="text-xs font-semibold text-[#1e293b]/70 leading-relaxed line-clamp-3">
                          {summary || "請於左側輸入摘要內容，這將會作為首頁卡片中呈現的前導預覽字句捏..."}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-1">
                      <button type="button" disabled className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-black rounded-xl border border-slate-300 flex items-center justify-center gap-1">
                        <span>預覽無法點擊</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Helpful tips */}
                <div className="bg-amber-50/40 p-5 rounded-2xl border-2 border-dashed border-amber-300 space-y-3 text-xs sm:text-sm font-medium text-amber-900">
                  <h4 className="font-black text-amber-950 flex items-center gap-1">💡 專業發文指南</h4>
                  <ul className="list-disc list-inside space-y-1 font-semibold leading-relaxed text-[#1e293b]/80">
                    <li>使用前綴表情符號（如 🌱、🛡️、🎓）能大幅增加消息在首頁的點擊吸引力！</li>
                    <li>公告全文斷行良好、適當利用符號，將會在使用者打開詳細視窗時，自動編排成清晰、易於閱讀的段落喔。</li>
                    <li>勾選「置頂公告」將使該篇公告始終顯示在首頁的最前列，並附帶顯眼的精選星章！</li>
                  </ul>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
