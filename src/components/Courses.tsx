import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  LogIn,
  PlayCircle,
  Unlock,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { CARD_MEDIA } from "../lib/cardLayout";

// 前台三頁：/courses 總覽、/courses/<id> 課程頁、/learn/<id> 教室。
//
// 影片 ID 只在教室裡、播放前一刻才向 /api/courses/lesson 要（POST，no-store）。
// 總覽與課程頁拿到的資料本來就不含 youtube_id，所以「鎖頭」只是體貼，
// 不是保護 —— 真正擋人的是伺服器那一支。

export interface LessonSummary {
  id: string;
  title: string;
  durationSec: number;
  sortOrder: number;
  isFreePreview: boolean;
  completed?: boolean;
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  lessonCount?: number;
  totalDurationSec?: number;
  expiresAt?: string | null;
  lessons: LessonSummary[];
}

const formatDuration = (sec: number) => {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m} 分${s ? ` ${s} 秒` : ""}` : `${s} 秒`;
};

function Spinner() {
  return (
    <div className="py-24 flex justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 總覽

export function CourseList({ onOpen }: { onOpen: (id: string) => void }) {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/courses/list")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setCourses(body);
      })
      .catch((c) => setError(c instanceof Error ? c.message : "課程載入失敗。"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <section className="py-12 px-4 bg-[#faf8f4] min-h-[70vh]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-2">線上課程</h1>
        <p className="font-bold text-slate-500 mb-8">
          動保、生態與勞動權益的培訓課程，報名後隨時上線學習。
        </p>

        {error && (
          <p className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl font-bold">{error}</p>
        )}

        {courses.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border-2 border-dashed text-center">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-500">目前還沒有開放的課程。</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => onOpen(course.id)}
                className="text-left bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden bubbly-shadow-md hover:-translate-y-1 transition-transform flex flex-col"
              >
                {course.coverImageUrl ? (
                  <div className={CARD_MEDIA}>
                    <img src={course.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`${CARD_MEDIA} flex items-center justify-center`}>
                    <BookOpen className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <h2 className="text-lg font-black leading-snug mb-2">{course.title}</h2>
                  <p className="text-sm font-bold text-slate-500 line-clamp-3 flex-1">{course.description}</p>
                  <p className="mt-3 text-xs font-bold text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <PlayCircle className="w-3.5 h-3.5" />
                      {course.lessonCount ?? course.lessons.length} 個單元
                    </span>
                    {!!course.totalDurationSec && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(course.totalDurationSec)}
                      </span>
                    )}
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

// ─────────────────────────────────────────────────────────────────────────
// 課程頁：介紹 + 課綱。有權限的人這裡直接進教室；沒有的看得到課綱但進不去。

export function CourseDetail({
  id,
  onBack,
  onLearn,
  onLogin,
}: {
  id: string;
  onBack: () => void;
  onLearn: (courseId: string, lessonId?: string) => void;
  onLogin: () => void;
}) {
  const { user, session } = useAuth();
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // 沒有單一課程的公開端點：從總覽裡挑（課程數是個位數、列表已有邊緣快取）。
    // 有登入的話再問一次「我的課程」，決定要不要顯示「進入教室」。
    Promise.all([
      fetch("/api/courses/list").then((r) => r.json()),
      session?.access_token
        ? fetch("/api/courses/mine", { headers: { Authorization: `Bearer ${session.access_token}` } })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        : Promise.resolve([]),
    ])
      .then(([all, mine]) => {
        if (cancelled) return;
        const found = (all as CourseSummary[]).find((c) => c.id === id) ?? null;
        setCourse(found);
        setEnrolled((mine as CourseSummary[]).some((c) => c.id === id));
        if (!found) setError("找不到這門課程，可能尚未開放。");
      })
      .catch(() => !cancelled && setError("課程載入失敗。"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, session?.access_token]);

  if (loading) return <Spinner />;

  if (error || !course) {
    return (
      <section className="py-24 px-4 text-center">
        <BookOpen className="w-14 h-14 mx-auto text-slate-300 mb-3" />
        <h1 className="text-2xl font-black">{error || "找不到這門課程。"}</h1>
        <button onClick={onBack} className="mt-5 px-5 py-2.5 border-2 font-black rounded-xl">
          回課程總覽
        </button>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-[#faf8f4]">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 mb-6 font-black text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          回課程總覽
        </button>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          <div className="bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden">
            {course.coverImageUrl && (
              <img src={course.coverImageUrl} alt="" className="w-full max-h-72 object-cover border-b-3 border-[#1e293b]" />
            )}
            <div className="p-6">
              <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-4">{course.title}</h1>
              <p className="text-sm font-semibold leading-relaxed text-slate-600 whitespace-pre-line">
                {course.description}
              </p>
              <p className="mt-4 text-xs font-bold text-slate-400 flex items-center gap-3">
                <span>{course.lessons.length} 個單元</span>
                {!!course.totalDurationSec && <span>總長 {formatDuration(course.totalDurationSec)}</span>}
              </p>
            </div>
          </div>

          <div className="bg-white border-3 border-[#1e293b] rounded-[2rem] overflow-hidden lg:sticky lg:top-24">
            <div className="p-5 bg-[#1e293b] text-white">
              <p className="text-xs text-amber-300 font-black">課程內容</p>
              <h2 className="font-black">共 {course.lessons.length} 個單元</h2>
            </div>

            <div className="p-4">
              {enrolled ? (
                <button
                  onClick={() => onLearn(course.id)}
                  className="w-full mb-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-2 border-[#1e293b] font-black flex justify-center items-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  進入教室
                </button>
              ) : user ? (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900">
                  此課程限已報名的學員觀看。若你已報名但看不到，請用報名時的 Email 登入，或聯絡工會。
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="w-full mb-4 py-3 bg-[#1e293b] hover:bg-slate-700 text-white rounded-xl font-black flex justify-center items-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  登入後觀看
                </button>
              )}

              <ol className="space-y-1.5">
                {course.lessons.map((lesson, index) => {
                  const canOpen = enrolled || lesson.isFreePreview;
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => canOpen && onLearn(course.id, lesson.id)}
                        disabled={!canOpen}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${
                          canOpen
                            ? "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50"
                            : "border-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <span className="w-6 text-xs font-black text-slate-400">{index + 1}</span>
                        <span className="flex-1">{lesson.title}</span>
                        {lesson.isFreePreview && !enrolled && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">試看</span>
                        )}
                        {!!lesson.durationSec && (
                          <span className="text-xs text-slate-400">{formatDuration(lesson.durationSec)}</span>
                        )}
                        {canOpen ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 教室：左播放器、右單元列表。

interface LessonPayload {
  courseId: string;
  courseTitle: string;
  title: string;
  youtubeId: string | null;
  body: string;
  isFreePreview: boolean;
}

export function Classroom({
  courseId,
  initialLessonId,
  onBack,
  onLogin,
}: {
  courseId: string;
  initialLessonId?: string | null;
  onBack: () => void;
  onLogin: () => void;
}) {
  const { session, user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [current, setCurrent] = useState<string | null>(initialLessonId ?? null);
  const [payload, setPayload] = useState<LessonPayload | null>(null);
  const [lessonError, setLessonError] = useState<{ status: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  const token = session?.access_token;

  // 課綱：有登入用「我的課程」（帶完成狀態），否則退回公開總覽（試看用）。
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    const source = token
      ? fetch("/api/courses/mine", { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : []))
      : Promise.resolve([]);
    source
      .then(async (mine: CourseSummary[]) => {
        let found = mine.find((c) => c.id === courseId) ?? null;
        if (!found) {
          const all: CourseSummary[] = await fetch("/api/courses/list").then((r) => r.json());
          found = all.find((c) => c.id === courseId) ?? null;
        }
        if (cancelled) return;
        setCourse(found);
        if (found && !current) setCurrent(found.lessons[0]?.id ?? null);
      })
      .catch(() => !cancelled && setCourse(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, token, authLoading]);

  // 播放：換單元時才向伺服器要 ID。這是唯一拿得到 youtube_id 的地方。
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    setLessonLoading(true);
    setLessonError(null);
    setPayload(null);
    fetch("/api/courses/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ lessonId: current }),
    })
      .then(async (r) => {
        const body = await r.json();
        if (cancelled) return;
        if (!r.ok) setLessonError({ status: r.status, message: body.error ?? "無法載入單元。" });
        else setPayload(body);
      })
      .catch(() => !cancelled && setLessonError({ status: 0, message: "無法載入單元。" }))
      .finally(() => !cancelled && setLessonLoading(false));
    return () => {
      cancelled = true;
    };
  }, [current, token]);

  const currentLesson = useMemo(() => course?.lessons.find((l) => l.id === current) ?? null, [course, current]);

  const markComplete = async () => {
    if (!current || !token) return;
    setMarking(true);
    try {
      const r = await fetch("/api/courses/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lessonId: current }),
      });
      if (r.ok) {
        setCourse((c) =>
          c ? { ...c, lessons: c.lessons.map((l) => (l.id === current ? { ...l, completed: true } : l)) } : c,
        );
      }
    } finally {
      setMarking(false);
    }
  };

  if (loading || authLoading) return <Spinner />;

  if (!course) {
    return (
      <section className="py-24 px-4 text-center">
        <BookOpen className="w-14 h-14 mx-auto text-slate-300 mb-3" />
        <h1 className="text-2xl font-black">找不到這門課程。</h1>
        <button onClick={onBack} className="mt-5 px-5 py-2.5 border-2 font-black rounded-xl">
          回課程總覽
        </button>
      </section>
    );
  }

  const done = course.lessons.filter((l) => l.completed).length;

  return (
    <section className="py-8 px-4 bg-[#1e293b] min-h-[80vh]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 text-white">
          <button onClick={onBack} className="flex items-center gap-1.5 font-black text-sm text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            回課程頁
          </button>
          <div className="text-right">
            <p className="text-xs text-amber-300 font-black">線上教室</p>
            <h1 className="font-black">{course.title}</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
          {/* 播放器 */}
          <div className="bg-black rounded-2xl overflow-hidden border-3 border-white/10">
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {lessonLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-white/60" />
              ) : lessonError ? (
                <div className="text-center px-6 text-white">
                  <Lock className="w-12 h-12 mx-auto text-amber-300 mb-3" />
                  <p className="font-black">{lessonError.message}</p>
                  {lessonError.status === 401 && !user && (
                    <button onClick={onLogin} className="mt-4 px-5 py-2.5 bg-amber-400 text-[#1e293b] font-black rounded-xl">
                      登入
                    </button>
                  )}
                </div>
              ) : payload?.youtubeId ? (
                // youtube-nocookie：不寫追蹤 cookie。影片必須在 YouTube 設「不公開」。
                <iframe
                  key={payload.youtubeId}
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${payload.youtubeId}?rel=0&modestbranding=1`}
                  title={payload.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center px-6 text-white/70">
                  <BookOpen className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-black">這個單元是文字內容，請看下方說明。</p>
                </div>
              )}
            </div>

            {payload && (
              <div className="p-5 bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-xl font-black">{payload.title}</h2>
                  {user && !payload.isFreePreview && (
                    <button
                      onClick={markComplete}
                      disabled={marking || currentLesson?.completed}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm border-2 transition-colors ${
                        currentLesson?.completed
                          ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                          : "border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {currentLesson?.completed ? "已完成" : marking ? "儲存中…" : "標記完成"}
                    </button>
                  )}
                </div>
                {payload.body && (
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600 whitespace-pre-line">
                    {payload.body}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 單元列表 */}
          <div className="bg-white rounded-2xl overflow-hidden border-3 border-white/10">
            <div className="p-4 border-b-2 border-slate-100">
              <p className="text-xs font-black text-slate-500">
                課程單元 · 已完成 {done} / {course.lessons.length}
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${course.lessons.length ? (done / course.lessons.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <ol className="p-2 max-h-[70vh] overflow-y-auto">
              {course.lessons.map((lesson, index) => (
                <li key={lesson.id}>
                  <button
                    onClick={() => setCurrent(lesson.id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      lesson.id === current ? "bg-[#1e293b] text-white" : "hover:bg-slate-50"
                    }`}
                  >
                    {lesson.completed ? (
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${lesson.id === current ? "text-emerald-300" : "text-emerald-600"}`} />
                    ) : (
                      <span className={`w-5 text-center text-xs font-black shrink-0 ${lesson.id === current ? "text-white/60" : "text-slate-400"}`}>
                        {index + 1}
                      </span>
                    )}
                    <span className="flex-1">{lesson.title}</span>
                    {!!lesson.durationSec && (
                      <span className={`text-xs ${lesson.id === current ? "text-white/60" : "text-slate-400"}`}>
                        {formatDuration(lesson.durationSec)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
