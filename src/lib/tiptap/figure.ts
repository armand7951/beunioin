// 「圖片＋圖說」節點：輸出 <figure><img><figcaption>…</figcaption></figure>。
//
// 為什麼不用 @tiptap/extension-image 就好：正式 DB 有兩篇舊文（legacy-hedgehog-guide、
// legacy-companion-animal-day-2025）是 <figure> 包 <img> 加 <figcaption>，content_json 為 null，
// 編輯器吃的是 HTML。Image 只認 <img>，schema 認不得 figure 就會把它拆掉、圖說整段丟失，
// 後台只要重存一次就掉東西。這個節點讓 figure 在「HTML → 文件 → HTML」一輪之後原樣保留。
//
// 圖片屬性（src/alt/width/height）掛在 figure 節點上，渲染時寫到內層 <img>；
// 節點內容就是圖說本身（inline*），使用者直接在圖下方打字。
import { Node, mergeAttributes } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

export interface FigureAttributes {
  src: string;
  alt?: string | null;
  width?: string | number | null;
  height?: string | number | null;
}

export interface SetFigureOptions {
  src: string;
  alt?: string | null;
  caption?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      /** 在目前位置插入一張帶圖說的圖片；caption 有給就先填進圖說。 */
      setFigure: (options: SetFigureOptions) => ReturnType;
    };
  }
}

// 圖片屬性都從內層 <img> 讀，而不是 figure 自己（figure 身上本來就沒有 src）。
// rendered: false —— 否則 TipTap 會把這些屬性也寫到 <figure> 標籤上。
function imageAttribute(name: keyof FigureAttributes) {
  return {
    default: null,
    rendered: false,
    parseHTML: (element: HTMLElement) => element.querySelector("img")?.getAttribute(name) ?? null,
  };
}

export const Figure = Node.create({
  name: "figure",
  group: "block",
  content: "inline*",
  draggable: true,
  // isolating：圖說開頭按 Backspace 不會把圖說併進上一段（那會把整張圖一起吃掉）。
  isolating: true,

  addAttributes() {
    return {
      src: imageAttribute("src"),
      alt: imageAttribute("alt"),
      width: imageAttribute("width"),
      height: imageAttribute("height"),
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        // 沒有 <img> 的 figure（例如包引用或影片的）不歸這個節點管，回 false 讓解析器往下走。
        getAttrs: (element) => (element.querySelector("img") ? null : false),
        // 圖說只從 <figcaption> 讀。舊文 legacy-companion-animal-day-2025 的九張圖都沒有
        // figcaption；這裡不能用字串形式的 contentElement: "figcaption"——querySelector 找不到
        // 會回 null，ProseMirror 拿 null 去讀 firstChild，整個編輯器在載入時就炸掉。
        // 找不到就給一個空元素，圖說視為空白。
        contentElement: (element) =>
          element.querySelector("figcaption") ?? element.ownerDocument.createElement("figcaption"),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, alt, width, height } = node.attrs as FigureAttributes;
    // 沒有值的屬性不輸出（不要出現 width="null"）。loading="lazy" 之類的載入提示
    // 由前台 prepareArticle（src/lib/articleHtml.ts）統一補，存進 DB 的 HTML 只留內容本身。
    const image: Record<string, string | number> = { src };
    if (alt) image.alt = alt;
    if (width) image.width = width;
    if (height) image.height = height;
    // 不加「可編輯／可拖曳」那類編輯器內部屬性 —— 這是要存進 content_html 給前台用的 HTML，
    // 不是編輯器的殼；那些屬性由 ProseMirror 自己在畫面上加。
    return ["figure", mergeAttributes(HTMLAttributes), ["img", image], ["figcaption", 0]];
  },

  addCommands() {
    return {
      setFigure:
        ({ src, alt, caption }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src, alt: alt ?? null },
            ...(caption ? { content: [{ type: "text", text: caption }] } : {}),
          }),
    };
  },

  addKeyboardShortcuts() {
    return {
      // 圖說裡按 Enter：預設的 splitBlock 會把 figure 切成兩個同 src 的節點（圖片變兩張），
      // 改成把游標移到圖片下方的段落，符合「打完圖說繼續寫內文」的直覺。
      // 下面已經有空段落（文件結尾的 TrailingNode 一定會補一個）就直接用，不再多開一個。
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        if ($from.parent.type !== this.type) return false;
        const after = $from.after();
        const next = state.doc.nodeAt(after);
        const hasEmptyParagraphBelow = next?.type === state.schema.nodes.paragraph && next.content.size === 0;
        return editor
          .chain()
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              if (!hasEmptyParagraphBelow) tr.insert(after, state.schema.nodes.paragraph.create());
              tr.setSelection(TextSelection.create(tr.doc, after + 1));
              tr.scrollIntoView();
            }
            return true;
          })
          .run();
      },
    };
  },
});

export default Figure;
