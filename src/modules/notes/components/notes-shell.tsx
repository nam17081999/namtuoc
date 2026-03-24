"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/core/utils/cn";
import { useAutosave } from "@/hooks/use-autosave";
import { useNotesUIStore } from "@/store/notes-store";
import { NoteEditor } from "./note-editor";
import { FolderList } from "./folder-list";
import { NoteList } from "./note-list";
import { useDeleteNote, useFolders, useNotes, useNote, useUpsertNote } from "../hooks";
import { PlusCircle, Trash2 } from "lucide-react";

const fontSizeOptions = [
  { value: "sm", label: "Bé" },
  { value: "md", label: "Vừa" },
  { value: "lg", label: "To" }
] as const;

type FontSize = (typeof fontSizeOptions)[number]["value"];

const fontSizeClasses: Record<FontSize, string> = {
  sm: "tiptap text-sm",
  md: "tiptap text-base",
  lg: "tiptap text-lg"
};

export function NotesShell() {
  const router = useRouter();
  const { activeFolderId, activeNoteId, setActiveFolder, setActiveNote } = useNotesUIStore();
  const { data: folders = [] } = useFolders();
  const { data: notes = [] } = useNotes(activeFolderId);
  const { data: activeNote } = useNote(activeNoteId);
  const upsertNote = useUpsertNote();
  const deleteNote = useDeleteNote();

  const [draftContent, setDraftContent] = useState<string>("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [fontSize, setFontSize] = useState<FontSize>("md");

  useEffect(() => {
    if (activeNote?.content) {
      setDraftContent(activeNote.content);
    } else if (activeNote) {
      setDraftContent("");
    }
  }, [activeNote?.id, activeNote?.content]);

  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNote(notes[0].id);
    }
  }, [activeNoteId, notes, setActiveNote]);

  const extractTitle = (html: string) => {
    const plain = html.replace(/<[^>]+>/g, "").trim();
    const firstLine = plain.split(/\n/)[0] ?? "";
    return firstLine.slice(0, 60) || "Ghi chú mới";
  };

  useAutosave(
    async () => {
      if (!activeNoteId) return;
      setSaveState("saving");
      const title = extractTitle(draftContent);
      await upsertNote.mutateAsync({ id: activeNoteId, title, content: draftContent, folder_id: activeFolderId });
      setSaveState("saved");
    },
    2000,
    [draftContent, activeNoteId, activeFolderId]
  );

  const handleCreateNote = async () => {
    setSaveState("saving");
    const result = await upsertNote.mutateAsync({
      title: "Ghi chú mới",
      content: "",
      folder_id: activeFolderId
    });
    setActiveNote(result.id);
    setSaveState("saved");
  };

  const handleDeleteNote = async () => {
    if (!activeNoteId) return;
    const confirmed = window.confirm("Bạn có chắc muốn xóa ghi chú này?");
    if (!confirmed) return;
    setSaveState("saving");
    await deleteNote.mutateAsync(activeNoteId);
    setActiveNote(null);
    setDraftContent("");
    setSaveState("idle");
  };

  const statusLabel = useMemo(() => {
    if (saveState === "saving") return "Đang lưu...";
    if (saveState === "saved") return "Đã lưu";
    return "Tự lưu sau 2 giây";
  }, [saveState]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 rounded-3xl bg-background/60 p-4 shadow-sm ring-1 ring-border/40">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="icloud-sidebar rounded-2xl bg-card/70 p-3 ring-1 ring-border/40">
          <FolderList
            folders={folders}
            activeFolderId={activeFolderId}
            onSelect={setActiveFolder}
            onOpenDeleted={() => router.push("/apps/notes/deleted")}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Ghi chú</span>
              <span className="text-[11px] text-muted">{statusLabel}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteNote}
                disabled={!activeNoteId}
                className="h-8 rounded-full px-3 text-[11px]"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Xóa
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-full bg-amber-500 px-3 text-[11px] text-[#0c0f18]"
                onClick={handleCreateNote}
              >
                <PlusCircle className="mr-1 h-3 w-3" />
                Mới
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-card/60 px-4 py-2 ring-1 ring-border/40">
            <span className="text-[11px] uppercase tracking-[0.25em] text-muted">Kích thước chữ</span>
            <div className="inline-flex gap-1 rounded-full bg-background/80 p-1">
              {fontSizeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFontSize(option.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-medium transition",
                    fontSize === option.value
                      ? "bg-amber-500 text-[#0c0f18]"
                      : "text-muted hover:text-text"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-[320px] flex-col gap-3 rounded-2xl bg-card/70 p-3 ring-1 ring-border/40">
            <div className="flex-1 overflow-hidden rounded-2xl bg-background/80 p-3">
              <NoteEditor content={draftContent} onUpdate={setDraftContent} className={fontSizeClasses[fontSize]} />
            </div>
          </div>

          <div className="rounded-2xl bg-card/70 p-3 ring-1 ring-border/40">
            <NoteList
              notes={notes}
              activeNoteId={activeNoteId}
              onSelect={(id) => {
                setActiveNote(id);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


