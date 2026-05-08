import { CircleHelp } from "lucide-react";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = {
  title: "FAQ - LJ CodeQuest",
  description: "Frequently asked questions about LJ CodeQuest.",
};

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="FAQ"
      title="Answers for common LJ CodeQuest questions."
      description="A quick reference for accounts, courses, certificates, and learning progress."
      icon={CircleHelp}
      sections={[
        {
          title: "Do I need an account?",
          body: "You can browse public pages without signing in, but progress, dashboard data, certificates, and protected lessons require an account.",
        },
        {
          title: "How is progress saved?",
          body: "After sign-in, LJ CodeQuest creates a secure session and syncs your Firebase identity with the platform database.",
        },
        {
          title: "Can I use social login?",
          body: "Yes. Google and GitHub sign-in are supported when the Firebase project is configured for those providers.",
        },
        {
          title: "Are certificates instant?",
          body: "Certificates depend on course eligibility and completion status. The certificate tools are being expanded as courses mature.",
        },
      ]}
    />
  );
}
