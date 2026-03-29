import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion extends Document {
  trackId: mongoose.Types.ObjectId;
  type: "mcq" | "multi-select" | "descriptive" | "coding";
  order: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  explanation?: string;

  // MCQ / Multi-select
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;

  // Descriptive
  sampleAnswer?: string;
  maxWords?: number;
  rubric?: string;

  // Coding
  starterCode?: string;
  language?: string;
  testCases?: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: number;
  }>;
  timeLimit?: number;
  memoryLimit?: number;
  hints?: string[];

  // Metadata
  tags: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    type: { type: String, enum: ["mcq", "multi-select", "descriptive", "coding"], required: true, index: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true, index: true },
    xpReward: { type: Number, default: 10 },
    explanation: { type: String },

    options: [
      {
        id: { type: String },
        text: { type: String },
        isCorrect: { type: Boolean },
      },
    ],

    sampleAnswer: { type: String },
    maxWords: { type: Number },
    rubric: { type: String },

    starterCode: { type: String },
    language: { type: String },
    testCases: [
      {
        id: { type: String },
        input: { type: String },
        expectedOutput: { type: String },
        isHidden: { type: Boolean, default: false },
        weight: { type: Number, default: 1 },
      },
    ],
    timeLimit: { type: Number, default: 10 },
    memoryLimit: { type: Number, default: 256 },
    hints: [{ type: String }],

    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ trackId: 1, order: 1 });

export const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>("Question", questionSchema);
