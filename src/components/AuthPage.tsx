import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

type AuthMode = "login" | "register" | "forgot";

export default function AuthPage({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage("重設密碼信已寄出，請前往信箱開啟連結。");
        return;
      }

      if (mode === "register") {
        if (!fullName.trim() || !phone.trim()) {
          throw new Error("請填寫姓名與聯絡電話。");
        }
        if (password.length < 8) {
          throw new Error("密碼至少需要 8 個字元。");
        }
        if (password !== confirmPassword) {
          throw new Error("兩次輸入的密碼不一致。");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/member`,
            data: { full_name: fullName.trim(), phone: phone.trim() },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          onNavigate("member");
        } else {
          setMessage("註冊完成！請先到信箱點擊驗證連結，驗證後即成為正式會員。");
        }
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      onNavigate("member");
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : "";
      const friendly =
        raw.includes("Invalid login credentials")
          ? "Email 或密碼不正確。"
          : raw.includes("Email not confirmed")
            ? "請先到信箱完成 Email 驗證。"
            : raw || "目前無法完成，請稍候再試。";
      setError(friendly);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="px-4 py-16 bg-amber-50/50 min-h-[65vh]">
      <div className="max-w-md mx-auto bg-white border-4 border-[#1e293b] rounded-[2rem] p-6 sm:p-8 bubbly-shadow-xl">
        <div className="text-center mb-6">
          <UserRound className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
          <h2 className="text-2xl font-black text-[#1e293b]">
            {mode === "login" ? "會員登入" : mode === "register" ? "立即成為正式會員" : "忘記密碼"}
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-2">
            {mode === "register"
              ? "完成 Email 驗證後，會員資格立即生效。"
              : "安全管理個人資料與活動報名紀錄。"}
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold flex gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-sm font-bold flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <label className="block text-xs font-black">
                姓名
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full px-4 py-3 border-2 rounded-xl font-bold" />
              </label>
              <label className="block text-xs font-black">
                聯絡電話
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full px-4 py-3 border-2 rounded-xl font-bold" />
              </label>
            </>
          )}
          <label className="block text-xs font-black">
            Email
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 rounded-xl font-bold" />
            </div>
          </label>
          {mode !== "forgot" && (
            <label className="block text-xs font-black">
              密碼
              <div className="relative mt-1">
                <LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 rounded-xl font-bold" />
              </div>
            </label>
          )}
          {mode === "register" && (
            <label className="block text-xs font-black">
              再次輸入密碼
              <input required minLength={8} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full px-4 py-3 border-2 rounded-xl font-bold" />
            </label>
          )}
          <button disabled={busy} className="w-full py-3 bg-emerald-600 text-white border-2 border-[#1e293b] rounded-xl font-black disabled:opacity-60 flex justify-center gap-2">
            {busy && <Loader2 className="w-5 h-5 animate-spin" />}
            {mode === "login" ? "登入" : mode === "register" ? "註冊會員" : "寄送重設密碼信"}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs font-black">
          {mode !== "login" && <button onClick={() => switchMode("login")} className="text-emerald-700">已有帳號，登入</button>}
          {mode !== "register" && <button onClick={() => switchMode("register")} className="text-emerald-700">立即註冊</button>}
          {mode !== "forgot" && <button onClick={() => switchMode("forgot")} className="text-slate-500">忘記密碼？</button>}
        </div>
      </div>
    </section>
  );
}
