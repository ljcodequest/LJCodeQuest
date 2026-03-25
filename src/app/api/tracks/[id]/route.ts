import { ApiRouteError, apiSuccess, handleRouteError, requireObjectId } from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { sanitizeQuestionForRole } from "@/lib/question-visibility";
import { QuestionModel, TrackModel } from "@/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { role } = await requireRegisteredUser(request);
    const { id } = await params;

    await dbConnect();

    const trackId = requireObjectId(id, "id");
    const track = await TrackModel.findById(trackId).lean();

    if (!track) {
      throw new ApiRouteError(404, "NOT_FOUND", "Track not found");
    }

    const questions = await QuestionModel.find({
      trackId: track._id,
      ...(role === "student" ? { isPublished: true } : {}),
    })
      .sort({ order: 1 })
      .lean();

    return apiSuccess(
      {
        ...track,
        questions: questions.map((question) =>
          sanitizeQuestionForRole(question, role)
        ),
      },
      "Track fetched successfully"
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
