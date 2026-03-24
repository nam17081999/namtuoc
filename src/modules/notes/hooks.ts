import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFolder, restoreNote, hardDeleteNote, deleteNote, fetchFolders, fetchNoteById, fetchNotes, fetchDeletedNotes, upsertNote } from "./api";
import { Note } from "./types";

export function useFolders() {
  return useQuery({ queryKey: ["notes", "folders"], queryFn: fetchFolders });
}

export function useNotes(folderId?: string | null) {
  return useQuery({
    queryKey: ["notes", "list", folderId ?? "all"],
    queryFn: () => fetchNotes({ folderId })
  });
}

export function useNote(noteId?: string | null) {
  return useQuery({
    queryKey: ["notes", "detail", noteId ?? "none"],
    queryFn: () => (noteId ? fetchNoteById(noteId) : Promise.resolve(null)),
    enabled: Boolean(noteId)
  });
}

export function useUpsertNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: Partial<Note> & { id?: string }) => upsertNote(note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createFolder(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes", "folders"] });
    }
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
  });
}

export function useDeletedNotes() {
  return useQuery({
    queryKey: ["notes", "deleted"],
    queryFn: fetchDeletedNotes
  });
}

export function useRestoreNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
  });
}

export function useHardDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hardDeleteNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
  });
}
