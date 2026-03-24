"use client";

import { Note } from "../types";
import { cn } from "@/core/utils/cn";

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelect: (id: string) => void;
}

export function NoteList({ notes, activeNoteId, onSelect }: NoteListProps) {
  return (
    <div className="space-y-1.5">
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => onSelect(note.id)}
          className={cn(
            "w-full rounded-2xl px-3 py-2.5 text-left text-sm transition",
            activeNoteId === note.id
              ? "bg-amber-500/10 text-text ring-1 ring-amber-500/50"
              : "bg-background/60 text-muted hover:bg-background hover:text-text"
          )}
        >
          <p className="truncate text-sm font-medium text-white">
            {note.title ?? "Ghi chú mới"}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted">
            {note.content?.replace(/<[^>]+>/g, "").slice(0, 80) || "Chưa có nội dung."}
          </p>
        </button>
      ))}
      {notes.length === 0 ? (
        <p className="rounded-2xl bg-background/60 px-3 py-4 text-xs text-muted">
          Chưa có ghi chú.
        </p>
      ) : null}
    </div>
  );
}



