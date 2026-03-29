import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { UserModel } from "@/models";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    const query: any = {};
    
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }
    
    if (role && role !== "all") {
      query.role = role;
    }

    const users = await UserModel.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
