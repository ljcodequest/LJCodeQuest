import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import dbConnect from "@/lib/db";
import { UserModel } from "@/models";
import { IUser } from "@/models/User";

export async function getSessionUser(): Promise<IUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    await dbConnect();
    
    // We expect the user to be in our MongoDB
    const user = await UserModel.findOne({ 
      firebaseUid: decodedToken.uid 
    }).lean();

    return user as IUser;
  } catch (error) {
    console.error("Failed to verify session token in Server Component:", error);
    return null;
  }
}
