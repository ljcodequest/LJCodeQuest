import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { UserModel, ProgressModel, CertificateModel } from "@/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    await dbConnect();
    
    // Search user by exact username match (case sensitive usually, or handle case via regex if needed)
    // Here we use strict match
    const user = await UserModel.findOne({ username, isPublicProfile: true })
       .select("displayName username bio avatarUrl xp level badges streak social createdAt role")
       .lean();

    if (!user) {
        return NextResponse.json({ success: false, error: "Profile not found or is private" }, { status: 404 });
    }

    // Parallel fetch: Find completed courses and earned certificates
    const [progressDocs, certificates] = await Promise.all([
        ProgressModel.find({ 
           userId: user._id, 
           isCompleted: true 
        }).populate("courseId", "title slug thumbnail shortDescription difficulty").lean(),
        CertificateModel ? CertificateModel.find({ userId: user._id }).lean() : Promise.resolve([])
    ]);

    // Format progress docs to only return necessary data
    const completedCourses = progressDocs.map((p: any) => ({
        courseId: p.courseId._id,
        title: p.courseId.title,
        slug: p.courseId.slug,
        thumbnail: p.courseId.thumbnail,
        completedAt: p.completedAt,
    }));

    return NextResponse.json({ 
      success: true, 
      data: {
         user,
         completedCourses,
         certificates
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
