import React, { useEffect, useState } from "react";
import { Calendar, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

interface MemberRegistration {
  id: string;
  event_id: string;
  registered_at: string;
  events: { title: string; event_date: string } | null;
}
export default function MemberCenter({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [registrations, setRegistrations] = useState<MemberRegistration[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("event_registrations")
      .select("id,event_id,registered_at,events(title,event_date)")
      .order("registered_at", { ascending: false })
      .then(({ data }) => setRegistrations((data as unknown as MemberRegistration[]) ?? []));
  }, [user]);

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (!user) {
    return (
      <section className="py-20 px-4 text-center">
        <UserRound className="w-14 h-14 mx-auto text-emerald-600 mb-3" />
        <h2 className="text-2xl font-black">請先登入會員</h2>
        <button onClick={() => onNavigate("auth")} className="mt-5 px-6 py-3 bg-emerald-600 text-white border-2 border-[#1e293b] rounded-xl font-black">登入／註冊</button>
      </section>
    );
  }

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    setMessage(error ? "資料更新失敗，請確認電話格式。" : "會員資料已更新。");
    if (!error) await refreshProfile();
  };

  return (
    <section className="px-4 py-14 bg-amber-50/40 min-h-[65vh]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="w-12 h-12 text-emerald-600" />
          <div><h2 className="text-3xl font-black">會員中心</h2><p className="text-sm font-bold text-slate-500">{user.email}</p></div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={saveProfile} className="bg-white p-6 rounded-3xl border-3 border-[#1e293b] bubbly-shadow-md space-y-4">
            <h3 className="text-xl font-black">基本資料</h3>
            <label className="block text-xs font-black">姓名<input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full px-4 py-3 border-2 rounded-xl" /></label>
            <label className="block text-xs font-black">聯絡電話<input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full px-4 py-3 border-2 rounded-xl" /></label>
            {message && <p className="text-xs font-bold text-emerald-700">{message}</p>}
            <button disabled={saving} className="w-full py-3 bg-emerald-600 text-white rounded-xl border-2 border-[#1e293b] font-black">儲存資料</button>
          </form>
          <div className="bg-white p-6 rounded-3xl border-3 border-[#1e293b] bubbly-shadow-md">
            <h3 className="text-xl font-black flex items-center gap-2"><Calendar className="w-5 h-5" />我的活動報名</h3>
            {registrations.length === 0 ? <p className="mt-6 text-sm font-bold text-slate-500">目前尚無報名紀錄。</p> : (
              <ul className="mt-4 space-y-3">
                {registrations.map((registration) => (
                  <li key={registration.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="font-black text-sm">{registration.events?.title ?? registration.event_id}</p>
                    <p className="text-xs font-bold text-slate-500">{registration.events?.event_date}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
