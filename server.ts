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
          title: "🛡️ 115年暑期全台動保現場志工安全培訓營，正式開放報名！",
          category: "教育訓練",
          date: "2026-07-20",
          summary: "為提升動保前線志工在救護與收容現場的安全意識，工會與多位資深動保專家聯合舉辦北中南三場實務培訓，含犬貓行為防衛、犬齒咬傷急救及個人裝備規格說明。",
          content: "各位親愛的動保夥伴：\n\n每一次投身動保現場，您都在為受傷、無助的生命抵擋風雨。然而，現場的突發狀況往往難以預料。為此，台灣環境生態護育產業工會特別規劃「115年暑期動保志工現場安全培訓營」，邀請資深行為學訓練師與急診室醫師，為大家帶來最實用的實務特訓！\n\n【課程核心亮點】\n1. **浪浪行為與防範應對**：判讀犬貓警戒與攻擊訊號，學會如何安全接近與撤離。\n2. **現場緊急救護實作**：遭遇犬貓抓咬傷、刺傷時的關鍵急救步驟與傷口清理常識。\n3. **個人防護裝備規格指南**：刺蝟手套、防割護臂、長筒安全防滑靴之正確挑選與保養。\n\n【場次資訊】\n- **北部場**：115/08/10 (日) 台北志工教育會館\n- **中部場**：115/08/17 (日) 台中生態研習教室\n- **南部場**：115/08/24 (日) 高雄動保推廣中心\n\n※ 本課程完全免費，志工夥伴享有優先錄取權，並於課後頒發安全研習結業證書。請立即透過下方連結或工會專線報名！\n\n台灣環境生態護育產業工會 關心您 🐾",
          imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800",
          isPinned: true
        },
        {
          id: "news-2",
          title: "🌱 賀！爭取成功！工會首創「前線志工24小時全年不中斷意外保障方案」",
          category: "工會動態",
          date: "2026-07-15",
          summary: "台灣環產與多家保險公司積極爭取，終於達成劃時代共識！自下月起，工會正式會員將享有首創「365天全年無休」前線與交通之專屬高額意外及醫療保險，為全台守護者織起安全網。",
          content: "親愛的會員及志工夥伴：\n\n我們深知，熱心生態與環境保護的您，不論是利用假日去淨灘、參與植樹，或是半夜接到野生動物救傷通報，危險往往不分時間、不分上下班。\n\n過去，一般的志工保險僅限於「出勤簽到期間」，交通往返或非表定活動時間若不幸發生意外，往往求助無門。\n\n經過工會不懈的努力與多次與保險公會、承保廠商的艱難談判，我們終於達成了劃時代的共識！\n\n【方案重大突破】\n1. **365天不限時段**：只要是本工會正式註冊會員，不論是否在執行官方出勤任務，全年 24 小時皆享有基本意外傷害險與實支實付醫療險保障！\n2. **高額給付保障**：包含因意外造成的殘疾、重大燒燙傷及住院津貼。\n3. **交通前後緩衝**：針對一般志工隊夥伴，出勤前後與交通往返的意外保障，也正式由 1 小時延長至「前後 2 小時」！\n\n工會理事長表示：「我們保護為萬物挺身而出的人。保護他們的生命與家庭安全，是工會最核心、最不可妥協的職責。」\n\n詳細投保流程與會員權益說明書將於近日寄發至您的電子信箱。若有任何疑問，歡迎撥打權益關懷專線 (02)8666-8111 諮詢。\n\n台灣環境生態護育產業工會 🛡️",
          imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800",
          isPinned: true
        },
        {
          id: "news-3",
          title: "💧 【防暑與防刺】滴滴提醒您：夏季淨灘出勤預防傷暑與刺傷的三大心法",
          category: "活動公告",
          date: "2026-07-12",
          summary: "酷暑來臨，海灘現場氣溫飆高，且暗藏玻璃碎片與廢棄魚鉤。環境守護獸「滴滴」提醒所有淨灘夥伴，務必掌握「補水、防曬、穿厚底」三大要訣，高高興興出門、平平安安回家！",
          content: "哈囉各位愛地球的環境守護勇士！我是滴滴 💧！\n\n夏天到了，看見大家頂著烈日，在沙灘上彎腰撿拾海洋垃圾、保衛海洋生態，滴滴心裡真的無比感動，但也非常擔心大家的中暑和受傷狀況捏！\n\n夏天的沙灘地表溫度常常突破 45 度，海風夾雜高溫，水分流失極快；同時，沙子底下可能掩埋著看不見的碎玻璃、鏽蝕鐵釘或廢棄魚鉤。\n\n為了保護大家，滴滴整理了「夏季淨灘安全三大心法」，大家一定要背起來喔！\n\n1. **定時定量補水，絕不「渴了才喝」**：\n   每 20 分鐘一定要到陰涼處喝水 150-200ml。建議攜帶含有微量鹽分的運動飲料，預防體內電解質失衡導致熱痙攣。\n\n2. **手套與厚底鞋是安全的基本底線**：\n   絕對不要穿夾腳拖或涼鞋淨灘！務必穿著「厚底防滑運動鞋」或「安全雨鞋」，防範鐵釘刺穿。撿拾垃圾時一定要配戴「防刺耐磨手套」，嚴禁徒手觸摸不明針筒或廢棄網具。\n\n3. **注意熱衰竭的前兆**：\n   如果出勤中感到頭暈、心跳加速、大量出汗後突然皮膚乾熱無汗、噁心想吐，這已經是熱傷害的警訊！請立即通知同組夥伴，移至陰涼通風處、解開領口，並使用濕毛巾擦拭額頭與頸部散熱。\n\n工會出勤現場皆備有緊急醫藥箱與遮陽帳，若夥伴有任何不適，請立即向組長反映。讓我們一起健康、快樂地守護海岸線！ 🌍",
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
        category: req.body.category || "活動公告",
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
