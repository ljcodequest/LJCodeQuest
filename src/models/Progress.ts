import { InferSchemaType, Schema, model, models } from "mongoose";

import { PROGRESS_STATUSES, TRACK_PROGRESS_STATUSES } from "@/constants";

const trackProgressSchema = new Schema(
  {
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    status: { type: String, enum: TRACK_PROGRESS_STATUSES, default: "locked" },
    score: { type: Number, default: 0, min: 0, max: 100 },
    questionsCompleted: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date },
    attempts: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const progressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: PROGRESS_STATUSES, default: "enrolled" },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    completedAt: { type: Date },
    trackProgress: { type: [trackProgressSchema], default: [] },
    totalXpEarned: { type: Number, default: 0, min: 0 },
    certificateId: { type: Schema.Types.ObjectId, ref: "Certificate" },
  },
  {
    timestamps: true,
  }
);

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
progressSchema.index({ userId: 1 });
progressSchema.index({ status: 1 });

export type Progress = InferSchemaType<typeof progressSchema>;

export const ProgressModel = models.Progress || model("Progress", progressSchema);
