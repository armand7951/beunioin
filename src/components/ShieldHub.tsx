import React, { useState } from "react";
import { Shield, BookOpen, Heart, Activity, Scale, Users, Coins, Mail, MapPin, Check, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ShieldHub() {
  const [activeTab, setActiveTab] = useState<"purpose" | "tasks" | "team" | "membership" | "contact">("purpose");

  const tenTasks = [
    { num: "01", title: "團體協約之締結、修改或廢止", desc: "主動發起與各公私立動物收容所、環保機關或研究單位簽署團體協約，確保基本勞動條件與權益保障。" },
    { num: "02", title: "勞資爭議之處理", desc: "充當會員與聘僱單位、活動主辦方的橋樑，在發生超時不當對待、拒發時數、積欠薪資或意外推諉時提供法律諮詢與申訴協調。" },
    { num: "03", title: "勞動條件、會員安全衛生及福利事項之促進", desc: "推行「第一線安全工作環境檢核機制」，如：林野工作、高空割草、海浪預警，極力倡導完善的職業安全衛生措施。" },
    { num: "04", title: "工會政策與法令之制定及修改", desc: "針對野生動物保育、流浪動物管理及環境工程等新興勞動現場法規，積極向主管機關提出友善法規建言。" },
    { num: "05", title: "會員就業之協助", desc: "串聯全台生態調查、環境工程、動物救傷、野生復育等職缺，協助受訓合格的會員夥伴媒合就業。" },
    { num: "06", title: "會員康樂、教育、托兒及宣傳事項之舉辦", desc: "辦理會員專屬的聯誼年會、親屬活動、專業講座，凝聚全台動植物與環境愛好者的溫馨社群。" },
    { num: "07", title: "生態護育產業技術之研發、交流、認證與推廣", desc: "引進國際先進動植物救傷與棲地復育技術，辦理實務研習並發行專業工作安全手冊與技術認證。" },
    { num: "08", title: "協助政府推動生態保育、野生動植物護育及環境永續政策", desc: "結合工會專業能量，承接公部門保育專案，將第一線夥伴的實務經驗融入國土生態保育綠網政策。" },
    { num: "09", title: "會員勞工保險、全民健康保險之協助及合作社之組織", desc: "協助自由職業者、派遣保育員及長期志工等無固定雇主夥伴辦理勞健保加保，提供安心執業的底線保障。" },
    { num: "10", title: "合於本會宗旨之其他事項", desc: "全方位開展各項能為一線生態與動植物守護天使們提供身心安全、專業發展之支援計畫。" }
  ];

  const leaders = [
    {
      role: "第一屆理事長",
      name: "郭佳雯",
      desc: "長年投身台灣環境運動與野生動物保育，深知前線調查、動植物救援、棲地復育工作者往往面臨「低薪資、高工時、高職災風險」的困境。創立工會，期盼為前線開拓一條『用專業守護自然，用制度保障勞權』的永續之路。",
      tags: ["環境捍衛者", "野生保育專家", "制度改革推手"]
    },
    {
      role: "常務理事及秘書團隊",
      name: "生態護育專業團隊",
      desc: "由全台資深野生動物保育員、環境工程師、生態調查專員、法律顧問與志工領袖共同組成。每季召開理監事會議，透明化會務，主動出擊落實勞檢監督與防護具倡議工作。",
      tags: ["勞權律師", "保育界領袖", "職安安全官"]
    }
  ];

  const membershipBenefits = [
    "🗳️ 享有工會大會提案、表決權、選舉權、被選舉權，共同決定生態界未來！",
    "🛡️ 享有勞資/志工不當對待、超時危險等『免費法律顧問與權益申訴協助』。",
    "🩹 個人執業安全諮詢，並可優先享有工會專屬團體意外保險加保資格。",
    "📚 優先免費或半價參與工會舉辦之『動植物救傷、棲地復育、工具操作職安衛課程』。",
    "💬 優先受邀加入工會北、中、南、東區分會社群，結識同路夥伴，分享職涯與心理療癒資源！"
  ];

  return (
    <section className="py-16 px-4 bg-[#fffdfa]" id="shield-section">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1e293b]/10 text-[#1e293b] rounded-full text-xs font-black tracking-widest uppercase mb-3 border-2 border-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b]">
            <Shield className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>BeUnion • 台灣環境生態護育產業工會官網資訊庫</span>
          </div>
          <h3 className="text-3xl md:text-5xl font-black text-[#1e293b] tracking-tight">
            我們將 <span className="text-[#1e293b] underline decoration-amber-400 decoration-wavy decoration-2">beunion.tw</span> 官方資訊完整呈現
          </h3>
          <p className="text-md font-bold text-[#1e293b]/60 mt-4 max-w-2xl mx-auto">
            工會自立案以來，全力維護動植物護育、生態保育、山林復育與環境教育等一線夥伴與志工的尊嚴、勞權與生命安全。
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="relative w-full overflow-hidden">
          {/* Mobile Swipe Hint */}
          <div className="flex md:hidden items-center justify-center gap-1.5 text-xs font-black text-amber-600/90 mb-3 animate-pulse bg-amber-500/5 py-1 px-4 rounded-full w-max mx-auto border border-amber-500/10 shadow-[2px_2px_0px_0px_rgba(245,158,11,0.05)]">
            <span>👈 左右滑動看更多選項 👉</span>
          </div>

          {/* Left/Right scroll indicators (gradient shades) */}
          <div className="absolute left-0 bottom-3.5 top-auto h-[52px] w-8 bg-gradient-to-r from-[#fffdfa] to-transparent pointer-events-none z-10 md:hidden" />
          <div className="absolute right-0 bottom-3.5 top-auto h-[52px] w-8 bg-gradient-to-l from-[#fffdfa] to-transparent pointer-events-none z-10 md:hidden" />

          <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-3 mb-10 scrollbar-none snap-x snap-mandatory px-4">
            {[
              { id: "purpose", label: "🌟 工會宗旨 & 立案", icon: Scale },
              { id: "tasks", label: "📋 法定十大任務", icon: BookOpen },
              { id: "team", label: "💼 理監事與創始團隊", icon: Users },
              { id: "membership", label: "💳 快速入會與福利", icon: Coins },
              { id: "contact", label: "📞 聯絡我們", icon: Mail }
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`snap-start shrink-0 px-4 py-3 rounded-2xl text-xs md:text-sm font-black border-3 transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-amber-400 border-[#1e293b] text-[#1e293b] shadow-[4px_4px_0px_0px_#1e293b] -translate-y-0.5"
                      : "bg-white border-[#1e293b]/20 text-[#1e293b]/70 hover:border-[#1e293b]/40 hover:bg-amber-50"
                  }`}
                >
                  <IconComponent className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels with motion */}
        <div className="min-h-[400px] border-4 border-[#1e293b] bg-white rounded-[2.5rem] p-6 md:p-10 bubbly-shadow-xl text-left relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {activeTab === "purpose" && (
              <motion.div
                key="purpose"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 border-b-2 border-dashed border-[#1e293b]/10 pb-6">
                  <div>
                    <h4 className="text-2xl md:text-3xl font-black text-[#1e293b] flex items-center gap-2">
                      <span>我們的宗旨與目標</span>
                      <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                    </h4>
                    <p className="text-sm font-bold text-[#1e293b]/50 mt-1">Taiwan Environmental Ecology and Conservation Industry Union (BeUnion)</p>
                  </div>
                  <div className="bg-amber-100 text-amber-900 border-2 border-[#1e293b] rounded-2xl px-4 py-2 font-black text-xs space-y-1">
                    <div>立案登記名稱：台灣環境生態護育產業工會</div>
                    <div>工會登記字號：府勞資字第 1120155234 號</div>
                    <div>成立大會日期：2023年7月11日</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-[#fdfbf7] p-6 rounded-3xl border-2 border-[#1e293b] relative">
                      <div className="absolute -top-3 left-6 px-3 py-0.5 bg-amber-400 text-[#1e293b] border-2 border-[#1e293b] rounded-full text-[10px] font-black">工會宗旨核心宣告</div>
                      <p className="text-base md:text-lg font-black text-[#1e293b] leading-relaxed pt-2">
                        「本會以保障會員權益、增進會員智能與福利、改善勞動條件與生活、協助政府推動生態護育政策及環境永續發展為宗旨。」
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-lg font-black text-[#1e293b]">為什麼全台需要「生態護育產業工會」？</h5>
                      <p className="text-sm font-bold text-[#1e293b]/80 leading-relaxed">
                        過去，野生動物保育員、生態調查人員、棲地復育志工與前線淨灘、淨山工作者散落在各民間團體、專案研究室與行政委外案中。當他們面對險惡的戶外環境、碎玻璃、野生動物抓咬傷、酷暑極熱、甚至強颱外圍環流時，往往面臨缺乏勞健保保障、防護具嚴重短缺、時數登錄不確實與事故無處申訴的窘境。
                      </p>
                      <p className="text-sm font-bold text-[#1e293b]/80 leading-relaxed">
                        <strong className="text-amber-600">BeUnion（台灣環境生態護育產業工會）</strong> 應運而生！我們是全台首個專門為動植物保護、山林生態與環境關懷第一線工作者、志工發聲的合法產業工會。我們深信：唯有守護好前線保育人員的勞動安全與身心權益，台灣的生態多樣性與環境保護才能永續生存！
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-emerald-50/50 p-6 rounded-[2rem] border-3 border-dashed border-[#1e293b]/20 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h5 className="text-base font-black text-emerald-800 flex items-center gap-1.5">
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>三大倡議核心柱</span>
                      </h5>
                      <ul className="space-y-3 text-xs md:text-sm font-bold text-[#1e293b]/90">
                        <li className="flex items-start gap-2">
                          <span className="bg-emerald-200 text-emerald-900 w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-0.5">1</span>
                          <span><strong>現場安全保障：</strong> 必須依法投保志工險/勞保。雇主/主辦單位應提供專業合格防護裝備（如防割手套、防割長靴、安全帽）。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-emerald-200 text-emerald-900 w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-0.5">2</span>
                          <span><strong>謝絕不當壓榨：</strong> 拒絕在無合格指導員、天候預警暴雨海浪下強迫勞動、拒絕時數非法漏計或扣留個人財物。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-emerald-200 text-emerald-900 w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-0.5">3</span>
                          <span><strong>身心創傷慰藉：</strong> 關注救援人員在親歷野生動物死傷、環境破壞後的替代性創傷與心靈燃燒（Burnout），提供心理傾聽支持。</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-2xl border-2 border-[#1e293b] flex items-center gap-3">
                      <Shield className="w-8 h-8 text-amber-500 fill-amber-100 shrink-0" />
                      <div className="text-left text-xs font-bold text-[#1e293b]">
                        <div className="font-black">用盾牌，為你撐起彩虹</div>
                        <div className="text-[#1e293b]/70">加入工會，讓善意不再孤單前行！</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "tasks" && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-2xl md:text-3xl font-black text-[#1e293b] flex items-center gap-2">
                    <span>工會十大法定任務</span>
                    <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg border-2 border-emerald-600 shadow-[1px_1px_0px_0px_#047857]">依工會法核定</span>
                  </h4>
                  <p className="text-sm font-bold text-[#1e293b]/60 mt-1">我們依據立案章程切實推動以下任務，全方位守護環境生態工作夥伴：</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {tenTasks.map((task, idx) => (
                    <div key={idx} className="p-5 bg-[#fdfbf7] rounded-3xl border-3 border-[#1e293b] bubbly-shadow-sm flex items-start gap-4 hover:-translate-y-0.5 transition-transform">
                      <div className="w-10 h-10 bg-amber-300 border-2 border-[#1e293b] text-[#1e293b] font-black rounded-xl flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#1e293b]">
                        {task.num}
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-black text-base text-[#1e293b] text-left">{task.title}</h5>
                        <p className="text-xs font-bold text-[#1e293b]/70 leading-relaxed text-left">{task.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "team" && (
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-2xl md:text-3xl font-black text-[#1e293b] flex items-center gap-2">
                    <span>理監事與倡議團隊</span>
                    <span className="text-xs font-black bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg border-2 border-rose-600 shadow-[1px_1px_0px_0px_#be123c]">第一屆會期</span>
                  </h4>
                  <p className="text-sm font-bold text-[#1e293b]/60 mt-1">由具備第一線實務經驗的專家及法律顧問領軍，決心推動生態界環境革命！</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                  {leaders.map((leader, index) => (
                    <div key={index} className="p-6 md:p-8 bg-white border-3 border-[#1e293b] rounded-[2rem] bubbly-shadow-md flex flex-col justify-between hover:-translate-y-0.5 transition-transform text-left">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full border-2 border-[#1e293b] bg-amber-100 flex items-center justify-center text-xl font-black text-[#1e293b]">
                            {index === 0 ? "👩‍💼" : "👥"}
                          </div>
                          <div>
                            <div className="text-xs font-black text-amber-600 tracking-wider uppercase">{leader.role}</div>
                            <h5 className="text-xl font-black text-[#1e293b]">{leader.name}</h5>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-[#1e293b]/80 leading-relaxed">
                          {leader.desc}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-6 pt-4 border-t-2 border-[#1e293b]/10">
                        {leader.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-2.5 py-1 bg-[#1e293b]/5 rounded-lg text-xs font-black text-[#1e293b]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border-2 border-[#1e293b] flex flex-col md:flex-row items-center justify-between gap-4 text-left">
                  <div>
                    <h5 className="font-black text-base text-[#1e293b] mb-1">📢 工會理監事常態發聲與監督</h5>
                    <p className="text-xs font-bold text-[#1e293b]/70">
                      我們常年參與全台各大棲地開發案、保育專案勞檢、淨灘安檢與職安申訴，為沒有固定雇主的工作人員撐腰。若你所屬的保育單位、政府標案包商存在不合規的安全盲區，請務必主動向工會反映！
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const element = document.getElementById("report-section");
                      if (element) element.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-[#1e293b] font-black rounded-xl border-2 border-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] text-xs shrink-0 cursor-pointer"
                  >
                    反映勞資/職安爭議 🚨
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "membership" && (
              <motion.div
                key="membership"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 border-b-2 border-dashed border-[#1e293b]/10 pb-6">
                  <div>
                    <h4 className="text-2xl md:text-3xl font-black text-[#1e293b] flex items-center gap-2">
                      <span>入會指南與福利說明</span>
                      <span className="text-xs font-black bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg border-2 border-rose-600 shadow-[1px_1px_0px_0px_#be123c]">歡迎前線夥伴加入</span>
                    </h4>
                    <p className="text-sm font-bold text-[#1e293b]/60 mt-1">不論你是全職、兼職從業者、學者助理、或是長期關懷大自然的熱血志工，工會都張開雙臂歡迎你！</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                  <div className="lg:col-span-4 space-y-4">
                    {/* Card 1: Regular Member */}
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-3 border-[#1e293b] rounded-[2rem] bubbly-shadow-sm text-left relative overflow-hidden">
                      <div className="absolute top-3 right-3 bg-amber-400 border-2 border-[#1e293b] rounded-lg px-2 py-0.5 text-[10px] font-black">推薦</div>
                      <h5 className="font-black text-xl text-[#1e293b] mb-2">一般個人會員</h5>
                      <p className="text-xs font-bold text-[#1e293b]/70 mb-4 leading-relaxed">
                        凡在台灣地區從事生態保育、野生及流浪動物救助護育、山林復育、淨灘淨山、環境教育或相關綠色產業之從業者、支持者與志工夥伴。
                      </p>
                      
                      <div className="space-y-1 bg-white p-3 rounded-xl border-2 border-[#1e293b] text-xs font-black text-[#1e293b] mb-4">
                        <div className="flex justify-between">
                          <span>入會費（首年繳一次）</span>
                          <span className="text-amber-600 font-extrabold">新台幣 500 元</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-[#1e293b]/10 pt-1 mt-1">
                          <span>常年會費（維持會籍）</span>
                          <span className="text-amber-600 font-extrabold">新台幣 1,000 元/年</span>
                        </div>
                      </div>

                      <ul className="text-left space-y-1.5 text-[11px] font-bold text-[#1e293b]/80">
                        <li className="flex items-center gap-1">✅ 享有大會完整表決權、選舉權</li>
                        <li className="flex items-center gap-1">✅ 免費法律與勞資申訴諮詢</li>
                        <li className="flex items-center gap-1">✅ 保育技術研習半價/免費</li>
                        <li className="flex items-center gap-1">✅ 保險協助及專屬加保資格</li>
                      </ul>
                    </div>

                    {/* Card 2: Sponsoring Member */}
                    <div className="p-6 bg-[#fdfbf7] border-3 border-[#1e293b]/50 rounded-[2rem] text-left">
                      <h5 className="font-black text-lg text-[#1e293b] mb-1">贊助/支持會員</h5>
                      <p className="text-xs font-bold text-[#1e293b]/60 mb-3">
                        認同工會理念、不限特定行業，願意以實質捐贈支持工會持續發聲的社會大眾、志工或團體。
                      </p>
                      <div className="p-2 bg-white rounded-lg border-2 border-[#1e293b]/30 text-xs font-black text-[#1e293b]/70 text-center mb-3">
                        會費自由認捐 • 支持力量無價 🌱
                      </div>
                      <p className="text-[10px] font-bold text-[#1e293b]/50">
                        * 贊助會員不享有會內法定表決與選舉權，但優先受邀參與工會聯誼康樂活動及宣傳講座。
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-6 text-left">
                    <div className="p-6 bg-white border-2 border-emerald-600 rounded-[2rem] space-y-4">
                      <h5 className="text-lg font-black text-emerald-800 flex items-center gap-1.5">
                        <Sparkles className="w-5 h-5 text-emerald-500 fill-emerald-500 animate-pulse" />
                        <span>加入工會的 5 大獨家福利</span>
                      </h5>
                      <div className="space-y-3.5">
                        {membershipBenefits.map((benefit, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2.5 text-sm font-bold text-[#1e293b]/90">
                            <span className="text-emerald-500 mt-0.5 shrink-0">✨</span>
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Simulation Application Form Box */}
                    <div className="p-6 bg-amber-400 rounded-3xl border-3 border-[#1e293b] bubbly-shadow flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-left">
                        <h5 className="font-black text-lg text-[#1e293b] mb-1">🌟 立即在線上提交「加入意願申請書」</h5>
                        <p className="text-xs font-bold text-[#1e293b]/90">
                          填寫完畢後，工會秘書處將有專人於 3 個工作天內，透過 Email/LINE 與您聯絡確認會籍事宜！
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const name = prompt("請輸入您的姓名：");
                          if (!name) return;
                          const email = prompt("請輸入您的聯絡 Email：");
                          if (!email) return;
                          const role = prompt("請輸入您的工作/志工領域（例如：動保救援/植樹志工/生態調查員）：");
                          if (!role) return;
                          alert(`🎉 恭喜 ${name} 夥伴！您已成功遞交台灣環境生態護育產業工會（BeUnion）入會申請意願書！\n\n我們將於 3 個工作天內寄送繳費及線上表單確認信至：${email}\n感謝您與工會同行，一起守護台灣環境生態！🐾🌱💧`);
                        }}
                        className="px-6 py-3 bg-white hover:bg-amber-100 text-[#1e293b] font-black rounded-2xl border-3 border-[#1e293b] bubbly-shadow text-sm shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <span>填寫入會意願 📝</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "contact" && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-2xl md:text-3xl font-black text-[#1e293b] flex items-center gap-2">
                    <span>聯絡我們 / 秘書處資訊</span>
                    <span className="text-xs font-black bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg border-2 border-sky-600 shadow-[1px_1px_0px_0px_#0369a1]">24小時電子信箱常開</span>
                  </h4>
                  <p className="text-sm font-bold text-[#1e293b]/60 mt-1">有關入會程序、勞資申訴、保育技術交流、或團體保險事宜，歡迎以下列管道聯絡工會：</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="p-6 bg-amber-50 rounded-3xl border-3 border-[#1e293b] text-left hover:-translate-y-0.5 transition-transform">
                    <div className="w-10 h-10 bg-amber-200 rounded-xl border-2 border-[#1e293b] flex items-center justify-center mb-4">
                      <MapPin className="w-5 h-5 text-[#1e293b]" />
                    </div>
                    <h5 className="font-black text-lg text-[#1e293b] mb-1">會址 / 聯絡處</h5>
                    <p className="text-xs font-bold text-[#1e293b]/70 leading-relaxed">
                      桃園市中壢區 (工會正式立案登記於桃園市，於北中南均有志工聯絡幹部。詳細通訊地址請來信或官方 LINE 洽詢)。
                    </p>
                    <div className="text-[10px] text-amber-700 font-extrabold mt-3">工會字號：府勞資字第 1120155234 號</div>
                  </div>

                  <div className="p-6 bg-emerald-50 rounded-3xl border-3 border-[#1e293b] text-left hover:-translate-y-0.5 transition-transform">
                    <div className="w-10 h-10 bg-emerald-200 rounded-xl border-2 border-[#1e293b] flex items-center justify-center mb-4">
                      <Mail className="w-5 h-5 text-[#1e293b]" />
                    </div>
                    <h5 className="font-black text-lg text-[#1e293b] mb-1">官方聯絡信箱</h5>
                    <p className="text-xs font-bold text-[#1e293b]/70 leading-relaxed mb-4">
                      有關媒體採訪、專案合作、標案職安稽核、勞資爭議申訴、或長文附件，歡迎投遞至工會官方 Gmail 箱：
                    </p>
                    <a
                      href="mailto:beunion.tw@gmail.com"
                      className="inline-block px-4 py-2 bg-white text-xs font-black text-emerald-800 rounded-lg border-2 border-emerald-600 hover:bg-emerald-100"
                    >
                      beunion.tw@gmail.com ✉️
                    </a>
                  </div>

                  <div className="p-6 bg-sky-50 rounded-3xl border-3 border-[#1e293b] text-left hover:-translate-y-0.5 transition-transform">
                    <div className="w-10 h-10 bg-sky-200 rounded-xl border-2 border-[#1e293b] flex items-center justify-center mb-4">
                      <Shield className="w-5 h-5 text-[#1e293b]" />
                    </div>
                    <h5 className="font-black text-lg text-[#1e293b] mb-1">LINE 官方帳號</h5>
                    <p className="text-xs font-bold text-[#1e293b]/70 leading-relaxed mb-4">
                      提供一般會員一對一諮詢服務、申訴追蹤與即時對答。請至 LINE APP 搜尋帳號或 ID：
                    </p>
                    <div className="inline-block px-4 py-2 bg-white text-xs font-black text-sky-800 rounded-lg border-2 border-sky-600">
                      ID 搜尋：<span className="underline select-all">@beunion</span> 💬
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-900 text-white rounded-[2rem] border-3 border-[#1e293b] text-left flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h5 className="font-black text-amber-400 text-base">🐾🌱💧 台灣環境生態護育產業工會 • 捍衛勞權永不停歇</h5>
                    <p className="text-xs text-white/70">
                      我們是由動植物工作者、一線志工、環境調查員自發成立的產業工會。我們深信：守護前線夥伴，就是守護台灣自然生態的最佳方式！
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const element = document.getElementById("chat-section");
                      if (element) element.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-5 py-3 bg-red-400 hover:bg-red-500 text-white font-black text-xs rounded-xl border-2 border-white/20 shadow-lg cursor-pointer shrink-0"
                  >
                    即刻呼喚 AI 守護獸 🐾
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Big callout block */}
        <div className="mt-12 p-8 bg-amber-400 rounded-[2.5rem] border-4 border-[#1e293b] bubbly-shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="max-w-3xl">
            <h4 className="text-2xl font-black text-[#1e293b] mb-2">遇到環境勞資爭議、現場職安不公？別怕，後盾在這裡！</h4>
            <p className="text-sm font-bold text-[#1e293b]/90 leading-relaxed">
              「聘僱單位拒保職災保險？」、「在颱風天或惡劣海相強迫第一線志工下海淨灘？」
              這些不合理的對待，台灣環境生態護育產業工會一對一關懷申訴系統會幫你撐腰、捍衛權益到底！
            </p>
          </div>
          <a
            href="#report-section"
            className="px-6 py-3 bg-white hover:bg-amber-100 text-[#1e293b] font-black rounded-xl border-3 border-[#1e293b] bubbly-shadow text-center shrink-0 cursor-pointer text-sm whitespace-nowrap active:translate-y-0.5 transition-transform"
            id="shield-hub-report-btn"
          >
            填寫權益申訴單 ✍️
          </a>
        </div>

      </div>
    </section>
  );
}
