// 兩個外部 Gemini Gem，取代原本站內的 AI 守護獸與權益檢測挑戰。
// 集中在這裡定義，避免同一組網址散落在 Hero、首頁卡片與 Footer 三個地方，
// 日後換連結時漏改其中一處。
export interface AiPartner {
  id: string;
  label: string;
  emoji: string;
  url: string;
  description: string;
}

export const AI_PARTNERS: AiPartner[] = [
  {
    id: "decisive",
    label: "果斷小夥伴",
    emoji: "💎",
    url: "https://gemini.google.com/gem/1LG7Kap8MObqZywHyoLqeqRsVh5SE2Bg8?usp=sharing",
    description: "需要明確方向與判斷時，直接給你可執行的建議。",
  },
  {
    id: "gentle",
    label: "溫柔小夥伴",
    emoji: "💎",
    url: "https://gemini.google.com/gem/1gm_je4qywvTNN-C5atD2l5m10JC_aRaY?usp=sharing",
    description: "想先被理解、慢慢釐清狀況時，陪你把話說完。",
  },
];
