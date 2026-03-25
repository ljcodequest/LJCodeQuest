import { InferSchemaType, Schema, model, models } from "mongoose";

import { USER_ROLES } from "@/constants";

const badgeSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    earnedAt: { type: Date, required: true },
  },
  { _id: false }
);

const streakSchema = new Schema(
  {
    current: { type: Number, default: 0, min: 0 },
    longest: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    firebaseUid: { type: String, trim: true, unique: true, sparse: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    displayName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true },
    avatarUrl: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 300 },
    role: { type: String, enum: USER_ROLES, default: "student" },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    badges: { type: [badgeSchema], default: [] },
    streak: { type: streakSchema, default: () => ({}) },
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    website: { type: String, trim: true },
    isPublicProfile: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ xp: -1 });

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = models.User || model("User", userSchema);
