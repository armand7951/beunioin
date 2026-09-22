// 提示框節點：輸出 <div data-callout="info|warning|tip">…區塊內容…</div>。
//
// 前台文章頁要有參考站那種「資訊／注意／小提醒」的框，後台就得能產出對應 HTML。
// 用 data-callout 而不是 class，是因為前台的樣式表（src/styles/article.css）只認這個
// 屬性；kind 也只允許三個值，CSS 沒寫到的型別不會出現。
//
// 內容是 block+（段落、清單、引用都可以放），行為比照 blockquote：再按一次就把內容
// 抬出來（lift），型別切換走 setCalloutKind。
import { Node, isNodeActive, mergeAttributes } from "@tiptap/core";

export type CalloutKind = "info" | "warning" | "tip";

export const CALLOUT_KINDS: readonly CalloutKind[] = ["info", "warning", "tip"];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** 把目前區塊包進提示框；已經在提示框裡就抬出來。 */
      toggleCallout: (kind?: CalloutKind) => ReturnType;
      /** 切換目前所在提示框的型別。 */
      setCalloutKind: (kind: CalloutKind) => ReturnType;
    };
  }
}

function normalizeKind(value: string | null | undefined): CalloutKind {
  return (CALLOUT_KINDS as readonly string[]).includes(value ?? "") ? (value as CalloutKind) : "info";
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  // defining：在框內按 Enter 時新段落留在框裡，貼上整段內容也不會把框拆掉（比照 blockquote）。
  defining: true,

  addAttributes() {
    return {
      kind: {
        default: "info",
        // 舊資料或手改的 HTML 若寫了不認識的型別，退回 info 而不是存一個前台畫不出來的值。
        parseHTML: (element: HTMLElement) => normalizeKind(element.getAttribute("data-callout")),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-callout": normalizeKind(attributes.kind as string),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleCallout:
        (kind = "info") =>
        ({ state, commands }) => {
          if (isNodeActive(state, this.name)) return commands.lift(this.name);
          return commands.wrapIn(this.name, { kind });
        },
      setCalloutKind:
        (kind) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { kind }),
    };
  },
});

export default Callout;
