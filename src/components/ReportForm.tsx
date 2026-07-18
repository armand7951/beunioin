import React, { useState, useEffect } from "react";
import { INITIAL_CASES } from "../data";
import { CaseReport } from "../types";
import { Shield, Send, AlertTriangle, CheckCircle, Search, HelpCircle, FileText } from "lucide-react";

export default function ReportForm() {
  const [cases, setCases] = useState<CaseReport[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    volunteerType: "animal",
    organization: "",
    issueType: "未投保意外傷害保險",
    description: "",
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load cases from localStorage or fallback to INITIAL_CASES
  useEffect(() => {
    const saved = localStorage.getItem("beunion_cases");
    if (saved) {
      try {
        setCases(JSON.parse(saved));
      } catch (e) {
        setCases(INITIAL_CASES);
      }
    } else {
      setCases(INITIAL_CASES);
      localStorage.setItem("beunion_cases", JSON.stringify(INITIAL_CASES));
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim() || !formData.description.trim()) {
      alert("請填寫所有必要欄位喔！🌱");
      return;
    }

    const newCase: CaseReport = {
      id: `case-${Date.now()}`,
      name: formData.name,
      contact: formData.contact,
      volunteerType: formData.volunteerType,
      organization: formData.organization || "未註明主辦方",
      issueType: formData.issueType,
      description: formData.description,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      statusMessage: "🔍 工會申訴處理小組已受理！已安排工會專員聯繫您，一週內將向該單位展開調查！"
    };

    const updatedCases = [newCase, ...cases];
    setCases(updatedCases);
    localStorage.setItem("beunion_cases", JSON.stringify(updatedCases));

    // Reset form & show success
    setFormData({
      name: "",
      contact: "",
      volunteerType: "animal",
      organization: "",
      issueType: "未投保意外傷害保險",
      description: "",
    });
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  const getMascotBadge = (type: string) => {
    if (type === "animal") return "🐶 動物志工";
    if (type === "plant") return "🌱 植物志工";
    return "💧 環境志工";
  };

  return (
    <section className="py-16 px-4 bg-[#fbf9f4]" id="report-section">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 border-2 border-red-500 text-red-800 rounded-full text-xs font-black mb-3 shadow-[1px_1px_0px_0px_#1e293b]">
            <AlertTriangle className="w-4 h-4" />
            <span>維護權益，絕不隱忍</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-[#1e293b]">不當對待申訴與權益諮詢單 ✍️</h3>
          <p className="text-sm md:text-base font-bold text-[#1e293b]/70 mt-2 max-w-2xl mx-auto">
            在服務過程中，遇到漏保險、危險超時、扣留時數、甚至職場騷擾？請放心地填寫此單。台灣環境生態護育產業工會會絕對保密您的個人資料，積極發函並代為協商，當你最強大的安全後盾！
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Input (Col: 5) */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-[2.5rem] border-4 border-[#1e293b] bubbly-shadow-xl text-left">
            <h4 className="text-xl font-black text-[#1e293b] mb-6 flex items-center gap-2 pb-3 border-b-2 border-gray-100">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>線上申訴填報欄位</span>
            </h4>

            {submitSuccess && (
              <div className="mb-6 p-4 bg-emerald-100 border-2 border-emerald-500 rounded-2xl text-emerald-800 text-xs font-black flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>
                  申訴提報成功！您的案子已登錄下方「申訴受理看板」，後盾人員會立刻開始處理！
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name & Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#1e293b] mb-1.5">
                    * 申訴人姓名
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="王大華"
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-[#1e293b] bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#1e293b] mb-1.5">
                    * 聯絡電話/Email
                  </label>
                  <input
                    type="text"
                    name="contact"
                    required
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="0912-345-678"
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-[#1e293b] bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>

              {/* Volunteer Type Selection */}
              <div>
                <label className="block text-xs font-black text-[#1e293b] mb-1.5">
                  * 志工種類
                </label>
                <select
                  name="volunteerType"
                  value={formData.volunteerType}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#1e293b] bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
                >
                  <option value="animal">🐶 動物保育與流浪動物救援</option>
                  <option value="plant">🌱 植物綠美化與山林復育</option>
                  <option value="eco">💧 環境保育、海洋淨灘或社區減塑</option>
                </select>
              </div>

              {/* Accused Organization */}
              <div>
                <label className="block text-xs font-black text-[#1e293b] mb-1.5">
                  * 服務的主辦單位名稱
                </label>
                <input
                  type="text"
                  name="organization"
                  required
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder="例如：健康綠森林協會"
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-[#1e293b] bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {/* Issue Type */}
              <div>
                <label className="block text-xs font-black text-[#1e293b] mb-1.5">
                  * 申訴遭遇問題類型
                </label>
                <select
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#1e293b] bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
                >
                  <option value="未投保意外傷害保險">未投保意外傷害保險（上工前未保險）</option>
                  <option value="指派超時、極危險或不安全任務">指派超時、極危險或不安全任務（缺防具）</option>
                  <option value="故意拖延或漏登錄服務時數">故意拖延或漏登錄服務時數、不發紀錄冊</option>
                  <option value="遭受騷擾、言語霸凌或職場不平等待遇">遭受騷擾、言語霸凌或職場不平等待遇</option>
                  <option value="其他違反《志願服務法》之情事">其他違反《志願服務法》之情事</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black text-[#1e293b] mb-1.5">
                  * 詳細不合理待遇描述
                </label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="請具體寫下時間、地點、發生的事情經過。例如：大太陽下除草5小時，單位不提供水也拒絕保險，還威脅不來就不登時數..."
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#1e293b] bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {/* Form submit */}
              <button
                type="submit"
                className="w-full py-3.5 bg-red-400 hover:bg-red-500 text-white font-black rounded-xl border-3 border-[#1e293b] bubbly-shadow text-base cursor-pointer flex items-center justify-center gap-2"
                id="submit-complaint-btn"
              >
                <span>送出申訴並啟動後盾 🛡️</span>
                <Send className="w-4 h-4 text-white fill-white" />
              </button>

              <p className="text-[10px] font-bold text-gray-400 text-center leading-normal">
                🔒 本站符合 GDPR 與個資法標準。您的聯絡資料僅供工會調查專員聯繫與協助，未取得您同意前絕不會向任何第三方公佈。
              </p>
            </form>
          </div>

          {/* Right Column: Case board (Col: 7) */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div className="p-6 bg-white rounded-[2.5rem] border-4 border-[#1e293b] bubbly-shadow-xl">
              <h4 className="text-xl font-black text-[#1e293b] mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-500" />
                <span>生態護育工會申訴受理進度看板</span>
              </h4>
              <p className="text-xs font-bold text-[#1e293b]/60 leading-relaxed mb-6">
                這裡是公開的匿名爭取看板（個資已遮蔽），展示生態護育工會後盾調查小組正在介入的案例與協商成果，透明化監督不法主辦方！
              </p>

              {/* Case board columns */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2" id="complaints-board-list">
                {cases.length === 0 ? (
                  <p className="text-sm font-bold text-gray-400 text-center py-10">目前尚無公開受理案件！🌱</p>
                ) : (
                  cases.map((cs) => (
                    <div
                      key={cs.id}
                      id={`complaint-case-${cs.id}`}
                      className="p-5 bg-slate-50 rounded-2xl border-2 border-[#1e293b] flex flex-col justify-between gap-4"
                    >
                      {/* Top title and status badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-[#1e293b]/10 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-gray-500">
                            案號：{cs.id.substring(0, 10)}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            cs.volunteerType === "animal"
                              ? "bg-amber-100 border-amber-300 text-amber-800"
                              : cs.volunteerType === "plant"
                              ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                              : "bg-sky-100 border-sky-300 text-sky-800"
                          }`}>
                            {getMascotBadge(cs.volunteerType)}
                          </span>
                        </div>
                        {/* Status Label */}
                        <div className="flex items-center gap-1">
                          {cs.status === "pending" && (
                            <span className="px-2.5 py-1 bg-amber-200 border-2 border-amber-500 rounded-lg text-[10px] font-black text-amber-800">
                              🔍 審核調查中
                            </span>
                          )}
                          {cs.status === "processing" && (
                            <span className="px-2.5 py-1 bg-rose-200 border-2 border-rose-500 rounded-lg text-[10px] font-black text-rose-800 animate-pulse">
                              🛡️ 後盾積極協調中
                            </span>
                          )}
                          {cs.status === "resolved" && (
                            <span className="px-2.5 py-1 bg-green-200 border-2 border-green-500 rounded-lg text-[10px] font-black text-green-800">
                              🎉 爭取成功，結案！
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="text-xs space-y-2">
                        <p className="font-extrabold text-[#1e293b]">
                          ⚠️ 遭遇單位：
                          <span className="font-bold text-[#1e293b]/80">{cs.organization}</span>
                        </p>
                        <p className="font-extrabold text-red-600">
                          🔥 申訴事項：
                          <span className="font-bold text-[#1e293b]/80">{cs.issueType}</span>
                        </p>
                        <p className="font-extrabold text-[#1e293b] leading-relaxed">
                          📝 事實經過：
                          <span className="font-bold text-[#1e293b]/70 block mt-1 bg-white p-2 rounded-lg border border-[#1e293b]/10 italic">
                            「{cs.description}」
                          </span>
                        </p>
                      </div>

                      {/* Status Message */}
                      <div className="p-3 bg-white border-2 border-[#1e293b] rounded-xl text-xs font-extrabold text-[#1e293b]">
                        <p className="text-[#1e293b]/60 text-[9px] mb-1 font-black uppercase tracking-wider">
                          📢 工會處理小組回覆：
                        </p>
                        <p>{cs.statusMessage}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Consultation Callout */}
            <div className="p-5 bg-sky-100 rounded-2xl border-2 border-[#1e293b] flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-sky-600 shrink-0" />
              <p className="text-xs font-bold text-sky-800 leading-normal">
                志工權益關懷專線：<strong className="text-sky-950 font-black">02-2345-6789</strong>（服務時間：週一至週五 09:00 - 18:00）。
                如有緊急志工意外受傷或安全爭議，歡迎直接撥打，由法規與意外险理賠專員即時為您守護！
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
