import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICertificate extends Document {
  certificateId: string;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  issuedAt: Date;
  metadata?: any;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateId: { 
       type: String, 
       required: true, 
       unique: true, 
       index: true 
    },
    userId: { 
       type: Schema.Types.ObjectId, 
       ref: "User", 
       required: true 
    },
    courseId: { 
       type: Schema.Types.ObjectId, 
       ref: "Course", 
       required: true 
    },
    issuedAt: { 
       type: Date, 
       default: Date.now 
    },
    metadata: {
       type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent creating duplicate certificates for the same course + user
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CertificateModel: Model<ICertificate> = mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", certificateSchema);
