import { ApiRouteError } from "@/lib/api";

const JDOODLE_URL = "https://api.jdoodle.com/v1/execute";

const languageConfig: Record<string, { lang: string; version: string }> = {
  python: { lang: "python3", version: "3" },
  javascript: { lang: "nodejs", version: "4" },
  java: { lang: "java", version: "4" },
  "c++": { lang: "cpp", version: "5" },
};

export interface CodeRunnerTestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  weight?: number;
}

export async function runCodeAgainstTestCases(options: {
  language: string;
  sourceCode: string;
  testCases: CodeRunnerTestCase[];
}) {
  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ApiRouteError(
      503,
      "CODE_RUNNER_UNAVAILABLE",
      "Code execution is not configured yet."
    );
  }

  if (!options.sourceCode.trim()) {
    throw new ApiRouteError(400, "VALIDATION_ERROR", "Source code is required.");
  }

  if (options.testCases.length === 0) {
    throw new ApiRouteError(
      400,
      "VALIDATION_ERROR",
      "This coding question has no test cases configured."
    );
  }

  const config = languageConfig[options.language] || languageConfig.python;
  const results = [];
  let allPassed = true;

  for (let i = 0; i < options.testCases.length; i += 1) {
    const testCase = options.testCases[i];
    const response = await fetch(JDOODLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        clientSecret,
        script: options.sourceCode,
        stdin: testCase.input || "",
        language: config.lang,
        versionIndex: config.version,
      }),
    });

    if (!response.ok) {
      throw new ApiRouteError(
        502,
        "CODE_RUNNER_FAILED",
        "The code runner failed to execute this submission."
      );
    }

    const runResult = await response.json();

    if (runResult.statusCode && runResult.statusCode !== 200) {
      throw new ApiRouteError(
        502,
        "CODE_RUNNER_FAILED",
        `Code runner error: ${runResult.error || "Unknown error"}`
      );
    }

    const actualOutput = String(runResult.output || "").trim();
    const expectedOutput = String(testCase.expectedOutput || "").trim();
    const passed = actualOutput === expectedOutput;

    if (!passed) {
      allPassed = false;
    }

    results.push({
      testCaseId: testCase.id || `test-${i + 1}`,
      name: testCase.isHidden ? `Hidden Test ${i + 1}` : `Test Case ${i + 1}`,
      passed,
      isHidden: Boolean(testCase.isHidden),
      input: testCase.isHidden ? "Hidden" : testCase.input,
      expectedOutput: testCase.isHidden ? "Hidden" : expectedOutput,
      actualOutput: testCase.isHidden ? (passed ? "Passed" : "Failed") : actualOutput,
      executionTime: Number(runResult.cpuTime || 0),
      memoryUsed: Number(runResult.memory || 0),
      compileErr: "",
      stderr: "",
      code: passed ? 0 : 1,
    });
  }

  return {
    passed: allPassed,
    results,
  };
}
