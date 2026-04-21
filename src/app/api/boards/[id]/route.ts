import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Board from "@/models/Board";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    await dbConnect();
    const board = await Board.findById(id);
    
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }
    
    return NextResponse.json(board);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch board" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    
    const board = await Board.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: 'after' }
    );
    
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    await dbConnect();
    await Board.findByIdAndDelete(id);
    // Recursively delete children? (skipped for simplicity in MVP)
    await Board.deleteMany({ parentId: id });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
  }
}
