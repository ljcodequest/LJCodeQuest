import { Wrench } from "lucide-react";

export const metadata = {
  title: "Challenges - LJ CodeQuest",
  description: "Daily coding challenges and activities.",
};

export default function ChallengesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center pb-20">
      <div className="w-24 h-24 bg-muted border border-border rounded-2xl flex items-center justify-center mb-8 shadow-sm">
        <Wrench className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
        Coming Soon
      </h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-8">
        We're currently building out interactive daily challenges to test your skills against the community. Stay tuned!
      </p>
    </div>
  );
}
