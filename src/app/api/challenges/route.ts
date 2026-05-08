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

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const difficulty = searchParams.get("difficulty");
    const category = searchParams.get("category")?.trim();

    const query: Record<string, unknown> = { isPublished: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    const challenges = await ChallengeModel.find(query)
      .select("-testCases.expectedOutput")
      .sort({ createdAt: -1 })
      .lean();

    const userId = await getOptionalUserId(request);

    if (!userId) {
      return NextResponse.json({ success: true, data: challenges });
    }

    const progressDocs = await ChallengeProgressModel.find({
      userId,
      challengeId: { $in: challenges.map((challenge) => challenge._id) },
    })
      .select("challengeId status attempts bestScore completedAt lastAttemptAt")
      .lean();

    const progressByChallengeId = new Map(
      progressDocs.map((progress) => [
        progress.challengeId.toString(),
        {
          status: progress.status,
          attempts: progress.attempts,
          bestScore: progress.bestScore,
          completedAt: progress.completedAt,
          lastAttemptAt: progress.lastAttemptAt,
        },
      ])
    );

    const data = challenges.map((challenge) => ({
      ...challenge,
      progress: progressByChallengeId.get(challenge._id.toString()) ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const routeError = getError(error);
    return NextResponse.json(
      { success: false, error: routeError.message },
      { status: routeError.status || 500 }
    );
  }
}

