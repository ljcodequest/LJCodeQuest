import { InferSchemaType, Schema, model, models } from "mongoose";

const trackSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true, min: 1 },
    theory: { type: String },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    totalQuestions: { type: Number, default: 0, min: 0 },
    passingScore: { type: Number, default: 80, min: 0, max: 100 },
    isLocked: { type: Boolean, default: true },
    xpReward: { type: Number, default: 100, min: 0 },
    isPublished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

trackSchema.index({ courseId: 1, order: 1 }, { unique: true });
trackSchema.index({ courseId: 1, slug: 1 }, { unique: true });

export type Track = InferSchemaType<typeof trackSchema>;

export const TrackModel = models.Track || model("Track", trackSchema);
