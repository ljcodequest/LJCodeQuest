import { NextResponse } from "next/server";

import { ApiRouteError, readJsonBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ChallengeModel, ChallengeProgressModel } from "@/models";

type ChallengeBody = {
  title?: string;
  summary?: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  category?: string;
  language?: string;
  starterCode?: string;
  testCases?: Array<{
    id?: string;
    input?: string;
    expectedOutput?: string;
    isHidden?: boolean;
    weight?: number;
  }>;
  xpReward?: number;
  timeLimitMinutes?: number;
  tags?: string[];
  isPublished?: boolean;
};

function createSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: "status" in error ? Number(error.status) : 500,
    };
  }

  return { message: "Unexpected challenge error", status: 500 };
}

function normalizeChallengeBody(body: ChallengeBody) {
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (!body.title.trim()) throw new ApiRouteError(400, "VALIDATION_ERROR", "Title is required");
    updates.title = body.title.trim();
    updates.slug = createSlug(body.title);
  }

  if (body.summary !== undefined) {
    if (!body.summary.trim()) throw new ApiRouteError(400, "VALIDATION_ERROR", "Summary is required");
    updates.summary = body.summary.trim();
  }

  if (body.description !== undefined) {
    if (!body.description.trim()) {
      throw new ApiRouteError(400, "VALIDATION_ERROR", "Description is required");
    }
    updates.description = body.description.trim();
  }

  if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
  if (body.category !== undefined) updates.category = body.category.trim() || "JavaScript";
  if (body.language !== undefined) updates.language = body.language;
  if (body.starterCode !== undefined) updates.starterCode = body.starterCode;
  if (body.xpReward !== undefined) updates.xpReward = Number(body.xpReward) || 50;
  if (body.timeLimitMinutes !== undefined) {
    updates.timeLimitMinutes = Number(body.timeLimitMinutes) || 30;
  }
  if (body.tags !== undefined) {
    updates.tags = body.tags.map((tag) => tag.trim()).filter(Boolean);
  }
  if (body.isPublished !== undefined) updates.isPublished = Boolean(body.isPublished);

  if (body.testCases !== undefined) {
    const testCases = body.testCases
      .filter((testCase) => testCase.expectedOutput !== undefined)
      .map((testCase, index) => ({
        id: testCase.id?.trim() || `test-${index + 1}`,
        input: testCase.input || "",
        expectedOutput: String(testCase.expectedOutput || ""),
        isHidden: Boolean(testCase.isHidden),
        weight: Number(testCase.weight) || 1,
      }));

    if (testCases.length === 0) {
      throw new ApiRouteError(400, "VALIDATION_ERROR", "At least one test case is required");
    }

    updates.testCases = testCases;
  }

  return updates;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const { id } = await params;
    const challenge = await ChallengeModel.findById(id).lean();

    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: challenge });
  } catch (error: unknown) {
    const routeError = getError(error);
    return NextResponse.json(
      { success: false, error: routeError.message },
      { status: routeError.status || 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const { id } = await params;
    const body = await readJsonBody<ChallengeBody>(request);
    const updates = normalizeChallengeBody(body);

    if (updates.slug) {
      const duplicate = await ChallengeModel.findOne({
        slug: updates.slug,
        _id: { $ne: id },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "Challenge with a similar title already exists." },
          { status: 400 }
        );
      }
    }

    const challenge = await ChallengeModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: challenge,
      message: "Challenge updated successfully",
    });
  } catch (error: unknown) {
    const routeError = getError(error);
    return NextResponse.json(
      { success: false, error: routeError.message },
      { status: routeError.status || 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const { id } = await params;
    const deleted = await ChallengeModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    await ChallengeProgressModel.deleteMany({ challengeId: id });

    return NextResponse.json({ success: true, message: "Challenge deleted successfully" });
  } catch (error: unknown) {
    const routeError = getError(error);
    return NextResponse.json(
      { success: false, error: routeError.message },
      { status: routeError.status || 500 }
    );
  }
}
