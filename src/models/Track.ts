import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrack extends Document {
  courseId: mongoose.Types.ObjectId;
  difficulty: "beginner" | "intermediate" | "advanced";
  title: string;
  slug: string;
  description: string;
  order: number;
  theory: string;
  questions: mongoose.Types.ObjectId[];
  totalQuestions: number;
  passingScore: number;
  isLocked: boolean;
  xpReward: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    description: { type: String, required: true },
    order: { type: Number, required: true },
    theory: { type: String, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    totalQuestions: { type: Number, default: 0 },
    passingScore: { type: Number, default: 80 },
    isLocked: { type: Boolean, default: true },
    xpReward: { type: Number, default: 100 },
    isPublished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

trackSchema.index({ courseId: 1, difficulty: 1, order: 1 }, { unique: true });

export const Track: Model<ITrack> = mongoose.models.Track || mongoose.model<ITrack>("Track", trackSchema);
