import React, { useId, useState } from "react";
import { ChevronDown, ChevronUp, ListTree } from "lucide-react";
import type { TocEntry } from "../lib/articleToc";

// 文章頁的「本文目錄」方框：h2 一層、h3 縮排在其下，編號用 buildToc 算好的
// 「1.」「1.1」。可收合，點了平滑捲到該節（標題有 scroll-margin-top 讓開 sticky Header）。

type TocGroup = { entry: TocEntry; children: TocEntry[] };

function groupEntries(entries: TocEntry[]): TocGroup[] {
  const groups: TocGroup[] = [];
  for (const entry of entries) {
    // buildToc 已把落單的 h3 升成第一層，這裡的 groups.length === 0 只是保險
    if (entry.level === 2 || groups.length === 0) groups.push({ entry, children: [] });
    else groups[groups.length - 1].children.push(entry);
  }
  return groups;
}

function jumpTo(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  // 不走瀏覽器原生的 #hash 跳轉：它會直接瞬移，而且觸發 popstate 讓 App 重跑一次路由。
  event.preventDefault();
  const target = document.getElementById(id);
  if (!target) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  // 網址列同步帶上 #id，複製連結分享時能直接落在那一節；replace 不新增歷史紀錄，
  // 否則讀者按返回會在目錄項目之間倒退，回不到列表。
  window.history.replaceState(window.history.state, "", `#${id}`);
}

function TocLink({ entry }: { entry: TocEntry }) {
  const major = entry.level === 2;
  return (
    <a
      href={`#${entry.id}`}
      onClick={(event) => jumpTo(event, entry.id)}
      className={`group flex items-baseline gap-2 leading-snug hover:text-emerald-700 ${
        major ? "font-black text-[#1e293b]" : "font-bold text-slate-600"
      }`}
    >
      <span className="shrink-0 text-amber-700 font-black tabular-nums">{entry.number}</span>
      <span className="group-hover:underline underline-offset-4 decoration-2">{entry.text}</span>
    </a>
  );
}

export default function ArticleToc({ entries }: { entries: TocEntry[] }) {
  const [open, setOpen] = useState(true);
  const headingId = useId();
  const panelId = useId();

  // 只有一個標題的目錄沒有導覽價值，只是多一個方框
  if (entries.length < 2) return null;

  const groups = groupEntries(entries);

  return (
    <nav
      aria-labelledby={headingId}
      className="rounded-2xl border-3 border-[#1e293b] bg-[#fdfbf7] bubbly-shadow p-5 my-8"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-lg font-black text-[#1e293b]">
          <ListTree className="w-5 h-5 text-amber-600" aria-hidden="true" />
          本文目錄
        </h2>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-[#1e293b] bg-white text-xs font-black hover:bg-amber-100 transition-colors"
        >
          {open ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
          {open ? "收合" : "展開"}
        </button>
      </div>

      <ol id={panelId} hidden={!open} className="mt-4 space-y-2">
        {groups.map(({ entry, children }) => (
          <li key={entry.id}>
            <TocLink entry={entry} />
            {children.length > 0 && (
              <ol className="mt-1.5 pl-6 space-y-1.5">
                {children.map((child) => (
                  <li key={child.id}>
                    <TocLink entry={child} />
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
