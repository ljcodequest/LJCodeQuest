import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel } from "@/models";
import { readJsonBody } from "@/lib/api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const body = await readJsonBody<{ role: string }>(request);
    
    if (!["student", "admin", "instructor"].includes(body.role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    // Prevent changing your own role (to prevent accidental lockout)
    if (id === context.user._id.toString() && body.role !== "admin") {
         return NextResponse.json({ success: false, error: "Cannot demote your own account" }, { status: 403 });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { role: body.role },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser, message: "User role updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
