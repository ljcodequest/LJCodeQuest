import { Newspaper } from "lucide-react";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = {
  title: "Blog - LJ CodeQuest",
  description: "Updates and learning notes from LJ CodeQuest.",
};

export default function BlogPage() {
  return (
    <InfoPage
      eyebrow="Blog"
      title="Product updates and practical coding notes are on the way."
      description="This space will collect platform updates, learning strategies, and behind-the-scenes improvements as LJ CodeQuest grows."
      icon={Newspaper}
      sections={[
        {
          title: "Release notes",
          body: "Follow new tracks, assessment improvements, certificate updates, and dashboard changes as they ship.",
        },
        {
          title: "Learning guides",
          body: "Expect short, focused articles that help you practice algorithms, debugging, system design, and secure coding.",
        },
        {
          title: "Community stories",
          body: "We will highlight learner milestones, project wins, and the paths students take through the platform.",
        },
        {
          title: "Engineering notes",
          body: "Technical posts will explain how major platform features are built and improved over time.",
        },
      ]}
    />
  );
}
