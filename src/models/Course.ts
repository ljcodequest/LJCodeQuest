import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  language: string;
  tracks: mongoose.Types.ObjectId[];
  totalTracks: number;
  totalQuestions: number;
  tags: string[];
  isPublished: boolean;
  enrollmentCount: number;
  averageRating: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 160 },
    thumbnail: { type: String, required: true },
    language: { type: String, required: true, index: true },
    tracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],
    totalTracks: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false, index: true },
    enrollmentCount: { type: Number, default: 0, index: -1 },
    averageRating: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>("Course", courseSchema);
