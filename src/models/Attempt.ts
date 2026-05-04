import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  trackId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  status: "active" | "submitted" | "timed_out";
  startedAt: Date;
  expiresAt: Date;
  submittedAt?: Date;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
  snapshot: {
    questionTitle: string;
    questionType: string;
    questionOrder: number;
    points: number;
    timeLimitMinutes: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const attemptSchema = new Schema<IAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true, index: true },
    status: {
      type: String,
      enum: ["active", "submitted", "timed_out"],
      default: "active",
      index: true,
    },
    startedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    submittedAt: { type: Date },
    durationMs: { type: Number },
    ipAddress: { type: String },
    userAgent: { type: String },
    snapshot: {
      questionTitle: { type: String, required: true },
      questionType: { type: String, required: true },
      questionOrder: { type: Number, required: true },
      points: { type: Number, required: true, default: 100 },
      timeLimitMinutes: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

attemptSchema.index(
  { userId: 1, questionId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);
attemptSchema.index({ userId: 1, courseId: 1, createdAt: -1 });

export const Attempt: Model<IAttempt> =
  mongoose.models.Attempt || mongoose.model<IAttempt>("Attempt", attemptSchema);
