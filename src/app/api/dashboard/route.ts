import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel, ProgressModel, CourseModel } from "@/models";
import { evaluateStreak, getLevelProgress } from "@/lib/gamification";

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

    const formattedProgress = progressDocs.map((p: any) => ({
      ...p,
      course: p.courseId,
      currentTrack: p.currentTrackId,
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
        continueLearning: formattedProgress.length > 0 ? formattedProgress[0] : null
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
