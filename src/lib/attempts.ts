import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import type { IQuestion } from "@/models/Question";
import { ApiRouteError } from "@/lib/api";
import { AttemptModel } from "@/models";

const DEFAULT_QUESTION_TIME_LIMIT_MINUTES = 10;

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}

export function getQuestionTimeLimitMinutes(question: Pick<IQuestion, "timeLimit">) {
  const minutes = Number(question.timeLimit);

  if (!Number.isFinite(minutes) || minutes < 1) {
    return DEFAULT_QUESTION_TIME_LIMIT_MINUTES;
  }

  return Math.floor(minutes);
}

export async function getOrCreateActiveAttempt(options: {
  request: NextRequest | Request;
  userId: Types.ObjectId | string;
  courseId: Types.ObjectId | string;
  trackId: Types.ObjectId | string;
  question: IQuestion & { _id: Types.ObjectId | string };
}) {
  const now = new Date();
  const existingAttempt = await AttemptModel.findOne({
    userId: options.userId,
    questionId: options.question._id,
    status: "active",
  });

  if (existingAttempt) {
    if (existingAttempt.expiresAt.getTime() <= now.getTime()) {
      existingAttempt.status = "timed_out";
      existingAttempt.submittedAt = now;
      existingAttempt.durationMs =
        now.getTime() - existingAttempt.startedAt.getTime();
      await existingAttempt.save();

      throw new ApiRouteError(
        409,
        "ATTEMPT_EXPIRED",
        "This timed attempt has expired. Refresh to continue with the next available question."
      );
    }

    return existingAttempt;
  }

  const timeLimitMinutes = getQuestionTimeLimitMinutes(options.question);
  const startedAt = now;
  const expiresAt = new Date(startedAt.getTime() + timeLimitMinutes * 60 * 1000);

  return AttemptModel.create({
    userId: options.userId,
    courseId: options.courseId,
    trackId: options.trackId,
    questionId: options.question._id,
    status: "active",
    startedAt,
    expiresAt,
    ipAddress: getClientIp(options.request),
    userAgent: options.request.headers.get("user-agent") || undefined,
    snapshot: {
      questionTitle: options.question.title,
      questionType: options.question.type,
      questionOrder: options.question.order,
      points: 100,
      timeLimitMinutes,
    },
  });
}

export async function requireActiveAttempt(options: {
  request: NextRequest | Request;
  userId: Types.ObjectId | string;
  courseId: Types.ObjectId | string;
  trackId: Types.ObjectId | string;
  question: IQuestion & { _id: Types.ObjectId | string };
}) {
  return getOrCreateActiveAttempt(options);
}

export async function markAttemptSubmitted(attemptId: Types.ObjectId | string) {
  const now = new Date();
  const attempt = await AttemptModel.findById(attemptId);

  if (!attempt) {
    return;
  }

  attempt.status = "submitted";
  attempt.submittedAt = now;
  attempt.durationMs = now.getTime() - attempt.startedAt.getTime();
  await attempt.save();
}
