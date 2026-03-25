import { QUESTION_TYPES } from "@/constants";
import {
  apiSuccess,
  ensureAllowedValue,
  handleRouteError,
  requireObjectId,
} from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { sanitizeQuestionForRole } from "@/lib/question-visibility";
import { QuestionModel } from "@/models";

export async function GET(request: Request) {
  try {
    const { role } = await requireRegisteredUser(request);

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const trackId = requireObjectId(searchParams.get("trackId"), "trackId");
    const type = searchParams.get("type")?.trim();

    const query: Record<string, unknown> = {
      trackId,
      ...(role === "student" ? { isPublished: true } : {}),
    };

    if (type) {
      query.type = ensureAllowedValue(type, QUESTION_TYPES, "type");
    }

    const questions = await QuestionModel.find(query).sort({ order: 1 }).lean();

    return apiSuccess(
      questions.map((question) => sanitizeQuestionForRole(question, role)),
      "Questions fetched successfully"
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
