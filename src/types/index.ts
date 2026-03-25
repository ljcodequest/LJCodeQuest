export type UserRole = "student" | "admin" | "instructor";

export type CourseDifficulty = "beginner" | "intermediate" | "advanced";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type QuestionType = "mcq" | "multi-select" | "descriptive" | "coding";

export type ProgressStatus = "enrolled" | "in-progress" | "completed";

export type TrackProgressStatus = "locked" | "in-progress" | "completed";

export type ReviewStatus = "pending" | "reviewed" | "rejected";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
