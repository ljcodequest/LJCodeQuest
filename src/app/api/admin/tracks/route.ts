import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { TrackModel } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const query: any = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Fetch all tracks and populate the course they belong to
    const tracks = await TrackModel.find(query)
      .populate("courseId", "title slug")
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess(tracks);
  } catch (error) {
    return handleRouteError(error);
  }
}
