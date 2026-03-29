import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  lastActiveAt: Date;
  completedTracks: mongoose.Types.ObjectId[];
  currentTrackId?: mongoose.Types.ObjectId;
  completedQuestions: mongoose.Types.ObjectId[];
  completedLevels: ("beginner" | "intermediate" | "advanced")[];
  currentTrackProgress?: {
    trackId: mongoose.Types.ObjectId;
    currentQuestionOrder: number;
    totalQuestionsInTrack: number;
  };
  percentComplete: number;
  isCompleted: boolean;
  completedAt?: Date;
  certificateId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    enrolledAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    completedTracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],
    currentTrackId: { type: Schema.Types.ObjectId, ref: "Track" },
    completedQuestions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    completedLevels: [{ type: String, enum: ["beginner", "intermediate", "advanced"] }],
    currentTrackProgress: {
      trackId: { type: Schema.Types.ObjectId, ref: "Track" },
      currentQuestionOrder: { type: Number, default: 1 },
      totalQuestionsInTrack: { type: Number },
    },
    percentComplete: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    certificateId: { type: Schema.Types.ObjectId, ref: "Certificate" },
  },
  {
    timestamps: true,
  }
);

// A user should only have one progress document per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
progressSchema.index({ userId: 1, lastActiveAt: -1 });

export const Progress: Model<IProgress> = mongoose.models.Progress || mongoose.model<IProgress>("Progress", progressSchema);
