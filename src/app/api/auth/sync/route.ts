import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { cookies } from "next/headers";

export async function POST(req: Request) {
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
    const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");

    let user = await User.findOne({ firebaseUid: uid });

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
        email,
        displayName: name || baseUsername,
        username,
        avatarUrl: picture || "",
        role: "student",
      });
    } else {
      // Optional: Update user info if it changed
      let updated = false;
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
