import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChallengeProgress extends Document {
  userId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  status: "in-progress" | "completed";
  attempts: number;
  bestScore: number;
  lastSubmittedCode?: string;
  language?: string;
  completedAt?: Date;
  lastAttemptAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const challengeProgressSchema = new Schema<IChallengeProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    challengeId: { type: Schema.Types.ObjectId, ref: "Challenge", required: true },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    lastSubmittedCode: { type: String },
    language: { type: String },
    completedAt: { type: Date },
    lastAttemptAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

challengeProgressSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
challengeProgressSchema.index({ userId: 1, lastAttemptAt: -1 });

export const ChallengeProgress: Model<IChallengeProgress> =
  mongoose.models.ChallengeProgress ||
  mongoose.model<IChallengeProgress>("ChallengeProgress", challengeProgressSchema);
