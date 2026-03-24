import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPhotoFolder,
  deletePhoto,
  deletePhotoFolder,
  fetchPhotoFolders,
  fetchPhotoItems,
  movePhoto,
  renamePhotoFolder,
  uploadPhoto
} from "./api";
import type { PhotoFolder, PhotoItem } from "./types";

export const photoKeys = {
  all: ["photos"] as const,
  folders: () => ["photos", "folders"] as const,
  items: (folderId?: string | null) => ["photos", "items", folderId ?? "all"] as const
};

export function usePhotoFolders() {
  return useQuery({
    queryKey: photoKeys.folders(),
    queryFn: fetchPhotoFolders
  });
}

export function usePhotoItems(folderId?: string | null) {
  return useQuery({
    queryKey: photoKeys.items(folderId),
    queryFn: () => fetchPhotoItems(folderId)
  });
}

export function useCreatePhotoFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createPhotoFolder(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: photoKeys.folders() });
    }
  });
}

export function useRenamePhotoFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renamePhotoFolder(id, name),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(photoKeys.folders(), (current: PhotoFolder[] | undefined) =>
        current?.map((folder) => (folder.id === variables.id ? { ...folder, name: variables.name } : folder)) ?? current
      );
      void queryClient.invalidateQueries({ queryKey: photoKeys.folders() });
    }
  });
}

export function useDeletePhotoFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePhotoFolder(id),
    onSuccess: (_, folderId) => {
      queryClient.setQueryData(photoKeys.folders(), (current: PhotoFolder[] | undefined) =>
        current?.filter((folder) => folder.id !== folderId) ?? current
      );
      queryClient.removeQueries({ queryKey: photoKeys.items(folderId), exact: true });
      void queryClient.invalidateQueries({ queryKey: photoKeys.all });
    }
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId?: string | null }) => uploadPhoto(file, folderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: photoKeys.all });
    }
  });
}

export function useMovePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photoId, folderId }: { photoId: string; folderId: string | null }) => movePhoto(photoId, folderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: photoKeys.all });
    }
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photo: Pick<PhotoItem, "id" | "file_path">) => deletePhoto(photo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: photoKeys.all });
    }
  });
}
