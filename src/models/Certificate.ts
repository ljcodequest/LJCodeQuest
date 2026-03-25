import { InferSchemaType, Schema, model, models } from "mongoose";

const certificateSchema = new Schema(
  {
    certificateId: { type: String, required: true, trim: true, uppercase: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    userName: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    issueDate: { type: Date, default: Date.now },
    completionScore: { type: Number, required: true, min: 0, max: 100 },
    isValid: { type: Boolean, default: true },
    verificationUrl: { type: String, trim: true },
    pdfUrl: { type: String, trim: true },
    templateVersion: { type: String, default: "v1" },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ userId: 1 });
certificateSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export type Certificate = InferSchemaType<typeof certificateSchema>;

export const CertificateModel =
  models.Certificate || model("Certificate", certificateSchema);
