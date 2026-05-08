import { ScrollText } from "lucide-react";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = {
  title: "Terms of Service - LJ CodeQuest",
  description: "Terms of service for LJ CodeQuest.",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms"
      title="Use LJ CodeQuest fairly, safely, and honestly."
      description="This page outlines the core expectations for using the platform while a fuller legal terms page is prepared."
      icon={ScrollText}
      ctaLabel="Start learning"
      ctaHref="/courses"
      sections={[
        {
          title: "Your account",
          body: "Keep your account secure and use accurate sign-in information so progress and certificates remain attached to the right learner.",
        },
        {
          title: "Assessment integrity",
          body: "Submissions should represent your own work unless a course or challenge explicitly permits collaboration.",
        },
        {
          title: "Platform use",
          body: "Do not abuse APIs, attempt to bypass access controls, or interfere with other learners' experience.",
        },
        {
          title: "Content changes",
          body: "Courses, questions, certificates, and platform features may change as LJ CodeQuest improves.",
        },
      ]}
    />
  );
}
