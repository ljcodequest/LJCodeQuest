"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TrackEditor({ courseId, trackId }: { courseId?: string, trackId?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!!trackId);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    theoryContent: "",
    passingScore: 80,
    xpReward: 100,
    isPublished: false,
  });

  useEffect(() => {
    if (trackId) {
      fetch(`/api/admin/tracks/${trackId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFormData(data.data);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [trackId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = trackId 
        ? `/api/admin/tracks/${trackId}` 
        : `/api/admin/courses/${courseId}/tracks`;
      const method = trackId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (courseId) {
            router.push(`/admin/courses/${courseId}/tracks`);
        } else {
            router.back();
        }
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to save track.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading track details...</div>;
  }

  const backLink = courseId ? `/admin/courses/${courseId}/tracks` : "/admin/courses";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" size="icon" className="h-8 w-8 rounded-full border-border"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {trackId ? "Edit Track" : "Add New Track"}
          </h2>
          <p className="text-muted-foreground text-sm">
             Design the theory and rewards for this module.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border border-border">
        <div className="space-y-2">
          <label className="text-sm font-medium">Track Title</label>
          <input
            required
            type="text"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Variables and Data Types"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Short Description</label>
          <input
            type="text"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What will the student learn in this track?"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Passing Score (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              required
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.passingScore}
              onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">XP Reward</label>
            <input
              type="number"
              min="0"
              required
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.xpReward}
              onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center justify-between">
            <span>Theory Content (Markdown)</span>
            <span className="text-xs text-muted-foreground font-normal">Supports standard formatting</span>
          </label>
          <textarea
            rows={12}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.theoryContent}
            onChange={(e) => setFormData({ ...formData, theoryContent: e.target.value })}
            placeholder="# Introduction to Variables\n\nVariables are containers for storing data values..."
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isPublishedTrack"
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
          />
          <label htmlFor="isPublishedTrack" className="text-sm font-medium cursor-pointer">
            Publish immediately
          </label>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Track"}
          </Button>
        </div>
      </form>
    </div>
  );
}
