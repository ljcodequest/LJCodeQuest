import { FileBadge } from "lucide-react";

export const metadata = {
  title: "Certificates - LJ CodeQuest",
};

export default function CertificatesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center pb-20">
      <div className="w-24 h-24 bg-muted border border-border rounded-2xl flex items-center justify-center mb-8 shadow-sm">
        <FileBadge className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
        Certifications Coming Soon
      </h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-8">
        We're working on a feature that lets you claim and share verifiable certificates for tracks you've passed. Keep coding!
      </p>
    </div>
  );
}
