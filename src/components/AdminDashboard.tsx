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
  Eye,
  Clock,
  MapPin,
  Users,
  Phone,
  Mail,
  Heart,
  Filter,
  User,
  Activity,
  UserCheck,
  Search,
  Check
} from "lucide-react";
import { NewsItem } from "./NewsBoard";
import { EventItem } from "./EventCalendar";

export default function AdminDashboard() {
  // High-level Scope Switcher
  const [adminScope, setAdminScope] = useState<"news" | "events" | "registrations">("news");

  // Core Data Lists
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [registrationsList, setRegistrationsList] = useState<any[]>([]);
  
  // Loading indicators
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);
  const [regsLoading, setRegsLoading] = useState<boolean>(true);

  // Success/Error Feedback State
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // News Scope Local States
  const [newsActiveTab, setNewsActiveTab] = useState<"list" | "form">("list");
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsCategory, setNewsCategory] = useState("工會公告");
  const [newsDate, setNewsDate] = useState(new Date().toISOString().split("T")[0]);
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsIsPinned, setNewsIsPinned] = useState(false);
  const [newsPreviewMode, setNewsPreviewMode] = useState<boolean>(false);
  const [showNewsDeleteConfirm, setShowNewsDeleteConfirm] = useState<string | null>(null);

  // Events Scope Local States
  const [eventActiveTab, setEventActiveTab] = useState<"list" | "form">("list");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventLecturer, setEventLecturer] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventMaxSeats, setEventMaxSeats] = useState(50);
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [eventRegisteredCount, setEventRegisteredCount] = useState(0);
  const [showEventDeleteConfirm, setShowEventDeleteConfirm] = useState<string | null>(null);

  // Registrations Scope Local States
  const [regSearchQuery, setRegSearchQuery] = useState("");
  const [regEventFilter, setRegEventFilter] = useState("all");
  const [showRegDeleteConfirm, setShowRegDeleteConfirm] = useState<string | null>(null);

  // Image presets for auto-filling forms
  const imagePresets = [
    { name: "動保教育", url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800" },
    { name: "山林復育", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800" },
    { name: "海岸淨灘", url: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=800" },
    { name: "綠能食農", url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800" }
  ];

  // Fetch functions
  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        setNewsList(data);
      }
    } catch (err) {
      console.error("Error fetching news list:", err);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEventsList(data);
      }
    } catch (err) {
      console.error("Error fetching events list:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    setRegsLoading(true);
    try {
      const res = await fetch("/api/registrations");
      if (res.ok) {
        const data = await res.json();
        setRegistrationsList(data);
      }
    } catch (err) {
      console.error("Error fetching registrations:", err);
    } finally {
      setRegsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchEvents();
    fetchRegistrations();
  }, []);

  // NEWS Crud functions
  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNewsTitle("");
    setNewsCategory("活動公告");
    setNewsDate(new Date().toISOString().split("T")[0]);
    setNewsImageUrl("");
    setNewsSummary("");
    setNewsContent("");
    setNewsIsPinned(false);
    setNewsPreviewMode(false);
  };

  const handleNewsEditClick = (item: NewsItem) => {
    setEditingNewsId(item.id);
    setNewsTitle(item.title);
    setNewsCategory(item.category);
    setNewsDate(item.date);
    setNewsImageUrl(item.imageUrl || "");
    setNewsSummary(item.summary);
    setNewsContent(item.content);
    setNewsIsPinned(item.isPinned);
    setNewsActiveTab("form");
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsSummary.trim() || !newsContent.trim()) {
      setStatusMessage({ type: "error", text: "請填寫所有必要欄位（標題、摘要、全文內容）捏！" });
      return;
    }

    const payload = {
      title: newsTitle,
      category: newsCategory,
      date: newsDate,
      summary: newsSummary,
      content: newsContent,
      imageUrl: newsImageUrl,
      isPinned: newsIsPinned
    };

    try {
      let res;
      if (editingNewsId) {
        res = await fetch(`/api/news/${editingNewsId}`, {
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
          text: editingNewsId ? "🎉 消息修改成功！已同步更新至首頁。" : "🎉 消息發布成功！已即時上架至首頁。"
        });
        resetNewsForm();
        fetchNews();
        setTimeout(() => {
          setNewsActiveTab("list");
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

  const handleNewsDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMessage({ type: "success", text: "🗑️ 消息已成功下架刪除。" });
        fetchNews();
        setShowNewsDeleteConfirm(null);
        setTimeout(() => setStatusMessage(null), 2000);
      } else {
        setStatusMessage({ type: "error", text: "下架刪除失敗，請再試一次。" });
      }
    } catch (err) {
      console.error("Error deleting news:", err);
    }
  };

  const toggleNewsPin = async (item: NewsItem) => {
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


  // EVENTS Crud functions
  const resetEventForm = () => {
    setEditingEventId(null);
    setEventTitle("");
    setEventDate(new Date().toISOString().split("T")[0]);
    setEventTime("");
    setEventLocation("");
    setEventLecturer("");
    setEventDescription("");
    setEventMaxSeats(50);
    setEventImageUrl("");
    setEventRegisteredCount(0);
  };

  const handleEventEditClick = (item: EventItem) => {
    setEditingEventId(item.id);
    setEventTitle(item.title);
    setEventDate(item.date);
    setEventTime(item.time);
    setEventLocation(item.location);
    setEventLecturer(item.lecturer || "");
    setEventDescription(item.description);
    setEventMaxSeats(item.maxSeats);
    setEventImageUrl(item.imageUrl || "");
    setEventRegisteredCount(item.registeredCount);
    setEventActiveTab("form");
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDescription.trim() || !eventTime.trim() || !eventLocation.trim()) {
      setStatusMessage({ type: "error", text: "請填寫所有活動必要欄位（標題、時間、地點、描述）喔！" });
      return;
    }

    const payload = {
      title: eventTitle,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      lecturer: eventLecturer,
      description: eventDescription,
      maxSeats: Number(eventMaxSeats),
      imageUrl: eventImageUrl,
      registeredCount: eventRegisteredCount
    };

    try {
      let res;
      if (editingEventId) {
        res = await fetch(`/api/events/${editingEventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: editingEventId ? "🎉 活動修改成功！已同步更新至行事曆。" : "🎉 活動上架成功！已即時發布至行事曆。"
        });
        resetEventForm();
        fetchEvents();
        setTimeout(() => {
          setEventActiveTab("list");
          setStatusMessage(null);
        }, 1500);
      } else {
        setStatusMessage({ type: "error", text: "儲存活動失敗，請再試一次。" });
      }
    } catch (err) {
      console.error("Error saving event:", err);
      setStatusMessage({ type: "error", text: "網路傳輸失敗，請確認伺服器連線。" });
    }
  };

  const handleEventDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMessage({ type: "success", text: "🗑️ 活動已成功下架刪除。" });
        fetchEvents();
        setShowEventDeleteConfirm(null);
        setTimeout(() => setStatusMessage(null), 2000);
      } else {
        setStatusMessage({ type: "error", text: "活動刪除失敗，請再試一次。" });
      }
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  // REGISTRATIONS Cancel/Delete
  const handleRegDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMessage({ type: "success", text: "🗑️ 報名紀錄已刪除，該活動名額已釋出。" });
        fetchRegistrations();
        fetchEvents(); // Refresh seats count in events list too
        setShowRegDeleteConfirm(null);
        setTimeout(() => setStatusMessage(null), 2000);
      } else {
        setStatusMessage({ type: "error", text: "刪除報名紀錄失敗，請再試一次。" });
      }
    } catch (err) {
      console.error("Error deleting registration:", err);
    }
  };

  // Filter registrations
  const filteredRegistrations = registrationsList.filter((reg) => {
    const matchesSearch = 
      reg.name.toLowerCase().includes(regSearchQuery.toLowerCase()) ||
      reg.phone.includes(regSearchQuery) ||
      reg.email.toLowerCase().includes(regSearchQuery.toLowerCase()) ||
      reg.eventTitle.toLowerCase().includes(regSearchQuery.toLowerCase());

    const matchesEvent = regEventFilter === "all" || reg.eventId === regEventFilter;

    return matchesSearch && matchesEvent;
  });

  return (
    <div className="bg-[#fffdfa] py-12 px-4 sm:px-6 lg:px-8" id="admin-dashboard-container">
      <div className="max-w-6xl mx-auto">
        
        {/* Admin Header Title banner */}
        <div className="relative rounded-[3rem] border-4 border-[#1e293b] bg-[#1e293b] text-white p-8 sm:p-12 mb-10 text-left overflow-hidden bubbly-shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400 rounded-full blur-3xl opacity-15 translate-x-12 -translate-y-12" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl opacity-10 -translate-x-16 translate-y-16" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="bg-amber-400 text-[#1e293b] text-xs font-black px-3.5 py-1 rounded-full border-2 border-[#1e293b] uppercase tracking-wider mb-4 inline-block">
                ⚙️ BEUNION WEB CONTROL CENTER
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-300">
                工會管理與志工報名整合控制台
              </h1>
              <p className="text-sm font-semibold text-white/70 mt-2 max-w-2xl leading-relaxed">
                發布工會公告、上架與編輯志工培訓活動、並掌握現場志工報名名單。所有資料一鍵儲存，即時更新至首頁動態與行事曆中捏。
              </p>
            </div>
          </div>
        </div>

        {/* Global Statistics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border-3 border-[#1e293b] p-4 rounded-3xl text-left bubbly-shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-[#1e293b] text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#1e293b]/50 uppercase">公告消息</p>
              <p className="text-xl font-black text-[#1e293b]">{newsList.length} 篇</p>
            </div>
          </div>

          <div className="bg-white border-3 border-[#1e293b] p-4 rounded-3xl text-left bubbly-shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border-2 border-[#1e293b] text-emerald-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#1e293b]/50 uppercase">活動行事曆</p>
              <p className="text-xl font-black text-[#1e293b]">{eventsList.length} 堂</p>
            </div>
          </div>

          <div className="bg-white border-3 border-[#1e293b] p-4 rounded-3xl text-left bubbly-shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border-2 border-[#1e293b] text-rose-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#1e293b]/50 uppercase">志工報名人數</p>
              <p className="text-xl font-black text-[#1e293b]">{registrationsList.length} 人次</p>
            </div>
          </div>

          <div className="bg-white border-3 border-[#1e293b] p-4 rounded-3xl text-left bubbly-shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border-2 border-[#1e293b] text-indigo-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#1e293b]/50 uppercase">本月報名率</p>
              <p className="text-xl font-black text-[#1e293b]">
                {eventsList.length > 0 
                  ? Math.round((eventsList.reduce((acc, ev) => acc + ev.registeredCount, 0) / eventsList.reduce((acc, ev) => acc + ev.maxSeats, 0)) * 100) 
                  : 0}%
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

        {/* Level 1 Tabs: Select Scope (News vs Events vs Registrations) */}
        <div className="flex flex-wrap border-b-4 border-[#1e293b] gap-2 mb-8">
          <button
            onClick={() => setAdminScope("news")}
            className={`px-5 py-3 font-black text-sm sm:text-base border-t-4 border-x-4 border-transparent rounded-t-2xl -mb-1 transition-all cursor-pointer flex items-center gap-2 ${
              adminScope === "news"
                ? "bg-white border-[#1e293b] text-emerald-700 px-7 shadow-sm"
                : "text-[#1e293b]/60 hover:text-[#1e293b]"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>📢 最新公告管理</span>
          </button>
          
          <button
            onClick={() => setAdminScope("events")}
            className={`px-5 py-3 font-black text-sm sm:text-base border-t-4 border-x-4 border-transparent rounded-t-2xl -mb-1 transition-all cursor-pointer flex items-center gap-2 ${
              adminScope === "events"
                ? "bg-white border-[#1e293b] text-emerald-700 px-7 shadow-sm"
                : "text-[#1e293b]/60 hover:text-[#1e293b]"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>🗓️ 活動行事曆上架</span>
          </button>

          <button
            onClick={() => setAdminScope("registrations")}
            className={`px-5 py-3 font-black text-sm sm:text-base border-t-4 border-x-4 border-transparent rounded-t-2xl -mb-1 transition-all cursor-pointer flex items-center gap-2 ${
              adminScope === "registrations"
                ? "bg-white border-[#1e293b] text-emerald-700 px-7 shadow-sm"
                : "text-[#1e293b]/60 hover:text-[#1e293b]"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>💌 志工報名名單</span>
            {registrationsList.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {registrationsList.length}
              </span>
            )}
          </button>
        </div>

        {/* SCOPE 1: NEWS BOARD MANAGEMENT */}
        {adminScope === "news" && (
          <div>
            {/* News sub-tabs */}
            <div className="flex border-b-2 border-[#1e293b]/10 mb-6 gap-2">
              <button
                onClick={() => { setNewsActiveTab("list"); resetNewsForm(); }}
                className={`px-4 py-2 text-xs font-black rounded-t-xl -mb-px border-t border-x ${
                  newsActiveTab === "list"
                    ? "bg-white border-[#1e293b]/20 border-b-2 border-b-white text-[#1e293b]"
                    : "text-slate-400 border-transparent hover:text-[#1e293b]"
                }`}
              >
                📋 最新公告列表 ({newsList.length})
              </button>
              <button
                onClick={() => { resetNewsForm(); setNewsActiveTab("form"); }}
                className={`px-4 py-2 text-xs font-black rounded-t-xl -mb-px border-t border-x flex items-center gap-1 ${
                  newsActiveTab === "form"
                    ? "bg-white border-[#1e293b]/20 border-b-2 border-b-white text-[#1e293b]"
                    : "text-slate-400 border-transparent hover:text-[#1e293b]"
                }`}
              >
                {editingNewsId ? <Edit3 className="w-3.5 h-3.5 text-amber-500" /> : <Plus className="w-3.5 h-3.5 text-emerald-600" />}
                {editingNewsId ? "✍️ 編輯公告消息" : "🆕 上架新公告消息"}
              </button>
            </div>

            {newsActiveTab === "list" ? (
              /* News List */
              <div className="bg-white rounded-[2rem] border-3 border-[#1e293b] overflow-hidden bubbly-shadow-md text-left">
                {newsLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">正在加載最新公告列表捏...</p>
                  </div>
                ) : newsList.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">目前沒有公告消息，點擊上方上架新公告！</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#1e293b] text-white text-xs">
                          <th className="p-4 font-black text-center w-16">置頂</th>
                          <th className="p-4 font-black text-left w-32">分類</th>
                          <th className="p-4 font-black text-left">標題與摘要</th>
                          <th className="p-4 font-black text-left w-32">發布日期</th>
                          <th className="p-4 font-black text-center w-32">管理操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-[#1e293b]/10 text-xs sm:text-sm">
                        {newsList.map((item) => (
                          <tr key={item.id} className="hover:bg-amber-50/10 transition-colors">
                            <td className="p-4 text-center">
                              <button
                                onClick={() => toggleNewsPin(item)}
                                className="focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                              >
                                <Bookmark 
                                  className={`w-4 h-4 mx-auto ${
                                    item.isPinned ? "text-amber-500 fill-amber-400" : "text-slate-300 hover:text-amber-400"
                                  }`} 
                                />
                              </button>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                item.category === "教育訓練" ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
                                item.category === "工會動態" ? "bg-indigo-50 text-indigo-800 border-indigo-300" :
                                "bg-amber-50 text-amber-800 border-amber-300"
                              }`}>
                                {item.category}
                              </span>
                            </td>
                            <td className="p-4 text-left">
                              <h4 className="font-black text-sm text-[#1e293b] line-clamp-1 mb-0.5">{item.title}</h4>
                              <p className="text-[11px] font-medium text-slate-500 line-clamp-1">{item.summary}</p>
                            </td>
                            <td className="p-4 text-slate-500 font-bold whitespace-nowrap">{item.date}</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleNewsEditClick(item)}
                                  className="p-1.5 bg-slate-50 hover:bg-amber-50 text-[#1e293b] rounded-lg border border-[#1e293b]/20 hover:border-amber-500 transition-colors cursor-pointer"
                                  title="編輯"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                
                                {showNewsDeleteConfirm === item.id ? (
                                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 p-1 rounded-lg shrink-0">
                                    <button
                                      onClick={() => handleNewsDelete(item.id)}
                                      className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded cursor-pointer"
                                    >
                                      確定
                                    </button>
                                    <button
                                      onClick={() => setShowNewsDeleteConfirm(null)}
                                      className="px-1.5 py-0.5 bg-slate-200 text-[#1e293b] text-[9px] font-black rounded cursor-pointer"
                                    >
                                      取消
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowNewsDeleteConfirm(item.id)}
                                    className="p-1.5 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-lg border border-[#1e293b]/20 hover:border-rose-400 transition-colors cursor-pointer"
                                    title="刪除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
              /* News Form */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                <form onSubmit={handleNewsSubmit} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[2rem] border-3 border-[#1e293b] bubbly-shadow-md space-y-5">
                  <div className="flex items-center justify-between border-b pb-3 border-[#1e293b]/10">
                    <h3 className="font-black text-base sm:text-lg text-[#1e293b]">
                      {editingNewsId ? "✍️ 正在編輯公告消息" : "🆕 上架新公告消息"}
                    </h3>
                    {editingNewsId && (
                      <button
                        type="button"
                        onClick={resetNewsForm}
                        className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" /> 放棄修改
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                      <span>公告標題</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="請輸入消息標題捏..."
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-bold bg-[#fffdfa]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#1e293b]">公告分類</label>
                      <select
                        value={newsCategory}
                        onChange={(e) => setNewsCategory(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-black bg-[#fffdfa]"
                      >
                        <option value="工會公告">工會公告 📣</option>
                        <option value="活動紀錄">活動紀錄 🌲</option>
                        <option value="知識分享">知識分享 📖</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#1e293b]">發布日期</label>
                      <input
                        type="date"
                        required
                        value={newsDate}
                        onChange={(e) => setNewsDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-bold bg-[#fffdfa]"
                      />
                    </div>

                    <div className="space-y-1 flex flex-col justify-end pb-1">
                      <label className="flex items-center gap-1.5 cursor-pointer bg-amber-50 border-2 border-dashed border-[#1e293b]/20 p-2 rounded-xl">
                        <input
                          type="checkbox"
                          checked={newsIsPinned}
                          onChange={(e) => setNewsIsPinned(e.target.checked)}
                          className="w-3.5 h-3.5 text-emerald-600 border-2 border-[#1e293b] rounded cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-[#1e293b] flex items-center gap-0.5">
                          <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />
                          置頂此公告
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b]">橫幅封面圖片網址 (可選)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newsImageUrl}
                      onChange={(e) => setNewsImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-semibold bg-[#fffdfa]"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {imagePresets.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setNewsImageUrl(preset.url)}
                          className="px-2 py-0.5 text-[9px] font-black bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                      <span>消息簡介/摘要</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      maxLength={180}
                      placeholder="約 80 ~ 120 字的消息簡介捏..."
                      value={newsSummary}
                      onChange={(e) => setNewsSummary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-semibold bg-[#fffdfa] resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                        <span>公告全文內容</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewsPreviewMode(!newsPreviewMode)}
                        className="text-[10px] font-black text-emerald-700 hover:underline flex items-center gap-0.5"
                      >
                        <Eye className="w-3 h-3" /> {newsPreviewMode ? "編輯全文" : "全文預覽"}
                      </button>
                    </div>

                    {newsPreviewMode ? (
                      <div className="w-full h-48 overflow-y-auto px-3 py-2 rounded-xl border-2 border-emerald-500 bg-emerald-50/20 text-xs font-medium whitespace-pre-wrap leading-relaxed text-left">
                        {newsContent || "尚未輸入全文捏。"}
                      </div>
                    ) : (
                      <textarea
                        rows={6}
                        required
                        placeholder="請填寫詳細公告內容捏..."
                        value={newsContent}
                        onChange={(e) => setNewsContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-semibold bg-[#fffdfa]"
                      />
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#1e293b]/10 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => { resetNewsForm(); setNewsActiveTab("list"); }}
                      className="px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-500 text-xs font-black hover:bg-slate-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl border-2 border-[#1e293b] bubbly-shadow-xs"
                    >
                      {editingNewsId ? "儲存修改" : "上架公告 🚀"}
                    </button>
                  </div>
                </form>

                {/* Sidebar Card Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest">卡片排版預覽</h4>
                  <div className="bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden bubbly-shadow-sm p-4 text-left">
                    {newsImageUrl && (
                      <div className="h-32 rounded-xl overflow-hidden mb-3 border-2 border-[#1e293b]">
                        <img src={newsImageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded border border-amber-300">
                        {newsCategory}
                      </span>
                      <h4 className="font-black text-sm text-[#1e293b] leading-snug truncate">
                        {newsTitle || "請於左側填寫公告標題..."}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-500 line-clamp-3 leading-relaxed">
                        {newsSummary || "請輸入簡介摘要。這將在首頁卡片快速顯示捏..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCOPE 2: EVENTS CALENDAR MANAGEMENT */}
        {adminScope === "events" && (
          <div>
            {/* Events sub-tabs */}
            <div className="flex border-b-2 border-[#1e293b]/10 mb-6 gap-2">
              <button
                onClick={() => { setEventActiveTab("list"); resetEventForm(); }}
                className={`px-4 py-2 text-xs font-black rounded-t-xl -mb-px border-t border-x ${
                  eventActiveTab === "list"
                    ? "bg-white border-[#1e293b]/20 border-b-2 border-b-white text-[#1e293b]"
                    : "text-slate-400 border-transparent hover:text-[#1e293b]"
                }`}
              >
                📋 現有活動列表 ({eventsList.length})
              </button>
              <button
                onClick={() => { resetEventForm(); setEventActiveTab("form"); }}
                className={`px-4 py-2 text-xs font-black rounded-t-xl -mb-px border-t border-x flex items-center gap-1 ${
                  eventActiveTab === "form"
                    ? "bg-white border-[#1e293b]/20 border-b-2 border-b-white text-[#1e293b]"
                    : "text-slate-400 border-transparent hover:text-[#1e293b]"
                }`}
              >
                {editingEventId ? <Edit3 className="w-3.5 h-3.5 text-amber-500" /> : <Plus className="w-3.5 h-3.5 text-emerald-600" />}
                {editingEventId ? "✍️ 編輯活動內容" : "🆕 上架全新守護活動"}
              </button>
            </div>

            {eventActiveTab === "list" ? (
              /* Events List Table */
              <div className="bg-white rounded-[2rem] border-3 border-[#1e293b] overflow-hidden bubbly-shadow-md text-left">
                {eventsLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">正在加載活動列表...</p>
                  </div>
                ) : eventsList.length === 0 ? (
                  <div className="p-12 text-center">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">目前暫無活動，點擊上方上架新活動！</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#1e293b] text-white text-xs">
                          <th className="p-4 font-black text-left w-48">活動時間 / 日期</th>
                          <th className="p-4 font-black text-left">活動名稱與介紹</th>
                          <th className="p-4 font-black text-left w-44">引導講師 / 地點</th>
                          <th className="p-4 font-black text-center w-36">報名狀況 (已報/上限)</th>
                          <th className="p-4 font-black text-center w-32">管理操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-[#1e293b]/10 text-xs sm:text-sm">
                        {eventsList.map((ev) => {
                          const percent = Math.min(100, Math.round((ev.registeredCount / ev.maxSeats) * 100));
                          return (
                            <tr key={ev.id} className="hover:bg-amber-50/10 transition-colors">
                              <td className="p-4 text-left whitespace-nowrap">
                                <div className="font-black text-emerald-800 flex items-center gap-1 mb-0.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{ev.date}</span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{ev.time}</span>
                                </div>
                              </td>
                              <td className="p-4 text-left">
                                <h4 className="font-black text-sm text-[#1e293b] mb-1">{ev.title}</h4>
                                <p className="text-[11px] font-semibold text-slate-500 line-clamp-1 leading-relaxed">
                                  {ev.description}
                                </p>
                              </td>
                              <td className="p-4 text-left">
                                <div className="font-bold text-[#1e293b] truncate max-w-[150px] flex items-center gap-0.5" title={ev.lecturer}>
                                  <User className="w-3 h-3 text-amber-600" />
                                  <span>{ev.lecturer || "無講師"}</span>
                                </div>
                                <div className="text-[11px] font-medium text-slate-500 truncate max-w-[150px] flex items-center gap-0.5" title={ev.location}>
                                  <MapPin className="w-3 h-3 text-indigo-600" />
                                  <span>{ev.location}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="space-y-1 max-w-[120px] mx-auto">
                                  <div className="flex justify-between text-[10px] font-black text-slate-600">
                                    <span>{ev.registeredCount} / {ev.maxSeats} 人</span>
                                    <span>{percent}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2 border border-slate-300 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        percent >= 100 ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEventEditClick(ev)}
                                    className="p-1.5 bg-slate-50 hover:bg-amber-50 text-[#1e293b] rounded-lg border border-[#1e293b]/20 hover:border-amber-500 transition-colors cursor-pointer"
                                    title="編輯"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  {showEventDeleteConfirm === ev.id ? (
                                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 p-1 rounded-lg shrink-0">
                                      <button
                                        onClick={() => handleEventDelete(ev.id)}
                                        className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded cursor-pointer"
                                      >
                                        確定
                                      </button>
                                      <button
                                        onClick={() => setShowEventDeleteConfirm(null)}
                                        className="px-1.5 py-0.5 bg-slate-200 text-[#1e293b] text-[9px] font-black rounded cursor-pointer"
                                      >
                                        取消
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setShowEventDeleteConfirm(ev.id)}
                                      className="p-1.5 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-lg border border-[#1e293b]/20 hover:border-rose-400 transition-colors cursor-pointer"
                                      title="下架活動"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Event Edit/Create Form */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                <form onSubmit={handleEventSubmit} className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-[2rem] border-3 border-[#1e293b] bubbly-shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-[#1e293b]/10">
                    <h3 className="font-black text-base sm:text-lg text-[#1e293b]">
                      {editingEventId ? "✍️ 正在編輯活動資訊" : "🆕 上架全新守護活動"}
                    </h3>
                    {editingEventId && (
                      <button
                        type="button"
                        onClick={resetEventForm}
                        className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" /> 放棄編輯、建立新活動
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                      <span>1. 活動名稱 / 講堂主題</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="例如：志工勞服組 | 特殊訓練"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-bold bg-[#fffdfa]"
                    />
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                        <span>2. 活動日期</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-bold bg-[#fffdfa]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                        <span>3. 活動時間說明</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="例如：10:00 - 17:00"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-bold bg-[#fffdfa]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                        <span>4. 活動地點 / 教室</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="例如：松菸食農教育園區"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-bold bg-[#fffdfa]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#1e293b]">5. 主講人 / 現場引導師 (可選)</label>
                      <input
                        type="text"
                        placeholder="例如：陳彥霖 (勞動基準科股長)"
                        value={eventLecturer}
                        onChange={(e) => setEventLecturer(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-bold bg-[#fffdfa]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                        <span>6. 活動名額上限 (人)</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={500}
                        value={eventMaxSeats}
                        onChange={(e) => setEventMaxSeats(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-bold bg-[#fffdfa]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#1e293b]">7. 已報名志工人數 (通常由報名系統累加)</label>
                      <input
                        type="number"
                        min={0}
                        value={eventRegisteredCount}
                        onChange={(e) => setEventRegisteredCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-bold bg-[#fffdfa] text-slate-500"
                        title="這通常會在志工報名時由系統自動加 1 捏"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b]">8. 活動宣傳海報 / 封面網址 (可選)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={eventImageUrl}
                      onChange={(e) => setEventImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs font-semibold bg-[#fffdfa]"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {imagePresets.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setEventImageUrl(preset.url)}
                          className="px-2 py-0.5 text-[9px] font-black bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1e293b] flex items-center gap-0.5">
                      <span>9. 詳細活動說明與志願工作細節</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="請描述活動的核心訓練亮點、適合參與志工的對象、志工的任務及注意事項..."
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none text-xs sm:text-sm font-semibold bg-[#fffdfa]"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#1e293b]/10 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => { resetEventForm(); setEventActiveTab("list"); }}
                      className="px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-500 text-xs font-black hover:bg-slate-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl border-2 border-[#1e293b] bubbly-shadow-xs"
                    >
                      {editingEventId ? "儲存活動修改" : "上架活動 🚀"}
                    </button>
                  </div>
                </form>

                {/* Event live preview */}
                <div className="lg:col-span-4 space-y-4">
                  <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest">行事曆卡片預覽</h4>
                  <div className="bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden bubbly-shadow-sm text-left">
                    {eventImageUrl ? (
                      <div className="h-28 overflow-hidden border-b-2 border-[#1e293b]">
                        <img src={eventImageUrl} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-10 border-b-2 border-[#1e293b] bg-slate-50 flex items-center px-4">
                        <span className="text-[10px] font-bold text-slate-400 italic">海報未設定</span>
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-300">
                        📅 {eventDate}
                      </span>
                      <h4 className="font-black text-sm text-[#1e293b] line-clamp-1 leading-none">{eventTitle || "請輸入活動名稱"}</h4>
                      
                      <div className="text-[10px] space-y-1 text-slate-500 font-bold bg-amber-50/40 p-2 rounded-lg">
                        <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-600" /><span>{eventTime || "時間未定"}</span></div>
                        <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-600" /><span>{eventLocation || "地點未定"}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCOPE 3: VOLUNTEER REGISTRATIONS LIST */}
        {adminScope === "registrations" && (
          <div className="space-y-6">
            
            {/* Filter and Search Bar controls */}
            <div className="bg-white p-5 rounded-3xl border-3 border-[#1e293b] bubbly-shadow-sm text-left flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Left Search input */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜尋姓名、聯絡電話、活動..."
                  value={regSearchQuery}
                  onChange={(e) => setRegSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none bg-[#fffdfa]"
                />
              </div>

              {/* Right Filter Dropdown */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-black text-slate-600 whitespace-nowrap">篩選活動：</span>
                <select
                  value={regEventFilter}
                  onChange={(e) => setRegEventFilter(e.target.value)}
                  className="w-full md:w-64 px-2 py-1.5 text-xs font-black rounded-xl border-2 border-[#1e293b]/20 focus:border-[#1e293b] focus:outline-none bg-[#fffdfa]"
                >
                  <option value="all">顯示全部報名 🎯 ({registrationsList.length})</option>
                  {eventsList.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.registeredCount}人)
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Registrations List Table */}
            <div className="bg-white rounded-[2.5rem] border-3 border-[#1e293b] overflow-hidden bubbly-shadow-md text-left">
              {regsLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">正在讀取志工報名名單...</p>
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="p-16 text-center">
                  <AlertCircle className="w-12 h-12 text-[#1e293b]/20 mx-auto mb-4" />
                  <h3 className="text-lg font-black text-[#1e293b]">沒有找到任何符合的報名紀錄</h3>
                  <p className="text-sm font-semibold text-slate-400 mt-1">
                    目前尚未有志工登記此活動，或請更換搜尋關鍵字喔捏。
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#1e293b] text-white text-xs">
                        <th className="p-4 font-black text-left w-24">志工姓名</th>
                        <th className="p-4 font-black text-left w-36">關注志工組別</th>
                        <th className="p-4 font-black text-left">報名活動</th>
                        <th className="p-4 font-black text-left w-44">聯絡資訊</th>
                        <th className="p-4 font-black text-left">備註欄位</th>
                        <th className="p-4 font-black text-left w-32">報名時間</th>
                        <th className="p-4 font-black text-center w-20">刪除</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-[#1e293b]/10 text-xs sm:text-sm font-medium text-slate-700">
                      {filteredRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-amber-50/10 transition-colors">
                          <td className="p-4 font-black text-[#1e293b] whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4 text-emerald-600" />
                              {reg.name}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              reg.volunteerType === "animal" ? "bg-rose-50 text-rose-800 border-rose-300" :
                              reg.volunteerType === "plant" ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
                              reg.volunteerType === "eco" ? "bg-indigo-50 text-indigo-800 border-indigo-300" :
                              "bg-slate-50 text-slate-800 border-slate-300"
                            }`}>
                              {reg.volunteerType === "animal" ? "🐾 動物保護" :
                               reg.volunteerType === "plant" ? "🌱 植物綠化" :
                               reg.volunteerType === "eco" ? "💧 環境與淨灘" : "💼 其他支援"}
                            </span>
                          </td>
                          <td className="p-4 text-left">
                            <h5 className="font-black text-[#1e293b] text-xs leading-tight mb-0.5">{reg.eventTitle}</h5>
                            <span className="text-[10px] text-slate-400 font-bold">活動日期：{reg.eventDate}</span>
                          </td>
                          <td className="p-4 text-left space-y-1">
                            <div className="flex items-center gap-1 font-bold">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{reg.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 truncate max-w-[150px]" title={reg.email}>
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{reg.email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-left max-w-[150px] truncate" title={reg.notes || "無"}>
                            <p className="text-[11px] font-medium text-slate-500 italic">
                              {reg.notes || "—"}
                            </p>
                          </td>
                          <td className="p-4 text-slate-400 font-bold text-[10px] whitespace-nowrap">
                            {new Date(reg.registeredAt).toLocaleString("zh-TW", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="p-4 text-center">
                            {showRegDeleteConfirm === reg.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 p-1 rounded-lg shrink-0 justify-center">
                                <button
                                  onClick={() => handleRegDelete(reg.id)}
                                  className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded cursor-pointer"
                                >
                                  確定
                                </button>
                                <button
                                  onClick={() => setShowRegDeleteConfirm(null)}
                                  className="px-1.5 py-0.5 bg-slate-200 text-[#1e293b] text-[9px] font-black rounded cursor-pointer"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowRegDeleteConfirm(reg.id)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer border border-[#1e293b]/5 hover:border-rose-400"
                                title="刪除此登記名單"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick action: export hint or copy names */}
            <div className="bg-amber-50/40 p-5 rounded-2xl border-2 border-dashed border-amber-300 text-xs font-semibold text-amber-900 text-left leading-relaxed">
              💡 <span className="font-black text-amber-950">志工保險與名單匯出指引：</span>
              根據《志願服務法》，工會出勤前一週需將志工名冊送交保險公司完成意外險加保。請在此對照名單姓名、電話與組別，複製或轉錄至工會團險保單中。取消或刪除某位志工的報名，系統將會【自動釋出】名額給其他備取夥伴喔。
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
