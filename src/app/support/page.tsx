import { LifeBuoy } from "lucide-react";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = {
  title: "Support - LJ CodeQuest",
  description: "Support information for LJ CodeQuest.",
};

export default function SupportPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Get unstuck with account, course, or assessment issues."
      description="Support resources are being organized around the most common learning and sign-in problems."
      icon={LifeBuoy}
      sections={[
        {
          title: "Sign-in help",
          body: "If login loops back to the sign-in page, refresh and try again. The app now waits for the server session before opening protected routes.",
        },
        {
          title: "Course access",
          body: "Protected learning pages require an active account and a valid session so your progress can be loaded safely.",
        },
        {
          title: "Assessment issues",
          body: "When a quiz or code challenge behaves unexpectedly, keep the course and track names handy so the issue can be traced quickly.",
        },
        {
          title: "Platform feedback",
          body: "Feedback about missing content, unclear questions, or broken links helps improve the learning experience for everyone.",
        },
      ]}
    />
  );
}
