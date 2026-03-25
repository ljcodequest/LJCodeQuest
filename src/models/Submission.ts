import { InferSchemaType, Schema, model, models } from "mongoose";

import { QUESTION_TYPES, REVIEW_STATUSES } from "@/constants";

const testResultSchema = new Schema(
  {
    testCaseId: { type: String, required: true, trim: true },
    passed: { type: Boolean, default: false },
    actualOutput: { type: String },
    executionTime: { type: Number, min: 0 },
    memoryUsed: { type: Number, min: 0 },
    error: { type: String },
  },
  { _id: false }
);

const submissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true, index: true },
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    selectedOptions: { type: [String], default: [] },
    descriptiveAnswer: { type: String },
    code: { type: String },
    language: { type: String, trim: true },
    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0, min: 0, max: 100 },
    xpEarned: { type: Number, default: 0, min: 0 },
    testResults: { type: [testResultSchema], default: [] },
    compilationError: { type: String },
    executionTime: { type: Number, min: 0 },
    reviewStatus: { type: String, enum: REVIEW_STATUSES, default: "pending" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewFeedback: { type: String },
    reviewedAt: { type: Date },
    attemptNumber: { type: Number, default: 1, min: 1 },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ userId: 1, questionId: 1 });
submissionSchema.index({ userId: 1, trackId: 1 });
submissionSchema.index({ reviewStatus: 1 });
submissionSchema.index({ createdAt: -1 });

export type Submission = InferSchemaType<typeof submissionSchema>;

export const SubmissionModel =
  models.Submission || model("Submission", submissionSchema);
