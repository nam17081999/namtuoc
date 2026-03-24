import { redirect } from "next/navigation";

export default function LegacyNoteRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/apps/notes/folder/all/note/${params.id}`);
}