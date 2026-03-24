"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { useDeletedNotes, useHardDeleteNote, useRestoreNote } from "@/modules/notes/hooks";
import { ChevronLeft, RotateCcw, Trash2 } from "lucide-react";

function formatDeletedAt(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function daysLeft(value: string | null) {
  if (!value) return 0;
  const deletedAt = new Date(value);
  const expiresAt = new Date(deletedAt);
  expiresAt.setDate(expiresAt.getDate() + 30);
  const diff = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function DeletedNotesPage() {
  const router = useRouter();
  const { data: notes = [] } = useDeletedNotes();
  const restoreNote = useRestoreNote();
  const hardDeleteNote = useHardDeleteNote();

  const handleRestore = async (noteId: string) => {
    await restoreNote.mutateAsync(noteId);
  };

  const handleDeleteForever = async (noteId: string) => {
    const confirmed = window.confirm("Xóa vĩnh viễn ghi chú này?");
    if (!confirmed) return;
    await hardDeleteNote.mutateAsync(noteId);
  };

  return (
    <AuthGate>
      <div className="icloud-notes px-3 py-4 sm:px-5">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/apps/notes" className="flex items-center gap-2 text-amber-300">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Đã xóa gần đây</p>
            <p className="text-xs text-muted">Ghi chú sẽ được giữ trong 30 ngày</p>
          </div>
          <div className="w-5" />
        </div>

        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-white/5 bg-[#23252b] px-4 py-3 text-white">
              <button
                type="button"
                onClick={() => router.push(`/apps/notes/folder/deleted/note/${note.id}`)}
                className="block w-full text-left"
              >
                <p className="text-sm font-semibold">{note.title ?? "Ghi chú mới"}</p>
                <p className="mt-1 text-xs text-muted">
                  {(note.content ?? "").replace(/<[^>]+>/g, "").slice(0, 96) || "Chưa có nội dung"}
                </p>
              </button>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-muted">
                  <p>Xóa ngày {formatDeletedAt(note.deleted_at)}</p>
                  <p>Còn lại {daysLeft(note.deleted_at)} ngày</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => void handleRestore(note.id)}>
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Khôi phục
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void handleDeleteForever(note.id)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Xóa hẳn
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {notes.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#23252b] px-4 py-6 text-center text-sm text-muted">
              Chưa có ghi chú nào trong mục đã xóa gần đây.
            </div>
          ) : null}
        </div>
      </div>
    </AuthGate>
  );
}
