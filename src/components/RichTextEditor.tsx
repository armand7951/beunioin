import React, { useCallback } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";

interface Props {
  contentJson: JSONContent | null;
  contentHtml: string;
  onChange: (value: { html: string; json: JSONContent }) => void;
  onUploadImage: (file: File) => Promise<string>;
}

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
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({
        openOnClick: false,
        // 只允許這幾種協定。少了這一行，貼上 javascript: 開頭的連結會原樣寫進
        // content_html，前台用 dangerouslySetInnerHTML 渲染出來就是可點擊的 XSS。
        protocols: ["http", "https", "mailto"],
      }),
    ],
    // json 是來源真相；沒有 json 的舊資料（或匯入的）才退回吃 html。
    content: contentJson ?? contentHtml ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[320px] px-4 py-3 focus:outline-none [&_h2]:font-black [&_h3]:font-black [&_img]:rounded-xl",
      },
    },
    onUpdate: ({ editor: instance }) =>
      onChange({ html: instance.getHTML(), json: instance.getJSON() }),
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
        editor.chain().focus().setImage({ src: url }).run();
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

  if (!editor) {
    return (
      <div className="border-2 border-slate-300 rounded-xl h-[380px] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="border-2 border-slate-300 rounded-xl overflow-hidden focus-within:border-emerald-600">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-100 border-b-2 border-slate-200">
        <ToolButton
          title="粗體"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="斜體"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="刪除線"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="w-4 h-4" />
        </ToolButton>

        <span className="w-px h-5 bg-slate-300 mx-1" />

        <ToolButton
          title="標題二"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="標題三"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="引用"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="w-4 h-4" />
        </ToolButton>

        <span className="w-px h-5 bg-slate-300 mx-1" />

        <ToolButton
          title="項目清單"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="編號清單"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolButton>

        <span className="w-px h-5 bg-slate-300 mx-1" />

        <ToolButton title="連結" active={editor.isActive("link")} onClick={setLink}>
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

        <span className="flex-1" />

        <ToolButton
          title="復原"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          title="重做"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="w-4 h-4" />
        </ToolButton>
      </div>

      {uploadError && (
        <p className="px-4 py-2 bg-red-50 text-red-800 text-xs font-black">{uploadError}</p>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
