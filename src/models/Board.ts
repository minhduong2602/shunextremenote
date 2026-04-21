import mongoose, { Schema, Document } from 'mongoose';

export interface IBoard extends Document {
  title: string;
  ownerId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  elements: any; // Excalidraw elements JSON
  assets: any; // Excalidraw assets JSON
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema: Schema = new Schema(
  {
    title: { type: String, required: true, default: 'Untitled Board' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Board' },
    dataFileId: { type: String },
    elements: { type: Schema.Types.Mixed, default: [] },
    assets: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.Board || mongoose.model<IBoard>('Board', BoardSchema);
