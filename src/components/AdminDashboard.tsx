import React, { useEffect, useMemo, useState } from "react";
import { Loader2, LockKeyhole, Search, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface AdminRegistration {
  id: string;
  eventTitle: string;
  eventDate: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  volunteerType: string;
  notes: string;
  registeredAt: string;
}

export default function AdminDashboard() {
  const { session, user, loading, isAdmin } = useAuth();
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isAdmin || !session?.access_token) return;
    setListLoading(true);
    fetch("/api/admin/registrations", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setRegistrations(body);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "名單載入失敗。"))
      .finally(() => setListLoading(false));
  }, [isAdmin, session?.access_token]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return registrations;
    return registrations.filter((item) =>
      [item.name, item.email, item.phone, item.eventTitle]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, registrations]);

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) {
    return (
      <section className="py-24 text-center px-4">
        <LockKeyhole className="w-14 h-14 mx-auto text-amber-500 mb-3" />
        <h2 className="text-2xl font-black">管理後台需要先登入</h2>
        <p className="mt-2 text-sm font-bold text-slate-500">請使用已授權的管理員帳號登入。</p>
      </section>
    );
  }
  if (!isAdmin) {
    return (
      <section className="py-24 text-center px-4">
        <LockKeyhole className="w-14 h-14 mx-auto text-red-500 mb-3" />
        <h2 className="text-2xl font-black">沒有管理員權限</h2>
        <p className="mt-2 text-sm font-bold text-slate-500">為保護報名者個資，此頁只開放管理員使用。</p>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-slate-50 min-h-[70vh]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-black text-emerald-700 flex gap-2"><ShieldCheck className="w-4 h-4" />安全管理後台</p>
            <h2 className="text-3xl font-black">活動報名名單</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋姓名、Email、電話、活動" className="w-full sm:w-80 pl-10 pr-4 py-2.5 border-2 rounded-xl font-bold text-sm" />
          </div>
        </div>

        {error && <p className="mb-5 p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl font-bold">{error}</p>}
        {listLoading ? (
          <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 bg-white rounded-3xl border-2 border-dashed text-center">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-500">目前沒有符合的報名資料。</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border-3 border-[#1e293b] rounded-2xl">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-[#1e293b] text-white text-left">
                <tr><th className="p-3">活動</th><th className="p-3">姓名</th><th className="p-3">Email</th><th className="p-3">電話</th><th className="p-3">身分</th><th className="p-3">領域／備註</th><th className="p-3">報名時間</th></tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b align-top">
                    <td className="p-3 font-black">{item.eventTitle}<div className="text-xs text-slate-500">{item.eventDate}</div></td>
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3">{item.email}</td>
                    <td className="p-3">{item.phone}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-black ${item.userId ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{item.userId ? "會員" : "訪客"}</span></td>
                    <td className="p-3">{item.volunteerType}<div className="text-xs text-slate-500 max-w-52">{item.notes || "—"}</div></td>
                    <td className="p-3 text-xs">{new Date(item.registeredAt).toLocaleString("zh-TW")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
