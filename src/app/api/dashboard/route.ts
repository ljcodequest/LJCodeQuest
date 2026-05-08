import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel, ProgressModel, CertificateModel } from "@/models";
import { evaluateStreak, getLevelProgress } from "@/lib/gamification";

type LeanRecord = Record<string, unknown>;

export async function GET(request: Request) {
  try {
    const context = await requireRegisteredUser(request);
    await dbConnect();

    // 1. Fetch Fresh User Data
    const user = await UserModel.findById(context.user._id);
    if (!user) {
       return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // 2. Evaluate and Update Streak
    const streakEvaluation = evaluateStreak({
       current: user.streak?.current || 0,
       longest: user.streak?.longest || 0,
       lastActiveDate: user.streak?.lastActiveDate || null
    });

    if (streakEvaluation.shouldUpdate) {
       user.streak = {
          current: streakEvaluation.newCurrent,
          longest: streakEvaluation.newLongest,
          lastActiveDate: new Date()
       };
       await user.save();
    }

    // 3. Get Gamification Stats
    const levelStats = getLevelProgress(user.xp);

    // 4. Fetch Enrolled Courses Progress
    const progressDocs = await ProgressModel.find({ userId: user._id })
      .populate("courseId", "title slug thumbnail shortDescription estimatedHours")
      .populate("currentTrackId", "title slug")
      .sort({ lastActiveAt: -1 }) // Most recently active first
      .lean();

    const formattedProgress = progressDocs.map((p) => ({
      ...p,
      course: (p as unknown as LeanRecord).courseId,
      currentTrack: (p as unknown as LeanRecord).currentTrackId,
    }));

    const certificateDocs = await CertificateModel.find({
      userId: user._id,
      status: "active",
    })
      .populate("courseId", "title slug thumbnail")
      .sort({ issuedAt: -1 })
      .lean();

    const certificates = certificateDocs.map((certificate) => ({
      _id: certificate._id,
      certificateId: certificate.certificateId,
      issuedAt: certificate.issuedAt,
      status: certificate.status,
      course: (certificate as unknown as LeanRecord).courseId,
    }));

    return NextResponse.json({ 
      success: true, 
      data: { 
        user: {
           displayName: user.displayName,
           xp: user.xp,
           streak: user.streak,
           badges: user.badges,
           ...levelStats
        },
        enrolledCourses: formattedProgress,
        continueLearning: formattedProgress.length > 0 ? formattedProgress[0] : null,
        certificates,
      } 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard";
    const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 500;
    return NextResponse.json({ success: false, error: message }, { status: status || 500 });
  }
}
