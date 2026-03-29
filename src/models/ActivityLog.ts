import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: "course_view" | "question_attempt" | "track_complete" | "course_complete";
  details?: string;
  timestamp: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { 
       type: String, 
       enum: ["course_view", "question_attempt", "track_complete", "course_complete"],
       required: true 
    },
    details: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

// We keep indexes on userId and timestamp for fast analytical range queries
export const ActivityLogModel: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
