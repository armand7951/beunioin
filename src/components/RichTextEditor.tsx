import React, { useCallback } from "react";
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Info,
  Italic,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  Loader2,
  MessageSquareWarning,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Trash2,
  TriangleAlert,
  Underline,
  Undo2,
} from "lucide-react";
import { Figure } from "../lib/tiptap/figure";
import { Callout, type CalloutKind } from "../lib/tiptap/callout";

interface Props {
  contentJson: JSONContent | null;
  contentHtml: string;
  onChange: (value: { html: string; json: JSONContent }) => void;
  onUploadImage: (file: File) => Promise<string>;
}

const CALLOUT_LABELS: { kind: CalloutKind; label: string; icon: React.ReactNode }[] = [
  { kind: "info", label: "資訊", icon: <Info className="w-3.5 h-3.5" /> },
  { kind: "warning", label: "注意", icon: <TriangleAlert className="w-3.5 h-3.5" /> },
  { kind: "tip", label: "小提醒", icon: <Lightbulb className="w-3.5 h-3.5" /> },
];

function ToolButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // type="button" 不能省。這個編輯器被放在 <form> 裡，預設的 type 是 submit，
      // 按任何一個工具鈕都會直接送出表單。
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${
        active ? "bg-[#1e293b] text-white" : "hover:bg-slate-200 text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

// 情境列（表格／提示框）用的小文字鈕：這些操作靠圖示認不出來，直接寫字。
function ChipButton({
  active,
  danger,
  onClick,
  children,
}: {
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-colors ${
        active
          ? "bg-[#1e293b] text-white"
          : danger
            ? "text-red-700 hover:bg-red-100"
            : "text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="w-px h-5 bg-slate-300 mx-1" />;

export default function RichTextEditor({
  contentJson,
  contentHtml,
  onChange,
  onUploadImage,
}: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");

  const editor = useEditor({
    extensions: [
      // StarterKit 3 已內建 Link 與 Underline，另外再掛一份 Link 會重複註冊。
      StarterKit.configure({
        link: {
          openOnClick: false,
          // 只允許這幾種協定。少了這一行，貼上 javascript: 開頭的連結會原樣寫進
          // content_html，前台用 dangerouslySetInnerHTML 渲染出來就是可點擊的 XSS。
          protocols: ["http", "https", "mailto"],
        },
        // 文章標題本身是 h1，內文只給 h2–h4（h4 不上工具列，留給貼上的內容用）。
        heading: { levels: [2, 3, 4] },
      }),
      // 保留 Image：三篇新文的內文是裸 <img>，schema 少了它重存就會掉圖。
      // 工具列插圖一律走 Figure（圖片＋圖說）。
      Image.configure({ inline: false }),
      // 表格在編輯器裡由 TipTap 的 node view 包在 <div class="tableWrapper">（可橫向捲動）；
      // 存進 content_html 的是裸 <table>，前台 prepareArticle（src/lib/articleHtml.ts）
      // 會自己補 .table-scroll 外框，所以這裡不開 renderWrapper，免得前台包成兩層。
      TableKit.configure({ table: { resizable: false } }),
      Figure,
      Callout,
      Placeholder.configure({
        placeholder: ({ node }) => (node.type.name === "figure" ? "在這裡輸入圖說…" : "開始撰寫文章內容…"),
      }),
    ],
    // json 是來源真相；沒有 json 的舊資料（或匯入的）才退回吃 html。
    content: contentJson ?? contentHtml ?? "",
    editorProps: {
      attributes: {
        // article-body 與前台文章頁共用同一份樣式（src/styles/article.css），
        // 後台看到的就是前台長的樣子。
        class: "article-body focus:outline-none min-h-[320px]",
      },
    },
    onUpdate: ({ editor: instance }) =>
      onChange({ html: instance.getHTML(), json: instance.getJSON() }),
  });

  // @tiptap/react 3 預設不再因為每個 transaction 重繪元件（shouldRerenderOnTransaction=false），
  // 直接在 JSX 裡讀 editor.isActive() 只會在父層剛好重繪時才對。游標移進表格、
  // 移到粗體字上這種「只動選取、不動內容」的情況，工具列狀態會停在舊值。
  // 改用 useEditorState 挑出工具列需要的旗標，值有變才重繪。
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) return null;
      return {
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        strike: current.isActive("strike"),
        heading2: current.isActive("heading", { level: 2 }),
        heading3: current.isActive("heading", { level: 3 }),
        blockquote: current.isActive("blockquote"),
        callout: current.isActive("callout"),
        calloutKind: (current.getAttributes("callout").kind as CalloutKind | undefined) ?? null,
        bulletList: current.isActive("bulletList"),
        orderedList: current.isActive("orderedList"),
        link: current.isActive("link"),
        table: current.isActive("table"),
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
      };
    },
  });

  const insertImage = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !editor) return;

      setUploadError("");
      setUploading(true);
      try {
        const url = await onUploadImage(file);
        // 插進去的是 figure（圖片＋圖說），游標會落在圖說裡，直接打字就是圖說。
        // alt 先用檔名去掉副檔名頂著，總比空的好。
        editor
          .chain()
          .focus()
          .setFigure({ src: url, alt: file.name.replace(/\.[^.]+$/, "") })
          .run();
      } catch (caught) {
        setUploadError(caught instanceof Error ? caught.message : "圖片插入失敗。");
      } finally {
        setUploading(false);
      }
    },
    [editor, onUploadImage],
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href ?? "";
    const input = window.prompt("連結網址（留空可移除連結）", previous);
    if (input === null) return;
    if (input.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: input.trim() }).run();
  }, [editor]);

  if (!editor || !active) {
    return (
      <div className="border-2 border-slate-300 rounded-xl h-[380px] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="border-2 border-slate-300 rounded-xl overflow-hidden focus-within:border-emerald-600">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-100 border-b-2 border-slate-200">
        {/* 文字 */}
        <ToolButton
          title="粗體"
          active={active.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="斜體"
          active={active.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="底線"
          active={active.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="刪除線"
          active={active.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="w-4 h-4" />
        </ToolButton>

        <Divider />

        {/* 結構 */}
        <ToolButton
          title="標題二"
          active={active.heading2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="標題三"
          active={active.heading3}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="引用"
          active={active.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="提示框"
          active={active.callout}
          onClick={() => editor.chain().focus().toggleCallout("info").run()}
        >
          <MessageSquareWarning className="w-4 h-4" />
        </ToolButton>

        <Divider />

        {/* 清單 */}
        <ToolButton
          title="項目清單"
          active={active.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="編號清單"
          active={active.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolButton>

        <Divider />

        {/* 插入 */}
        <ToolButton title="連結" active={active.link} onClick={setLink}>
          <Link2 className="w-4 h-4" />
        </ToolButton>
        <label
          title="插入圖片"
          className={`p-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-200 text-slate-600 ${
            uploading ? "opacity-50 cursor-wait" : ""
          }`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={insertImage}
          />
        </label>
        <ToolButton
          title="插入表格（3×3，含表頭列）"
          active={active.table}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <Table className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="分隔線"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="w-4 h-4" />
        </ToolButton>

        <span className="flex-1" />

        {/* 復原／重做 */}
        <ToolButton
          title="復原"
          disabled={!active.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="重做"
          disabled={!active.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="w-4 h-4" />
        </ToolButton>
      </div>

      {/* 情境列：游標在表格裡才出現的表格操作 */}
      {active.table && (
        <div className="flex flex-wrap items-center gap-1 px-2 py-1 bg-emerald-50 border-b-2 border-slate-200">
          <span className="text-xs font-black text-emerald-800 mr-1">表格</span>
          <ChipButton onClick={() => editor.chain().focus().addRowBefore().run()}>上方加列</ChipButton>
          <ChipButton onClick={() => editor.chain().focus().addRowAfter().run()}>下方加列</ChipButton>
          <ChipButton danger onClick={() => editor.chain().focus().deleteRow().run()}>
            刪除列
          </ChipButton>
          <Divider />
          <ChipButton onClick={() => editor.chain().focus().addColumnBefore().run()}>左方加欄</ChipButton>
          <ChipButton onClick={() => editor.chain().focus().addColumnAfter().run()}>右方加欄</ChipButton>
          <ChipButton danger onClick={() => editor.chain().focus().deleteColumn().run()}>
            刪除欄
          </ChipButton>
          <Divider />
          <ChipButton onClick={() => editor.chain().focus().toggleHeaderRow().run()}>切換表頭列</ChipButton>
          <ChipButton danger onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 className="w-3.5 h-3.5" />
            刪除表格
          </ChipButton>
        </div>
      )}

      {/* 情境列：游標在提示框裡才出現的型別切換 */}
      {active.callout && (
        <div className="flex flex-wrap items-center gap-1 px-2 py-1 bg-amber-50 border-b-2 border-slate-200">
          <span className="text-xs font-black text-amber-900 mr-1">提示框型別</span>
          {CALLOUT_LABELS.map(({ kind, label, icon }) => (
            <ChipButton
              key={kind}
              active={active.calloutKind === kind}
              onClick={() => editor.chain().focus().setCalloutKind(kind).run()}
            >
              {icon}
              {label}
            </ChipButton>
          ))}
          <Divider />
          <ChipButton danger onClick={() => editor.chain().focus().toggleCallout().run()}>
            移除提示框
          </ChipButton>
        </div>
      )}

      <p className="px-4 py-1.5 text-[11px] text-slate-500 bg-slate-50 border-b border-slate-200">
        圖片插入後可直接在圖下方輸入圖說；表格內按 Tab 換格。
      </p>

      {uploadError && (
        <p className="px-4 py-2 bg-red-50 text-red-800 text-xs font-black">{uploadError}</p>
      )}

      {/* 內距放在外層，不塞進 article-body —— 那個 class 前台也在用，不該帶編輯器的留白 */}
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
