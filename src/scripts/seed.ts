import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

import dbConnect from "../lib/db";
import { calculateLevel } from "../lib/gamification";
import { ActivityLogModel } from "../models/ActivityLog";
import { CertificateModel } from "../models/Certificate";
import { Course } from "../models/Course";
import { Progress } from "../models/Progress";
import { Question } from "../models/Question";
import { Submission } from "../models/Submission";
import { Track } from "../models/Track";
import { User } from "../models/User";

loadEnvConfig(process.cwd());

const RESET_FLAG = "--reset";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function upsertUser(input: {
  email: string;
  displayName: string;
  username: string;
  firebaseUid: string;
  role: "student" | "admin" | "instructor";
  xp: number;
  bio?: string;
}) {
  const level = calculateLevel(input.xp);

  const user = await User.findOneAndUpdate(
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

  return user;
}

async function upsertCourse(input: {
  title: string;
  description: string;
  shortDescription: string;
  language: string;
  tags: string[];
  thumbnail: string;
  createdBy: mongoose.Types.ObjectId;
}) {
  const slug = slugify(input.title);

  const course = await Course.findOneAndUpdate(
    { slug },
    {
      $set: {
        title: input.title,
        slug,
        description: input.description,
        shortDescription: input.shortDescription,
        language: input.language,
        tags: input.tags,
        thumbnail: input.thumbnail,
        isPublished: true,
        createdBy: input.createdBy,
      },
      $setOnInsert: {
        tracks: [],
        totalTracks: 0,
        totalQuestions: 0,
        enrollmentCount: 0,
        averageRating: 4.6,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
    }
  );

  return course;
}

async function upsertTrack(input: {
  courseId: mongoose.Types.ObjectId;
  difficulty: "beginner" | "intermediate" | "advanced";
  order: number;
  title: string;
  description: string;
  theory: string;
  xpReward: number;
  passingScore: number;
  isLocked: boolean;
}) {
  const slug = slugify(input.title);

  const track = await Track.findOneAndUpdate(
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

  return track;
}

async function upsertQuestion(input: {
  trackId: mongoose.Types.ObjectId;
  order: number;
  type: "mcq" | "multi-select" | "descriptive" | "coding";
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
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
  tags: string[];
}) {
  return Question.findOneAndUpdate(
    { trackId: input.trackId, order: input.order },
    {
      $set: {
        ...input,
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

async function resetSeededData() {
  await Progress.deleteMany({});
  await Submission.deleteMany({});
  await CertificateModel.deleteMany({});
  await ActivityLogModel.deleteMany({ details: { $regex: "^seed:" } });
  await Question.deleteMany({});
  await Track.deleteMany({});
  await Course.deleteMany({ slug: { $in: ["javascript-fundamentals", "python-problem-solving"] } });
  await User.deleteMany({
    email: {
      $in: [
        "admin@ljcodequest.dev",
        "student1@ljcodequest.dev",
        "student2@ljcodequest.dev",
        "student3@ljcodequest.dev",
      ],
    },
  });
}

async function seed() {
  const shouldReset = process.argv.includes(RESET_FLAG);

  await dbConnect();

  if (shouldReset) {
    console.log("[seed] Reset flag detected, removing existing seeded data...");
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
    xp: 1800,
    bio: "Platform administrator seeded by script.",
  });

  const studentOne = await upsertUser({
    email: "student1@ljcodequest.dev",
    displayName: "Ada Student",
    username: "ada_student",
    firebaseUid: "seed-student-uid-1",
    role: "student",
    xp: 420,
    bio: "Enjoys solving algorithmic puzzles.",
  });

  const studentTwo = await upsertUser({
    email: "student2@ljcodequest.dev",
    displayName: "Linus Learner",
    username: "linus_learner",
    firebaseUid: "seed-student-uid-2",
    role: "student",
    xp: 250,
    bio: "Focused on backend engineering.",
  });

  const studentThree = await upsertUser({
    email: "student3@ljcodequest.dev",
    displayName: "Grace Coder",
    username: "grace_coder",
    firebaseUid: "seed-student-uid-3",
    role: "student",
    xp: 90,
    bio: "Beginning the coding journey.",
  });

  const jsCourse = await upsertCourse({
    title: "JavaScript Fundamentals",
    description:
      "Master JavaScript basics through theory, quizzes, and coding challenges.",
    shortDescription: "Build a strong JavaScript foundation step by step.",
    language: "JavaScript",
    tags: ["javascript", "fundamentals", "web"],
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    createdBy: admin._id,
  });

  const pyCourse = await upsertCourse({
    title: "Python Problem Solving",
    description:
      "Practice practical problem solving in Python with progressive tracks and coding tasks.",
    shortDescription: "Solve Python problems and level up your logic.",
    language: "Python",
    tags: ["python", "problem-solving", "algorithms"],
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    createdBy: admin._id,
  });

  const jsTrackOne = await upsertTrack({
    courseId: jsCourse._id,
    difficulty: "beginner",
    order: 1,
    title: "Variables and Data Types",
    description: "Understand how to store and manipulate data in JavaScript.",
    theory:
      "# Variables and Data Types\n\nJavaScript supports `let`, `const`, and `var`. Prefer `const` by default and use `let` when reassignment is needed.",
    xpReward: 100,
    passingScore: 80,
    isLocked: false,
  });

  const jsTrackTwo = await upsertTrack({
    courseId: jsCourse._id,
    difficulty: "beginner",
    order: 2,
    title: "Functions and Control Flow",
    description: "Apply conditions and reusable functions to solve tasks.",
    theory:
      "# Functions and Control Flow\n\nFunctions help organize logic. Use `if/else` and loops to control execution based on conditions.",
    xpReward: 120,
    passingScore: 80,
    isLocked: true,
  });

  const pyTrackOne = await upsertTrack({
    courseId: pyCourse._id,
    difficulty: "intermediate",
    order: 1,
    title: "Python Collections",
    description: "Use lists, tuples, sets, and dictionaries effectively.",
    theory:
      "# Python Collections\n\nCollections are core data structures. Pick the right one depending on ordering, mutability, and lookup needs.",
    xpReward: 120,
    passingScore: 75,
    isLocked: false,
  });

  const q1 = await upsertQuestion({
    trackId: jsTrackOne._id,
    order: 1,
    type: "mcq",
    title: "Which keyword should you prefer for immutable bindings?",
    description: "Choose the modern JavaScript keyword for values that should not be reassigned.",
    difficulty: "easy",
    xpReward: 10,
    explanation: "Use const for values that are not reassigned.",
    options: [
      { id: "a", text: "var", isCorrect: false },
      { id: "b", text: "const", isCorrect: true },
      { id: "c", text: "mutable", isCorrect: false },
      { id: "d", text: "let", isCorrect: false },
    ],
    tags: ["javascript", "variables"],
  });

  const q2 = await upsertQuestion({
    trackId: jsTrackOne._id,
    order: 2,
    type: "coding",
    title: "Sum Two Numbers",
    description:
      "Read two integers from standard input separated by a space and print their sum.",
    difficulty: "easy",
    xpReward: 50,
    explanation: "Parse input values, convert to numbers, then print the sum.",
    language: "javascript",
    starterCode:
      "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n// TODO: parse and print result\n",
    testCases: [
      {
        id: "tc1",
        input: "2 3",
        expectedOutput: "5",
        isHidden: false,
        weight: 1,
      },
      {
        id: "tc2",
        input: "10 15",
        expectedOutput: "25",
        isHidden: true,
        weight: 1,
      },
    ],
    tags: ["javascript", "input-output"],
  });

  const q3 = await upsertQuestion({
    trackId: jsTrackTwo._id,
    order: 1,
    type: "descriptive",
    title: "Fill in the Blanks",
    description: "Drag and drop the correct terms to explain pure functions.",
    difficulty: "medium",
    xpReward: 30,
    starterCode: "A pure function always returns the [[BLANK_1]] output for the same input and has no [[BLANK_2]] effects.",
    sampleAnswer: "same,side",
    options: [
      { id: "same", text: "same", isCorrect: true },
      { id: "side", text: "side", isCorrect: true },
      { id: "different", text: "different", isCorrect: false },
      { id: "random", text: "random", isCorrect: false },
    ],
    tags: ["javascript", "functions", "design"],
  });

  const q4 = await upsertQuestion({
    trackId: pyTrackOne._id,
    order: 1,
    type: "multi-select",
    title: "Which collections are mutable in Python?",
    description: "Select all mutable built-in collection types from the options.",
    difficulty: "easy",
    xpReward: 20,
    explanation: "Lists and dictionaries are mutable.",
    options: [
      { id: "a", text: "list", isCorrect: true },
      { id: "b", text: "tuple", isCorrect: false },
      { id: "c", text: "dict", isCorrect: true },
      { id: "d", text: "str", isCorrect: false },
    ],
    tags: ["python", "collections"],
  });

  const trackQuestionMap = [
    { track: jsTrackOne, questions: [q1, q2] },
    { track: jsTrackTwo, questions: [q3] },
    { track: pyTrackOne, questions: [q4] },
  ];

  for (const item of trackQuestionMap) {
    await Track.findByIdAndUpdate(item.track._id, {
      $set: {
        questions: item.questions.map((question) => question._id),
        totalQuestions: item.questions.length,
      },
    });
  }

  await Course.findByIdAndUpdate(jsCourse._id, {
    $set: {
      tracks: [jsTrackOne._id, jsTrackTwo._id],
      totalTracks: 2,
      totalQuestions: 3,
      enrollmentCount: 2,
    },
  });

  await Course.findByIdAndUpdate(pyCourse._id, {
    $set: {
      tracks: [pyTrackOne._id],
      totalTracks: 1,
      totalQuestions: 1,
      enrollmentCount: 1,
    },
  });

  await Progress.findOneAndUpdate(
    { userId: studentOne._id, courseId: jsCourse._id },
    {
      $set: {
        currentTrackId: jsTrackTwo._id,
        completedTracks: [jsTrackOne._id],
        completedQuestions: [q1._id, q2._id],
        completedLevels: [],
        currentTrackProgress: {
          trackId: jsTrackTwo._id,
          currentQuestionOrder: 1,
          totalQuestionsInTrack: 1,
        },
        percentComplete: 50,
        isCompleted: false,
        lastActiveAt: new Date(),
      },
      $setOnInsert: {
        enrolledAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await Progress.findOneAndUpdate(
    { userId: studentTwo._id, courseId: jsCourse._id },
    {
      $set: {
        currentTrackId: jsTrackTwo._id,
        completedTracks: [jsTrackOne._id, jsTrackTwo._id],
        completedQuestions: [q1._id, q2._id, q3._id],
        completedLevels: ["beginner"],
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
    { userId: studentThree._id, courseId: pyCourse._id },
    {
      $set: {
        currentTrackId: pyTrackOne._id,
        completedTracks: [],
        completedQuestions: [],
        completedLevels: [],
        currentTrackProgress: {
          trackId: pyTrackOne._id,
          currentQuestionOrder: 1,
          totalQuestionsInTrack: 1,
        },
        percentComplete: 10,
        isCompleted: false,
        lastActiveAt: new Date(),
      },
      $setOnInsert: {
        enrolledAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await Submission.findOneAndUpdate(
    { userId: studentOne._id, questionId: q1._id, attemptNumber: 1 },
    {
      $set: {
        trackId: jsTrackOne._id,
        courseId: jsCourse._id,
        type: "mcq",
        selectedOptions: ["b"],
        isCorrect: true,
        score: 100,
        xpEarned: 10,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await Submission.findOneAndUpdate(
    { userId: studentOne._id, questionId: q2._id, attemptNumber: 1 },
    {
      $set: {
        trackId: jsTrackOne._id,
        courseId: jsCourse._id,
        type: "coding",
        code:
          "const fs=require('fs'); const [a,b]=fs.readFileSync(0,'utf8').trim().split(' ').map(Number); console.log(a+b);",
        language: "javascript",
        isCorrect: true,
        score: 100,
        xpEarned: 50,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const pendingReview = await Submission.findOneAndUpdate(
    { userId: studentOne._id, questionId: q3._id, attemptNumber: 1 },
    {
      $set: {
        trackId: jsTrackTwo._id,
        courseId: jsCourse._id,
        type: "descriptive",
        descriptiveAnswer:
          "Pure functions return the same result for the same input and avoid side effects, which makes testing easier.",
        isCorrect: false,
        score: 0,
        xpEarned: 0,
        reviewStatus: "pending",
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const certificate = await CertificateModel.findOneAndUpdate(
    { userId: studentTwo._id, courseId: jsCourse._id },
    {
      $setOnInsert: {
        certificateId: `CERT-${Date.now().toString(36).toUpperCase()}`,
        issuedAt: new Date(),
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
    { userId: studentTwo._id, courseId: jsCourse._id },
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
      details: "seed:student-one-q1",
      timestamp: new Date(),
    },
    {
      userId: studentOne._id,
      action: "question_attempt",
      details: "seed:student-one-q2",
      timestamp: new Date(),
    },
    {
      userId: studentTwo._id,
      action: "course_complete",
      details: "seed:student-two-course-complete",
      timestamp: new Date(),
    },
    {
      userId: studentOne._id,
      action: "question_attempt",
      details: `seed:pending-review-${pendingReview._id.toString()}`,
      timestamp: new Date(),
    },
  ]);

  console.log("[seed] Completed successfully.");
  console.log("[seed] Admin user:", {
    email: admin.email,
    username: admin.username,
    role: admin.role,
    firebaseUid: admin.firebaseUid,
  });
  console.log("[seed] Students:", [studentOne.email, studentTwo.email, studentThree.email]);
  console.log("[seed] Courses:", [jsCourse.slug, pyCourse.slug]);
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
