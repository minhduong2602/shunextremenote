import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Board from "@/models/Board";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const boards = await Board.find({}).sort({ updatedAt: -1 }).select("-elements -assets");
    return NextResponse.json(boards);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { title, parentId, dataFileId } = await req.json();

    // Find the single personal user
    const mongoose = (await import("mongoose")).default;
    const db = await dbConnect();
    const User = (await import("@/models/User")).default;
    let user = await User.findOne({ email: "admin@personal.app" });

    if (!user) {
      user = await User.create({
        email: "admin@personal.app",
        name: "Admin",
      });
    }

    const newBoard = await Board.create({
      title: title || "Untitled Board",
      ownerId: user._id,
      parentId: parentId || undefined,
      dataFileId: dataFileId || undefined,
      elements: [],
      assets: {}
    });

    return NextResponse.json(newBoard, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
}
