import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { UserModel } from "@/models";
import { ActivityLogModel } from "@/models/ActivityLog";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    await dbConnect();
    
    // Find User
    const user = await UserModel.findOne({ username, isPublicProfile: true }).select("_id").lean();
    if (!user) {
        return NextResponse.json({ success: false, error: "Profile not found or is private" }, { status: 404 });
    }

    // Fetch the last 365 days of activity
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const logs = await ActivityLogModel.find({
       userId: user._id,
       timestamp: { $gte: oneYearAgo }
    }).select("timestamp action").lean();

    // Group logs by Date string (YYYY-MM-DD)
    const activityMap: Record<string, number> = {};
    
    logs.forEach(log => {
       const dateString = new Date(log.timestamp).toISOString().split('T')[0];
       activityMap[dateString] = (activityMap[dateString] || 0) + 1;
    });

    // Format into array for the heatmap component
    const heatmapData = Object.keys(activityMap).map(date => ({
       date,
       count: activityMap[date]
    }));

    // Because this happens continuously, let's also send back active gamification data 
    // Wait, the profile page already has the user's total xp. This endpoint is strictly for the heatmap matrix.

    return NextResponse.json({ 
      success: true, 
      data: heatmapData 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
