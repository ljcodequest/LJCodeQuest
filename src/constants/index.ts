import type {
  CourseDifficulty,
  ProgressStatus,
  QuestionDifficulty,
  QuestionType,
  ReviewStatus,
  TrackProgressStatus,
  UserRole,
} from "@/types";

export const USER_ROLES = ["student", "admin", "instructor"] as const satisfies readonly UserRole[];

export const COURSE_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
] as const satisfies readonly CourseDifficulty[];

export const QUESTION_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
] as const satisfies readonly QuestionDifficulty[];

export const QUESTION_TYPES = [
  "mcq",
  "multi-select",
  "descriptive",
  "coding",
] as const satisfies readonly QuestionType[];

export const PROGRESS_STATUSES = [
  "enrolled",
  "in-progress",
  "completed",
] as const satisfies readonly ProgressStatus[];

export const TRACK_PROGRESS_STATUSES = [
  "locked",
  "in-progress",
  "completed",
] as const satisfies readonly TrackProgressStatus[];

export const REVIEW_STATUSES = [
  "pending",
  "reviewed",
  "rejected",
] as const satisfies readonly ReviewStatus[];
