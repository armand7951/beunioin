// 首頁「活動」與「文章」兩區的卡片版面共用這組 class。
// 分開寫兩份的話，日後只改其中一邊，兩區的卡片就會慢慢長得不一樣。

// 手機是可左右滑的一列（snap 讓它一張一張停），lg 以上才變成三欄格線。
//
// -mx-4 px-4 這組是刻意的：捲動容器要能滿版出血到螢幕邊緣，否則最後一張卡片
// 右側會被容器的內距切掉一塊，看起來像沒捲完。lg 以上再把它歸零。
export const CARD_GRID =
  "flex snap-x snap-mandatory overflow-x-auto -mx-4 px-4 pb-4 gap-6 " +
  "lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0";

// shrink-0 不能省：flex 子項預設會被壓縮以塞進容器，少了它卡片會全部擠在一個螢幕寬內，
// 於是根本捲不動。
export const CARD_ITEM = "snap-start shrink-0 w-[85%] sm:w-[55%] lg:w-auto";

// 圖片區高度兩邊一致；活動海報是直式 EDM，用 object-contain 才不會被裁掉。
export const CARD_MEDIA = "h-48 w-full overflow-hidden border-b-3 border-[#1e293b] bg-slate-100";

// 首頁最多顯示兩排（三欄 × 兩排）。超過的收在「看更多」後面。
export const HOME_CARD_LIMIT = 6;
