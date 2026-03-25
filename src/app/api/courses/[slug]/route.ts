import { ApiRouteError, apiSuccess, handleRouteError, requireString } from "@/lib/api";
import dbConnect from "@/lib/db";
import { CourseModel, TrackModel } from "@/models";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();

    const { slug } = await params;
    const normalizedSlug = requireString(slug, "slug").toLowerCase();

    const course = await CourseModel.findOne({
      slug: normalizedSlug,
      isPublished: true,
    }).lean();

    if (!course) {
      throw new ApiRouteError(404, "NOT_FOUND", "Course not found");
    }

    const tracks = await TrackModel.find({
      courseId: course._id,
      isPublished: true,
    })
      .sort({ order: 1 })
      .lean();

    return apiSuccess(
      {
        ...course,
        tracks,
      },
      "Course fetched successfully"
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
