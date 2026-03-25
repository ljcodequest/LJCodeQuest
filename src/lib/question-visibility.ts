import type { UserRole } from "@/types";

type PlainObject = Record<string, unknown>;

function omitKeys<T extends PlainObject>(
  value: T,
  keys: readonly string[]
): PlainObject {
  return Object.fromEntries(
    Object.entries(value).filter(([entryKey]) => !keys.includes(entryKey))
  );
}

export function canViewQuestionAnswers(role: UserRole) {
  return role === "admin" || role === "instructor";
}

export function sanitizeQuestionForRole<T extends PlainObject>(
  question: T,
  role: UserRole
) {
  if (canViewQuestionAnswers(role)) {
    return question;
  }

  const nextQuestion = omitKeys(question, ["sampleAnswer", "rubric"]);

  if (Array.isArray(question.options)) {
    nextQuestion.options = question.options.map((option) =>
      omitKeys(option as PlainObject, ["isCorrect"])
    );
  }

  if (Array.isArray(question.testCases)) {
    nextQuestion.testCases = question.testCases.map((testCase) => {
      const typedTestCase = testCase as PlainObject;

      if (typedTestCase.isHidden) {
        return {
          id: typedTestCase.id,
          isHidden: true,
          weight: typedTestCase.weight ?? 1,
        };
      }

      return typedTestCase;
    });
  }

  return nextQuestion as T;
}
