import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import Board from "@/models/Board";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BoardEditorWrapper from "@/components/BoardEditorWrapper";

export default async function BoardPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>Please log in to view this board.</div>;
  }

  await dbConnect();
  const board = await Board.findById(id);

  if (!board) {
    return notFound();
  }

  let initialElements = board.elements;
  let initialAssets = board.assets;

  if (board.dataFileId) {
    try {
      const res = await fetch(`${process.env.R2_PUBLIC_URL}/${board.dataFileId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const excalidrawFile = await res.json();
        initialElements = excalidrawFile.elements || initialElements;
        initialAssets = excalidrawFile.files || initialAssets;
      }
    } catch (e) {
      console.error("Failed to load .excalidraw from R2", e);
    }
  }

  return (
    <BoardEditorWrapper
      boardId={board._id.toString()}
      initialElements={initialElements}
      initialAssets={initialAssets}
      boardTitle={board.title}
    />
  );
}
