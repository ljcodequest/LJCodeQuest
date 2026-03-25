import { InferSchemaType, Schema, model, models } from "mongoose";

import { COURSE_DIFFICULTIES } from "@/constants";

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 160 },
    thumbnail: { type: String, trim: true },
    difficulty: { type: String, enum: COURSE_DIFFICULTIES, required: true },
    language: { type: String, required: true, trim: true },
    tracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],
    totalTracks: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false },
    enrollmentCount: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ language: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ enrollmentCount: -1 });

export type Course = InferSchemaType<typeof courseSchema>;

export const CourseModel = models.Course || model("Course", courseSchema);
