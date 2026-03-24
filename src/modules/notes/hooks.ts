import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFolder,
  restoreNote,
  hardDeleteNote,
  deleteNote,
  fetchFolders,
  fetchNoteById,
  fetchNotes,
  fetchDeletedNotes,
  upsertNote,
  renameFolder,
  deleteFolder
} from "./api";
import { Note } from "./types";

function removeNoteFromCache(queryClient: ReturnType<typeof useQueryClient>, noteId: string) {
  queryClient.setQueriesData<Note[]>(
    { queryKey: ["notes", "list"] },
    (current) => current?.filter((note) => note.id !== noteId) ?? []
  );
  queryClient.setQueryData(["notes", "detail", noteId], null);
}

function upsertNoteInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  saved: { id: string },
  input: Partial<Note> & { id?: string }
) {
  const noteId = saved.id;
  const now = new Date().toISOString();

  const baseNote: Note = {
    id: noteId,
    user_id: "",
    title: input.title ?? null,
    content: input.content ?? null,
    folder_id: input.folder_id ?? null,
    updated_at: now,
    deleted_at: null
  };

  queryClient.setQueryData<Note | null>(["notes", "detail", noteId], (current) => ({
    ...baseNote,
    ...current,
    ...input,
    id: noteId,
    updated_at: now,
    deleted_at: null
  }));

  const mergeIntoList = (current: Note[] | undefined) => {
    const existing = current ?? [];
    const previous = existing.find((note) => note.id === noteId);
    const nextNote: Note = {
      ...baseNote,
      ...previous,
      ...input,
      id: noteId,
      updated_at: now,
      deleted_at: null
    };

    const withoutOld = existing.filter((note) => note.id !== noteId);
    return [nextNote, ...withoutOld];
  };

  queryClient.setQueryData<Note[]>(["notes", "list", "all"], mergeIntoList);

  if (input.folder_id) {
    queryClient.setQueryData<Note[]>(["notes", "list", input.folder_id], mergeIntoList);
  }
}

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
    onSuccess: (saved, input) => {
      upsertNoteInCache(queryClient, saved, input);
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

export function useRenameFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameFolder(id, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes", "folders"] });
    }
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes", "folders"] });
      void queryClient.invalidateQueries({ queryKey: ["notes", "list"] });
    }
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: (_, id) => {
      removeNoteFromCache(queryClient, id);
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
    onSuccess: (_, id) => {
      removeNoteFromCache(queryClient, id);
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
  });
}
