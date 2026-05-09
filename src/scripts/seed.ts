import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

import dbConnect from "../lib/db";
import { calculateLevel } from "../lib/gamification";
import { ActivityLogModel } from "../models/ActivityLog";
import { Attempt } from "../models/Attempt";
import { CertificateModel } from "../models/Certificate";
import { Challenge } from "../models/Challenge";
import { ChallengeProgress } from "../models/ChallengeProgress";
import { Course } from "../models/Course";
import { Progress } from "../models/Progress";
import { Question } from "../models/Question";
import { Submission } from "../models/Submission";
import { Track } from "../models/Track";
import { User } from "../models/User";

loadEnvConfig(process.cwd());

const RESET_FLAG = "--reset";
const QUESTIONS_PER_TRACK = 24;

type Difficulty = "beginner" | "intermediate" | "advanced";
type QuestionDifficulty = "easy" | "medium" | "hard";
type QuestionType = "mcq" | "multi-select" | "descriptive" | "coding";

type QuestionSeed = {
  type: QuestionType;
  title: string;
  description: string;
  difficulty: QuestionDifficulty;
  xpReward: number;
  explanation?: string;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  sampleAnswer?: string;
  maxWords?: number;
  rubric?: string;
  language?: string;
  starterCode?: string;
  testCases?: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: number;
  }>;
  hints?: string[];
  tags: string[];
};

type TrackSeed = {
  difficulty: Difficulty;
  title: string;
  description: string;
  theory: string;
  xpReward: number;
  passingScore: number;
  questions: QuestionSeed[];
};

type CourseSeed = {
  title: string;
  description: string;
  shortDescription: string;
  difficulty: Difficulty;
  language: string;
  estimatedHours: number;
  tags: string[];
  thumbnail: string;
  averageRating: number;
  enrollmentCount: number;
  tracks: TrackSeed[];
};

type ChallengeSeed = {
  title: string;
  summary: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  language: string;
  starterCode: string;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: number;
  }>;
  xpReward: number;
  timeLimitMinutes: number;
  tags: string[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function hashString(value: string) {
  let hash = 2166136261;

  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function deterministicShuffle<T>(items: T[], salt: string) {
  const shuffled = [...items];
  let seed = hashString(salt);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function mixOptions(
  options: Array<{ id: string; text: string; isCorrect: boolean }>,
  salt: string
) {
  const shuffled = deterministicShuffle(options, salt);

  if (shuffled[0]?.isCorrect) {
    const firstWrongIndex = shuffled.findIndex((option) => !option.isCorrect);

    if (firstWrongIndex > 0) {
      [shuffled[0], shuffled[firstWrongIndex]] = [shuffled[firstWrongIndex], shuffled[0]];
    }
  }

  return shuffled;
}

function mixQuestionOptions<T extends QuestionSeed>(question: T, salt: string): T {
  if (!question.options?.length) {
    return question;
  }

  return {
    ...question,
    options: mixOptions(question.options, salt),
  };
}

function jsStarter(functionName: string, body: string) {
  return [
    "const fs = require('fs');",
    "const input = fs.readFileSync(0, 'utf8').trim();",
    "",
    `function ${functionName}(input) {`,
    body,
    "}",
    "",
    `console.log(${functionName}(input));`,
  ].join("\n");
}

function pyStarter(functionName: string, body: string) {
  return [
    "import sys",
    "data = sys.stdin.read().strip()",
    "",
    `def ${functionName}(data):`,
    body,
    "",
    `print(${functionName}(data))`,
  ].join("\n");
}

function javaStarter(body: string) {
  return [
    "import java.io.*;",
    "import java.util.*;",
    "",
    "public class Main {",
    "  public static void main(String[] args) throws Exception {",
    "    Scanner scanner = new Scanner(System.in);",
    body,
    "  }",
    "}",
  ].join("\n");
}

function mcq(
  title: string,
  description: string,
  correct: string,
  wrong: string[],
  explanation: string,
  tags: string[],
  difficulty: QuestionDifficulty = "easy",
  xpReward = 15
): QuestionSeed {
  return {
    type: "mcq",
    title,
    description,
    difficulty,
    xpReward,
    explanation,
    options: [
      { id: "a", text: correct, isCorrect: true },
      { id: "b", text: wrong[0], isCorrect: false },
      { id: "c", text: wrong[1], isCorrect: false },
      { id: "d", text: wrong[2], isCorrect: false },
    ],
    tags,
  };
}

function multi(
  title: string,
  description: string,
  correct: string[],
  wrong: string[],
  explanation: string,
  tags: string[],
  difficulty: QuestionDifficulty = "medium",
  xpReward = 25
): QuestionSeed {
  return {
    type: "multi-select",
    title,
    description,
    difficulty,
    xpReward,
    explanation,
    options: [
      ...correct.map((text, index) => ({ id: `c${index + 1}`, text, isCorrect: true })),
      ...wrong.map((text, index) => ({ id: `w${index + 1}`, text, isCorrect: false })),
    ],
    tags,
  };
}

function descriptive(
  title: string,
  description: string,
  sampleAnswer: string,
  tags: string[],
  difficulty: QuestionDifficulty = "medium",
  xpReward = 30
): QuestionSeed {
  const presets: Record<string, { template: string; correct: string[]; wrong: string[] }> = {
    "Explain coercion risk": {
      template: "Implicit coercion can create [[BLANK_1]] conversions, so teams prefer [[BLANK_2]] parsing and comparison.",
      correct: ["surprising", "explicit"],
      wrong: ["compiled", "visual"],
    },
    "When to extract a function": {
      template: "Extract a function when code [[BLANK_1]] or when a block has one clear [[BLANK_2]].",
      correct: ["repeats", "responsibility"],
      wrong: ["renders", "stylesheet"],
    },
    "Event delegation": {
      template: "Event delegation attaches one listener to a [[BLANK_1]] and handles matching child [[BLANK_2]].",
      correct: ["parent", "targets"],
      wrong: ["database", "packages"],
    },
    "Choosing collections": {
      template: "Choose a set when you need [[BLANK_1]] values and fast [[BLANK_2]] checks.",
      correct: ["unique", "membership"],
      wrong: ["duplicated", "animation"],
    },
    "API validation": {
      template: "Validate API input early to reject [[BLANK_1]] data before deeper code trusts invalid [[BLANK_2]].",
      correct: ["malformed", "assumptions"],
      wrong: ["cached", "pixels"],
    },
    "Retry strategy": {
      template: "Retry [[BLANK_1]] failures with a limit and [[BLANK_2]], but do not retry validation errors.",
      correct: ["transient", "backoff"],
      wrong: ["permanent", "duplication"],
    },
    "Space complexity": {
      template: "Auxiliary space counts [[BLANK_1]] memory allocated by the algorithm, separate from the [[BLANK_2]].",
      correct: ["extra", "input"],
      wrong: ["network", "theme"],
    },
    "Queue use case": {
      template: "A queue fits work that should be processed in [[BLANK_1]] order, such as [[BLANK_2]].",
      correct: ["arrival", "BFS"],
      wrong: ["random", "minification"],
    },
    "Visited sets": {
      template: "A visited set prevents [[BLANK_1]] nodes and avoids infinite loops in [[BLANK_2]] graphs.",
      correct: ["revisiting", "cyclic"],
      wrong: ["styling", "static"],
    },
    "State ownership": {
      template: "React state should live at the lowest common [[BLANK_1]] that needs to read or [[BLANK_2]] it.",
      correct: ["owner", "update"],
      wrong: ["compiler", "serialize"],
    },
    "Server-first data fetching": {
      template: "Server-side fetching can keep [[BLANK_1]] off the client and reduce client-side [[BLANK_2]].",
      correct: ["secrets", "waterfalls"],
      wrong: ["buttons", "icons"],
    },
    "Caching choice": {
      template: "Cache dashboard data when some [[BLANK_1]] is acceptable, and revalidate quickly when data must be [[BLANK_2]].",
      correct: ["staleness", "fresh"],
      wrong: ["opacity", "decorative"],
    },
    "Optional fields": {
      template: "An optional field may be [[BLANK_1]], while a nullable field is present but can hold [[BLANK_2]].",
      correct: ["absent", "null"],
      wrong: ["compiled", "CSS"],
    },
    "Avoid duplicate DTOs": {
      template: "Deriving related DTO types reduces [[BLANK_1]] and keeps API contracts [[BLANK_2]].",
      correct: ["drift", "consistent"],
      wrong: ["latency", "rounded"],
    },
    "Runtime validation": {
      template: "TypeScript types disappear at [[BLANK_1]], so external JSON still needs [[BLANK_2]].",
      correct: ["runtime", "validation"],
      wrong: ["compile time", "animation"],
    },
    "WHERE vs HAVING": {
      template: "WHERE filters [[BLANK_1]] before grouping, while HAVING filters grouped [[BLANK_2]].",
      correct: ["rows", "aggregates"],
      wrong: ["indexes", "components"],
    },
    "Choosing join type": {
      template: "Use LEFT JOIN when you need all rows from the [[BLANK_1]] table even if the right side is [[BLANK_2]].",
      correct: ["left", "missing"],
      wrong: ["temporary", "sorted"],
    },
    "Slow query response": {
      template: "Investigate a slow query by checking the query [[BLANK_1]] and whether indexes match the access [[BLANK_2]].",
      correct: ["plan", "pattern"],
      wrong: ["theme", "shortcut"],
    },
  };
  const preset = presets[title] ?? {
    template: "A strong answer should include the [[BLANK_1]] and a practical [[BLANK_2]].",
    correct: ["concept", "example"],
    wrong: ["color", "shortcut"],
  };

  return {
    type: "descriptive",
    title,
    description,
    difficulty,
    xpReward,
    starterCode: preset.template,
    sampleAnswer: "c1,c2",
    explanation: sampleAnswer,
    options: [
      { id: "c1", text: preset.correct[0], isCorrect: true },
      { id: "c2", text: preset.correct[1], isCorrect: true },
      { id: "w1", text: preset.wrong[0], isCorrect: false },
      { id: "w2", text: preset.wrong[1], isCorrect: false },
    ],
    maxWords: 120,
    rubric: sampleAnswer,
    tags,
  };
}

function coding(
  title: string,
  description: string,
  language: string,
  starterCode: string,
  testCases: QuestionSeed["testCases"],
  tags: string[],
  difficulty: QuestionDifficulty = "medium",
  xpReward = 60,
  hints: string[] = []
): QuestionSeed {
  return {
    type: "coding",
    title,
    description,
    difficulty,
    xpReward,
    language,
    starterCode,
    testCases,
    hints,
    tags,
  };
}

function generatedFillBlank(
  title: string,
  description: string,
  template: string,
  correct: [string, string],
  wrong: [string, string],
  explanation: string,
  tags: string[],
  difficulty: QuestionDifficulty,
  xpReward: number
): QuestionSeed {
  return {
    type: "descriptive",
    title,
    description,
    difficulty,
    xpReward,
    starterCode: template,
    sampleAnswer: "c1,c2",
    explanation,
    options: [
      { id: "c1", text: correct[0], isCorrect: true },
      { id: "c2", text: correct[1], isCorrect: true },
      { id: "w1", text: wrong[0], isCorrect: false },
      { id: "w2", text: wrong[1], isCorrect: false },
    ],
    maxWords: 120,
    rubric: explanation,
    tags,
  };
}

const masteryDimensions = [
  {
    label: "boundary validation",
    correct: "Validate input at the boundary before downstream code trusts it",
    multiCorrect: ["Reject malformed input early", "Return actionable errors", "Keep validation close to the API boundary"],
    wrong: ["Wait until persistence fails", "Trust client-only checks", "Treat invalid input as an empty success"],
    blanks: ["malformed", "boundary"] as [string, string],
    distractors: ["cached", "animation"] as [string, string],
  },
  {
    label: "state ownership",
    correct: "Place mutable state at the smallest owner that must read or update it",
    multiCorrect: ["Avoid duplicating derived values", "Lift state only for shared access", "Keep updates explicit"],
    wrong: ["Store every derived value independently", "Put all state in a global object", "Let unrelated components mutate it"],
    blanks: ["owner", "derived"] as [string, string],
    distractors: ["stylesheet", "package"] as [string, string],
  },
  {
    label: "error recovery",
    correct: "Separate transient failures from permanent validation or permission failures",
    multiCorrect: ["Retry transient failures with a limit", "Surface permanent errors clearly", "Log enough context to debug"],
    wrong: ["Retry every error forever", "Hide failed operations", "Convert all errors into success responses"],
    blanks: ["transient", "permanent"] as [string, string],
    distractors: ["decorative", "random"] as [string, string],
  },
  {
    label: "data modeling",
    correct: "Model the domain around stable identities and relationships instead of duplicated facts",
    multiCorrect: ["Use stable identifiers", "Avoid duplicated source-of-truth fields", "Represent relationships explicitly"],
    wrong: ["Copy every field into every record", "Use display names as primary keys", "Skip constraints to make writes easier"],
    blanks: ["identity", "relationship"] as [string, string],
    distractors: ["gradient", "shortcut"] as [string, string],
  },
  {
    label: "performance diagnosis",
    correct: "Measure the slow path before changing algorithms, queries, or caching",
    multiCorrect: ["Measure before optimizing", "Check data size assumptions", "Compare complexity and real timings"],
    wrong: ["Optimize the first line you see", "Ignore production-like data", "Add caching without invalidation rules"],
    blanks: ["measure", "bottleneck"] as [string, string],
    distractors: ["guess", "palette"] as [string, string],
  },
  {
    label: "security review",
    correct: "Assume external input is hostile until authentication, authorization, and validation pass",
    multiCorrect: ["Check authorization on the server", "Keep secrets outside client bundles", "Validate external input"],
    wrong: ["Trust hidden form fields", "Log secrets for easier debugging", "Authorize by button visibility only"],
    blanks: ["authorization", "secrets"] as [string, string],
    distractors: ["spacing", "icons"] as [string, string],
  },
  {
    label: "test strategy",
    correct: "Cover the riskiest behavior with tests at the smallest level that proves the contract",
    multiCorrect: ["Test edge cases", "Keep fixtures realistic", "Automate regression checks"],
    wrong: ["Only test the happy path manually", "Mock the behavior under test", "Delete failing tests during release"],
    blanks: ["contract", "regression"] as [string, string],
    distractors: ["viewport", "headline"] as [string, string],
  },
  {
    label: "API contracts",
    correct: "Make success, failure, and versioning shapes explicit for both client and server",
    multiCorrect: ["Return typed error shapes", "Document breaking changes", "Validate response assumptions"],
    wrong: ["Return unrelated shapes for the same state", "Change response fields silently", "Let clients infer errors from CSS"],
    blanks: ["success", "failure"] as [string, string],
    distractors: ["shadow", "border"] as [string, string],
  },
  {
    label: "caching tradeoffs",
    correct: "Cache only when the allowed staleness and invalidation path are clear",
    multiCorrect: ["Define acceptable staleness", "Invalidate after relevant writes", "Measure cache hit behavior"],
    wrong: ["Cache every request forever", "Ignore user-specific data", "Use stale data for security decisions"],
    blanks: ["staleness", "invalidation"] as [string, string],
    distractors: ["opacity", "rounded"] as [string, string],
  },
  {
    label: "refactoring judgment",
    correct: "Refactor when it reduces repeated risk or makes a real change easier to make",
    multiCorrect: ["Preserve observable behavior", "Keep changes reviewable", "Refactor around a clear pain point"],
    wrong: ["Rewrite unrelated modules together", "Change behavior without tests", "Prefer novelty over local conventions"],
    blanks: ["behavior", "pain"] as [string, string],
    distractors: ["color", "asset"] as [string, string],
  },
];

function questionDifficultyForTrack(trackDifficulty: Difficulty, offset = 0): QuestionDifficulty {
  if (trackDifficulty === "advanced") {
    return "hard";
  }

  if (trackDifficulty === "intermediate" || offset % 3 === 2) {
    return "medium";
  }

  return "easy";
}

function generatedCodingQuestion(course: CourseSeed, track: TrackSeed, index: number): QuestionSeed {
  const variant = index % 4;
  const language = course.language === "Java" || course.language === "Python" ? course.language.toLowerCase() : "javascript";
  const difficulty = questionDifficultyForTrack(track.difficulty, index);
  const xpReward = difficulty === "hard" ? 90 : difficulty === "medium" ? 70 : 55;
  const tags = [...new Set([...course.tags, ...track.questions.flatMap((question) => question.tags).slice(0, 3)])];

  if (variant === 0) {
    const title = `${track.title}: passing signal audit ${index + 1}`;
    const description = "Read space-separated labels and print how many begin with `pass:`.";

    if (language === "java") {
      return coding(title, description, "java", javaStarter("    int count = 0;\n    while (scanner.hasNext()) {\n      if (scanner.next().startsWith(\"pass:\")) count++;\n    }\n    System.out.println(count);"), [{ id: "tc1", input: "pass:lint fail:test pass:build", expectedOutput: "2", isHidden: false, weight: 1 }, { id: "tc2", input: "skip pass:a pass:b fail:c pass:d", expectedOutput: "3", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
    }

    if (language === "python") {
      return coding(title, description, "python", pyStarter("solve", "    return sum(1 for label in data.split() if label.startswith('pass:'))"), [{ id: "tc1", input: "pass:lint fail:test pass:build", expectedOutput: "2", isHidden: false, weight: 1 }, { id: "tc2", input: "skip pass:a pass:b fail:c pass:d", expectedOutput: "3", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
    }

    return coding(title, description, "javascript", jsStarter("solve", "  return input.split(/\\s+/).filter((label) => label.startsWith('pass:')).length;"), [{ id: "tc1", input: "pass:lint fail:test pass:build", expectedOutput: "2", isHidden: false, weight: 1 }, { id: "tc2", input: "skip pass:a pass:b fail:c pass:d", expectedOutput: "3", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
  }

  if (variant === 1) {
    const title = `${track.title}: duplicate signal check ${index + 1}`;
    const description = "Read tokens and print `DUPLICATE` if any token appears twice, otherwise `UNIQUE`.";

    if (language === "java") {
      return coding(title, description, "java", javaStarter("    Set<String> seen = new HashSet<>();\n    while (scanner.hasNext()) {\n      String token = scanner.next();\n      if (seen.contains(token)) {\n        System.out.println(\"DUPLICATE\");\n        return;\n      }\n      seen.add(token);\n    }\n    System.out.println(\"UNIQUE\");"), [{ id: "tc1", input: "alpha beta alpha", expectedOutput: "DUPLICATE", isHidden: false, weight: 1 }, { id: "tc2", input: "red blue green", expectedOutput: "UNIQUE", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
    }

    if (language === "python") {
      return coding(title, description, "python", pyStarter("solve", "    tokens = data.split()\n    return 'DUPLICATE' if len(tokens) != len(set(tokens)) else 'UNIQUE'"), [{ id: "tc1", input: "alpha beta alpha", expectedOutput: "DUPLICATE", isHidden: false, weight: 1 }, { id: "tc2", input: "red blue green", expectedOutput: "UNIQUE", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
    }

    return coding(title, description, "javascript", jsStarter("solve", "  const tokens = input.split(/\\s+/).filter(Boolean);\n  return tokens.length === new Set(tokens).size ? 'UNIQUE' : 'DUPLICATE';"), [{ id: "tc1", input: "alpha beta alpha", expectedOutput: "DUPLICATE", isHidden: false, weight: 1 }, { id: "tc2", input: "red blue green", expectedOutput: "UNIQUE", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
  }

  if (variant === 2) {
    const title = `${track.title}: threshold count ${index + 1}`;
    const description = "Read `threshold|numbers` and print how many numbers are greater than or equal to the threshold.";

    if (language === "java") {
      return coding(title, description, "java", javaStarter("    String[] parts = scanner.nextLine().split(\"\\\\|\");\n    int threshold = Integer.parseInt(parts[0].trim());\n    int count = 0;\n    if (parts.length > 1) {\n      for (String item : parts[1].trim().split(\"\\\\s+\")) {\n        if (!item.isBlank() && Integer.parseInt(item) >= threshold) count++;\n      }\n    }\n    System.out.println(count);"), [{ id: "tc1", input: "10|3 10 15 8", expectedOutput: "2", isHidden: false, weight: 1 }, { id: "tc2", input: "5|5 4 7 9 1", expectedOutput: "3", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
    }

    if (language === "python") {
      return coding(title, description, "python", pyStarter("solve", "    threshold_text, numbers_text = data.split('|')\n    threshold = int(threshold_text)\n    return sum(1 for value in numbers_text.split() if int(value) >= threshold)"), [{ id: "tc1", input: "10|3 10 15 8", expectedOutput: "2", isHidden: false, weight: 1 }, { id: "tc2", input: "5|5 4 7 9 1", expectedOutput: "3", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
    }

    return coding(title, description, "javascript", jsStarter("solve", "  const [thresholdText, numbersText = ''] = input.split('|');\n  const threshold = Number(thresholdText);\n  return numbersText.split(/\\s+/).filter(Boolean).filter((value) => Number(value) >= threshold).length;"), [{ id: "tc1", input: "10|3 10 15 8", expectedOutput: "2", isHidden: false, weight: 1 }, { id: "tc2", input: "5|5 4 7 9 1", expectedOutput: "3", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
  }

  const title = `${track.title}: normalize list ${index + 1}`;
  const description = "Read comma-separated values and print non-empty trimmed lowercase values joined by `|`.";

  if (language === "java") {
    return coding(title, description, "java", javaStarter("    String line = scanner.hasNextLine() ? scanner.nextLine() : \"\";\n    List<String> output = new ArrayList<>();\n    for (String item : line.split(\",\")) {\n      String normalized = item.trim().toLowerCase();\n      if (!normalized.isEmpty()) output.add(normalized);\n    }\n    System.out.println(String.join(\"|\", output));"), [{ id: "tc1", input: " Ada, LINUS ,Grace ", expectedOutput: "ada|linus|grace", isHidden: false, weight: 1 }, { id: "tc2", input: "One,, TWO", expectedOutput: "one|two", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
  }

  if (language === "python") {
    return coding(title, description, "python", pyStarter("solve", "    return '|'.join(item.strip().lower() for item in data.split(',') if item.strip())"), [{ id: "tc1", input: " Ada, LINUS ,Grace ", expectedOutput: "ada|linus|grace", isHidden: false, weight: 1 }, { id: "tc2", input: "One,, TWO", expectedOutput: "one|two", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
  }

  return coding(title, description, "javascript", jsStarter("solve", "  return input.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean).join('|');"), [{ id: "tc1", input: " Ada, LINUS ,Grace ", expectedOutput: "ada|linus|grace", isHidden: false, weight: 1 }, { id: "tc2", input: "One,, TWO", expectedOutput: "one|two", isHidden: true, weight: 1 }], tags, difficulty, xpReward);
}

function generatedConceptQuestion(course: CourseSeed, track: TrackSeed, index: number): QuestionSeed {
  const dimension = masteryDimensions[index % masteryDimensions.length];
  const difficulty = questionDifficultyForTrack(track.difficulty, index);
  const tags = [...new Set([...course.tags, dimension.label.replace(/\s+/g, "-")])];
  const label = `${track.title}: ${dimension.label} ${Math.floor(index / masteryDimensions.length) + 1}`;

  if (index % 3 === 0) {
    return mcq(
      label,
      `In ${course.title}, which choice is the strongest way to handle ${dimension.label} during ${track.title.toLowerCase()} work?`,
      dimension.correct,
      dimension.wrong,
      `${dimension.correct}. The distractors are tempting shortcuts, but they create hidden risk in production workflows.`,
      tags,
      difficulty,
      difficulty === "hard" ? 45 : 30
    );
  }

  if (index % 3 === 1) {
    return multi(
      label,
      `Select the practices that make ${dimension.label} reliable in ${track.title.toLowerCase()}.`,
      dimension.multiCorrect,
      dimension.wrong.slice(0, 2),
      `${dimension.multiCorrect.join(", ")} are reliable signals. The wrong answers hide failures or move trust to the wrong place.`,
      tags,
      difficulty,
      difficulty === "hard" ? 55 : 40
    );
  }

  return generatedFillBlank(
    label,
    `Complete the statement about ${dimension.label} for ${track.title.toLowerCase()}.`,
    `Strong ${track.title.toLowerCase()} work treats [[BLANK_1]] as explicit and checks the [[BLANK_2]] before relying on a decision.`,
    dimension.blanks,
    dimension.distractors,
    `A strong answer identifies ${dimension.blanks[0]} and ${dimension.blanks[1]} instead of choosing unrelated implementation details.`,
    tags,
    difficulty,
    difficulty === "hard" ? 50 : 35
  );
}

function expandTrackQuestions(course: CourseSeed, track: TrackSeed): TrackSeed {
  const questions = [...track.questions];
  let generatedIndex = 0;

  while (questions.length < QUESTIONS_PER_TRACK) {
    const generatedQuestion =
      generatedIndex % 4 === 3
        ? generatedCodingQuestion(course, track, generatedIndex)
        : generatedConceptQuestion(course, track, generatedIndex);

    questions.push(generatedQuestion);
    generatedIndex += 1;
  }

  return {
    ...track,
    questions,
  };
}

function expandCourseQuestions(course: CourseSeed): CourseSeed {
  return {
    ...course,
    tracks: course.tracks.map((track) => expandTrackQuestions(course, track)),
  };
}

const courseSeeds: CourseSeed[] = [
  {
    title: "JavaScript Mastery",
    description:
      "A practical JavaScript path from language fundamentals to async browser programming and maintainable application code.",
    shortDescription: "Master modern JavaScript through quizzes, writing prompts, and coding drills.",
    difficulty: "beginner",
    language: "JavaScript",
    estimatedHours: 14,
    tags: ["javascript", "web", "frontend", "fundamentals"],
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    averageRating: 4.8,
    enrollmentCount: 1840,
    tracks: [
      {
        difficulty: "beginner",
        title: "Values, Variables, and Types",
        description: "Learn how JavaScript stores data, coerces values, and handles common type checks.",
        theory:
          "# Values, Variables, and Types\n\nUse `const` for stable bindings, `let` for reassignment, and explicit conversions when input arrives as text.",
        xpReward: 120,
        passingScore: 80,
        questions: [
          mcq("Prefer the right binding", "Which keyword should you prefer when a variable will not be reassigned?", "const", ["var", "static", "mutable"], "A `const` binding cannot be reassigned, which makes intent clear.", ["javascript", "variables"]),
          multi("Truthy and falsy values", "Select all values that are falsy in JavaScript.", ["0", "''", "null"], ["[]"], "Only a small fixed set of values are falsy; arrays are truthy even when empty.", ["javascript", "types"]),
          descriptive("Explain coercion risk", "Why can implicit coercion make bug reports hard to reproduce?", "Implicit coercion can turn strings, numbers, booleans, null, or undefined into surprising values depending on the operator. Clear parsing and strict equality reduce hidden assumptions.", ["javascript", "coercion"]),
          coding("Add two numbers", "Read two integers separated by a space and print their sum.", "javascript", jsStarter("solve", "  const [a, b] = input.split(/\\s+/).map(Number);\n  return a + b;"), [{ id: "tc1", input: "2 3", expectedOutput: "5", isHidden: false, weight: 1 }, { id: "tc2", input: "41 59", expectedOutput: "100", isHidden: true, weight: 1 }], ["javascript", "input-output"], "easy", 50, ["Split on whitespace before converting to numbers."]),
        ],
      },
      {
        difficulty: "intermediate",
        title: "Functions, Scope, and Control Flow",
        description: "Practice functions, lexical scope, loops, conditionals, and reusable program structure.",
        theory:
          "# Functions, Scope, and Control Flow\n\nSmall pure functions are easier to test. Keep mutable state close to where it is needed and return values instead of relying on side effects.",
        xpReward: 140,
        passingScore: 80,
        questions: [
          mcq("Lexical scope", "What determines where a JavaScript variable can be read?", "Where the variable is declared in the source code", ["The file name", "The browser tab", "The package manager"], "JavaScript uses lexical scope, so nested functions can access variables from their enclosing scopes.", ["javascript", "scope"], "medium"),
          multi("Pure function traits", "Select the traits of a pure function.", ["Same input returns same output", "No observable side effects"], ["Always uses global state", "Requires a class"], "Pure functions are predictable because they avoid hidden reads and writes.", ["javascript", "functions"]),
          descriptive("When to extract a function", "Describe two signals that a block of code should become a named function.", "Extract a function when code repeats or when a block has a clear responsibility that can be named. This improves reuse, testability, and readability.", ["javascript", "clean-code"]),
          coding("Count vowels", "Read a string and print the number of vowels it contains.", "javascript", jsStarter("countVowels", "  const matches = input.match(/[aeiou]/gi);\n  return matches ? matches.length : 0;"), [{ id: "tc1", input: "CodeQuest", expectedOutput: "4", isHidden: false, weight: 1 }, { id: "tc2", input: "rhythm", expectedOutput: "0", isHidden: true, weight: 1 }], ["javascript", "strings"], "medium", 55),
        ],
      },
      {
        difficulty: "advanced",
        title: "Async JavaScript and Browser APIs",
        description: "Use promises, async functions, fetch, DOM events, and browser state responsibly.",
        theory:
          "# Async JavaScript and Browser APIs\n\n`async` functions return promises. Use `try/catch` around awaited work and keep UI state transitions explicit.",
        xpReward: 180,
        passingScore: 85,
        questions: [
          mcq("Async return value", "What does an async function always return?", "A Promise", ["A callback", "A generator", "A DOM node"], "Even when returning a plain value, an async function wraps it in a Promise.", ["javascript", "async"], "medium"),
          multi("Fetch failure handling", "Which checks make a fetch workflow more reliable?", ["Check `response.ok`", "Catch network errors", "Handle empty states"], ["Assume JSON is always present"], "Network, HTTP, and data-shape failures are separate concerns.", ["javascript", "fetch"], "medium"),
          descriptive("Event delegation", "Explain why event delegation can be useful for dynamic lists.", "Event delegation attaches one handler to a parent and checks event targets. It avoids adding handlers to every item and works for elements inserted later.", ["javascript", "dom"], "medium"),
          coding("Debounce event count", "Read integers representing rapid event timestamps and print how many handlers run with a 300ms debounce window.", "javascript", jsStarter("debouncedRuns", "  if (!input) return 0;\n  const times = input.split(/\\s+/).map(Number).sort((a, b) => a - b);\n  let runs = 0;\n  let lastRun = -Infinity;\n  for (const time of times) {\n    if (time - lastRun >= 300) {\n      runs++;\n      lastRun = time;\n    }\n  }\n  return runs;"), [{ id: "tc1", input: "0 120 410 900", expectedOutput: "3", isHidden: false, weight: 1 }, { id: "tc2", input: "10 20 30 400 401 900", expectedOutput: "3", isHidden: true, weight: 1 }], ["javascript", "async", "events"], "hard", 80),
        ],
      },
    ],
  },
  {
    title: "Python Developer Path",
    description:
      "A production-minded Python course covering syntax, collections, data processing, files, APIs, and automation.",
    shortDescription: "Build Python confidence from syntax to automation.",
    difficulty: "beginner",
    language: "Python",
    estimatedHours: 16,
    tags: ["python", "backend", "automation", "data"],
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    averageRating: 4.9,
    enrollmentCount: 2310,
    tracks: [
      {
        difficulty: "beginner",
        title: "Python Syntax and Collections",
        description: "Work with Python values, loops, lists, dictionaries, sets, and tuples.",
        theory:
          "# Python Syntax and Collections\n\nChoose lists for ordered mutable sequences, tuples for fixed records, sets for uniqueness, and dictionaries for key-based lookup.",
        xpReward: 120,
        passingScore: 80,
        questions: [
          mcq("Dictionary lookup", "Which Python collection stores key-value pairs?", "dict", ["list", "tuple", "set"], "A dictionary maps keys to values and provides efficient lookups.", ["python", "collections"]),
          multi("Mutable collections", "Select all mutable built-in collection types.", ["list", "dict", "set"], ["tuple"], "Lists, dicts, and sets can be changed after creation; tuples cannot.", ["python", "collections"]),
          descriptive("Choosing collections", "Explain when you would choose a set instead of a list.", "Use a set when uniqueness and membership checks matter more than preserving order or duplicates.", ["python", "data-structures"]),
          coding("Unique word count", "Read words separated by spaces and print the number of unique lowercase words.", "python", pyStarter("solve", "    words = data.lower().split()\n    return len(set(words))"), [{ id: "tc1", input: "Red blue red GREEN", expectedOutput: "3", isHidden: false, weight: 1 }, { id: "tc2", input: "a a a b c", expectedOutput: "3", isHidden: true, weight: 1 }], ["python", "sets"], "easy", 50),
        ],
      },
      {
        difficulty: "intermediate",
        title: "Files, Exceptions, and APIs",
        description: "Handle files, errors, JSON payloads, and API-style data transformations.",
        theory:
          "# Files, Exceptions, and APIs\n\nParse external data defensively. Validate required fields, use clear exception boundaries, and return predictable shapes.",
        xpReward: 150,
        passingScore: 80,
        questions: [
          mcq("JSON payloads", "Which standard library module parses JSON strings in Python?", "json", ["pickle", "pathlib", "typing"], "The `json` module loads and dumps JSON data.", ["python", "json"]),
          multi("Exception handling", "Which practices make exception handling easier to maintain?", ["Catch specific exceptions", "Keep error messages actionable"], ["Use a bare `except` everywhere", "Silently ignore failures"], "Specific catches and useful messages preserve debuggability.", ["python", "errors"]),
          descriptive("API validation", "Why should an API handler validate required fields before doing work?", "Validation catches malformed input early, returns clearer errors, and prevents deeper code from running with invalid assumptions.", ["python", "api"]),
          coding("Parse scores", "Read `name:score` pairs separated by spaces and print the highest score.", "python", pyStarter("solve", "    best = 0\n    for pair in data.split():\n        _, score = pair.split(':')\n        best = max(best, int(score))\n    return best"), [{ id: "tc1", input: "ada:98 linus:87 grace:94", expectedOutput: "98", isHidden: false, weight: 1 }, { id: "tc2", input: "a:1 b:10 c:7", expectedOutput: "10", isHidden: true, weight: 1 }], ["python", "parsing"], "medium", 65),
        ],
      },
      {
        difficulty: "advanced",
        title: "Automation and Data Pipelines",
        description: "Design repeatable scripts, command-line utilities, and small data pipelines.",
        theory:
          "# Automation and Data Pipelines\n\nGood automation is idempotent, observable, configurable, and safe to rerun.",
        xpReward: 190,
        passingScore: 85,
        questions: [
          mcq("Idempotent scripts", "What does it mean for a script to be idempotent?", "It can run repeatedly without unintended extra effects", ["It never reads input", "It must be interactive", "It only works once"], "Idempotency makes retries and scheduled runs safer.", ["python", "automation"], "medium"),
          multi("Reliable pipeline habits", "Select habits that improve data pipeline reliability.", ["Validate input schema", "Log meaningful progress", "Write atomic outputs"], ["Overwrite source data first"], "Validation, logging, and careful writes make failures easier to recover from.", ["python", "pipelines"]),
          descriptive("Retry strategy", "Describe a sensible retry strategy for a flaky network request.", "Retry transient failures with a small limit, exponential backoff, and logging. Avoid retrying validation errors that will not heal.", ["python", "networking"]),
          coding("Normalize CSV row", "Read comma-separated names and print them trimmed, lowercased, and joined by `|`.", "python", pyStarter("solve", "    return '|'.join(part.strip().lower() for part in data.split(',') if part.strip())"), [{ id: "tc1", input: " Ada, LINUS ,Grace ", expectedOutput: "ada|linus|grace", isHidden: false, weight: 1 }, { id: "tc2", input: "One,, TWO", expectedOutput: "one|two", isHidden: true, weight: 1 }], ["python", "csv"], "medium", 65),
        ],
      },
    ],
  },
  {
    title: "Data Structures and Algorithms",
    description:
      "A focused interview and problem-solving path covering arrays, hashing, stacks, queues, trees, graphs, and complexity analysis.",
    shortDescription: "Practice core algorithms with clear complexity thinking.",
    difficulty: "intermediate",
    language: "JavaScript",
    estimatedHours: 22,
    tags: ["algorithms", "data-structures", "interview", "problem-solving"],
    thumbnail: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d",
    averageRating: 4.9,
    enrollmentCount: 3140,
    tracks: [
      {
        difficulty: "beginner",
        title: "Arrays, Strings, and Big O",
        description: "Build the foundation for efficient sequence processing.",
        theory:
          "# Arrays, Strings, and Big O\n\nCount loops, nested loops, and extra storage. Prefer single-pass solutions when the problem only needs local state.",
        xpReward: 150,
        passingScore: 80,
        questions: [
          mcq("Nested loop complexity", "What is the typical time complexity of checking every pair in an array of length n?", "O(n^2)", ["O(1)", "O(log n)", "O(n log n)"], "A pairwise nested loop grows roughly with n times n.", ["algorithms", "complexity"]),
          multi("Two-pointer signals", "Which problem clues suggest a two-pointer approach?", ["Sorted input", "Pair or window constraints"], ["Need remote API calls", "Random UI rendering"], "Two pointers often work on ordered sequences or moving windows.", ["algorithms", "arrays"]),
          descriptive("Space complexity", "Explain the difference between input space and auxiliary space.", "Input space is memory used by the data provided to the algorithm. Auxiliary space is extra memory allocated by the algorithm to solve the problem.", ["algorithms", "complexity"]),
          coding("Reverse words", "Read a sentence and print the words in reverse order separated by one space.", "javascript", jsStarter("solve", "  return input.split(/\\s+/).filter(Boolean).reverse().join(' ');"), [{ id: "tc1", input: "learn code daily", expectedOutput: "daily code learn", isHidden: false, weight: 1 }, { id: "tc2", input: "a b c d", expectedOutput: "d c b a", isHidden: true, weight: 1 }], ["algorithms", "strings"], "easy", 55),
        ],
      },
      {
        difficulty: "intermediate",
        title: "Hash Maps, Stacks, and Queues",
        description: "Use associative lookup and linear helper structures to simplify problems.",
        theory:
          "# Hash Maps, Stacks, and Queues\n\nHash maps trade memory for fast lookup. Stacks model last-in-first-out flows; queues model first-in-first-out flows.",
        xpReward: 180,
        passingScore: 80,
        questions: [
          mcq("Stack behavior", "Which phrase describes a stack?", "Last in, first out", ["First in, first out", "Sorted lookup", "Random access only"], "The most recently pushed item is popped first.", ["algorithms", "stacks"]),
          multi("Hash map wins", "Which tasks often benefit from a hash map?", ["Frequency counting", "Finding complements", "Deduplicating by key"], ["Rendering CSS gradients"], "Hash maps are strong when repeated key lookup is central.", ["algorithms", "hash-maps"]),
          descriptive("Queue use case", "Give one practical case where a queue fits naturally.", "A queue fits breadth-first search, task scheduling, or processing requests in arrival order because the first item added is handled first.", ["algorithms", "queues"]),
          coding("Balanced brackets", "Read a bracket string containing `()[]{}` and print `YES` if balanced, otherwise `NO`.", "javascript", jsStarter("solve", "  const stack = [];\n  const pairs = { ')': '(', ']': '[', '}': '{' };\n  for (const ch of input) {\n    if ('([{'.includes(ch)) stack.push(ch);\n    if (')]}'.includes(ch) && stack.pop() !== pairs[ch]) return 'NO';\n  }\n  return stack.length === 0 ? 'YES' : 'NO';"), [{ id: "tc1", input: "{[()]}", expectedOutput: "YES", isHidden: false, weight: 1 }, { id: "tc2", input: "([)]", expectedOutput: "NO", isHidden: true, weight: 1 }], ["algorithms", "stacks"], "medium", 70),
        ],
      },
      {
        difficulty: "advanced",
        title: "Trees, Graphs, and Search",
        description: "Reason about traversal, connectivity, shortest paths, and recursive structure.",
        theory:
          "# Trees, Graphs, and Search\n\nDepth-first search explores a path before backtracking. Breadth-first search explores by distance from the starting node.",
        xpReward: 220,
        passingScore: 85,
        questions: [
          mcq("BFS guarantee", "In an unweighted graph, what does BFS find first?", "The shortest path by number of edges", ["The lexicographically smallest path", "The path with lowest memory", "A sorted topological order"], "BFS visits nodes in increasing edge distance from the source.", ["algorithms", "graphs"], "medium"),
          multi("DFS applications", "Select common DFS applications.", ["Cycle detection", "Connected components", "Tree traversal"], ["CSS minification"], "DFS is useful anywhere recursive reachability matters.", ["algorithms", "dfs"]),
          descriptive("Visited sets", "Why do graph traversals usually need a visited set?", "A visited set prevents revisiting nodes, avoids infinite loops in cyclic graphs, and keeps traversal complexity bounded.", ["algorithms", "graphs"]),
          coding("Count components", "Read `n` then undirected edges like `0-1 2-3` and print the number of connected components.", "javascript", jsStarter("solve", "  const parts = input.split(/\\s+/).filter(Boolean);\n  const n = Number(parts.shift() || 0);\n  const graph = Array.from({ length: n }, () => []);\n  for (const edge of parts) {\n    const [a, b] = edge.split('-').map(Number);\n    graph[a].push(b);\n    graph[b].push(a);\n  }\n  const seen = new Set();\n  let count = 0;\n  for (let i = 0; i < n; i++) {\n    if (seen.has(i)) continue;\n    count++;\n    const stack = [i];\n    seen.add(i);\n    while (stack.length) {\n      for (const next of graph[stack.pop()]) {\n        if (!seen.has(next)) {\n          seen.add(next);\n          stack.push(next);\n        }\n      }\n    }\n  }\n  return count;"), [{ id: "tc1", input: "5 0-1 1-2 3-4", expectedOutput: "2", isHidden: false, weight: 1 }, { id: "tc2", input: "4 0-1 2-3", expectedOutput: "2", isHidden: true, weight: 1 }], ["algorithms", "graphs"], "hard", 90),
        ],
      },
    ],
  },
  {
    title: "React and Next.js App Router",
    description:
      "Build modern React applications with the Next.js App Router, including component boundaries, route handlers, forms, and deployment thinking.",
    shortDescription: "Ship React and Next.js apps with App Router patterns.",
    difficulty: "intermediate",
    language: "TypeScript",
    estimatedHours: 18,
    tags: ["react", "nextjs", "typescript", "frontend"],
    thumbnail: "https://images.unsplash.com/photo-1551650975-87deedd944c3",
    averageRating: 4.8,
    enrollmentCount: 2085,
    tracks: [
      {
        difficulty: "beginner",
        title: "React Components and State",
        description: "Compose components, props, state, events, and derived UI.",
        theory:
          "# React Components and State\n\nKeep state as close as possible to the UI that owns it. Compute derived values during render instead of duplicating them in state.",
        xpReward: 130,
        passingScore: 80,
        questions: [
          mcq("Derived state", "Which value usually should not be stored separately in React state?", "A filtered list that can be calculated from existing state", ["The current input text", "The selected tab", "The open dialog id"], "Derived values can be recomputed during render to avoid synchronization bugs.", ["react", "state"], "medium"),
          multi("Component design", "Which practices help reusable components stay flexible?", ["Accept focused props", "Expose event callbacks", "Render children where useful"], ["Read every value from globals"], "Clear props and callbacks make reuse explicit.", ["react", "components"]),
          descriptive("State ownership", "Explain how you decide where state should live in a React tree.", "State should live at the lowest common owner that needs to read or update it. Lift state only when multiple children need shared access.", ["react", "state"]),
          coding("Render totals", "Read item prices separated by spaces and print the total fixed to two decimals.", "javascript", jsStarter("solve", "  const total = input.split(/\\s+/).filter(Boolean).map(Number).reduce((sum, value) => sum + value, 0);\n  return total.toFixed(2);"), [{ id: "tc1", input: "10 2.5 3.25", expectedOutput: "15.75", isHidden: false, weight: 1 }, { id: "tc2", input: "1.1 2.2", expectedOutput: "3.30", isHidden: true, weight: 1 }], ["react", "arrays"], "easy", 50),
        ],
      },
      {
        difficulty: "intermediate",
        title: "Server and Client Boundaries",
        description: "Understand where code runs in App Router applications and how data crosses boundaries.",
        theory:
          "# Server and Client Boundaries\n\nServer Components can fetch data close to the source. Client Components are for browser-only interactivity, event handlers, and local state.",
        xpReward: 170,
        passingScore: 80,
        questions: [
          mcq("Client component trigger", "Which feature requires a Client Component?", "An onClick event handler", ["Reading a database on the server", "Rendering static markdown", "Generating metadata"], "Interactive browser event handlers require client-side JavaScript.", ["nextjs", "react"], "medium"),
          multi("Boundary-safe data", "Which values are appropriate to pass from server to client props?", ["Plain objects", "Strings and numbers", "Arrays of serializable data"], ["Database connection instances"], "Props crossing the boundary should be serializable data.", ["nextjs", "app-router"]),
          descriptive("Server-first data fetching", "Why can server-side data fetching simplify a React application?", "Fetching on the server can keep secrets off the client, reduce client waterfalls, and send the UI the data it needs in a ready shape.", ["nextjs", "data-fetching"]),
          coding("Serialize route params", "Read path segments separated by `/` and print a JSON array of non-empty segments.", "javascript", jsStarter("solve", "  return JSON.stringify(input.split('/').filter(Boolean));"), [{ id: "tc1", input: "/courses/js/tracks/intro", expectedOutput: "[\"courses\",\"js\",\"tracks\",\"intro\"]", isHidden: false, weight: 1 }, { id: "tc2", input: "///admin/users", expectedOutput: "[\"admin\",\"users\"]", isHidden: true, weight: 1 }], ["nextjs", "routing"], "medium", 60),
        ],
      },
      {
        difficulty: "advanced",
        title: "Forms, Route Handlers, and Deployment",
        description: "Design mutations, validation, API routes, caching choices, and production readiness.",
        theory:
          "# Forms, Route Handlers, and Deployment\n\nValidate at the boundary, return clear errors, and make caching choices match the freshness expectations of the user workflow.",
        xpReward: 210,
        passingScore: 85,
        questions: [
          mcq("Validation boundary", "Where should user input be validated?", "At the server/API boundary before trusted work runs", ["Only in button text", "Only in CSS", "After writing to the database"], "Client validation helps UX, but server validation protects the system.", ["nextjs", "validation"], "medium"),
          multi("Production readiness", "Select important production checks before deployment.", ["Required env vars are present", "Error states are handled", "Forms reject invalid data"], ["All logs include passwords"], "Config, errors, and validation are baseline production concerns.", ["nextjs", "deployment"]),
          descriptive("Caching choice", "Explain how you would decide whether dashboard data should be cached.", "Use caching when users can tolerate stale data and it reduces load. Avoid or revalidate quickly when data must reflect recent actions.", ["nextjs", "caching"]),
          coding("Validate form fields", "Read comma-separated `field=value` pairs and print `VALID` if `email` and `name` are both present and non-empty.", "javascript", jsStarter("solve", "  const fields = Object.fromEntries(input.split(',').map((part) => part.split('=').map((value) => value.trim())));\n  return fields.email && fields.name ? 'VALID' : 'INVALID';"), [{ id: "tc1", input: "name=Ada,email=ada@example.com", expectedOutput: "VALID", isHidden: false, weight: 1 }, { id: "tc2", input: "name=Linus,email=", expectedOutput: "INVALID", isHidden: true, weight: 1 }], ["nextjs", "forms"], "medium", 70),
        ],
      },
    ],
  },
  {
    title: "TypeScript for Production",
    description:
      "Use TypeScript to model real application data, reduce runtime errors, and create safer APIs.",
    shortDescription: "Write safer application code with practical TypeScript.",
    difficulty: "intermediate",
    language: "TypeScript",
    estimatedHours: 15,
    tags: ["typescript", "types", "frontend", "backend"],
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea",
    averageRating: 4.7,
    enrollmentCount: 1565,
    tracks: [
      {
        difficulty: "beginner",
        title: "Types, Interfaces, and Narrowing",
        description: "Model objects, unions, optional fields, and runtime narrowing.",
        theory:
          "# Types, Interfaces, and Narrowing\n\nUse explicit shapes for shared data and narrow unions before accessing fields that only exist on one variant.",
        xpReward: 130,
        passingScore: 80,
        questions: [
          mcq("Union narrowing", "What does TypeScript need before you access a property that exists on only one union member?", "A narrowing check", ["A CSS class", "A database index", "A package reinstall"], "Narrowing proves which variant is currently in use.", ["typescript", "unions"]),
          multi("Useful type tools", "Which tools help express object shapes?", ["interface", "type alias"], ["setTimeout", "console.table"], "Interfaces and type aliases are both common for describing data shapes.", ["typescript", "types"]),
          descriptive("Optional fields", "Explain the difference between an optional field and a nullable field.", "An optional field may be absent. A nullable field is present but can explicitly hold null, depending on the declared type.", ["typescript", "objects"]),
          coding("Classify status", "Read a numeric HTTP status and print `ok`, `redirect`, `client`, `server`, or `other`.", "javascript", jsStarter("solve", "  const code = Number(input);\n  if (code >= 200 && code < 300) return 'ok';\n  if (code >= 300 && code < 400) return 'redirect';\n  if (code >= 400 && code < 500) return 'client';\n  if (code >= 500 && code < 600) return 'server';\n  return 'other';"), [{ id: "tc1", input: "404", expectedOutput: "client", isHidden: false, weight: 1 }, { id: "tc2", input: "201", expectedOutput: "ok", isHidden: true, weight: 1 }], ["typescript", "api"], "easy", 50),
        ],
      },
      {
        difficulty: "intermediate",
        title: "Generics and Utility Types",
        description: "Write reusable typed functions and transform existing types safely.",
        theory:
          "# Generics and Utility Types\n\nGenerics preserve relationships between inputs and outputs. Utility types help reuse existing models without copying fields manually.",
        xpReward: 165,
        passingScore: 80,
        questions: [
          mcq("Generic identity", "What is a key benefit of a generic identity function?", "It preserves the input type in the output", ["It disables type checking", "It always returns a string", "It creates a database table"], "A generic type parameter carries the concrete input type through the function.", ["typescript", "generics"], "medium"),
          multi("Utility types", "Which are built-in TypeScript utility types?", ["Partial", "Pick", "Omit"], ["Fetch"], "Utility types transform existing object types.", ["typescript", "utility-types"]),
          descriptive("Avoid duplicate DTOs", "Why is deriving request and response types from shared models useful?", "Deriving related types reduces drift, makes refactors safer, and keeps API contracts consistent with domain models.", ["typescript", "api-design"]),
          coding("Pick requested keys", "Read `keys|object` where keys are comma-separated and object is JSON. Print JSON with only requested keys that exist.", "javascript", jsStarter("solve", "  const [keysText, jsonText] = input.split('|');\n  const keys = keysText.split(',').map((key) => key.trim());\n  const obj = JSON.parse(jsonText);\n  const picked = {};\n  for (const key of keys) if (key in obj) picked[key] = obj[key];\n  return JSON.stringify(picked);"), [{ id: "tc1", input: "id,name|{\"id\":1,\"name\":\"Ada\",\"role\":\"admin\"}", expectedOutput: "{\"id\":1,\"name\":\"Ada\"}", isHidden: false, weight: 1 }, { id: "tc2", input: "name|{\"name\":\"Linus\",\"xp\":10}", expectedOutput: "{\"name\":\"Linus\"}", isHidden: true, weight: 1 }], ["typescript", "objects"], "medium", 70),
        ],
      },
      {
        difficulty: "advanced",
        title: "Typed API Contracts",
        description: "Use discriminated unions, validation, and typed responses for robust client-server code.",
        theory:
          "# Typed API Contracts\n\nA good API contract states success and failure shapes clearly. Runtime validation and static types should reinforce each other.",
        xpReward: 205,
        passingScore: 85,
        questions: [
          mcq("Discriminated union", "What makes a discriminated union easy to narrow?", "A shared literal field like `status` or `type`", ["A random object key", "A CSS selector", "A hidden import"], "A common literal discriminator lets TypeScript infer the active variant.", ["typescript", "api"], "medium"),
          multi("Contract safety", "Which practices make API contracts safer?", ["Return typed error shapes", "Validate unknown input", "Version breaking changes"], ["Trust client-only checks"], "Input validation and explicit response shapes reduce ambiguity.", ["typescript", "validation"]),
          descriptive("Runtime validation", "Why are TypeScript types alone not enough for external API input?", "TypeScript disappears at runtime, so external JSON still needs validation before the server trusts its shape.", ["typescript", "runtime"]),
          coding("Read discriminated result", "Read JSON with `{status,data,error}` and print `data` for ok or `error` for failed.", "javascript", jsStarter("solve", "  const result = JSON.parse(input);\n  return result.status === 'ok' ? result.data : result.error;"), [{ id: "tc1", input: "{\"status\":\"ok\",\"data\":\"saved\"}", expectedOutput: "saved", isHidden: false, weight: 1 }, { id: "tc2", input: "{\"status\":\"error\",\"error\":\"denied\"}", expectedOutput: "denied", isHidden: true, weight: 1 }], ["typescript", "unions"], "medium", 70),
        ],
      },
    ],
  },
  {
    title: "SQL and Database Design",
    description:
      "Learn query fundamentals, relational modeling, indexes, transactions, and practical database performance.",
    shortDescription: "Design databases and write queries that scale cleanly.",
    difficulty: "intermediate",
    language: "SQL",
    estimatedHours: 17,
    tags: ["sql", "databases", "backend", "data-modeling"],
    thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d",
    averageRating: 4.8,
    enrollmentCount: 1735,
    tracks: [
      {
        difficulty: "beginner",
        title: "Query Essentials",
        description: "Read, filter, sort, aggregate, and group relational data.",
        theory:
          "# Query Essentials\n\nUse `WHERE` to filter rows before grouping, `GROUP BY` to aggregate, and `HAVING` to filter aggregated groups.",
        xpReward: 120,
        passingScore: 80,
        questions: [
          mcq("Filtering rows", "Which SQL clause filters rows before aggregation?", "WHERE", ["HAVING", "ORDER BY", "LIMIT"], "`WHERE` filters individual rows before grouping occurs.", ["sql", "queries"]),
          multi("Aggregate functions", "Which are common SQL aggregate functions?", ["COUNT", "SUM", "AVG"], ["RENAME"], "Aggregates summarize multiple rows into one value.", ["sql", "aggregation"]),
          descriptive("WHERE vs HAVING", "Explain the difference between WHERE and HAVING.", "WHERE filters rows before grouping. HAVING filters grouped aggregate results after GROUP BY.", ["sql", "aggregation"]),
          coding("Count matching rows", "Read statuses separated by spaces and print how many are `active`.", "javascript", jsStarter("solve", "  return input.split(/\\s+/).filter((status) => status === 'active').length;"), [{ id: "tc1", input: "active paused active deleted", expectedOutput: "2", isHidden: false, weight: 1 }, { id: "tc2", input: "paused active", expectedOutput: "1", isHidden: true, weight: 1 }], ["sql", "filtering"], "easy", 45),
        ],
      },
      {
        difficulty: "intermediate",
        title: "Relationships, Joins, and Modeling",
        description: "Use primary keys, foreign keys, normalization, and joins to model real domains.",
        theory:
          "# Relationships, Joins, and Modeling\n\nForeign keys preserve references between tables. Joins combine related rows when a query needs fields from multiple tables.",
        xpReward: 165,
        passingScore: 80,
        questions: [
          mcq("Foreign key", "What does a foreign key represent?", "A reference to a row in another table", ["A password hash", "A UI route", "A cache timeout"], "Foreign keys model relationships and can enforce referential integrity.", ["sql", "relationships"]),
          multi("Normalization goals", "Which are goals of normalization?", ["Reduce duplicate data", "Improve data consistency"], ["Store every value in one giant text column", "Prevent all joins"], "Normalization organizes data around facts and relationships.", ["sql", "modeling"]),
          descriptive("Choosing join type", "When would you use a LEFT JOIN instead of an INNER JOIN?", "Use LEFT JOIN when you need all rows from the left table even if the related right table row is missing.", ["sql", "joins"]),
          coding("Join-like lookup", "Read `users|orders`; users are `id:name`, orders are user ids. Print ordered names separated by commas.", "javascript", jsStarter("solve", "  const [usersText, ordersText] = input.split('|');\n  const users = Object.fromEntries(usersText.split(',').map((pair) => pair.split(':')));\n  return ordersText.split(',').map((id) => users[id]).filter(Boolean).join(',');"), [{ id: "tc1", input: "1:Ada,2:Linus|2,1,2", expectedOutput: "Linus,Ada,Linus", isHidden: false, weight: 1 }, { id: "tc2", input: "1:A,2:B|1,3,2", expectedOutput: "A,B", isHidden: true, weight: 1 }], ["sql", "joins"], "medium", 65),
        ],
      },
      {
        difficulty: "advanced",
        title: "Indexes, Transactions, and Performance",
        description: "Reason about query plans, indexing tradeoffs, consistency, and safe writes.",
        theory:
          "# Indexes, Transactions, and Performance\n\nIndexes speed reads for matching access patterns but add write overhead. Transactions group writes so they commit or roll back together.",
        xpReward: 210,
        passingScore: 85,
        questions: [
          mcq("Transaction guarantee", "Which ACID property means a transaction fully succeeds or fully rolls back?", "Atomicity", ["Durability", "Isolation", "Projection"], "Atomicity is the all-or-nothing property.", ["sql", "transactions"], "medium"),
          multi("Index tradeoffs", "Select true statements about indexes.", ["They can speed reads", "They add storage overhead", "They can slow writes"], ["They remove the need for schema design"], "Indexes are powerful but not free.", ["sql", "indexes"]),
          descriptive("Slow query response", "What steps would you take to investigate a slow database query?", "Check the query plan, verify indexes match filters and joins, inspect row counts, measure production-like data, and simplify the query where possible.", ["sql", "performance"], "hard"),
          coding("Detect duplicate keys", "Read keys separated by spaces and print `DUPLICATE` if any key repeats, otherwise `UNIQUE`.", "javascript", jsStarter("solve", "  const seen = new Set();\n  for (const key of input.split(/\\s+/).filter(Boolean)) {\n    if (seen.has(key)) return 'DUPLICATE';\n    seen.add(key);\n  }\n  return 'UNIQUE';"), [{ id: "tc1", input: "user_id email created_at email", expectedOutput: "DUPLICATE", isHidden: false, weight: 1 }, { id: "tc2", input: "id slug title", expectedOutput: "UNIQUE", isHidden: true, weight: 1 }], ["sql", "indexes"], "medium", 70),
        ],
      },
    ],
  },
];

const developerCourseSeeds: CourseSeed[] = [
  {
    title: "Java Developer Mastery",
    description:
      "A complete Java path with beginner, intermediate, and advanced levels. Learners must finish every beginner assessment with 100% mastery before intermediate or advanced work unlocks.",
    shortDescription: "Learn Java from syntax to OOP, collections, concurrency, and service design.",
    difficulty: "beginner",
    language: "Java",
    estimatedHours: 26,
    tags: ["java", "backend", "oop", "spring-ready"],
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    averageRating: 4.9,
    enrollmentCount: 2870,
    tracks: [
      {
        difficulty: "beginner",
        title: "Java Basics and Program Flow",
        description: "Use classes, variables, primitive types, strings, conditionals, loops, and console input.",
        theory:
          "# Java Basics and Program Flow\n\nJava programs run from a `main` method. Use clear types, parse input deliberately, and keep beginner programs small enough to reason about line by line.",
        xpReward: 140,
        passingScore: 100,
        questions: [
          mcq("Java entry point", "Which method is the standard entry point for a Java console program?", "public static void main(String[] args)", ["start()", "main(String args)", "public void run()"], "The JVM starts execution from `public static void main(String[] args)`.", ["java", "basics"], "easy", 20),
          multi("Primitive numeric types", "Select Java primitive numeric types.", ["int", "double", "long"], ["String"], "`String` is a class, while `int`, `double`, and `long` are primitive numeric types.", ["java", "types"], "easy", 25),
          descriptive("Java beginner flow", "Why should beginner Java programs parse input before branching?", "Parsing once at the boundary keeps conditions simple, avoids repeated conversions, and makes validation easier to test.", ["java", "input"], "easy", 30),
          coding("Sum Java integers", "Read two integers and print their sum.", "java", javaStarter("    int a = scanner.nextInt();\n    int b = scanner.nextInt();\n    System.out.println(a + b);"), [{ id: "tc1", input: "4 9", expectedOutput: "13", isHidden: false, weight: 1 }, { id: "tc2", input: "25 17", expectedOutput: "42", isHidden: true, weight: 1 }], ["java", "io"], "easy", 55),
        ],
      },
      {
        difficulty: "beginner",
        title: "Java Methods and Arrays",
        description: "Break Java code into methods and process arrays with simple loops.",
        theory:
          "# Java Methods and Arrays\n\nMethods name reusable behavior. Arrays store fixed-size sequences, so loop bounds and index checks matter.",
        xpReward: 150,
        passingScore: 100,
        questions: [
          mcq("Method return type", "What does `void` mean in a Java method declaration?", "The method returns no value", ["The method is private", "The method returns null", "The method is asynchronous"], "`void` says callers should not expect a returned value.", ["java", "methods"], "easy", 20),
          multi("Array loop safety", "Which practices help avoid array index errors?", ["Start at index 0", "Use `array.length` for the upper bound"], ["Loop through `i <= array.length`", "Assume every array has ten items"], "Java arrays are zero-indexed and the last valid index is `array.length - 1`.", ["java", "arrays"], "easy", 25),
          descriptive("Java method extraction", "When should beginner Java code be moved into a method?", "Extract a method when a block has a clear responsibility, repeats, or makes `main` hard to scan.", ["java", "methods"], "easy", 30),
          coding("Largest Java number", "Read `n` followed by `n` integers and print the largest value.", "java", javaStarter("    int n = scanner.nextInt();\n    int best = Integer.MIN_VALUE;\n    for (int i = 0; i < n; i++) {\n      best = Math.max(best, scanner.nextInt());\n    }\n    System.out.println(best);"), [{ id: "tc1", input: "5 4 8 1 9 2", expectedOutput: "9", isHidden: false, weight: 1 }, { id: "tc2", input: "3 -5 -2 -8", expectedOutput: "-2", isHidden: true, weight: 1 }], ["java", "arrays"], "easy", 60),
        ],
      },
      {
        difficulty: "intermediate",
        title: "Java OOP and Collections",
        description: "Model domains with classes, encapsulation, lists, maps, sets, and collection iteration.",
        theory:
          "# Java OOP and Collections\n\nUse classes to protect invariants. Choose `List` for ordered values, `Set` for uniqueness, and `Map` for key-based lookup.",
        xpReward: 180,
        passingScore: 100,
        questions: [
          mcq("Encapsulation", "What is the main goal of encapsulation?", "Protect object state behind methods", ["Make every field public", "Remove constructors", "Avoid packages"], "Encapsulation keeps state changes controlled by the object API.", ["java", "oop"], "medium", 25),
          multi("Collection choices", "Select correct Java collection matches.", ["ArrayList for ordered dynamic items", "HashSet for uniqueness", "HashMap for key-value lookup"], ["Thread for JSON parsing"], "The Java collections framework gives different structures for different access patterns.", ["java", "collections"], "medium", 30),
          descriptive("Choosing Java collections", "Explain when you would choose a `Map` instead of a `List`.", "Use a Map when lookup by key is central, such as finding users by id. A List fits ordered traversal or position-based access.", ["java", "collections"], "medium", 35),
          coding("Java frequency count", "Read words and print the count of the most frequent word.", "java", javaStarter("    Map<String, Integer> counts = new HashMap<>();\n    int best = 0;\n    while (scanner.hasNext()) {\n      String word = scanner.next().toLowerCase();\n      int next = counts.getOrDefault(word, 0) + 1;\n      counts.put(word, next);\n      best = Math.max(best, next);\n    }\n    System.out.println(best);"), [{ id: "tc1", input: "red blue red green red", expectedOutput: "3", isHidden: false, weight: 1 }, { id: "tc2", input: "a b b c c c", expectedOutput: "3", isHidden: true, weight: 1 }], ["java", "maps"], "medium", 70),
        ],
      },
      {
        difficulty: "advanced",
        title: "Java Concurrency and Services",
        description: "Reason about threads, immutability, exceptions, boundaries, and service-style Java code.",
        theory:
          "# Java Concurrency and Services\n\nAdvanced Java code needs clear ownership of mutable state, explicit error handling, and APIs that make invalid states hard to represent.",
        xpReward: 240,
        passingScore: 100,
        questions: [
          mcq("Thread safety", "Which approach most directly reduces shared-state concurrency bugs?", "Prefer immutable data or synchronize shared mutations", ["Store everything in public static fields", "Ignore exceptions", "Use longer variable names"], "Concurrency is safer when mutable shared state is removed or guarded.", ["java", "concurrency"], "hard", 30),
          multi("Service boundary habits", "Which habits make Java services more reliable?", ["Validate request input", "Return clear error responses", "Keep transactions scoped"], ["Swallow every exception"], "Reliable services validate, handle failures explicitly, and keep data changes consistent.", ["java", "services"], "hard", 35),
          descriptive("Java service design", "Why should service methods separate validation from persistence?", "Validation protects deeper code from invalid assumptions, while persistence should focus on consistent state changes and transactional boundaries.", ["java", "architecture"], "hard", 40),
          coding("Java unique ids", "Read ids and print `DUPLICATE` if any id repeats, otherwise `UNIQUE`.", "java", javaStarter("    Set<String> seen = new HashSet<>();\n    while (scanner.hasNext()) {\n      String id = scanner.next();\n      if (seen.contains(id)) {\n        System.out.println(\"DUPLICATE\");\n        return;\n      }\n      seen.add(id);\n    }\n    System.out.println(\"UNIQUE\");"), [{ id: "tc1", input: "u1 u2 u3 u2", expectedOutput: "DUPLICATE", isHidden: false, weight: 1 }, { id: "tc2", input: "a b c", expectedOutput: "UNIQUE", isHidden: true, weight: 1 }], ["java", "sets"], "hard", 85),
        ],
      },
    ],
  },
  ...[
    {
      title: "Git and Developer Workflow",
      language: "Git",
      tags: ["git", "github", "workflow", "collaboration"],
      description: "Learn version control, branching, pull requests, conflict resolution, and release hygiene.",
      shortDescription: "Use Git confidently in real team workflows.",
      thumbnail: "https://images.unsplash.com/photo-1556075798-4825dfaaf498",
      tracks: ["Commits and Branches", "Pull Requests and Reviews", "Rebases, Releases, and Recovery"],
    },
    {
      title: "Testing and Quality Engineering",
      language: "TypeScript",
      tags: ["testing", "quality", "automation", "ci"],
      description: "Build confidence with unit, integration, end-to-end, accessibility, and regression testing.",
      shortDescription: "Ship reliable software with practical testing strategy.",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      tracks: ["Testing Fundamentals", "Integration and Browser Tests", "CI Quality Gates"],
    },
    {
      title: "Cloud and DevOps Foundations",
      language: "Cloud",
      tags: ["cloud", "devops", "docker", "deployment"],
      description: "Understand containers, environments, deployments, observability, and operational safety.",
      shortDescription: "Deploy and operate applications with modern DevOps practices.",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
      tracks: ["Containers and Environments", "Deployment Pipelines", "Observability and Incident Response"],
    },
    {
      title: "Security for Developers",
      language: "Security",
      tags: ["security", "auth", "owasp", "backend"],
      description: "Practice secure input handling, authentication, authorization, secrets, and common web risks.",
      shortDescription: "Build safer applications from the first line of code.",
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
      tracks: ["Secure Coding Basics", "Authentication and Authorization", "Threat Modeling and Hardening"],
    },
    {
      title: "System Design and Architecture",
      language: "Architecture",
      tags: ["system-design", "architecture", "scalability", "backend"],
      description: "Design scalable services with clear APIs, data ownership, queues, caches, and tradeoff thinking.",
      shortDescription: "Think like an architect without losing engineering practicality.",
      thumbnail: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
      tracks: ["API and Data Design", "Scaling and Caching", "Distributed Systems Tradeoffs"],
    },
    {
      title: "HTML CSS and Accessibility",
      language: "HTML/CSS",
      tags: ["html", "css", "accessibility", "frontend"],
      description: "Create semantic, responsive, accessible interfaces with maintainable styling systems.",
      shortDescription: "Build interfaces that are usable, responsive, and accessible.",
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
      tracks: ["Semantic HTML and Forms", "Responsive CSS Layouts", "Accessibility Audits"],
    },
  ].map((course, courseIndex): CourseSeed => ({
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    difficulty: "beginner",
    language: course.language,
    estimatedHours: 12 + courseIndex * 2,
    tags: course.tags,
    thumbnail: course.thumbnail,
    averageRating: 4.7 + (courseIndex % 3) * 0.1,
    enrollmentCount: 980 + courseIndex * 280,
    tracks: course.tracks.map((title, index) => {
      const difficulty = (["beginner", "intermediate", "advanced"] as const)[index];
      return {
        difficulty,
        title,
        description: `Master ${title.toLowerCase()} with focused developer practice.`,
        theory: `# ${title}\n\nThis level focuses on practical decisions, clear terminology, and habits that transfer into production work.`,
        xpReward: 120 + index * 35,
        passingScore: 100,
        questions: [
          mcq(`${title} core idea`, `Which habit best supports ${title.toLowerCase()}?`, "Use small, reviewable changes with clear feedback", ["Hide failures until release", "Skip validation", "Avoid documentation always"], "Strong developer workflows make state, intent, and failure visible.", course.tags, index === 0 ? "easy" : index === 1 ? "medium" : "hard", 20 + index * 5),
          multi(`${title} reliable practices`, `Select practices that improve ${title.toLowerCase()}.`, ["Automate repeatable checks", "Name decisions clearly", "Review risky changes"], ["Commit secrets to the repository"], "Automation, naming, and review reduce avoidable mistakes.", course.tags, index === 0 ? "easy" : "medium", 25 + index * 5),
          descriptive(`${title} tradeoff`, `Explain one tradeoff a developer should consider in ${title.toLowerCase()}.`, "A strong answer names the context, the benefit, the cost, and how the team would detect whether the decision is working.", course.tags, index === 0 ? "easy" : index === 1 ? "medium" : "hard", 30 + index * 5),
          coding(`${title} signal count`, "Read event labels and print how many labels start with `pass:`.", "javascript", jsStarter("solve", "  return input.split(/\\s+/).filter((label) => label.startsWith('pass:')).length;"), [{ id: "tc1", input: "pass:lint fail:test pass:build", expectedOutput: "2", isHidden: false, weight: 1 }, { id: "tc2", input: "skip pass:a pass:b fail:c", expectedOutput: "2", isHidden: true, weight: 1 }], course.tags, index === 0 ? "easy" : "medium", 50 + index * 10),
        ],
      };
    }),
  })),
];

const challengeSeeds: ChallengeSeed[] = [
  {
    title: "Pair Sum Gate",
    summary: "Detect whether two distinct numbers can unlock a requested target sum.",
    description:
      "Read input in the format `target|numbers`. Print `YES` if two distinct numbers from the list add up to the target, otherwise print `NO`.\n\nUse each number at most once. Negative values may appear.",
    difficulty: "easy",
    category: "Arrays",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Return YES or NO.\n  return 'NO';"),
    testCases: [
      { id: "visible-1", input: "10|3 7 4 2", expectedOutput: "YES", isHidden: false, weight: 1 },
      { id: "visible-2", input: "8|1 2 3 9", expectedOutput: "NO", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "0|-4 2 4 8", expectedOutput: "YES", isHidden: true, weight: 2 },
    ],
    xpReward: 75,
    timeLimitMinutes: 20,
    tags: ["arrays", "hash-set", "two-sum"],
  },
  {
    title: "Slug Forge",
    summary: "Convert messy title text into stable URL slugs.",
    description:
      "Read one line of text and print a slug: lowercase it, replace groups of non-alphanumeric characters with one hyphen, and trim leading or trailing hyphens.",
    difficulty: "easy",
    category: "Strings",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Normalize the input into a URL slug.\n  return input;"),
    testCases: [
      { id: "visible-1", input: "React & Next.js App Router", expectedOutput: "react-next-js-app-router", isHidden: false, weight: 1 },
      { id: "visible-2", input: "  Ship!!! Fast  ", expectedOutput: "ship-fast", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "API_v2: Contracts", expectedOutput: "api-v2-contracts", isHidden: true, weight: 2 },
    ],
    xpReward: 70,
    timeLimitMinutes: 15,
    tags: ["strings", "regex", "normalization"],
  },
  {
    title: "Bracket Firewall",
    summary: "Validate nested bracket structure before code reaches production.",
    description:
      "Read a string containing only `()[]{}` characters. Print `VALID` when every opening bracket closes in the correct order, otherwise print `INVALID`.",
    difficulty: "easy",
    category: "Stacks",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Validate balanced brackets.\n  return 'INVALID';"),
    testCases: [
      { id: "visible-1", input: "{[()]}", expectedOutput: "VALID", isHidden: false, weight: 1 },
      { id: "visible-2", input: "([)]", expectedOutput: "INVALID", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "(([]){})", expectedOutput: "VALID", isHidden: true, weight: 2 },
    ],
    xpReward: 80,
    timeLimitMinutes: 20,
    tags: ["stacks", "parsing", "validation"],
  },
  {
    title: "Frequency Leaderboard",
    summary: "Find the most common token with deterministic tie-breaking.",
    description:
      "Read space-separated words. Print the word that appears most often. If multiple words tie, print the lexicographically smallest tied word. Matching is case-insensitive.",
    difficulty: "medium",
    category: "Hash Maps",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Print the most frequent normalized word.\n  return '';"),
    testCases: [
      { id: "visible-1", input: "Red blue red GREEN green", expectedOutput: "green", isHidden: false, weight: 1 },
      { id: "visible-2", input: "beta alpha beta alpha", expectedOutput: "alpha", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "Code code quest Quest quest", expectedOutput: "quest", isHidden: true, weight: 2 },
    ],
    xpReward: 110,
    timeLimitMinutes: 25,
    tags: ["hash-map", "strings", "tie-break"],
  },
  {
    title: "Scoreboard Parser",
    summary: "Parse compact score rows and report the winning score.",
    description:
      "Read `name:score` pairs separated by spaces. Print `name=score` for the highest score. If scores tie, choose the earliest pair in the input.",
    difficulty: "medium",
    category: "Parsing",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Parse scores and print the winning pair.\n  return '';"),
    testCases: [
      { id: "visible-1", input: "ada:98 linus:87 grace:94", expectedOutput: "ada=98", isHidden: false, weight: 1 },
      { id: "visible-2", input: "a:10 b:10 c:9", expectedOutput: "a=10", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "x:-5 y:-2 z:-3", expectedOutput: "y=-2", isHidden: true, weight: 2 },
    ],
    xpReward: 115,
    timeLimitMinutes: 25,
    tags: ["parsing", "arrays", "edge-cases"],
  },
  {
    title: "Rate Limit Buckets",
    summary: "Count request bursts in fixed-size time buckets.",
    description:
      "Read input as `bucketSize|timestamps`. Timestamps are integers in milliseconds. Print comma-separated counts per bucket starting at time `0`. For example, with bucket size `100`, timestamp `250` belongs to bucket `2`.",
    difficulty: "medium",
    category: "Systems",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Return comma-separated bucket counts.\n  return '';"),
    testCases: [
      { id: "visible-1", input: "100|0 20 120 250 260", expectedOutput: "2,1,2", isHidden: false, weight: 1 },
      { id: "visible-2", input: "50|10 49 50 99 100", expectedOutput: "2,2,1", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "200|0 199 200 600", expectedOutput: "2,1,0,1", isHidden: true, weight: 2 },
    ],
    xpReward: 125,
    timeLimitMinutes: 30,
    tags: ["systems", "arrays", "rate-limit"],
  },
  {
    title: "Merge Sorted Streams",
    summary: "Merge two sorted integer streams into one sorted output.",
    description:
      "Read two sorted integer lists separated by `|`. Print the merged sorted list with numbers separated by spaces. Either side may be empty.",
    difficulty: "medium",
    category: "Two Pointers",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Merge both sorted lists.\n  return '';"),
    testCases: [
      { id: "visible-1", input: "1 4 8|2 3 10", expectedOutput: "1 2 3 4 8 10", isHidden: false, weight: 1 },
      { id: "visible-2", input: "|5 7", expectedOutput: "5 7", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "-3 0 0|-4 2", expectedOutput: "-4 -3 0 0 2", isHidden: true, weight: 2 },
    ],
    xpReward: 120,
    timeLimitMinutes: 25,
    tags: ["two-pointers", "arrays", "sorting"],
  },
  {
    title: "Window Pressure",
    summary: "Find the highest fixed-window load over a stream of readings.",
    description:
      "Read `k|numbers`. Print the maximum sum of any contiguous window of size `k`. If `k` is larger than the list length, sum the whole list.",
    difficulty: "hard",
    category: "Sliding Window",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Compute the maximum fixed-window sum.\n  return 0;"),
    testCases: [
      { id: "visible-1", input: "3|2 1 5 1 3 2", expectedOutput: "9", isHidden: false, weight: 1 },
      { id: "visible-2", input: "2|-5 -1 -3", expectedOutput: "-4", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "5|4 2", expectedOutput: "6", isHidden: true, weight: 2 },
    ],
    xpReward: 160,
    timeLimitMinutes: 35,
    tags: ["sliding-window", "arrays", "performance"],
  },
  {
    title: "Component Islands",
    summary: "Count connected groups in a compact graph input.",
    description:
      "Read `n` followed by edges like `0-1 2-3`. Nodes are numbered from `0` to `n - 1`. Print the number of connected components.",
    difficulty: "hard",
    category: "Graphs",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Count connected components.\n  return 0;"),
    testCases: [
      { id: "visible-1", input: "5 0-1 1-2 3-4", expectedOutput: "2", isHidden: false, weight: 1 },
      { id: "visible-2", input: "4", expectedOutput: "4", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "6 0-1 2-3 3-4 4-2", expectedOutput: "3", isHidden: true, weight: 2 },
    ],
    xpReward: 180,
    timeLimitMinutes: 40,
    tags: ["graphs", "dfs", "connectivity"],
  },
  {
    title: "Retry Timeline",
    summary: "Generate a capped exponential backoff schedule.",
    description:
      "Read `attempts base cap`. Print retry delays where delay `i` is `base * 2^i`, capped at `cap`, for `attempts` retries. Separate values with spaces.",
    difficulty: "hard",
    category: "Reliability",
    language: "javascript",
    starterCode: jsStarter("solve", "  // Build the retry schedule.\n  return '';"),
    testCases: [
      { id: "visible-1", input: "4 100 1000", expectedOutput: "100 200 400 800", isHidden: false, weight: 1 },
      { id: "visible-2", input: "5 250 1000", expectedOutput: "250 500 1000 1000 1000", isHidden: false, weight: 1 },
      { id: "hidden-1", input: "3 50 75", expectedOutput: "50 75 75", isHidden: true, weight: 2 },
    ],
    xpReward: 165,
    timeLimitMinutes: 30,
    tags: ["reliability", "backoff", "systems"],
  },
];

async function upsertUser(input: {
  email: string;
  displayName: string;
  username: string;
  firebaseUid: string;
  role: "user" | "admin";
  xp: number;
  bio?: string;
}) {
  const level = calculateLevel(input.xp);

  return User.findOneAndUpdate(
    { email: input.email },
    {
      $set: {
        displayName: input.displayName,
        username: input.username,
        role: input.role,
        xp: input.xp,
        level,
        bio: input.bio,
        isPublicProfile: true,
        streak: {
          current: 3,
          longest: 7,
          lastActiveDate: new Date(),
        },
      },
      $setOnInsert: {
        firebaseUid: input.firebaseUid,
        avatarUrl: "",
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
    }
  );
}

async function upsertCourse(input: Omit<CourseSeed, "tracks"> & { createdBy: mongoose.Types.ObjectId }) {
  const slug = slugify(input.title);

  return Course.findOneAndUpdate(
    { slug },
    {
      $set: {
        title: input.title,
        slug,
        description: input.description,
        shortDescription: input.shortDescription,
        difficulty: input.difficulty,
        language: input.language,
        estimatedHours: input.estimatedHours,
        tags: input.tags,
        thumbnail: input.thumbnail,
        isPublished: true,
        enrollmentCount: input.enrollmentCount,
        averageRating: input.averageRating,
        createdBy: input.createdBy,
      },
      $setOnInsert: {
        tracks: [],
        totalTracks: 0,
        totalQuestions: 0,
        prerequisiteCourseIds: [],
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
    }
  );
}

async function upsertTrack(input: {
  courseId: mongoose.Types.ObjectId;
  difficulty: Difficulty;
  order: number;
  title: string;
  description: string;
  theory: string;
  xpReward: number;
  passingScore: number;
  isLocked: boolean;
}) {
  const slug = slugify(input.title);

  return Track.findOneAndUpdate(
    { courseId: input.courseId, difficulty: input.difficulty, order: input.order },
    {
      $set: {
        title: input.title,
        slug,
        description: input.description,
        difficulty: input.difficulty,
        theory: input.theory,
        xpReward: input.xpReward,
        passingScore: input.passingScore,
        isLocked: input.isLocked,
        isPublished: true,
      },
      $setOnInsert: {
        questions: [],
        totalQuestions: 0,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
    }
  );
}

async function upsertQuestion(input: QuestionSeed & { trackId: mongoose.Types.ObjectId; order: number }) {
  const questionInput = mixQuestionOptions(input, `${input.trackId.toString()}:${input.order}:${input.title}`);

  return Question.findOneAndUpdate(
    { trackId: questionInput.trackId, order: questionInput.order },
    {
      $set: {
        ...questionInput,
        isPublished: true,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
    }
  );
}

async function upsertChallenge(input: ChallengeSeed & { createdBy: mongoose.Types.ObjectId }) {
  const slug = slugify(input.title);

  return Challenge.findOneAndUpdate(
    { slug },
    {
      $set: {
        title: input.title,
        slug,
        summary: input.summary,
        description: input.description,
        difficulty: input.difficulty,
        category: input.category,
        language: input.language,
        starterCode: input.starterCode,
        testCases: input.testCases,
        xpReward: input.xpReward,
        timeLimitMinutes: input.timeLimitMinutes,
        tags: input.tags,
        isPublished: true,
        createdBy: input.createdBy,
      },
      $setOnInsert: {
        completionsCount: 0,
        submissionsCount: 0,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
    }
  );
}

async function resetSeededData() {
  await Attempt.deleteMany({});
  await Progress.deleteMany({});
  await Submission.deleteMany({});
  await CertificateModel.deleteMany({});
  await ChallengeProgress.deleteMany({});
  await Challenge.deleteMany({});
  await ActivityLogModel.deleteMany({});
  await Question.deleteMany({});
  await Track.deleteMany({});
  await Course.deleteMany({});
  await User.deleteMany({});
}

async function reconcileTrackIndexes() {
  try {
    await Track.collection.dropIndex("courseId_1_order_1");
    console.log("[seed] Dropped legacy track index courseId_1_order_1.");
  } catch (error) {
    const mongoError = error as { codeName?: string; code?: number };
    if (mongoError.codeName !== "IndexNotFound" && mongoError.code !== 27) {
      throw error;
    }
  }

  await Track.collection.createIndex(
    { courseId: 1, difficulty: 1, order: 1 },
    { unique: true, name: "courseId_1_difficulty_1_order_1" }
  );
}

async function reconcileChallengeIndexes() {
  try {
    await Challenge.collection.dropIndex("title_text_summary_text_category_text_tags_text");
    console.log("[seed] Dropped legacy challenge text index.");
  } catch (error) {
    const mongoError = error as { codeName?: string; code?: number };
    if (mongoError.codeName !== "IndexNotFound" && mongoError.code !== 27) {
      throw error;
    }
  }

  await Challenge.collection.createIndex(
    { title: "text", summary: "text", category: "text", tags: "text" },
    {
      name: "title_text_summary_text_category_text_tags_text",
      default_language: "none",
      language_override: "textLanguage",
    }
  );
}

async function seed() {
  const shouldReset = process.argv.includes(RESET_FLAG);

  await dbConnect();
  await reconcileTrackIndexes();
  await reconcileChallengeIndexes();

  if (shouldReset) {
    console.log("[seed] Reset flag detected, removing existing users, catalog, attempts, progress, submissions, certificates, and challenges...");
    await resetSeededData();
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ljcodequest.dev";
  const adminUid = process.env.SEED_ADMIN_FIREBASE_UID ?? "seed-admin-uid";

  const admin = await upsertUser({
    email: adminEmail,
    displayName: "LJ Admin",
    username: "ljadmin",
    firebaseUid: adminUid,
    role: "admin",
    xp: 2600,
    bio: "Platform administrator seeded by script.",
  });

  const studentOne = await upsertUser({
    email: "student1@ljcodequest.dev",
    displayName: "Ada Student",
    username: "ada_student",
    firebaseUid: "seed-student-uid-1",
    role: "user",
    xp: 860,
    bio: "Enjoys solving algorithmic puzzles.",
  });

  const studentTwo = await upsertUser({
    email: "student2@ljcodequest.dev",
    displayName: "Linus Learner",
    username: "linus_learner",
    firebaseUid: "seed-student-uid-2",
    role: "user",
    xp: 1450,
    bio: "Focused on backend engineering.",
  });

  const studentThree = await upsertUser({
    email: "student3@ljcodequest.dev",
    displayName: "Grace Coder",
    username: "grace_coder",
    firebaseUid: "seed-student-uid-3",
    role: "user",
    xp: 390,
    bio: "Beginning the coding journey.",
  });

  const createdCourses: Array<{
    course: Awaited<ReturnType<typeof upsertCourse>>;
    tracks: Array<{ track: Awaited<ReturnType<typeof upsertTrack>>; questions: Awaited<ReturnType<typeof upsertQuestion>>[] }>;
  }> = [];
  const createdChallenges = [];

  const seedCatalog = [...courseSeeds, ...developerCourseSeeds].map(expandCourseQuestions);

  for (const courseSeed of seedCatalog) {
    const { tracks, ...courseInput } = courseSeed;
    const course = await upsertCourse({ ...courseInput, createdBy: admin._id });
    const createdTracks: Array<{
      track: Awaited<ReturnType<typeof upsertTrack>>;
      questions: Awaited<ReturnType<typeof upsertQuestion>>[];
    }> = [];
    const difficultyOrderCounts: Record<Difficulty, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    for (const trackSeed of tracks) {
      difficultyOrderCounts[trackSeed.difficulty] += 1;
      const orderInDifficulty = difficultyOrderCounts[trackSeed.difficulty];
      const track = await upsertTrack({
        courseId: course._id,
        difficulty: trackSeed.difficulty,
        order: orderInDifficulty,
        title: trackSeed.title,
        description: trackSeed.description,
        theory: trackSeed.theory,
        xpReward: trackSeed.xpReward,
        passingScore: trackSeed.passingScore,
        isLocked: !(trackSeed.difficulty === "beginner" && orderInDifficulty === 1),
      });

      const questions = [];
      for (const [questionIndex, questionSeed] of trackSeed.questions.entries()) {
        questions.push(
          await upsertQuestion({
            ...questionSeed,
            trackId: track._id,
            order: questionIndex + 1,
          })
        );
      }

      await Track.findByIdAndUpdate(track._id, {
        $set: {
          questions: questions.map((question) => question._id),
          totalQuestions: questions.length,
        },
      });

      createdTracks.push({ track, questions });
    }

    await Course.findByIdAndUpdate(course._id, {
      $set: {
        tracks: createdTracks.map((item) => item.track._id),
        totalTracks: createdTracks.length,
        totalQuestions: createdTracks.reduce((sum, item) => sum + item.questions.length, 0),
      },
    });

    createdCourses.push({ course, tracks: createdTracks });
  }

  for (const challengeSeed of challengeSeeds) {
    createdChallenges.push(await upsertChallenge({ ...challengeSeed, createdBy: admin._id }));
  }

  const jsCourse = createdCourses[0];
  const pythonCourse = createdCourses[1];
  const dsaCourse = createdCourses[2];

  await Progress.findOneAndUpdate(
    { userId: studentOne._id, courseId: jsCourse.course._id },
    {
      $set: {
        currentTrackId: jsCourse.tracks[1].track._id,
        completedTracks: [jsCourse.tracks[0].track._id],
        completedQuestions: jsCourse.tracks[0].questions.map((question) => question._id),
        completedLevels: ["beginner"],
        currentTrackProgress: {
          trackId: jsCourse.tracks[1].track._id,
          currentQuestionOrder: 2,
          totalQuestionsInTrack: jsCourse.tracks[1].questions.length,
        },
        percentComplete: 34,
        isCompleted: false,
        lastActiveAt: new Date(),
      },
      $setOnInsert: {
        enrolledAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  if (createdChallenges.length >= 2) {
    const completedChallenge = createdChallenges[0];
    const startedChallenge = createdChallenges[1];

    await ChallengeProgress.findOneAndUpdate(
      { userId: studentOne._id, challengeId: completedChallenge._id },
      {
        $set: {
          status: "completed",
          attempts: 2,
          bestScore: 100,
          lastSubmittedCode: completedChallenge.starterCode,
          language: completedChallenge.language,
          completedAt: new Date(),
          lastAttemptAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    await ChallengeProgress.findOneAndUpdate(
      { userId: studentThree._id, challengeId: startedChallenge._id },
      {
        $set: {
          status: "in-progress",
          attempts: 1,
          bestScore: 50,
          lastSubmittedCode: startedChallenge.starterCode,
          language: startedChallenge.language,
          lastAttemptAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    await Challenge.bulkWrite([
      {
        updateOne: {
          filter: { _id: completedChallenge._id },
          update: { $set: { completionsCount: 1, submissionsCount: 2 } },
        },
      },
      {
        updateOne: {
          filter: { _id: startedChallenge._id },
          update: { $set: { completionsCount: 0, submissionsCount: 1 } },
        },
      },
    ]);
  }

  await Progress.findOneAndUpdate(
    { userId: studentTwo._id, courseId: pythonCourse.course._id },
    {
      $set: {
        currentTrackId: pythonCourse.tracks[2].track._id,
        completedTracks: pythonCourse.tracks.map((item) => item.track._id),
        completedQuestions: pythonCourse.tracks.flatMap((item) => item.questions.map((question) => question._id)),
        completedLevels: ["beginner", "intermediate", "advanced"],
        percentComplete: 100,
        isCompleted: true,
        completedAt: new Date(),
        lastActiveAt: new Date(),
      },
      $setOnInsert: {
        enrolledAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await Progress.findOneAndUpdate(
    { userId: studentThree._id, courseId: dsaCourse.course._id },
    {
      $set: {
        currentTrackId: dsaCourse.tracks[0].track._id,
        completedTracks: [],
        completedQuestions: [],
        completedLevels: [],
        currentTrackProgress: {
          trackId: dsaCourse.tracks[0].track._id,
          currentQuestionOrder: 1,
          totalQuestionsInTrack: dsaCourse.tracks[0].questions.length,
        },
        percentComplete: 8,
        isCompleted: false,
        lastActiveAt: new Date(),
      },
      $setOnInsert: {
        enrolledAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const firstJsMcq = jsCourse.tracks[0].questions[0];
  const firstJsCoding = jsCourse.tracks[0].questions[3];
  const pendingReviewQuestion = jsCourse.tracks[1].questions[2];
  const firstJsMcqCorrectOptionId = firstJsMcq.options?.find((option) => option.isCorrect)?.id;

  if (!firstJsMcqCorrectOptionId) {
    throw new Error("Seeded first JavaScript MCQ is missing a correct option.");
  }

  await Submission.findOneAndUpdate(
    { userId: studentOne._id, questionId: firstJsMcq._id, attemptNumber: 1 },
    {
      $set: {
        trackId: jsCourse.tracks[0].track._id,
        courseId: jsCourse.course._id,
        type: "mcq",
        selectedOptions: [firstJsMcqCorrectOptionId],
        isCorrect: true,
        score: 100,
        xpEarned: firstJsMcq.xpReward,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await Submission.findOneAndUpdate(
    { userId: studentOne._id, questionId: firstJsCoding._id, attemptNumber: 1 },
    {
      $set: {
        trackId: jsCourse.tracks[0].track._id,
        courseId: jsCourse.course._id,
        type: "coding",
        code:
          "const fs=require('fs'); const [a,b]=fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number); console.log(a+b);",
        language: "javascript",
        isCorrect: true,
        score: 100,
        xpEarned: firstJsCoding.xpReward,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const pendingReview = await Submission.findOneAndUpdate(
    { userId: studentOne._id, questionId: pendingReviewQuestion._id, attemptNumber: 1 },
    {
      $set: {
        trackId: jsCourse.tracks[1].track._id,
        courseId: jsCourse.course._id,
        type: "descriptive",
        descriptiveAnswer:
          "I would extract a function when repeated code has a single clear responsibility and a name would make the main flow easier to read.",
        isCorrect: false,
        score: 0,
        xpEarned: 0,
        reviewStatus: "pending",
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const seedCertificateId = `CERT-${Date.now().toString(36).toUpperCase()}`;
  const certificate = await CertificateModel.findOneAndUpdate(
    { userId: studentTwo._id, courseId: pythonCourse.course._id },
    {
      $setOnInsert: {
        certificateId: seedCertificateId,
        issuedAt: new Date(),
        status: "active",
        verificationHash: `seed-${seedCertificateId}`,
        metadata: {
          grade: "A",
          generatedBy: "seed-script",
        },
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
    }
  );

  await Progress.findOneAndUpdate(
    { userId: studentTwo._id, courseId: pythonCourse.course._id },
    {
      $set: {
        certificateId: certificate._id,
      },
    }
  );

  await ActivityLogModel.deleteMany({ details: { $regex: "^seed:" } });
  await ActivityLogModel.insertMany([
    {
      userId: studentOne._id,
      action: "question_attempt",
      details: "seed:student-one-js-mcq",
      timestamp: new Date(),
    },
    {
      userId: studentOne._id,
      action: "question_attempt",
      details: "seed:student-one-js-coding",
      timestamp: new Date(),
    },
    {
      userId: studentTwo._id,
      action: "course_complete",
      details: "seed:student-two-python-complete",
      timestamp: new Date(),
    },
    {
      userId: studentOne._id,
      action: "question_attempt",
      details: `seed:pending-review-${pendingReview._id.toString()}`,
      timestamp: new Date(),
    },
  ]);

  const courseSlugs = createdCourses.map((item) => item.course.slug);
  const challengeSlugs = createdChallenges.map((item) => item.slug);
  const totalTracks = createdCourses.reduce((sum, item) => sum + item.tracks.length, 0);
  const totalQuestions = createdCourses.reduce(
    (sum, item) => sum + item.tracks.reduce((trackSum, track) => trackSum + track.questions.length, 0),
    0
  );

  console.log("[seed] Completed successfully.");
  console.log("[seed] Admin user:", {
    email: admin.email,
    username: admin.username,
    role: admin.role,
    firebaseUid: admin.firebaseUid,
  });
  console.log("[seed] Students:", [studentOne.email, studentTwo.email, studentThree.email]);
  console.log("[seed] Courses:", courseSlugs);
  console.log("[seed] Challenges:", challengeSlugs);
  console.log("[seed] Totals:", { courses: createdCourses.length, tracks: totalTracks, questions: totalQuestions, challenges: createdChallenges.length });
  console.log("[seed] Tip: Set SEED_ADMIN_EMAIL and SEED_ADMIN_FIREBASE_UID to align admin with your Firebase account.");
}

seed()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
