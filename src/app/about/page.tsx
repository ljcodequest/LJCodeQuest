import { Sparkles } from "lucide-react";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = {
  title: "About - LJ CodeQuest",
  description: "About LJ CodeQuest.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="A focused platform for practicing real programming skills."
      description="LJ CodeQuest is built to help learners move from passive tutorials to hands-on coding, measurable progress, and shareable proof of skill."
      icon={Sparkles}
      sections={[
        {
          title: "Mission",
          body: "Make coding practice structured, motivating, and honest about mastery by combining lessons, assessments, and progress tracking.",
        },
        {
          title: "Learning model",
          body: "Courses are divided into tracks so learners can build skill step by step instead of jumping randomly between topics.",
        },
        {
          title: "Built for proof",
          body: "Certificates and public verification pages are designed to make completed work easier to share with mentors and employers.",
        },
        {
          title: "Built by",
          body: "The platform is created by Lahiru Harshana Jayasinghe as a practical learning and assessment environment.",
        },
      ]}
    />
  );
}
