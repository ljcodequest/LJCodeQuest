import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { CertificateModel, UserModel, CourseModel } from "@/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await params;
    await dbConnect();
    
    // Allow users to verify certificates dynamically without Auth
    const cert = await CertificateModel.findOne({ certificateId })
       .populate("userId", "displayName username")
       .populate("courseId", "title difficulty")
       .lean();

    if (!cert) {
        return NextResponse.json({ success: false, error: "Certificate Verification Failed. No record found." }, { status: 404 });
    }

    return NextResponse.json({ 
       success: true, 
       data: {
          certificateId: cert.certificateId,
          issuedAt: cert.issuedAt,
          user: cert.userId,
          course: cert.courseId
       }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
