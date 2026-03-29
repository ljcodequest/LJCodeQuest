import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { UserModel } from "@/models";

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch Top 50 Users mathematically sorted by highest XP.
    // We strictly strip out email, Firebase identifiers, or other PII using .select()
    const topUsers = await UserModel.find({ isPublicProfile: true, xp: { $gt: 0 } })
       .sort({ xp: -1 })
       .limit(50)
       .select("displayName username xp level badges avatarUrl streak")
       .lean();

    return NextResponse.json({ 
      success: true, 
      data: topUsers 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
