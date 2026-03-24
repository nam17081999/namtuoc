import { supabase } from "@/core/supabase/client";
import { Folder, Note } from "./types";

export async function fetchFolders() {
  const { data, error } = await supabase
    .from("note_folders")
    .select("id, name, user_id")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Folder[];
}

export async function fetchNotes(params: { folderId?: string | null }) {
  let queryBuilder = supabase
    .from("notes")
    .select("id, title, content, folder_id, updated_at, user_id, deleted_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (params.folderId) {
    queryBuilder = queryBuilder.eq("folder_id", params.folderId);
  }

  const { data, error } = await queryBuilder;
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function fetchDeletedNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, content, folder_id, updated_at, user_id, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function fetchNoteById(noteId: string) {
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, content, folder_id, updated_at, user_id, deleted_at")
    .eq("id", noteId)
    .single();
  if (error) throw error;
  return data as Note;
}

export async function upsertNote(note: Partial<Note> & { id?: string }) {
  const payload: Record<string, unknown> = {
    id: note.id,
    title: note.title ?? null,
    content: note.content ?? null
  };
  if (note.folder_id !== undefined) {
    payload.folder_id = note.folder_id ?? null;
  }

  const { data, error } = await supabase.from("notes").upsert(payload).select("id").single();

  if (error) throw error;
  return data as { id: string };
}

export async function deleteNote(noteId: string) {
  const { error } = await supabase.from("notes").update({ deleted_at: new Date().toISOString() }).eq("id", noteId);
  if (error) throw error;
}

export async function hardDeleteNote(noteId: string) {
  const { error } = await supabase.from("notes").delete().eq("id", noteId);
  if (error) throw error;
}

export async function restoreNote(noteId: string) {
  const { error } = await supabase.from("notes").update({ deleted_at: null }).eq("id", noteId);
  if (error) throw error;
}

export async function createFolder(name: string) {
  const { data, error } = await supabase.from("note_folders").insert({ name }).select("id, name, user_id").single();
  if (error) throw error;
  return data as Folder;
}
