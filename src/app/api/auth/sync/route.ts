import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { cookies } from "next/headers";

const FALLBACK_ADMIN_EMAILS = ["lhcodequest@gmail.com"];

function getAdminEmails() {
  const configuredEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return new Set([...FALLBACK_ADMIN_EMAILS, ...configuredEmails]);
}

function getRoleForEmail(email: string) {
  return getAdminEmails().has(email.toLowerCase()) ? "admin" : "user";
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(session);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await connectDB();

    // Create a base username from email if displayName is missing
    const normalizedEmail = email.toLowerCase();
    const role = getRoleForEmail(normalizedEmail);
    const baseUsername = normalizedEmail.split("@")[0].replace(/[^a-z0-9]/g, "");

    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: normalizedEmail }],
    });

    if (!user) {
      // Create new user
      // Ensure unique username
      let username = baseUsername;
      let counter = 1;
      while (await User.exists({ username })) {
         username = `${baseUsername}${counter}`;
         counter++;
      }

      user = await User.create({
        firebaseUid: uid,
        email: normalizedEmail,
        displayName: name || baseUsername,
        username,
        avatarUrl: picture || "",
        role,
      });
    } else {
      // Optional: Update user info if it changed
      let updated = false;
      if (user.firebaseUid !== uid) {
        user.firebaseUid = uid;
        updated = true;
      }
      if (user.email !== normalizedEmail) {
        user.email = normalizedEmail;
        updated = true;
      }
      if (user.role !== role) {
        user.role = role;
        updated = true;
      }
      if (name && user.displayName !== name) {
        user.displayName = name;
        updated = true;
      }
      if (picture && user.avatarUrl !== picture) {
        user.avatarUrl = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
