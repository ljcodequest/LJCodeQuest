import { NextResponse } from "next/server";

import { ApiRouteError, readJsonBody } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ChallengeModel } from "@/models";

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
  if (!body.title?.trim()) {
    throw new ApiRouteError(400, "VALIDATION_ERROR", "Title is required");
  }

  if (!body.summary?.trim()) {
    throw new ApiRouteError(400, "VALIDATION_ERROR", "Summary is required");
  }

  if (!body.description?.trim()) {
    throw new ApiRouteError(400, "VALIDATION_ERROR", "Description is required");
  }

  const testCases = (body.testCases || [])
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

  return {
    title: body.title.trim(),
    summary: body.summary.trim(),
    description: body.description.trim(),
    difficulty: body.difficulty || "easy",
    category: body.category?.trim() || "JavaScript",
    language: body.language || "javascript",
    starterCode: body.starterCode || "",
    testCases,
    xpReward: Number(body.xpReward) || 50,
    timeLimitMinutes: Number(body.timeLimitMinutes) || 30,
    tags: (body.tags || []).map((tag) => tag.trim()).filter(Boolean),
    isPublished: Boolean(body.isPublished),
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
            { tags: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const challenges = await ChallengeModel.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: challenges,
      message: "Fetched challenges",
    });
  } catch (error: unknown) {
    const routeError = getError(error);
    return NextResponse.json(
      { success: false, error: routeError.message },
      { status: routeError.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireAdmin(request);
    await dbConnect();

    const body = await readJsonBody<ChallengeBody>(request);
    const normalizedBody = normalizeChallengeBody(body);
    const slug = createSlug(normalizedBody.title);

    const existing = await ChallengeModel.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Challenge with a similar title already exists." },
        { status: 400 }
      );
    }

    const challenge = await ChallengeModel.create({
      ...normalizedBody,
      slug,
      createdBy: context.user._id,
    });

    return NextResponse.json(
      { success: true, data: challenge, message: "Challenge created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    const routeError = getError(error);
    return NextResponse.json(
      { success: false, error: routeError.message },
      { status: routeError.status || 500 }
    );
  }
}
