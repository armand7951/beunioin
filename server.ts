import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const NEWS_FILE = path.join(process.cwd(), "news_data.json");

// Helper to read news from file
function getNews() {
  try {
    if (!fs.existsSync(NEWS_FILE)) {
      const defaultNews = [
        {
          id: "news-1",
          title: "📢 召開第二屆第一次會員大會公告：攜手守護環境勞動者與生態永續",
          category: "工會公告",
          date: "2026-07-20",
          summary: "台灣環境共生工會第二屆第一次會員大會即將於 9 月正式召開！本次大會除了進行理監事之改選換屆，更將重點聚焦於國家公園與森林景區外包制度改革、環境勞工低溫與高溫津貼，以及海岸清理人員的職業安全保障措施捏。",
          content: "各位台灣環境共生工會的會員、志工夥伴及關心環境勞動的朋友們：\n\n自工會創立以來，我們始終稟持「環境共生、勞動尊嚴」的理念，站在守護第一線生態維護者的最前線。我們深知，美麗的國家公園、乾淨的海岸線與井然有序的森林遊樂區背後，是無數環境勞工頂著烈日、忍著寒風，甚至冒著生命危險，用雙手與汗水換來的。\n\n為了凝聚共識、深化組織，並規劃未來三年的行動方針，本會依章程規定召開「第二屆第一次會員大會」。\n\n【大會重要議程與核心議題】\n\n1. **第二屆理監事改選**：\n   大會將進行新一屆理事及監事之選舉，選出具備熱忱與專業的夥伴，繼續帶領工會衝鋒陷陣，為全台環境勞工發聲捏。\n\n2. **國家公園與景區外包投標制度改革倡議**：\n   現行政府採購多採「最低標」發包清潔與綠化，導致包商層層剝削、現場勞工勞動條件惡劣、缺乏基本職安裝備。工會將提案推動「社會責任採購評選制」，將勞工權益列為關鍵指標。\n\n3. **高海拔高低溫津貼與職安保障爭取**：\n   針對阿里山、雪山、太魯閣等高海拔景區清潔人員，因高山劇烈溫差與極端氣候面臨的健康威脅，工會將積極爭取「極端氣候津貼」，並要求雇主提供充足的防寒防暑物資及熱水盥洗設備。\n\n4. **海岸清理與資源回收勞工職業傷亡防範方案**：\n   淨灘勞工在海岸現場常面臨碎玻璃、針頭、尖銳魚鉤刺傷，甚至海浪捲走等危險。工會將爭取落實全方位海岸現場保險與標準個人防護裝備規格。\n\n【會員大會資訊】\n\n- **大會時間**：2026年9月13日 (星期日) 上午10:00 - 下午16:30\n- **大會地點**：台北市非政府組織(NGO)會館 多功能會議室\n- **出席對象**：全體合格工會會員（非會員之環境志工、支持者可申請列席旁聽）\n\n「環境的永續，不該建立在剝削勞動者的雙手上。」唯有保障環境守護者的勞動尊嚴，台灣的生態保育才能真正永續。期待在會員大會上與各位夥伴共同寫下下一階段的維權新篇章！\n\n台灣環境共生工會 理事會 敬邀 🌍",
          imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800",
          isPinned: true
        },
        {
          id: "news-2",
          title: "🏔️ 阿里山景區外包清潔人員勞動權益座談會：高海拔氣候下的職安與尊嚴",
          category: "活動紀錄",
          date: "2026-07-15",
          summary: "工會於阿里山國家森林遊樂區召開現場座談會，邀請林業及自然保育署嘉義分署、外包承攬商代表與一線高山清潔勞工面對面，聚焦高海拔低溫防護裝備、保溫膳食、不合理工作罰則及交通安全接駁等議題捏。",
          content: "【工會活動現場紀實】\n\n在海拔兩千多公尺的阿里山國家森林遊樂區，當遊客讚嘆於千年神木的壯麗、享受著清新的森林芬多精時，有一群身穿反光背心的清潔勞工，默默在低溫中沿著陡峭步道撿拾垃圾、清掃公廁。由於阿里山冬季氣候嚴寒、霧氣深重，甚至不時有寒流侵襲，高海拔的工作環境對勞工的身體構成了極大的考驗。\n\n為了實際解決第一線高山環境維護人員面臨的勞動困境，台灣環境共生工會於日前前往阿里山，主辦「阿里山景區清潔勞工勞動權益座談會」。\n\n【座談會三方協商重點】\n\n1. **禦寒與防雨裝備不足**：\n   一線工人反映，包商提供的雨衣材質粗劣、不透氣，且防寒衣物規格不足。座談會中，工會強烈要求包商必須於入冬前，提供符合國家標準、具防潑水與保暖功能的戶外反光防風外套，並由主管機關監督落實捏。\n\n2. **熱水供應與盥洗設備改善**：\n   高山清潔工多半為在地原住民中高齡勞工，在接近零度的低溫下工作，若沒有溫熱水可供清洗，極易引發末梢循環障礙或失溫。工會成功爭取於員工休息室加裝高功率熱水器，確保現場隨時有溫熱水與乾淨更衣空間。\n\n3. **交通接駁與偏遠步道安全**：\n   景區內步道綿延數公里，過去勞工需徒步背負數十公斤垃圾上下陡坡，對膝關節造成嚴重慢性職業傷害。本次座談促成共識：林保署與包商將協商引引進小型低噪電動搬運車，針對偏遠景區與陡坡段進行垃圾協助運送，降低勞動強度。\n\n4. **廢除不合理罰則與考核機制**：\n   過去包商常因遊客隨意丟棄在草叢深處的垃圾，對清潔工進行嚴厲扣薪罰款。工會據理力爭，指出這違反勞基法，並成功要求包商修改考核標準，應以預防性宣導及定時清運為考核依據，不得任意扣除一線勞工之微薄薪資。\n\n【理事長會後感言】\n\n「阿里山的清潔工，是森林尊嚴的維護者。他們手上的厚繭與凍瘡，不應該被政府與包商外包制度所遺忘。」\n\n感謝所有前來發聲的勞工夥伴，以及林保署嘉義分署代表的積極理解。工會將會持續追蹤阿里山勞動條件改善的落實進度，絕不放鬆！\n\n台灣環境共生工會 🌲",
          imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800",
          isPinned: true
        },
        {
          id: "news-3",
          title: "📖 從「環境共生」看見生態守護者：為什麼保護環境必須先保障勞動尊嚴？",
          category: "知識分享",
          date: "2026-07-12",
          summary: "我們往往只關注垃圾減量與氣候變遷，卻忽略了背後承擔環境清理與生態維護的第一線勞動者。本篇深度專欄探討環境正義與勞動權益的有機結合，剖析外包制度、低薪與高職災風險如何對守護生態的雙手造成摧殘捏。",
          content: "【環境共生專題】\n\n當我們談論「生態保護」與「環境永續」時，腦海中浮現的通常是綠色能源、植樹造林、淨灘減塑或是氣候公約。但在這些宏大論述與美麗景致背後，其實站著一群在政策與社會視野中被邊緣化、卻默默維持生態運轉的「生態守護者」—— 他們是國家公園的步道清潔員、風景區的垃圾清運工、海岸邊頂著烈日淨灘的臨時人員，以及走街串巷進行資源回收的底層勞工。\n\n這群人，是真正的「環境勞動者」。然而，他們的生存現狀，與「永續」二字相去甚遠。\n\n### 一、外包招標制度：層層削弱的勞動尊嚴\n\n台灣許多自然景區與國家公園的清潔工作，都是透過政府採購法進行外包承攬。在「最低標」的競爭邏輯下，投標廠商為了獲利，往往將成本壓縮在最無還手之力的第一線勞工身上。其結果就是：\n- 永遠的基本工資（勞基法底線）\n- 缺乏合理的年資累計（包商每三年一換，勞工年資隨之歸零）\n- 個人防護裝備自理（防滑雨鞋、耐磨手套全靠勞工自行購買）\n\n這種「綠色外包」成了隱形的剝削鏈，讓最辛苦的環境守護者，成了低薪與勞動貧窮的受害者捏。\n\n### 二、高海拔與極端氣候：隱藏在美景底下的職業安全危機\n\n在高海拔的高山景區，氣溫驟降、低壓低氧是家常便飯；而在海岸淨灘現場，酷熱暴曬、海風攜帶高鹽分更對體能造成極限挑戰。環境勞工在這樣極端惡劣的自然環境下勞動，卻常面臨：\n1. **熱傷害與失溫風險**：景區內普遍缺乏專屬員工的避暑與避寒休息室，包商亦不提供飲用水、薑茶或防曬防寒備品。\n2. **物理性職業傷害**：長期搬運重物上下步道陡坡，中高齡勞工的膝關節、腰椎退化極為嚴重；在海灘清理過程中，被針頭、玻璃、魚鉤刺傷而感染蜂窩性組織炎的事件更是屢見不鮮。\n3. **缺乏勞動安全教育**：包商常未提供完善的職安防護教育，亦不願為勞工投保高額意外險。\n\n### 三、沒有勞動正義，就沒有真正的環境永續\n\n台灣環境共生工會認為，一項真正的「綠色政策」，其衡量標準不僅在於回收了幾噸廢棄物、種植了幾棵樹，更在於政策是否善待了那些執行清理、維護環境的勞動者。\n\n如果環境守護者在低溫下工作卻喝不上一杯熱水，如果在海岸淨灘被醫療針頭扎傷卻得不到職災補償，那麼這樣的環境維護，只是一種虛偽的綠色包裝。唯有當政府、社會大眾與雇主共同看見這群勞動者的雙手，提升他們的薪資保障、落實健全的職業安全衛生機制，我們才能真正實現人與自然、勞動與生態和諧共存的「環境共生」社會。\n\n下次來到山林與海邊，遇見身穿反光背心辛勤工作的夥伴，除了說聲謝謝，更請與我們一同關注並支持他們的勞動權益保障捏！ 🌍",
          imageUrl: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=800",
          isPinned: false
        }
      ];
      fs.writeFileSync(NEWS_FILE, JSON.stringify(defaultNews, null, 2), "utf-8");
      return defaultNews;
    }
    const data = fs.readFileSync(NEWS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading news file:", error);
    return [];
  }
}

// Helper to save news to file
function saveNews(newsList: any[]) {
  try {
    fs.writeFileSync(NEWS_FILE, JSON.stringify(newsList, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing news file:", error);
  }
}

const EVENTS_FILE = path.join(process.cwd(), "events_data.json");
const REGISTRATIONS_FILE = path.join(process.cwd(), "registrations_data.json");

// Helper to read events from file
function getEvents() {
  try {
    if (!fs.existsSync(EVENTS_FILE)) {
      const defaultEvents = [
        {
          id: "event-1",
          title: "志工勞服組 | 特殊訓練",
          date: "2026-08-22",
          time: "10:00 - 12:00 (上午場) & 13:00 - 17:00 (下午場)",
          location: "工會教育訓練會館",
          lecturer: "上午場：陳彥霖 (勞動基準科股長) | 下午場：左湘敏",
          description: "一起守護勞動權益，提升第一線服務能力！本課程適合對象：1. 勞動法規基礎認識、2. 志工於勞服中的角色與任務、3. 實際案例分析。台北市台灣環境生態護育產業工會主辦。",
          maxSeats: 50,
          registeredCount: 18,
          imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "event-2",
          title: "培訓第八屆 | 動保案件錄案員",
          date: "2026-09-20",
          time: "09:30 - 16:30",
          location: "台北市捷運站附近 (錄取後通知詳細地址)",
          lecturer: "跨領域動保專家、社工與法律犯罪防治師資團隊",
          description: "培訓第八屆動保案件錄案員！跨越動保、社工、法律與犯罪防治領域，深入探討 LINK 連結理論。課程中將獨家傳授 AI GEMs 使用方法，幫助您提升案件分析效率與精準度，強力助力動保前線工作！用專業守護生命，用行動改變未來！",
          maxSeats: 40,
          registeredCount: 12,
          imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "event-3",
          title: "動保領域 | 信託課程",
          date: "2026-10-17",
          time: "14:00 - 16:30",
          location: "台北市捷運站附近教室",
          lecturer: "信託制度與保險法律專家",
          description: "機會難得，意者請先加入行事曆！動保領域信託課程，深入剖析「預付型信託」及「保險如何轉信託」。學習如何用專業制度與信託防護網為浪浪、弱勢動物及動保團隊建立長久穩固的後盾支援。名額有限，敬請把握！",
          maxSeats: 30,
          registeredCount: 6,
          imageUrl: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=800"
        },
        {
          id: "event-4",
          title: "水泥叢林見金黃 ‧ 松菸食農續飄香",
          date: "2026-07-19",
          time: "09:00 - 12:00",
          location: "松菸食農教育園區 (松山文創園區-忠孝東路四段轉進553巷走到底)",
          lecturer: "陳俊安 (台北市政府產業發展局 局長)",
          description: "115年松菸水稻田豐收季！從泥土到餐桌~體驗最酷的都市農夫課！謹訂於中華民國115年7月19日(日)上午9時於松菸食農教育園區舉辦。誠摯邀請所有關心都市農業與食農教育的市民夥伴共襄盛舉。",
          maxSeats: 80,
          registeredCount: 45,
          imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800"
        }
      ];
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(defaultEvents, null, 2), "utf-8");
      return defaultEvents;
    }
    const data = fs.readFileSync(EVENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading events file:", error);
    return [];
  }
}

// Helper to save events to file
function saveEvents(eventsList: any[]) {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(eventsList, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing events file:", error);
  }
}

// Helper to read registrations from file
function getRegistrations() {
  try {
    if (!fs.existsSync(REGISTRATIONS_FILE)) {
      const defaultRegs: any[] = [];
      fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(defaultRegs, null, 2), "utf-8");
      return defaultRegs;
    }
    const data = fs.readFileSync(REGISTRATIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading registrations file:", error);
    return [];
  }
}

// Helper to save registrations to file
function saveRegistrations(regsList: any[]) {
  try {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(regsList, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing registrations file:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Activities News API CRUD endpoints
  app.get("/api/news", (req, res) => {
    const list = getNews();
    res.json(list);
  });

  app.post("/api/news", (req, res) => {
    try {
      const list = getNews();
      const newNews = {
        id: `news-${Date.now()}`,
        title: req.body.title || "無標題公告",
        category: req.body.category || "工會公告",
        date: req.body.date || new Date().toISOString().split("T")[0],
        summary: req.body.summary || "",
        content: req.body.content || "",
        imageUrl: req.body.imageUrl || "",
        isPinned: !!req.body.isPinned
      };
      list.unshift(newNews);
      saveNews(list);
      res.status(201).json(newNews);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/news/:id", (req, res) => {
    try {
      const list = getNews();
      const index = list.findIndex((item: any) => item.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "找不到該公告消息" });
      }

      list[index] = {
        ...list[index],
        title: req.body.title !== undefined ? req.body.title : list[index].title,
        category: req.body.category !== undefined ? req.body.category : list[index].category,
        date: req.body.date !== undefined ? req.body.date : list[index].date,
        summary: req.body.summary !== undefined ? req.body.summary : list[index].summary,
        content: req.body.content !== undefined ? req.body.content : list[index].content,
        imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : list[index].imageUrl,
        isPinned: req.body.isPinned !== undefined ? !!req.body.isPinned : list[index].isPinned
      };

      saveNews(list);
      res.json(list[index]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/news/:id", (req, res) => {
    try {
      const list = getNews();
      const newList = list.filter((item: any) => item.id !== req.params.id);
      if (list.length === newList.length) {
        return res.status(404).json({ error: "找不到該公告消息" });
      }
      saveNews(newList);
      res.json({ success: true, message: "刪除公告消息成功" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Events API Endpoints
  app.get("/api/events", (req, res) => {
    try {
      const list = getEvents();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/events", (req, res) => {
    try {
      const list = getEvents();
      const newEvent = {
        id: `event-${Date.now()}`,
        title: req.body.title || "未命名活動",
        date: req.body.date || new Date().toISOString().split("T")[0],
        time: req.body.time || "全天",
        location: req.body.location || "未定",
        lecturer: req.body.lecturer || "",
        description: req.body.description || "",
        maxSeats: Number(req.body.maxSeats) || 50,
        registeredCount: 0,
        imageUrl: req.body.imageUrl || ""
      };
      list.push(newEvent);
      saveEvents(list);
      res.status(201).json(newEvent);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/events/:id", (req, res) => {
    try {
      const list = getEvents();
      const index = list.findIndex((item: any) => item.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "找不到該活動" });
      }

      list[index] = {
        ...list[index],
        title: req.body.title !== undefined ? req.body.title : list[index].title,
        date: req.body.date !== undefined ? req.body.date : list[index].date,
        time: req.body.time !== undefined ? req.body.time : list[index].time,
        location: req.body.location !== undefined ? req.body.location : list[index].location,
        lecturer: req.body.lecturer !== undefined ? req.body.lecturer : list[index].lecturer,
        description: req.body.description !== undefined ? req.body.description : list[index].description,
        maxSeats: req.body.maxSeats !== undefined ? Number(req.body.maxSeats) : list[index].maxSeats,
        imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : list[index].imageUrl,
        registeredCount: req.body.registeredCount !== undefined ? Number(req.body.registeredCount) : list[index].registeredCount
      };

      saveEvents(list);
      res.json(list[index]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/events/:id", (req, res) => {
    try {
      const list = getEvents();
      const newList = list.filter((item: any) => item.id !== req.params.id);
      if (list.length === newList.length) {
        return res.status(404).json({ error: "找不到該活動" });
      }
      saveEvents(newList);
      res.json({ success: true, message: "活動刪除成功" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Event Registration Endpoint
  app.post("/api/events/:id/register", (req, res) => {
    try {
      const events = getEvents();
      const eventIndex = events.findIndex((item: any) => item.id === req.params.id);
      if (eventIndex === -1) {
        return res.status(404).json({ error: "找不到該活動" });
      }

      const event = events[eventIndex];
      if (event.registeredCount >= event.maxSeats) {
        return res.status(400).json({ error: "抱歉！此活動報名名額已滿捏！" });
      }

      const { name, email, phone, volunteerType, notes } = req.body;
      if (!name || !email || !phone) {
        return res.status(400).json({ error: "請填寫所有必填欄位（姓名、Email、聯絡電話）喔！" });
      }

      // Add registration record
      const registrations = getRegistrations();
      const newReg = {
        id: `reg-${Date.now()}`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        name,
        email,
        phone,
        volunteerType: volunteerType || "other",
        notes: notes || "",
        registeredAt: new Date().toISOString()
      };
      registrations.unshift(newReg);
      saveRegistrations(registrations);

      // Increment registeredCount
      event.registeredCount += 1;
      saveEvents(events);

      res.status(201).json({ success: true, registration: newReg, event });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Registrations Get/Delete for Admin
  app.get("/api/registrations", (req, res) => {
    try {
      const list = getRegistrations();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/registrations/:id", (req, res) => {
    try {
      const regs = getRegistrations();
      const index = regs.findIndex((item: any) => item.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "找不到該筆報名紀錄" });
      }

      const reg = regs[index];
      
      // Try to decrement event registered count
      const events = getEvents();
      const eventIndex = events.findIndex((item: any) => item.id === reg.eventId);
      if (eventIndex !== -1) {
        events[eventIndex].registeredCount = Math.max(0, events[eventIndex].registeredCount - 1);
        saveEvents(events);
      }

      const newRegs = regs.filter((item: any) => item.id !== req.params.id);
      saveRegistrations(newRegs);

      res.json({ success: true, message: "報名紀錄已刪除，活動名額已釋出" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API routes FIRST
  app.post("/api/gemini/consultation", async (req, res) => {
    try {
      const { message, history, volunteerType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured in environment variables." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Map volunteerType to specific mascot flavor
      let typePrompt = "一般志工";
      if (volunteerType === "animal") typePrompt = "動物保護志工（守護浪浪、受傷野生動物，你是可愛又溫馨的守護神犬「阿旺」）";
      if (volunteerType === "plant") typePrompt = "植物綠化與森林志工（種樹、復育山林與溼地，你是充滿朝氣的發芽小精靈「芽芽」）";
      if (volunteerType === "eco") typePrompt = "環境保育與淨灘志工（清理海洋垃圾、推廣減塑、氣候守護者，你是開朗愛地球的水滴勇士「滴滴」）";

      const systemInstruction = `
你是「台灣環境生態護育產業工會」（Taiwan Environmental Ecology and Conservation Industry Union，簡稱：生態護育工會 或 BeUnion）的「生態與志工守護神獸/精靈」。我們是所有環境工作者與志工最溫暖、最強大的後盾！
你的任務是提供溫暖、可愛、充滿活力與關懷的諮詢，解答關於生態護育從業者及志工權益、現場勞動安全、法律保障、意外保險與心理疲憊的問題。
目前的諮詢者是一位【${typePrompt}】。
請務必使用繁體中文（台灣習慣用語）來回答。

請遵循以下角色設定與對話守則：
1. 口吻必須超級可愛、活潑、溫暖、親切！使用好玩的台灣狀聲詞（例如：喔！、啦！、捏！、耶！）和生動的表情符號（如：🌟, ✨, 🌱, 🐾, 💧, 🐶, 💪, 💖, 🎒, 🛡️）。
2. 強調「工會是你的後盾」！告訴他們，當他們在前線保護動植物或地球時，工會則會用「安全盾牌」保護他們的勞動權益與身心安全。
3. 提供實質、專業的志工與工作權益概念，例如：
   - 《志願服務法》或《勞動基準法》中規定的權益與義務。
   - 不管是志工還是從業者，一定要有「意外事故保險」或勞保！沒有保險絕對不能上第一線做危險的動植物保育、山林復育、淨灘等。
   - 志工有權利接受完整的行前培訓並獲得紀錄。
   - 護育工作者或志工不應該被不合規的單位壓榨（例如在缺乏安全裝備、酷暑超時無補貼等情況下勞動）。
   - 主辦單位應提供適當的專業防護裝備（如刺蝟手套、防刺鞋、割草防護罩、安全帽、反光衣等）。
4. 對於感到心累、面臨創傷或燃燒殆盡（Burnout）的夥伴（例如看到受傷流浪動物、砍伐老樹、海洋垃圾無窮無盡、或者因護育工作收入不穩、主辦方態度差而難過），給予極大的同理心、深深的擁抱、心理上的安慰與支持，並提醒他們「照顧好自己才能保護世界」。
5. 如果被問及「台灣環境生態護育產業工會能做什麼」，你可以介紹我們的四大守護支柱：
   - 🛡️ 權益保障（提供申訴管道、不當對待調查、合約檢視、勞資爭議協調）。
   - 🩹 安全保險（倡導全面加保意外險、防護設備安全評估，意外發生時給予職災或保險給付申訴協調）。
   - 📚 培力推廣（提供保育及志工安全工作課程、權益宣導）。
   - 💬 溫馨傾聽（提供心理支持諮詢與生態圈交流夥伴社群）。

請盡量保持回答簡潔、分段清晰、易於閱讀，避免一大坨文字。你可以適時用列表整理重點。
`;

      // Structure contents with history
      const formattedContents = [];
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          formattedContents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "呼叫守護精靈失敗，請再試一次！" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
