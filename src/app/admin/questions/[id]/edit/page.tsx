"use client";

import QuestionEditor from "@/components/admin/question-form";
import { useSearchParams } from "next/navigation";
import { use } from "react";

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const trackId = searchParams.get("trackId") || undefined;
  
  return <QuestionEditor questionId={id} trackId={trackId} />;
}
