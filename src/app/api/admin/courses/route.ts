import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CourseModel } from "@/models";
import { readJsonBody, optionalString, optionalBoolean } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await dbConnect();

    // Get search/sort params from requested URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const query: any = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const courses = await CourseModel.find(query).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({ success: true, data: courses, message: "Fetched courses" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireAdmin(request);
    await dbConnect();

    const body = await readJsonBody<any>(request);

    if (!body.title) {
        return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // check if slug exists
    const existing = await CourseModel.findOne({ slug });
    if (existing) {
        return NextResponse.json({ success: false, error: "Course with similar title already exists." }, { status: 400 });
    }

    const newCourse = await CourseModel.create({
      title: body.title,
      slug,
      description: body.description || "",
      shortDescription: body.shortDescription || body.description?.substring(0, 150) || "",
      thumbnail: body.thumbnail || "https://placehold.co/600x400/png",
      difficulty: body.difficulty || "beginner",
      language: body.language || "javascript",
      tags: body.tags || [],
      isPublished: body.isPublished || false,
      createdBy: context.user._id,
    });

    return NextResponse.json({ success: true, data: newCourse, message: "Course created successfully" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
