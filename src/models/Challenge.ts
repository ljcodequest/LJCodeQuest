import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChallenge extends Document {
  title: string;
  slug: string;
  summary: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  language: string;
  starterCode: string;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: number;
  }>;
  xpReward: number;
  timeLimitMinutes: number;
  tags: string[];
  isPublished: boolean;
  completionsCount: number;
  submissionsCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const challengeSchema = new Schema<IChallenge>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    summary: { type: String, required: true, maxlength: 180 },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
      index: true,
    },
    category: { type: String, required: true, index: true },
    language: { type: String, required: true, default: "javascript", index: true },
    starterCode: { type: String, default: "" },
    testCases: [
      {
        id: { type: String },
        input: { type: String, default: "" },
        expectedOutput: { type: String, required: true },
        isHidden: { type: Boolean, default: false },
        weight: { type: Number, default: 1 },
      },
    ],
    xpReward: { type: Number, default: 50 },
    timeLimitMinutes: { type: Number, default: 30 },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false, index: true },
    completionsCount: { type: Number, default: 0, index: -1 },
    submissionsCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

challengeSchema.index({ title: "text", summary: "text", category: "text", tags: "text" });

export const Challenge: Model<IChallenge> =
  mongoose.models.Challenge || mongoose.model<IChallenge>("Challenge", challengeSchema);
