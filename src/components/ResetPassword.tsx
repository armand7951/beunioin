import React, { useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8 || password !== confirmPassword) {
      setError(password.length < 8 ? "密碼至少需要 8 個字元。" : "兩次輸入的密碼不一致。");
      return;
    }
    setBusy(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError("重設連結已失效或無法更新，請重新申請忘記密碼信。");
    } else {
      setDone(true);
    }
  };

  return (
    <section className="px-4 py-16 min-h-[65vh] bg-amber-50/50">
      <div className="max-w-md mx-auto bg-white border-4 border-[#1e293b] rounded-[2rem] p-8 bubbly-shadow-xl text-center">
        {done ? (
          <>
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-2xl font-black">密碼已更新</h2>
            <button onClick={() => onNavigate("member")} className="mt-6 px-6 py-3 bg-emerald-600 text-white border-2 border-[#1e293b] rounded-xl font-black">前往會員中心</button>
          </>
        ) : (
          <>
            <LockKeyhole className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-2xl font-black mb-5">設定新密碼</h2>
            {error && <p className="mb-4 text-sm font-bold text-red-700">{error}</p>}
            <form onSubmit={updatePassword} className="space-y-4 text-left">
              <label className="block text-xs font-black">新密碼<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-4 py-3 border-2 rounded-xl" /></label>
              <label className="block text-xs font-black">再次輸入新密碼<input required minLength={8} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full px-4 py-3 border-2 rounded-xl" /></label>
              <button disabled={busy} className="w-full py-3 bg-emerald-600 text-white border-2 border-[#1e293b] rounded-xl font-black flex justify-center gap-2">{busy && <Loader2 className="w-5 h-5 animate-spin" />}更新密碼</button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
