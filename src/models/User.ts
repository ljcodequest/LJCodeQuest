import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: "student" | "admin" | "instructor";
  xp: number;
  level: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    earnedAt: Date;
  }>;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: Date;
  };
  social: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
  isPublicProfile: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    avatarUrl: { type: String },
    bio: { type: String, maxlength: 300 },
    role: { type: String, enum: ["student", "admin", "instructor"], default: "student" },
    xp: { type: Number, default: 0, index: -1 },
    level: { type: Number, default: 1 },
    badges: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        earnedAt: { type: Date, required: true },
      },
    ],
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date },
    },
    social: {
      github: { type: String },
      linkedin: { type: String },
      website: { type: String },
    },
    isPublicProfile: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
