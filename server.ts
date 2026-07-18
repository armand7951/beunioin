import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
