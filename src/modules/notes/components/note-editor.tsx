"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/core/utils/cn";
import type { Editor } from "@tiptap/react";
import { FontSize } from "@/modules/notes/extensions/font-size";

interface NoteEditorProps {
  content: string | null;
  onUpdate: (content: string) => void;
  className?: string;
  editorClassName?: string;
  onEditorReady?: (editor: Editor | null) => void;
}

export function NoteEditor({ content, onUpdate, className, editorClassName, onEditorReady }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      FontSize,
      Placeholder.configure({
        placeholder: "Viết ghi chú..."
      })
    ],
    content: content ?? "",
    editorProps: {
      attributes: {
        class: cn(
          "tiptap min-h-[55vh] focus:outline-none text-sm leading-relaxed text-text",
          editorClassName
        )
      }
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    }
  });

  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    if (content === editor.getHTML()) return;
    editor.commands.setContent(content ?? "", false);
  }, [content, editor]);

  return (
    <div className={cn("h-full", className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
