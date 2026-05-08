import { BriefcaseBusiness } from "lucide-react";
import { InfoPage } from "@/components/layout/info-page";

export const metadata = {
  title: "Careers - LJ CodeQuest",
  description: "Careers at LJ CodeQuest.",
};

export default function CareersPage() {
  return (
    <InfoPage
      eyebrow="Careers"
      title="Help build a better coding practice platform."
      description="LJ CodeQuest is growing carefully. Future roles will focus on content quality, product engineering, and learner success."
      icon={BriefcaseBusiness}
      sections={[
        {
          title: "Engineering",
          body: "Product engineering work centers on reliable assessments, fast learning flows, and secure account experiences.",
        },
        {
          title: "Curriculum",
          body: "Course contributors help design tracks, questions, explanations, and projects that teach practical skill.",
        },
        {
          title: "Review",
          body: "Quality review keeps questions accurate, difficulty balanced, and certificates meaningful.",
        },
        {
          title: "Community",
          body: "Learner support and community programs will help students stay consistent and confident.",
        },
      ]}
    />
  );
}
