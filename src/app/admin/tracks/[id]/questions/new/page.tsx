"use client";

import QuestionEditor from "@/components/admin/question-form";
import { use } from "react";

export default function NewQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <QuestionEditor trackId={id} />;
}
