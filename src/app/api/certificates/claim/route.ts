import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CertificateModel, ProgressModel, CourseModel, UserModel } from "@/models";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const context = await requireRegisteredUser(request);
    await dbConnect();
    
    const body = await request.json();
    const { courseId } = body;

    // Validate if the User has actually completed the course
    const progress = await ProgressModel.findOne({
       userId: context.user._id,
       courseId
    });

    if (!progress || !progress.isCompleted) {
       return NextResponse.json({ success: false, error: "Course not completed" }, { status: 403 });
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

    const newCertificate = await CertificateModel.create({
       certificateId,
       userId: context.user._id,
       courseId
    });

    // Optionally award a Badge or massive XP boost to the User Document here
    // However gamification formula automatically awarded course-XP inside Phase 4

    return NextResponse.json({ 
       success: true, 
       data: { certificateId: newCertificate.certificateId }
    });

  } catch (error: any) {
    // If we hit the compound unique index, we handle it gracefully just in case
    if (error.code === 11000) {
       return NextResponse.json({ success: false, error: "Certificate already generated." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
