import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Question } from "@/models/Question";

const JDOODLE_URL = "https://api.jdoodle.com/v1/execute";
const CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
const CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;

export async function POST(request: Request) {
  try {
    // Authenticate the request to prevent abuse of our execution limits
    await requireRegisteredUser(request);
    
    const body = await request.json();
    const { questionId, language, sourceCode, testCases: clientTestCases } = body;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("JDoodle credentials are not configured. Please check your .env file.");
    }

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

    const testCases = question.testCases;

    // Map our frontend language names to JDoodle language codes and versions
    const languageConfig: Record<string, { lang: string; version: string }> = {
       "python": { lang: "python3", version: "3" },    // Python 3.9
       "javascript": { lang: "nodejs", version: "4" }, // Node.js 17
       "java": { lang: "java", version: "4" },         // JDK 17
       "c++": { lang: "cpp", version: "5" }            // GCC 11
    };

    const config = languageConfig[language] || { lang: "python3", version: "3" };
    const results = [];
    let allPassed = true;

    // JDoodle API has a rate limit constraint (max 5 concurrent by default)
    // We execute test cases sequentially to be safe.
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        
        const payload = {
           clientId: CLIENT_ID,
           clientSecret: CLIENT_SECRET,
           script: sourceCode,
           stdin: testCase.input || "",
           language: config.lang,
           versionIndex: config.version
        };

        const response = await fetch(JDOODLE_URL, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload)
        });

        if (!response.ok) {
           let errMessage = "JDoodle API execution failed";
           try {
              const errBody = await response.json();
              errMessage = errBody.error || errBody.message || errMessage;
           } catch {
              const errText = await response.text();
              if (errText) errMessage += `: ${errText}`;
           }
           console.error("JDoodle HTTP Error:", errMessage);
           throw new Error(errMessage);
        }

        const runResult = await response.json();
        
        // Handle JDoodle's internal API limits/errors (which might return HTTP 200 but error in JSON)
        if (runResult.statusCode && runResult.statusCode !== 200) {
           throw new Error(`JDoodle Error: ${runResult.error || "Unknown error"} (Status Code: ${runResult.statusCode})`);
        }
        
        // JDoodle returns combined stdout and stderr in the `output` field
        const actualOutput = String(runResult.output || "").trim();
        const expectedOutput = String(testCase.expectedOutput || "").trim();

        // Check if output matches perfectly
        const passed = actualOutput === expectedOutput;

        if (!passed) allPassed = false;

        results.push({
           name: testCase.isHidden ? `Hidden Test ${i + 1}` : `Test Case ${i + 1}`,
           passed,
           isHidden: testCase.isHidden,
           input: testCase.isHidden ? "Hidden" : testCase.input,
           expectedOutput: testCase.isHidden ? "Hidden" : expectedOutput,
           actualOutput: testCase.isHidden ? (passed ? "Passed" : "Failed") : actualOutput,
           // JDoodle does not strictly separate compile errors from stdout in its basic response
           compileErr: "", 
           stderr: "",     
           code: passed ? 0 : 1 
        });
    }

    return NextResponse.json({ 
       success: true, 
       data: { 
          passed: allPassed, 
          results 
       } 
    });

  } catch (error: any) {
    console.error("Execution Route Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
