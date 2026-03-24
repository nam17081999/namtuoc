import { supabase } from "@/core/supabase/client";
import type { PhotoFolder, PhotoItem } from "./types";

const PHOTO_BUCKET = "photos";

export async function fetchPhotoFolders() {
  const { data, error } = await supabase
    .from("photo_folders")
    .select("id, user_id, name, created_at")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PhotoFolder[];
}

export async function createPhotoFolder(name: string) {
  const { data, error } = await supabase
    .from("photo_folders")
    .insert({ name })
    .select("id, user_id, name, created_at")
    .single();
  if (error) throw error;
  return data as PhotoFolder;
}

export async function renamePhotoFolder(folderId: string, name: string) {
  const { data, error } = await supabase
    .from("photo_folders")
    .update({ name })
    .eq("id", folderId)
    .select("id, user_id, name, created_at")
    .single();
  if (error) throw error;
  return data as PhotoFolder;
}

export async function deletePhotoFolder(folderId: string) {
  const { error } = await supabase.from("photo_folders").delete().eq("id", folderId);
  if (error) throw error;
}

export async function fetchPhotoItems(folderId?: string | null) {
  let query = supabase
    .from("photo_items")
    .select("id, user_id, folder_id, file_name, file_path, public_url, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (folderId === "unfiled") {
    query = query.is("folder_id", null);
  } else if (folderId) {
    query = query.eq("folder_id", folderId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PhotoItem[];
}

export async function uploadPhoto(file: File, folderId?: string | null) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const filePath = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("photo_items")
    .insert({
      folder_id: folderId && folderId !== "unfiled" ? folderId : null,
      file_name: file.name,
      file_path: filePath,
      public_url: publicData.publicUrl
    })
    .select("id, user_id, folder_id, file_name, file_path, public_url, created_at, updated_at")
    .single();

  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([filePath]);
    throw error;
  }
  return data as PhotoItem;
}

export async function movePhoto(photoId: string, folderId: string | null) {
  const { data, error } = await supabase
    .from("photo_items")
    .update({ folder_id: folderId })
    .eq("id", photoId)
    .select("id, user_id, folder_id, file_name, file_path, public_url, created_at, updated_at")
    .single();
  if (error) throw error;
  return data as PhotoItem;
}

export async function deletePhoto(photo: PhotoItem) {
  const { error } = await supabase.from("photo_items").delete().eq("id", photo.id);
  if (error) throw error;

  const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.file_path]);
  if (storageError) {
    const { error: rollbackError } = await supabase.from("photo_items").insert({
      id: photo.id,
      user_id: photo.user_id,
      folder_id: photo.folder_id,
      file_name: photo.file_name,
      file_path: photo.file_path,
      public_url: photo.public_url,
      created_at: photo.created_at,
      updated_at: photo.updated_at
    });

    if (rollbackError) {
      throw new Error(`${storageError.message}; rollback failed: ${rollbackError.message}`);
    }

    throw storageError;
  }
}
