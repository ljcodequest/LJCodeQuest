import { ApiRouteError, apiSuccess, handleRouteError, requireObjectId } from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { sanitizeQuestionForRole } from "@/lib/question-visibility";
import { QuestionModel } from "@/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { role } = await requireRegisteredUser(request);
    const { id } = await params;

    await dbConnect();

    const questionId = requireObjectId(id, "id");
    const question = await QuestionModel.findById(questionId).lean();

    if (!question || (role === "student" && !question.isPublished)) {
      throw new ApiRouteError(404, "NOT_FOUND", "Question not found");
    }

    return apiSuccess(
      sanitizeQuestionForRole(question as any, role),
      "Question fetched successfully"
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
