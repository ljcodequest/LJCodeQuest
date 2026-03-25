import { InferSchemaType, Schema, model, models } from "mongoose";

import { QUESTION_DIFFICULTIES, QUESTION_TYPES } from "@/constants";

const optionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const testCaseSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    input: { type: String, default: "" },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
    weight: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    order: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: QUESTION_DIFFICULTIES, required: true },
    xpReward: { type: Number, default: 10, min: 0 },
    explanation: { type: String, trim: true },
    options: { type: [optionSchema], default: [] },
    sampleAnswer: { type: String },
    maxWords: { type: Number, min: 1 },
    rubric: { type: String },
    starterCode: { type: String },
    language: { type: String, trim: true },
    testCases: { type: [testCaseSchema], default: [] },
    timeLimit: { type: Number, default: 10, min: 1 },
    memoryLimit: { type: Number, default: 256, min: 1 },
    hints: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ trackId: 1, order: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ difficulty: 1 });

export type Question = InferSchemaType<typeof questionSchema>;

export const QuestionModel = models.Question || model("Question", questionSchema);
