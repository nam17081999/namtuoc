export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  folder_id: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}
