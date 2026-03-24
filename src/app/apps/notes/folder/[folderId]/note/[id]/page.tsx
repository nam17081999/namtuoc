"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { cn } from "@/core/utils/cn";
import { useAutosave } from "@/hooks/use-autosave";
import { NoteEditor } from "@/modules/notes/components/note-editor";
import { useDeleteNote, useNote, useUpsertNote } from "@/modules/notes/hooks";
import { ChevronLeft, PlusCircle, Trash2 } from "lucide-react";
import type { Editor } from "@tiptap/react";

const sizeActions = [
  { key: "sm", label: "Bé", size: "10px" },
  { key: "md", label: "Vừa", size: "16px" },
  { key: "lg", label: "To", size: "24px" }
] as const;

type SizeKey = (typeof sizeActions)[number]["key"];

export default function NoteEditorInFolderPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = typeof params?.id === "string" ? params.id : "";
  const folderId = typeof params?.folderId === "string" ? params.folderId : "all";
  const isAll = folderId === "all";
  const isDeleted = folderId === "deleted";

  const { data: note } = useNote(noteId);
  const upsertNote = useUpsertNote();
  const deleteNote = useDeleteNote();

  const [content, setContent] = useState("");
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [currentSize, setCurrentSize] = useState<SizeKey>("md");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (editorInstance && !content) {
      editorInstance.commands.setFontSize("16px");
      setCurrentSize("md");
    }
  }, [editorInstance, content]);

  useEffect(() => {
    if (!editorInstance) return;
    const handler = () => {
      const attrs = editorInstance.getAttributes("textStyle");
      const storedMarks = editorInstance.state.storedMarks ?? [];
      const stored = storedMarks.find((mark) => mark.type.name === "textStyle");
      const size =
        (stored?.attrs?.fontSize as string | undefined) ||
        (attrs?.fontSize as string | undefined) ||
        (editorInstance.storage?.fontSize?.current as string | undefined);

      if (size === "10px") setCurrentSize("sm");
      else if (size === "24px") setCurrentSize("lg");
      else if (size === "16px") setCurrentSize("md");
    };
    editorInstance.on("selectionUpdate", handler);
    editorInstance.on("transaction", handler);
    return () => {
      editorInstance.off("selectionUpdate", handler);
      editorInstance.off("transaction", handler);
    };
  }, [editorInstance]);

  useEffect(() => {
    if (note?.content) {
      setContent(note.content);
    } else if (note) {
      setContent("");
    }
  }, [note?.id, note?.content]);

  const extractTitle = (html: string) => {
    const plain = html.replace(/<[^>]+>/g, "").trim();
    const firstLine = plain.split(/\n/)[0] ?? "";
    return firstLine.slice(0, 60) || "Ghi chú mới";
  };

  useAutosave(
    async () => {
      if (!noteId) return;
      setStatus("saving");
      const title = extractTitle(content);
      await upsertNote.mutateAsync({ id: noteId, title, content, folder_id: note?.folder_id ?? null });
      setStatus("saved");
    },
    1500,
    [content, noteId]
  );

  const handleDelete = async () => {
    if (!noteId) return;
    const confirmed = window.confirm("Bạn có chắc muốn xóa ghi chú này?");
    if (!confirmed) return;
    await deleteNote.mutateAsync(noteId);
    router.push(isDeleted ? "/apps/notes/deleted" : `/apps/notes/folder/${folderId}`);
  };

  const handleCreate = async () => {
    const result = await upsertNote.mutateAsync({
      title: "Ghi chú mới",
      content: "",
      folder_id: isAll || isDeleted ? null : folderId
    });
    router.push(isDeleted ? `/apps/notes/folder/all/note/${result.id}` : `/apps/notes/folder/${folderId}/note/${result.id}`);
  };

  const statusLabel = useMemo(() => {
    if (status === "saving") return "Đang lưu";
    if (status === "saved") return "Đã lưu";
    return "Tự lưu";
  }, [status]);

  return (
    <AuthGate>
      <div className="icloud-notes px-3 py-4 sm:px-5">
        <div className="mb-4 flex items-center justify-between text-amber-300">
          <div className="flex items-center gap-3">
            <Link href={isDeleted ? "/apps/notes/deleted" : `/apps/notes/folder/${folderId}`} className="text-amber-300">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <button type="button" onClick={handleDelete} aria-label="Xóa ghi chú" className="text-amber-300">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {sizeActions.map((item) => {
              const isActive = currentSize === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (!editorInstance) return;
                    setCurrentSize(item.key);
                    editorInstance.chain().focus().setFontSize(item.size).run();
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    isActive ? "bg-amber-400 text-[#1b1c20]" : "text-amber-300"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={handleCreate} aria-label="Ghi chú mới" className="text-amber-300">
            <PlusCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs text-muted">{statusLabel}</div>

        <div className="mt-4">
          <NoteEditor
            content={content}
            onUpdate={setContent}
            className="border-transparent bg-transparent p-0"
            onEditorReady={setEditorInstance}
          />
        </div>
      </div>
    </AuthGate>
  );
}

