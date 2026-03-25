import { ApiRouteError, apiSuccess, handleRouteError, readJsonBody, requireString } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel } from "@/models";

interface RegisterBody {
  firebaseUid?: string;
  email?: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
}

function normalizeUsername(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,30}$/.test(normalizedValue)) {
    throw new ApiRouteError(
      400,
      "VALIDATION_ERROR",
      "username must be 3-30 characters and contain only lowercase letters, numbers, or underscores"
    );
  }

  return normalizedValue;
}

export async function POST(request: Request) {
  try {
    const session = await authenticateRequest(request);
    const body = await readJsonBody<RegisterBody>(request);

    const firebaseUid = body.firebaseUid
      ? requireString(body.firebaseUid, "firebaseUid")
      : session.firebaseUid;

    if (firebaseUid !== session.firebaseUid) {
      throw new ApiRouteError(
        400,
        "VALIDATION_ERROR",
        "firebaseUid must match the authenticated user"
      );
    }

    const email = requireString(body.email ?? session.email, "email").toLowerCase();
    const displayName = requireString(body.displayName, "displayName", {
      maxLength: 100,
    });
    const username = normalizeUsername(requireString(body.username, "username"));
    const avatarUrl =
      typeof body.avatarUrl === "string" && body.avatarUrl.trim().length > 0
        ? body.avatarUrl.trim()
        : undefined;

    await dbConnect();

    const existingUser = await UserModel.findOne({
      $or: [
        { firebaseUid: session.firebaseUid },
        { email },
        { username },
      ],
    }).lean();

    if (existingUser) {
      throw new ApiRouteError(
        409,
        "DUPLICATE_ENTRY",
        "A user with that Firebase account, email, or username already exists"
      );
    }

    const user = await UserModel.create({
      firebaseUid: session.firebaseUid,
      email,
      displayName,
      username,
      avatarUrl,
    });

    return apiSuccess(user.toObject(), "User registered successfully", {
      status: 201,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
