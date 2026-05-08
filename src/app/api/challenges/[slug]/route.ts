import { NextResponse } from "next/server";

import { ApiRouteError } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ChallengeModel, ChallengeProgressModel } from "@/models";

function getError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: "status" in error ? Number(error.status) : 500,
    };
  }

  return { message: "Unexpected challenge error", status: 500 };
}

async function getOptionalUserId(request: Request) {
  try {
    const context = await getAuthContext(request);
    return context.user?._id ?? null;
  } catch (error) {
    if (error instanceof ApiRouteError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();

    const { slug } = await params;
    const challenge = await ChallengeModel.findOne({ slug, isPublished: true }).lean();

    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    const userId = await getOptionalUserId(request);
    const progress = userId
      ? await ChallengeProgressModel.findOne({
          userId,
          challengeId: challenge._id,
        })
          .select("status attempts bestScore lastSubmittedCode language completedAt lastAttemptAt")
          .lean()
      : null;

    const visibleChallenge = {
      ...challenge,
      testCases: challenge.testCases.map((testCase, index) => ({
        id: testCase.id || `test-${index + 1}`,
        input: testCase.isHidden ? "Hidden" : testCase.input,
        expectedOutput: testCase.isHidden ? "Hidden" : testCase.expectedOutput,
        isHidden: testCase.isHidden,
        weight: testCase.weight,
      })),
    };

    return NextResponse.json({
      success: true,
      data: {
        challenge: visibleChallenge,
        progress,
      },
    });
  } catch (error: unknown) {
    const routeError = getError(error);
    return NextResponse.json(
      { success: false, error: routeError.message },
      { status: routeError.status || 500 }
    );
  }
}

