import { HelpCircle } from "lucide-react";

export const metadata = {
  title: "Manage Questions - Admin Dashboard",
};

export default function AdminQuestionsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-16 h-16 bg-muted border border-border rounded-xl flex items-center justify-center mb-6 shadow-sm">
        <HelpCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Question Bank Coming Soon</h1>
      <p className="text-muted-foreground max-w-md">
        An interface to add, edit, or configure coding test cases and multiple-choice questions is under active development.
      </p>
    </div>
  );
}
