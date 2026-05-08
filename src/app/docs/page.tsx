import { BookOpen } from "lucide-react";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = {
  title: "Documentation - LJ CodeQuest",
  description: "Guides for learning on LJ CodeQuest.",
};

export default function DocsPage() {
  return (
    <InfoPage
      eyebrow="Documentation"
      title="Learn how LJ CodeQuest tracks, challenges, and certificates work."
      description="Use these guides to understand the learning flow, progression rules, and what to expect as you move through each course."
      icon={BookOpen}
      sections={[
        {
          title: "Course flow",
          body: "Start with a published course, complete each track in order, and use quizzes to prove mastery before moving ahead.",
        },
        {
          title: "Progression",
          body: "Your activity, attempts, and completion status are saved to your account so protected learning routes can restore your state.",
        },
        {
          title: "Certificates",
          body: "Eligible courses can issue verifiable certificates once the required tracks and assessments are completed.",
        },
        {
          title: "Account setup",
          body: "Sign in with email, Google, or GitHub to sync progress and keep your dashboard ready across devices.",
        },
      ]}
    />
  );
}
