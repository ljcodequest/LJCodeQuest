import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

import { USER_ROLES } from "@/constants";
import { ApiRouteError } from "@/lib/api";
import { getFirebaseProjectId } from "@/lib/env";
import dbConnect from "@/lib/db";
import { User as UserModel } from "@/models/User";
import type { UserRole } from "@/types";

const firebaseJwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export interface AuthSession {
  firebaseUid: string;
  email: string | null;
  role: UserRole;
  tokenPayload?: JWTPayload;
}

export interface AuthContext {
  session: AuthSession;
  role: UserRole;
  user: Awaited<ReturnType<typeof UserModel.findOne>>;
}

function getBearerToken(request: Request) {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim() || null;
}

function getSessionCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookieParts = cookieHeader.split(";");

  for (const part of cookieParts) {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (rawName === "session") {
      const token = rawValue.join("=").trim();
      return token ? decodeURIComponent(token) : null;
    }
  }

  return null;
}

function getDevelopmentSession(request: Request): AuthSession | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const firebaseUid = request.headers.get("x-dev-firebase-uid");

  if (!firebaseUid) {
    return null;
  }

  const requestedRole = request.headers.get("x-dev-role");
  const role =
    requestedRole && USER_ROLES.includes(requestedRole as UserRole)
      ? (requestedRole as UserRole)
      : "student";

  return {
    firebaseUid,
    email: request.headers.get("x-dev-email"),
    role,
  };
}

async function verifyFirebaseToken(token: string): Promise<AuthSession> {
  const projectId = getFirebaseProjectId();

  if (!projectId) {
    throw new ApiRouteError(
      500,
      "INTERNAL_ERROR",
      "Firebase project ID is not configured"
    );
  }

  const { payload } = await jwtVerify(token, firebaseJwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ["RS256"],
  });

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new ApiRouteError(
      401,
      "UNAUTHORIZED",
      "Missing or invalid auth token"
    );
  }

  const claimedRole =
    typeof payload.role === "string" &&
    USER_ROLES.includes(payload.role as UserRole)
      ? (payload.role as UserRole)
      : "student";

  return {
    firebaseUid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
    role: claimedRole,
    tokenPayload: payload,
  };
}

export async function authenticateRequest(request: Request) {
  const developmentSession = getDevelopmentSession(request);

  if (developmentSession) {
    return developmentSession;
  }

  const token = getBearerToken(request) ?? getSessionCookieToken(request);

  if (!token) {
    throw new ApiRouteError(
      401,
      "UNAUTHORIZED",
      "Missing or invalid auth token"
    );
  }

  try {
    return await verifyFirebaseToken(token);
  } catch (error) {
    if (error instanceof ApiRouteError) {
      throw error;
    }

    throw new ApiRouteError(
      401,
      "UNAUTHORIZED",
      "Missing or invalid auth token"
    );
  }
}

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const session = await authenticateRequest(request);

  await dbConnect();

  const user = await UserModel.findOne({
    firebaseUid: session.firebaseUid,
  });

  return {
    session,
    role: (user?.role as UserRole | undefined) ?? session.role,
    user,
  };
}

export async function requireRegisteredUser(request: Request) {
  const context = await getAuthContext(request);

  if (!context.user) {
    throw new ApiRouteError(
      404,
      "NOT_FOUND",
      "User profile not found. Complete registration first."
    );
  }

  return context as AuthContext & { user: NonNullable<AuthContext["user"]> };
}

export async function requireAdmin(request: Request) {
  const context = await requireRegisteredUser(request);

  if (context.role !== "admin") {
    throw new ApiRouteError(403, "FORBIDDEN", "Admin access required");
  }

  return context;
}
