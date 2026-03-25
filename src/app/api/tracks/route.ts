import { apiSuccess, handleRouteError, requireObjectId } from "@/lib/api";
import dbConnect from "@/lib/db";
import { TrackModel } from "@/models";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const courseId = requireObjectId(searchParams.get("courseId"), "courseId");

    const tracks = await TrackModel.find({
      courseId,
      isPublished: true,
    })
      .sort({ order: 1 })
      .lean();

    return apiSuccess(tracks, "Tracks fetched successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
