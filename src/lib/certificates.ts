import crypto from "crypto";
import type { Types } from "mongoose";

import { CertificateModel, ProgressModel } from "@/models";

function createVerificationHash(certificateId: string, userId: string, courseId: string) {
  return crypto
    .createHash("sha256")
    .update(`${certificateId}:${userId}:${courseId}:${process.env.CERTIFICATE_SECRET || "lj-codequest"}`)
    .digest("hex");
}

function createCertificateId() {
  const year = new Date().getFullYear();
  const randomHash = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `LJCQ-${year}-${randomHash}`;
}

export async function issueCourseCertificate(options: {
  userId: Types.ObjectId | string;
  courseId: Types.ObjectId | string;
  progressId?: Types.ObjectId | string;
  awardedFor?: "course" | "beginner-level";
  completedLevels?: string[];
}) {
  const userId = options.userId.toString();
  const courseId = options.courseId.toString();

  const existing = await CertificateModel.findOne({
    userId: options.userId,
    courseId: options.courseId,
  });

  if (existing) {
    return { certificate: existing, created: false };
  }

  const certificateId = createCertificateId();
  const verificationHash = createVerificationHash(certificateId, userId, courseId);

  const certificate = await CertificateModel.create({
    certificateId,
    userId: options.userId,
    courseId: options.courseId,
    issuedAt: new Date(),
    status: "active",
    verificationHash,
    metadata: {
      awardedFor: options.awardedFor || "course",
      completedLevels: options.completedLevels || [],
    },
  });

  if (options.progressId) {
    await ProgressModel.findByIdAndUpdate(options.progressId, {
      certificateId: certificate._id,
      status: options.awardedFor === "beginner-level" ? "passed" : "certified",
      ...(options.awardedFor === "course"
        ? { isCompleted: true, completedAt: new Date() }
        : {}),
    });
  }

  return { certificate, created: true };
}
