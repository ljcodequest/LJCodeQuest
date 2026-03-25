import { NextResponse } from "next/server";
import { Types } from "mongoose";

import type { PaginationMeta } from "@/types";

export class ApiRouteError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiRouteError";
    this.status = status;
    this.code = code;
  }
}

export function apiSuccess<T>(
  data: T,
  message = "Operation successful",
  init?: ResponseInit
) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    init
  );
}

export function apiPaginated<T>(
  data: T,
  pagination: PaginationMeta,
  message = "Operation successful",
  init?: ResponseInit
) {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
      message,
    },
    init
  );
}

export function apiError(
  error: string,
  code: string,
  status: number,
  init?: ResponseInit
) {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
    },
    {
      status,
      ...init,
    }
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return apiError(error.message, error.code, error.status);
  }

  console.error(error);

  return apiError(
    "An unexpected server error occurred.",
    "INTERNAL_ERROR",
    500
  );
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiRouteError(400, "VALIDATION_ERROR", "Invalid JSON request body");
  }
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
) {
  const page = coercePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(
    coercePositiveInt(searchParams.get("limit"), defaultLimit),
    maxLimit
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function coercePositiveInt(value: string | null, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.floor(parsedValue);
}

export function requireString(
  value: unknown,
  fieldName: string,
  options?: {
    minLength?: number;
    maxLength?: number;
  }
) {
  if (typeof value !== "string") {
    throw new ApiRouteError(
      400,
      "VALIDATION_ERROR",
      `${fieldName} must be a string`
    );
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new ApiRouteError(
      400,
      "VALIDATION_ERROR",
      `${fieldName} is required`
    );
  }

  if (
    options?.minLength !== undefined &&
    normalizedValue.length < options.minLength
  ) {
    throw new ApiRouteError(
      400,
      "VALIDATION_ERROR",
      `${fieldName} must be at least ${options.minLength} characters`
    );
  }

  if (
    options?.maxLength !== undefined &&
    normalizedValue.length > options.maxLength
  ) {
    throw new ApiRouteError(
      400,
      "VALIDATION_ERROR",
      `${fieldName} must be at most ${options.maxLength} characters`
    );
  }

  return normalizedValue;
}

export function optionalString(
  value: unknown,
  fieldName: string,
  options?: {
    maxLength?: number;
  }
) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return requireString(value, fieldName, {
    maxLength: options?.maxLength,
  });
}

export function optionalBoolean(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new ApiRouteError(
      400,
      "VALIDATION_ERROR",
      `${fieldName} must be a boolean`
    );
  }

  return value;
}

export function ensureAllowedValue<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
) {
  if (!allowedValues.includes(value as T)) {
    throw new ApiRouteError(
      400,
      "VALIDATION_ERROR",
      `${fieldName} must be one of: ${allowedValues.join(", ")}`
    );
  }

  return value as T;
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function requireObjectId(value: string | null, fieldName: string) {
  const normalizedValue = requireString(value, fieldName);

  if (!Types.ObjectId.isValid(normalizedValue)) {
    throw new ApiRouteError(
      400,
      "VALIDATION_ERROR",
      `${fieldName} must be a valid id`
    );
  }

  return normalizedValue;
}
