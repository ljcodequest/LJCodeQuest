import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import { QuestionModel } from "@/models";

export async function POST(request: Request) {
  try {
    const context = await requireRegisteredUser(request);
    await dbConnect();
    
    const body = await request.json();
    const { questionId, sourceCode, language } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: "AI Mentor is currently offline." }, { status: 503 });
    }

    const question = await QuestionModel.findById(questionId).lean();
    if (!question) {
       return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using structured schema to force Gemini to return valid JSON
    const responseSchema: Schema = {
       type: SchemaType.OBJECT,
       properties: {
          timeComplexity: { type: SchemaType.STRING, description: "Big O time complexity notation like O(N) or O(N^2)" },
          spaceComplexity: { type: SchemaType.STRING, description: "Big O space complexity notation like O(1) or O(N)" },
          qualityScore: { type: SchemaType.NUMBER, description: "Score from 1 to 10 evaluating the code readability" },
          refactoringTips: {
             type: SchemaType.ARRAY,
             items: { type: SchemaType.STRING },
             description: "2 or 3 bullet points with advanced suggestions to make the code cleaner"
          }
       },
       required: ["timeComplexity", "spaceComplexity", "qualityScore", "refactoringTips"]
    };

    const model = genAI.getGenerativeModel({ 
       model: "gemini-1.5-flash",
       generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
       }
    });

    const prompt = `
The student has successfully solved the coding challenge: "${question.title}".
Language: ${language}
Their submitted code:
\`\`\`
${sourceCode}
\`\`\`

Please act as a Senior Engineer doing a Pull Request review. 
Evaluate their Time/Space complexity and give them a quality score and 2 actionable tips on how they could write it better next time.
    `;

    const result = await model.generateContent(prompt);
    const jsonStr = result.response.text();
    const metrics = JSON.parse(jsonStr);

    return NextResponse.json({ 
       success: true, 
       data: metrics
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
