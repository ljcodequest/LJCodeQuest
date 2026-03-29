"use client";

import TrackEditor from "@/components/admin/track-form";
import { useSearchParams } from "next/navigation";
import { use } from "react";

export default function EditTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || undefined;
  
  return <TrackEditor trackId={id} courseId={courseId} />;
}
