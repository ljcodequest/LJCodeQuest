import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  trackId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  type: string;
  
  // Answers
  selectedOptions?: string[];
  descriptiveAnswer?: string;
  code?: string;
  language?: string;

  // Results
  isCorrect: boolean;
  score: number;
  xpEarned: number;

  // Coding Results
  testResults?: Array<{
    testCaseId: string;
    passed: boolean;
    actualOutput: string;
    executionTime: number;
    memoryUsed: number;
    error?: string;
  }>;
  compilationError?: string;
  executionTime?: number;

  // Descriptive
  reviewStatus?: "pending" | "reviewed" | "rejected";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewFeedback?: string;
  reviewedAt?: Date;

  attemptNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    type: { type: String, required: true },
    
    selectedOptions: [{ type: String }],
    descriptiveAnswer: { type: String },
    code: { type: String },
    language: { type: String },

    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },

    testResults: [
      {
        testCaseId: { type: String },
        passed: { type: Boolean },
        actualOutput: { type: String },
        executionTime: { type: Number },
        memoryUsed: { type: Number },
        error: { type: String },
      },
    ],
    compilationError: { type: String },
    executionTime: { type: Number },

    reviewStatus: { type: String, enum: ["pending", "reviewed", "rejected"], index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewFeedback: { type: String },
    reviewedAt: { type: Date },

    attemptNumber: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ userId: 1, questionId: 1 });
submissionSchema.index({ userId: 1, trackId: 1 });
submissionSchema.index({ createdAt: -1 });

export const Submission: Model<ISubmission> = mongoose.models.Submission || mongoose.model<ISubmission>("Submission", submissionSchema);
