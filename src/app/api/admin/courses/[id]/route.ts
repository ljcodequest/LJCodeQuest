import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CourseModel } from "@/models";
import { readJsonBody } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const course = await CourseModel.findById(id).lean();

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: course });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const body = await readJsonBody<any>(request);

    // Provide slug update if title changed
    let updates = { ...body };
    if (body.title) {
       updates.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const updatedCourse = await CourseModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCourse, message: "Course updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const deleted = await CourseModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
