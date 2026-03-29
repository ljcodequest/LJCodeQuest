import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import { QuestionModel } from "@/models";

// Initialize Gemini SDK lazily to ensure missing API keys don't crash the server at boot
const getGeminiClient = () => {
   if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
   }
   return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

export async function POST(request: Request) {
  try {
    const context = await requireRegisteredUser(request);
    await dbConnect();
    
    const body = await request.json();
    const { questionId, sourceCode, language } = body;

    const question = await QuestionModel.findById(questionId).lean();
    if (!question || question.type !== "coding") {
       return NextResponse.json({ success: false, error: "Invalid coding challenge" }, { status: 400 });
    }

    const genAI = getGeminiClient();
    // We use gemini-1.5-flash for maximum speed / low latency in an interactive UI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an expert Socratic programming mentor for a student learning ${language}. 
The student is trying to solve the following problem:
"${question.title}"
Description: ${question.description}

Here is the student's current code:
\`\`\`${language}
${sourceCode || "// No code written yet"}
\`\`\`

Analyze their code without writing a solution for them. 
Generate a short 1 to 2 sentence hint pointing them in the right direction. 
If they have a syntax error or logic flaw, mention it conceptually. 
DO NOT write code for them. Treat them like a student you are mentoring. Be encouraging!
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ 
       success: true, 
       data: { hint: text }
    });

  } catch (error: any) {
    if (error.message.includes("GEMINI_API_KEY")) {
       return NextResponse.json({ success: false, error: "AI Mentor is currently offline (Missing API Key)." }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
