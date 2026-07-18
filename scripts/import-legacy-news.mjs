import { writeFile } from "node:fs/promises";

const apiBase = "https://beunion.tw/wp-json/wp/v2/posts";

function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    laquo: "«",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    raquo: "»",
    rdquo: "”",
    rsquo: "’",
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&([a-z]+);/gi, (entity, name) => named[name] ?? entity);
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<h2[^>]*>/gi, "\n## ")
      .replace(/<h3[^>]*>/gi, "\n### ")
      .replace(/<h4[^>]*>/gi, "\n#### ")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|h2|h3|h4|li|ul|ol|figure|blockquote|div)>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function loadPost(id) {
  const response = await fetch(
    `${apiBase}/${id}?_fields=id,date,title,excerpt,content`,
  );
  if (!response.ok) {
    throw new Error(`Unable to load legacy post ${id}: ${response.status}`);
  }
  return response.json();
}

const [hedgehogPost, companionPost] = await Promise.all([
  loadPost(2103),
  loadPost(2070),
]);

const articles = [
  {
    id: "legacy-hedgehog-guide",
    title: "刺蝟飼養全指南｜價格、壽命、氣味、飲食 4 大攻略超解析",
    category: "知識分享",
    date: "2026-01-18",
    summary:
      "想養刺蝟前一定要看！整理刺蝟飼養價格、壽命、氣味來源、飲食與環境照護重點，避免衝動飼養與常見誤解。",
    content: htmlToText(hedgehogPost.content.rendered),
    imageUrl: "/news/hedgehog-cover.jpeg",
    isPinned: true,
    sourceUrl: "https://beunion.tw/hedgehog-knowledge/",
    images: [
      {
        imageUrl: "/news/hedgehog-eating.jpeg",
        alt: "刺蝟正在進食",
        caption:
          "刺蝟飼養需求細緻，需要穩定環境與正確照護。圖片來源：Freepik。",
      },
      {
        imageUrl: "/news/hedgehog-cover.jpeg",
        alt: "刺蝟飼養環境",
        caption:
          "刺蝟飼養需要適當溫度管理、健康飲食與安全環境配置。圖片來源：Freepik。",
      },
      {
        imageUrl: "/news/hedgehog-health.jpg",
        alt: "刺蝟在自然環境中活動",
        caption:
          "刺蝟平均壽命約為 4～6 年，良好環境管理與日常觀察有助維持健康。Photo by Sierra NiCole Narvaeth on Unsplash。",
      },
      {
        imageUrl: "/news/hedgehog-diet.jpg",
        alt: "刺蝟接近食碗",
        caption:
          "刺蝟飲食需以高蛋白、適當脂肪為主。Image by jcomp on Freepik。",
      },
      {
        imageUrl: "/news/hedgehog-cleaning.jpg",
        alt: "刺蝟在乾淨草墊環境中活動",
        caption:
          "多數異味來自環境清潔與排泄物管理不當。Image by kuritafsheen77 on Freepik。",
      },
      {
        imageUrl: "/news/hedgehog-home.jpg",
        alt: "刺蝟在柔軟保暖的環境中",
        caption:
          "穩定溫度、乾燥且具遮蔽感的空間，是刺蝟健康管理的基礎。Photo by Taylor Binkley on Unsplash。",
      },
    ],
  },
  {
    id: "legacy-companion-animal-day-2025",
    title: "2025國際同伴動物日",
    category: "活動紀錄",
    date: "2025-06-26",
    summary:
      "第三屆國際同伴動物日以「保護動物，就是保護婦幼的第一道防線」為主軸，倡議建立跨領域通報與預防機制。",
    content: htmlToText(companionPost.content.rendered),
    imageUrl: "/news/companion-day-cover.jpeg",
    isPinned: false,
    sourceUrl:
      "https://beunion.tw/2025%E5%9C%8B%E9%9A%9B%E5%90%8C%E4%BC%B4%E5%8B%95%E7%89%A9%E6%97%A5/",
    images: [
      { imageUrl: "/news/companion-day-01.avif", alt: "國際同伴動物日活動照片" },
      { imageUrl: "/news/companion-day-02.webp", alt: "國際同伴動物日活動現場" },
      { imageUrl: "/news/companion-day-03.jpeg", alt: "國際同伴動物日參與夥伴" },
      { imageUrl: "/news/companion-day-04.jpeg", alt: "國際同伴動物日交流活動" },
      { imageUrl: "/news/companion-day-05.jpeg", alt: "國際同伴動物日展區" },
      { imageUrl: "/news/companion-day-06.jpeg", alt: "國際同伴動物日現場紀錄" },
      { imageUrl: "/news/companion-day-07.jpeg", alt: "國際同伴動物日活動合影" },
      { imageUrl: "/news/companion-day-08.jpeg", alt: "國際同伴動物日宣導照片" },
      { imageUrl: "/news/companion-day-09.jpeg", alt: "國際同伴動物日參與者照片" },
    ],
  },
];

for (const article of articles) {
  article.images = article.images.map((image) => ({
    type: "image",
    ...image,
  }));
}

const output = `export interface NewsImage {
  type: "image";
  imageUrl: string;
  alt: string;
  caption?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  content: string;
  imageUrl?: string;
  isPinned: boolean;
  sourceUrl?: string;
  images?: NewsImage[];
}

export const IMPORTED_NEWS: NewsItem[] = ${JSON.stringify(articles, null, 2)};
`;

await writeFile("src/data/news.ts", output);
