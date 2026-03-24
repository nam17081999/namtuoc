export interface PhotoFolder {
  id: string;
  user_id: string | null;
  name: string;
  created_at?: string | null;
}

export interface PhotoItem {
  id: string;
  user_id: string | null;
  folder_id: string | null;
  file_name: string;
  file_path: string;
  public_url: string;
  created_at: string;
  updated_at: string | null;
}
