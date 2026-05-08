import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CertificateModel, ProgressModel } from "@/models";
import crypto from "crypto";

function createVerificationHash(certificateId: string, userId: string, courseId: string) {
  return crypto
    .createHash("sha256")
    .update(`${certificateId}:${userId}:${courseId}:${process.env.CERTIFICATE_SECRET || "lj-codequest"}`)
    .digest("hex");
}

function getRouteError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, status: "status" in error ? Number(error.status) : 500 };
  }

  return { message: "Unexpected certificate error", status: 500 };
}

export async function POST(request: Request) {
  try {
    const context = await requireRegisteredUser(request);
    await dbConnect();
    
    const body = await request.json();
    const { courseId } = body;

    // A learner can claim a certificate after 100% beginner mastery.
    // Full-course completion also remains valid for learners who continue through advanced.
    const progress = await ProgressModel.findOne({
       userId: context.user._id,
       courseId
    });

    const hasBeginnerCertificateEligibility =
       progress?.completedLevels?.includes("beginner") || progress?.isCompleted;

    if (!progress || !hasBeginnerCertificateEligibility) {
       return NextResponse.json({ success: false, error: "Beginner level not completed" }, { status: 403 });
    }

    // Check if certificate already exists
    const existing = await CertificateModel.findOne({
       userId: context.user._id,
       courseId
    });

    if (existing) {
       return NextResponse.json({ 
          success: true, 
          data: { certificateId: existing.certificateId }
       });
    }

    // Generate unique Certificate ID: LJCQ-[YEAR]-[RANDOM_HEX_6_CHARS]
    const year = new Date().getFullYear();
    const randomHash = crypto.randomBytes(3).toString("hex").toUpperCase();
    const certificateId = `LJCQ-${year}-${randomHash}`;
    const verificationHash = createVerificationHash(
       certificateId,
       context.user._id.toString(),
       courseId
    );

    const newCertificate = await CertificateModel.create({
       certificateId,
       userId: context.user._id,
       courseId,
       status: "active",
       verificationHash,
       metadata: {
          awardedFor: progress.isCompleted ? "course" : "beginner-level",
          completedLevels: progress.completedLevels || [],
       },
    });

    await ProgressModel.findByIdAndUpdate(progress._id, {
       certificateId: newCertificate._id,
       status: progress.isCompleted ? "certified" : "passed",
    });

    return NextResponse.json({ 
       success: true, 
       data: { certificateId: newCertificate.certificateId }
    });

  } catch (error: unknown) {
    // If we hit the compound unique index, we handle it gracefully just in case
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
       return NextResponse.json({ success: false, error: "Certificate already generated." }, { status: 400 });
    }
    const routeError = getRouteError(error);
    return NextResponse.json({ success: false, error: routeError.message }, { status: routeError.status || 500 });
  }
}
