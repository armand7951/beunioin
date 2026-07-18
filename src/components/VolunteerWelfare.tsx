import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Shield, 
  Heart, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Scale, 
  Users, 
  Shirt, 
  Wine, 
  Compass, 
  ArrowRight, 
  Award, 
  Gift, 
  HeartHandshake, 
  Calendar,
  CheckCircle2,
  Check
} from "lucide-react";

export default function VolunteerWelfare() {
  const [activeTier, setActiveTier] = useState<"all" | "volunteer" | "member">("all");

  const sharedWelfares = [
    {
      title: "每月線上課程",
      desc: "每月提供 1-2 堂最新產業知識與技能課程，讓您持續學習不中斷。",
      icon: BookOpen,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200"
    },
    {
      title: "線上網校資源",
      desc: "隨時隨地登入我們的線上學習平台，海量生態保育資源任您自由探索。",
      icon: GraduationCap,
      color: "text-amber-600 bg-amber-50 border-amber-200"
    },
    {
      title: "免費法律諮詢與錄案",
      desc: "遇見任何志願服務或勞動法律問題？我們提供最專業的諮詢為您排憂解難。",
      icon: Scale,
      color: "text-sky-600 bg-sky-50 border-sky-200"
    },
    {
      title: "資深心理師團體諮商",
      desc: "每月固定一次的暖心團體諮商，由專業資深心理諮商師引領，呵護您的心靈健康。",
      icon: Heart,
      color: "text-rose-600 bg-rose-50 border-rose-200"
    },
    {
      title: "專屬團隊服飾",
      desc: "免費提供專屬工會服、運動毛巾與安全帽，增強團隊歸屬感與榮譽感。",
      icon: Shirt,
      color: "text-purple-600 bg-purple-50 border-purple-200"
    },
    {
      title: "春酒與尾牙宴席",
      desc: "參與年度溫馨感恩大會與歡慶春酒尾牙，感謝您一年來的無私貢獻與付出。",
      icon: Wine,
      color: "text-amber-600 bg-amber-50 border-amber-200"
    },
    {
      title: "產業參訪行程",
      desc: "實地組團走訪全台指標性生態復育、林務、動保等標竿企業與專案，擴大視野。",
      icon: Compass,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200"
    }
  ];

  const volunteerWelfares = [
    {
      title: "全程出勤與交通保險",
      desc: "每一次出勤服務及往返交通前後 2 小時，皆享有工會為您加保的完整意外與醫療保險。",
      icon: Shield
    },
    {
      title: "第二輪物資優先發放",
      desc: "享有工會專屬生活及護育資源、救災物資、宣導紀念品的第二輪發放優先權。",
      icon: Gift
    },
    {
      title: "各組專業實務培訓",
      desc: "根據您所屬的任务組別（動保、植樹、淨灘等），提供量身打造的安全操作與護育技術培訓。",
      icon: Users
    },
    {
      title: "專屬表揚與特殊貢獻獎",
      desc: "您的熱情不應被埋沒！表現優異者除可獲頒志工榮譽卡外，亦有機會在工會大會接受公開表揚。",
      icon: Award
    }
  ];

  const tableData = {
    headers: ["福利項目", "共享福利 (所有夥伴)", "志工隊福利", "會員福利"],
    rows: [
      { name: "專屬服飾與裝備", all: "工會服、毛巾、帽", volunteer: "工會服、毛巾、帽", member: "優先升級全套裝備" },
      { name: "線上學習資源", all: "每月課程 1-2 堂、線上網校", volunteer: "同左 + 進階實務特訓", member: "同左 + 每月專業1堂課" },
      { name: "法律與諮商支持", all: "心理諮商/月、免費法律諮詢", volunteer: "同左", member: "同左 + 專屬法律訴訟代理" },
      { name: "春酒、尾牙與參訪", all: "可報名參加", volunteer: "可報名參加", member: "保留席位、眷屬優惠" },
      { name: "保險保障", all: "無 (非出勤期間)", volunteer: "出勤及交通前後 2 小時保障", member: "🌟 全年 365 天 24小時完整保險" },
      { name: "發放物資優先權", all: "一般順位", volunteer: "第二輪發放優先權", member: "🌟 第一優先最快速發放" },
      { name: "證照與執照輔導", all: "無", volunteer: "特選科目輔導", member: "🌟 證照班：每年至少一科目免費" },
      { name: "大會表揚制度", all: "無", volunteer: "榮譽卡、特殊貢獻獎", member: "🌟 於會員大會盛大公開表揚" },
    ]
  };

  return (
    <div className="bg-[#fffdfa] py-12 px-4 sm:px-6 lg:px-8">
      {/* Container with grid lines */}
      <div className="max-w-6xl mx-auto">
        
        {/* PDF Page 1: Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[3rem] border-4 border-[#1e293b] bg-emerald-900 text-white overflow-hidden p-8 sm:p-12 md:p-16 text-center bubbly-shadow-2xl mb-16"
        >
          {/* Ambient Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="bg-amber-400 text-[#1e293b] text-xs md:text-sm font-black px-4 py-1.5 rounded-full border-2 border-[#1e293b] uppercase tracking-widest mb-6 animate-bounce">
              🌟 Taiwan Ecology & Volunteer Welfare
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-amber-300 drop-shadow-sm">
              台灣環產 | 志工夥伴福利總覽
            </h1>
            <p className="mt-6 text-lg sm:text-xl md:text-2xl font-bold text-emerald-100 max-w-2xl">
              凝聚力量 ‧ 共享成長 ‧ 全面關懷
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm font-black text-amber-400">
              <span>我們保護為萬物挺身而出的人</span>
              <Heart className="w-5 h-5 text-red-400 fill-red-400 animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* PDF Page 2: Ecosystem Introduction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16 border-b-4 border-dashed border-[#1e293b]/10 pb-16">
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="text-emerald-600 font-extrabold tracking-wider text-sm uppercase">◆ GROWING TOGETHER</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e293b]">
              我們不只是一個組織，<br />更是一個共同成長的生態系
            </h2>
            <p className="text-base sm:text-lg font-medium text-[#1e293b]/80 leading-relaxed">
              在台灣環境生態護育產業工會（台灣環產），每一位夥伴的投入都是我們最珍視的資產。
            </p>
            <p className="text-sm sm:text-base font-medium text-[#1e293b]/70 leading-relaxed bg-[#fbebe4]/40 p-5 rounded-2xl border-2 border-dashed border-[#1e293b]/20">
              我們相信，隨著您對社群的貢獻加深，社群也應回饋給您更全面的支持。
              這份福利總覽將為您揭示一個層層遞進的支持系統，從所有夥伴共享的基礎，
              到為志工與正式會員打造的專屬回饋。這是一趟精彩、安心且共同成長的旅程。
            </p>
          </div>

          {/* Interactive Nested Circle Ecosystem Graphic (Page 2 Interactive Version) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Outer circle: All partners */}
              <div 
                onClick={() => setActiveTier("all")}
                className={`absolute w-full h-full rounded-full border-4 border-[#1e293b] flex items-end justify-center pb-4 transition-all duration-300 cursor-pointer ${
                  activeTier === "all" ? "bg-emerald-50 scale-105 shadow-[6px_6px_0px_0px_#1e293b]" : "bg-white/50 hover:bg-emerald-50/30"
                }`}
              >
                <span className="font-black text-xs text-emerald-800 tracking-widest">【 外圈：所有夥伴 】</span>
              </div>

              {/* Middle circle: Volunteer team */}
              <div 
                onClick={() => setActiveTier("volunteer")}
                className={`absolute w-[75%] h-[75%] rounded-full border-4 border-[#1e293b] flex items-end justify-center pb-4 transition-all duration-300 cursor-pointer ${
                  activeTier === "volunteer" ? "bg-rose-50 scale-105 shadow-[4px_4px_0px_0px_#1e293b]" : "bg-white hover:bg-rose-50/30"
                }`}
              >
                <span className="font-black text-xs text-rose-800 tracking-widest">【 中圈：志工隊 】</span>
              </div>

              {/* Inner circle: Official members */}
              <div 
                onClick={() => setActiveTier("member")}
                className={`absolute w-[50%] h-[50%] rounded-full border-4 border-[#1e293b] flex items-center justify-center p-4 transition-all duration-300 cursor-pointer text-center ${
                  activeTier === "member" ? "bg-amber-100 scale-105 shadow-[4px_4px_0px_0px_#1e293b]" : "bg-amber-50 hover:bg-amber-100/50"
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <Shield className="w-6 h-6 text-amber-600 fill-white mb-1" />
                  <span className="font-black text-xs text-amber-900 leading-tight">【 內圈 】<br />正式會員</span>
                </div>
              </div>
            </div>

            {/* Dynamic Ecosystem Explanation Card */}
            <div className="mt-6 w-full max-w-sm p-4 rounded-2xl border-3 border-[#1e293b] bg-white bubbly-shadow-md text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">
                  {activeTier === "all" && "🌍"}
                  {activeTier === "volunteer" && "🤝"}
                  {activeTier === "member" && "👑"}
                </span>
                <h4 className="font-black text-sm text-[#1e293b]">
                  {activeTier === "all" && "外圈：所有夥伴"}
                  {activeTier === "volunteer" && "中圈：志工隊夥伴"}
                  {activeTier === "member" && "內圈：工會正式會員"}
                </h4>
              </div>
              <p className="text-xs font-semibold text-[#1e293b]/70 leading-relaxed">
                {activeTier === "all" && "只要是關心環境生態護育、參與台灣環產活動的人（包括一般大眾及關注者），皆能免費享有法律、心理及基礎線上知能課程等共享福利！"}
                {activeTier === "volunteer" && "積極投身第一線動保、淨灘、植樹等任務的無私志工們，除享有共享福利外，工會提供額外的出勤意外險保障、實務培訓與專屬表揚！"}
                {activeTier === "member" && "正式加入工會並完成註冊的專業工作者與核心夥伴，享有全方位最高規格福利：365天全年保險、第一優先最速物資、證照輔導補助與特殊大會表揚。"}
              </p>
            </div>
          </div>
        </div>

        {/* PDF Page 3 & 4 & 5: Shared Welfare Block */}
        <div className="mb-16">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-amber-500 font-extrabold tracking-wider text-sm">CO-SHARING FOUNDATION</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e293b] mt-1.5">
              每一位夥伴共享的基石：我們的共同福利
            </h2>
            <p className="text-sm sm:text-base font-bold text-[#1e293b]/70 mt-3">
              無論您的角色為何，只要您是台灣環產的一份子，這些福利就是我們為您打下的堅實基礎。這是我們承諾的起點，確保每個人都能獲得專業成長與社群連結。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedWelfares.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div 
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-white border-3 border-[#1e293b] p-6 rounded-[2rem] text-left bubbly-shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl border-2 border-[#1e293b] flex items-center justify-center mb-5 ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-[#1e293b] mb-2">{item.title}</h3>
                    <p className="text-sm font-semibold text-[#1e293b]/70 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#1e293b]/10 flex items-center text-xs font-black text-emerald-600 gap-1">
                    <span>所有夥伴皆可享有</span>
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* PDF Page 7 & 8: Volunteer Exclusives */}
        <div className="bg-[#fef6f0] border-4 border-[#1e293b] rounded-[3rem] p-8 sm:p-12 mb-16 bubbly-shadow-lg text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column Text (Page 7 content) */}
            <div className="lg:col-span-5 space-y-6">
              <span className="bg-rose-400 text-[#1e293b] text-xs font-black px-3 py-1 rounded-full border-2 border-[#1e293b] w-max uppercase block">
                🤝 VOLUNTEER EXCLUSIVE
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e293b] leading-tight">
                為挺身而出的您，<br />我們提供更堅實的後盾
              </h2>
              <h3 className="text-lg font-black text-rose-600">志工隊專屬福利</h3>
              <p className="text-sm sm:text-base font-medium text-[#1e293b]/80 leading-relaxed">
                您的時間與熱情是推動我們前進的關鍵動力。為了回饋您的無私奉獻，我們特別為志工隊夥伴準備了專屬的支持與保障，讓您在付出的同時，也能感到百分之百的安心與榮耀！
              </p>
              
              {/* Cute Badge */}
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border-2 border-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] w-max">
                <HeartHandshake className="w-6 h-6 text-rose-500 fill-rose-100" />
                <span className="text-xs font-black text-[#1e293b]">您的安全，由我們來承包 🛡️</span>
              </div>
            </div>

            {/* Right Column Grid (Page 8 details) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {volunteerWelfares.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="bg-white p-5 rounded-2xl border-3 border-[#1e293b] shadow-[3px_3px_0px_0px_#1e293b] flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border-2 border-[#1e293b] text-rose-600 flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-base text-[#1e293b] mb-1.5">{item.title}</h4>
                      <p className="text-xs font-semibold text-[#1e293b]/70 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* PDF Page 6: Comparison Matrix */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-indigo-600 font-extrabold tracking-wider text-sm">BENEFIT COMPARISON</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e293b] mt-1.5">
              夥伴福利，一目了然
            </h2>
            <p className="text-sm font-bold text-[#1e293b]/60 mt-2">
              透過以下清晰的福利矩陣，快速了解不同參與層級的專屬福利。歡迎您進一步加入志工隊或註冊成為正式會員！
            </p>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-[2rem] border-4 border-[#1e293b] bubbly-shadow-md bg-white">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#1e293b] text-white">
                  {tableData.headers.map((header, i) => (
                    <th 
                      key={i} 
                      className={`p-4 md:p-5 font-black text-sm tracking-wider uppercase border-r border-[#1e293b]/10 last:border-r-0 ${
                        i === 1 ? "bg-emerald-800" : i === 2 ? "bg-rose-700" : i === 3 ? "bg-amber-600" : ""
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-3 divide-[#1e293b]/10">
                {tableData.rows.map((row, index) => (
                  <tr key={index} className="hover:bg-amber-50/20 transition-colors">
                    <td className="p-4 md:p-5 font-extrabold text-sm text-[#1e293b] bg-slate-50 border-r-3 border-[#1e293b]/10">
                      {row.name}
                    </td>
                    <td className="p-4 md:p-5 text-xs font-semibold text-[#1e293b]/80 border-r-3 border-[#1e293b]/10">
                      {row.all}
                    </td>
                    <td className="p-4 md:p-5 text-xs font-bold text-[#1e293b] bg-rose-50/20 border-r-3 border-[#1e293b]/10">
                      {row.volunteer}
                    </td>
                    <td className="p-4 md:p-5 text-xs font-extrabold text-emerald-800 bg-amber-50/20">
                      {row.member}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PDF Page 9 & 10: Ending / Warm CTA */}
        <div className="relative rounded-[3rem] border-4 border-[#1e293b] bg-amber-100 overflow-hidden p-8 sm:p-12 md:p-16 text-center bubbly-shadow-lg">
          {/* Ambient shapes */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl opacity-60 -translate-x-12 -translate-y-12" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-200 rounded-full blur-3xl opacity-40 translate-x-12 translate-y-12" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <span className="text-3xl sm:text-4xl md:text-5xl mb-6">🤝❤️🌱</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e293b] tracking-tight leading-none">
              我們是您人生旅途的同行者
            </h2>
            <p className="mt-6 text-base sm:text-lg font-bold text-[#1e293b]/80 leading-relaxed">
              台灣環境生態護育產業工會（台灣環產）致力於成為您最可靠、最溫馨的夥伴。
              在您投入生態護育人生的每一個重要、感動或疲憊的時刻，
              我們都在這裡，提供最溫暖、最即時的關懷與全方位權益支持。
            </p>
            <p className="mt-4 text-xs sm:text-sm font-black text-rose-600 bg-white border-2 border-dashed border-rose-300 px-4 py-2.5 rounded-full">
              ✨ 這份全方位關懷，適用於全台所有的環境、動植物志工與前線工作者！
            </p>

            <div className="mt-10 border-t-3 border-dashed border-[#1e293b]/10 pt-8 w-full">
              <p className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-wide">
                「我們保護為萬物挺身而出的人。」
              </p>
              <p className="mt-2 text-xs font-extrabold text-[#1e293b]/50">
                台灣環境生態護育產業工會 • 陪伴您安心、驕傲地為大地呼吸
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
