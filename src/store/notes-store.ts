import { create } from "zustand";

interface NotesUIState {
  activeFolderId: string | null;
  activeNoteId: string | null;
  setActiveFolder: (id: string | null) => void;
  setActiveNote: (id: string | null) => void;
}

export const useNotesUIStore = create<NotesUIState>((set) => ({
  activeFolderId: null,
  activeNoteId: null,
  setActiveFolder: (id) => set({ activeFolderId: id }),
  setActiveNote: (id) => set({ activeNoteId: id })
}));
