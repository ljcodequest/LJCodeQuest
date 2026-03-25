import {
  ApiRouteError,
  apiSuccess,
  handleRouteError,
  optionalBoolean,
  optionalString,
  readJsonBody,
} from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";

interface UpdateProfileBody {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  isPublicProfile?: boolean;
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

export async function GET(request: Request) {
  try {
    const { user } = await requireRegisteredUser(request);

    return apiSuccess(user.toObject(), "Profile fetched successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { session, user } = await requireRegisteredUser(request);
    const body = await readJsonBody<UpdateProfileBody>(request);

    const displayName = optionalString(body.displayName, "displayName", {
      maxLength: 100,
    });
    const username =
      typeof body.username === "string"
        ? normalizeUsername(body.username)
        : undefined;
    const bio = optionalString(body.bio, "bio", { maxLength: 300 });
    const avatarUrl = optionalString(body.avatarUrl, "avatarUrl", {
      maxLength: 500,
    });
    const github = optionalString(body.github, "github", { maxLength: 300 });
    const linkedin = optionalString(body.linkedin, "linkedin", {
      maxLength: 300,
    });
    const website = optionalString(body.website, "website", { maxLength: 300 });
    const isPublicProfile = optionalBoolean(
      body.isPublicProfile,
      "isPublicProfile"
    );

    if (username && username !== user.username) {
      const duplicateUsername = await user.constructor.findOne({
        username,
        firebaseUid: { $ne: session.firebaseUid },
      }).lean();

      if (duplicateUsername) {
        throw new ApiRouteError(
          409,
          "DUPLICATE_ENTRY",
          "That username is already taken"
        );
      }
    }

    if (displayName !== undefined) {
      user.displayName = displayName;
    }

    if (username !== undefined) {
      user.username = username;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    if (github !== undefined) {
      user.github = github;
    }

    if (linkedin !== undefined) {
      user.linkedin = linkedin;
    }

    if (website !== undefined) {
      user.website = website;
    }

    if (isPublicProfile !== undefined) {
      user.isPublicProfile = isPublicProfile;
    }

    await user.save();

    return apiSuccess(user.toObject(), "Profile updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
