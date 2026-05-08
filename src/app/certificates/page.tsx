import { FileBadge } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        Your Certificates
      </h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-8">
        Certificates are issued automatically when you complete every course requirement. Open your dashboard to download and verify earned awards.
      </p>
      <Link href="/dashboard">
        <Button>Open Dashboard</Button>
      </Link>
    </div>
  );
}
