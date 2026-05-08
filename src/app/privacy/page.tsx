import { ShieldCheck } from "lucide-react";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = {
  title: "Privacy Policy - LJ CodeQuest",
  description: "Privacy policy for LJ CodeQuest.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="How LJ CodeQuest handles account and learning data."
      description="This page summarizes the platform's privacy posture while a fuller legal policy is prepared."
      icon={ShieldCheck}
      ctaLabel="Go to dashboard"
      ctaHref="/dashboard"
      sections={[
        {
          title: "Account data",
          body: "The platform stores basic profile information from your sign-in provider so your account can be identified and restored.",
        },
        {
          title: "Learning data",
          body: "Progress, submissions, attempts, and certificates may be saved to support dashboards, progression, and verification.",
        },
        {
          title: "Session security",
          body: "Server sessions are created from verified Firebase ID tokens and stored in an HTTP-only cookie.",
        },
        {
          title: "Data minimization",
          body: "LJ CodeQuest should only collect data needed to operate courses, authentication, assessments, and certificates.",
        },
      ]}
    />
  );
}
