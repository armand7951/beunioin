import React from "react";

// 內頁頂部的麵包屑（首頁 › 工會文章 › 分類 › 標題）。站內換頁走 App 的
// handleNavigation，所以可點的項目是 button 而不是 <a href>；最後一項是目前頁面，
// 不可點、標 aria-current，太長就截斷，別讓一整行標題把版面撐開。

export type BreadcrumbItem = {
  label: string;
  onClick?: () => void;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="麵包屑">
      <ol className="flex flex-wrap items-center gap-1 text-sm font-bold text-slate-500">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`} className="flex items-center gap-1 min-w-0">
              {index > 0 && (
                <span aria-hidden="true" className="text-slate-400">
                  ›
                </span>
              )}
              {item.onClick && !last ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-[#1e293b] hover:underline underline-offset-4 decoration-2 transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "truncate max-w-[60vw] text-[#1e293b]" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
