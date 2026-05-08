import { NextResponse } from "next/server";

import { readJsonBody } from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";
import { runCodeAgainstTestCases } from "@/lib/code-runner";
import dbConnect from "@/lib/db";
import { ChallengeModel, ChallengeProgressModel, UserModel } from "@/models";

type SubmitBody = {
  language?: string;
  sourceCode?: string;
};

function getError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: "status" in error ? Number(error.status) : 500,
    };
  }

  return { message: "Unexpected challenge submission error", status: 500 };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const context = await requireRegisteredUser(request);
    await dbConnect();

    const { slug } = await params;
    const body = await readJsonBody<SubmitBody>(request);

    const challenge = await ChallengeModel.findOne({ slug, isPublished: true });

    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    const language = body.language || challenge.language;
    const sourceCode = body.sourceCode || "";
    const execution = await runCodeAgainstTestCases({
      language,
      sourceCode,
      testCases: challenge.testCases,
    });

    const totalWeight = challenge.testCases.reduce(
      (sum, testCase) => sum + (Number(testCase.weight) || 1),
      0
    );
    const passedWeight = execution.results.reduce((sum, result, index) => {
      if (!result.passed) return sum;
      return sum + (Number(challenge.testCases[index]?.weight) || 1);
    }, 0);
    const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
    const passed = execution.passed;

    const existingProgress = await ChallengeProgressModel.findOne({
      userId: context.user._id,
      challengeId: challenge._id,
    });
    const firstCompletion = passed && existingProgress?.status !== "completed";

    const progress = await ChallengeProgressModel.findOneAndUpdate(
      {
        userId: context.user._id,
        challengeId: challenge._id,
      },
      {
        $set: {
          status: passed ? "completed" : existingProgress?.status || "in-progress",
          bestScore: Math.max(score, existingProgress?.bestScore || 0),
          lastSubmittedCode: sourceCode,
          language,
          lastAttemptAt: new Date(),
          ...(passed && !existingProgress?.completedAt ? { completedAt: new Date() } : {}),
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await ChallengeModel.findByIdAndUpdate(challenge._id, {
      $inc: {
        submissionsCount: 1,
        completionsCount: firstCompletion ? 1 : 0,
      },
    });

    if (firstCompletion) {
      await UserModel.findByIdAndUpdate(context.user._id, {
        $inc: { xp: challenge.xpReward },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        passed,
        score,
        xpEarned: firstCompletion ? challenge.xpReward : 0,
        execution,
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
