"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { Input } from "@/components/ui/input";
import { useFolders, useNotes, useUpsertNote } from "@/modules/notes/hooks";
import { ChevronLeft, Folder, PencilLine } from "lucide-react";

export default function NotesFolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = typeof params?.folderId === "string" ? params.folderId : "all";
  const isAll = folderId === "all";
  const { data: folders = [] } = useFolders();
  const folderName = isAll ? "Tất cả iCloud" : folders.find((f) => f.id === folderId)?.name ?? "Thư mục";

  const { data: notes = [] } = useNotes(isAll ? null : folderId);
  const upsertNote = useUpsertNote();
  const [query, setQuery] = useState("");

  const filteredNotes = useMemo(() => {
    const scoped = isAll ? notes : notes.filter((note) => note.folder_id === folderId);
    if (!query.trim()) return scoped;
    const q = query.toLowerCase();
    return scoped.filter((note) => {
      const title = (note.title ?? "").toLowerCase();
      const content = (note.content ?? "").replace(/<[^>]+>/g, "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [notes, query, isAll, folderId]);

  const handleCreateNote = async () => {
    const result = await upsertNote.mutateAsync({
      title: "Ghi chú mới",
      content: "",
      folder_id: isAll ? null : folderId
    });
    router.push(`/apps/notes/folder/${folderId}/note/${result.id}`);
  };

  return (
    <AuthGate>
      <div className="icloud-notes px-3 py-4 sm:px-5">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/apps/notes" className="flex items-center gap-2 text-amber-300">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <p className="text-sm font-semibold text-white">{folderName}</p>
          <button type="button" onClick={handleCreateNote} className="text-amber-300">
            <PencilLine className="h-5 w-5" />
          </button>
        </div>

        <Input
          placeholder="Tìm kiếm tất cả ghi chú"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mb-4 bg-[#2a2c32] text-white"
        />

        <div className="space-y-3">
          {filteredNotes.map((note, index) => (
            <Link
              key={note.id}
              href={`/apps/notes/folder/${folderId}/note/${note.id}`}
              className={`block rounded-2xl px-4 py-3 ${index === 0 ? "bg-amber-400 text-[#1b1c20]" : "bg-transparent text-white"}`}
            >
              <p className="text-sm font-semibold">{note.title ?? "Ghi chú mới"}</p>
              <p className="mt-1 text-xs opacity-80">
                {(note.content ?? "").replace(/<[^>]+>/g, "").slice(0, 48) || "Chưa có nội dung"}
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs opacity-75">
                <Folder className="h-3 w-3" />
                {isAll ? "Ghi chú" : folderName}
              </p>
            </Link>
          ))}
          {filteredNotes.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#23252b] px-4 py-6 text-center text-sm text-muted">
              Chưa có ghi chú trong thư mục này
            </div>
          ) : null}
        </div>
      </div>
    </AuthGate>
  );
}