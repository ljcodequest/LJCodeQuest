import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Question } from "@/models/Question";
import { runCodeAgainstTestCases } from "@/lib/code-runner";

export async function POST(request: Request) {
  try {
    // Authenticate the request to prevent abuse of our execution limits
    await requireRegisteredUser(request);
    
    const body = await request.json();
    const { questionId, language, sourceCode } = body;

    if (!questionId) {
       throw new Error("Missing questionId in request.");
    }

    // Connect to database to fetch the ground-truth test cases!
    // Secret test cases are stripped before being sent to the client. We must get them from the DB.
    await dbConnect();
    const question = await Question.findById(questionId);
    
    if (!question || !question.testCases) {
       throw new Error("Question not found or has no test cases specified.");
    }

    const execution = await runCodeAgainstTestCases({
      language,
      sourceCode,
      testCases: question.testCases,
    });

    return NextResponse.json({ 
       success: true, 
       data: execution 
    });

  } catch (error: any) {
    console.error("Execution Route Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
