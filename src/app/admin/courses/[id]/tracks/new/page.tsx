"use client";

import TrackEditor from "@/components/admin/track-form";
import { use } from "react";

export default function NewTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TrackEditor courseId={id} />;
}
