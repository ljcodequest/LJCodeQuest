import { COURSE_DIFFICULTIES } from "@/constants";
import {
  apiPaginated,
  ensureAllowedValue,
  escapeRegex,
  handleRouteError,
  parsePagination,
  requireString,
  createPaginationMeta,
} from "@/lib/api";
import dbConnect from "@/lib/db";
import { CourseModel } from "@/models";

const allowedSorts = [
  "createdAt",
  "title",
  "enrollmentCount",
  "averageRating",
  "totalTracks",
] as const;

const sortMap: Record<(typeof allowedSorts)[number], Record<string, 1 | -1>> = {
  averageRating: { averageRating: -1, title: 1 },
  createdAt: { createdAt: -1 },
  enrollmentCount: { enrollmentCount: -1, title: 1 },
  title: { title: 1 },
  totalTracks: { totalTracks: -1, title: 1 },
};

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const language = searchParams.get("language")?.trim();
    const difficulty = searchParams.get("difficulty")?.trim();
    const search = searchParams.get("search")?.trim();
    const sortValue = searchParams.get("sort")?.trim() ?? "enrollmentCount";
    const sort = ensureAllowedValue(sortValue, allowedSorts, "sort");

    const query: Record<string, unknown> = {
      isPublished: true,
    };

    if (language) {
      query.language = requireString(language, "language", { maxLength: 50 });
    }

    if (difficulty) {
      query.difficulty = ensureAllowedValue(
        difficulty,
        COURSE_DIFFICULTIES,
        "difficulty"
      );
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      query.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { shortDescription: { $regex: safeSearch, $options: "i" } },
        { tags: { $elemMatch: { $regex: safeSearch, $options: "i" } } },
      ];
    }

    const [courses, total] = await Promise.all([
      CourseModel.find(query)
        .sort(sortMap[sort])
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseModel.countDocuments(query),
    ]);

    return apiPaginated(
      courses,
      createPaginationMeta(page, limit, total),
      "Courses fetched successfully"
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
