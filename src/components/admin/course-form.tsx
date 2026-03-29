"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CourseEditor({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!!courseId);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    difficulty: "beginner",
    language: "javascript",
    thumbnail: "",
    tags: "",
    isPublished: false,
  });

  useEffect(() => {
    if (courseId) {
      fetch(`/api/admin/courses/${courseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFormData({
              ...data.data,
              tags: data.data.tags ? data.data.tags.join(", ") : "",
            });
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      const url = courseId ? `/api/admin/courses/${courseId}` : `/api/admin/courses`;
      const method = courseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/courses");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to save course.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      alert("Please choose an image file first.");
      return;
    }

    setIsUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", imageFile);

      const res = await fetch("/api/admin/uploads/course-image", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (!res.ok || !data?.success || !data?.data?.url) {
        throw new Error(data?.error || "Failed to upload image.");
      }

      setFormData((prev) => ({ ...prev, thumbnail: data.data.url }));
      setImageFile(null);
    } catch (error: any) {
      console.error("Image upload error", error);
      alert(error?.message || "Image upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading course details...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {courseId ? "Edit Course" : "Create New Course"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {courseId ? "Update course details and settings." : "Add a new course to the platform."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border border-border">
        <div className="space-y-2">
          <label className="text-sm font-medium">Course Title</label>
          <input
            required
            type="text"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Master React in 30 Days"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Short Description</label>
          <input
            required
            type="text"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="A brief 160 character summary..."
            maxLength={160}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            required
            rows={4}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide a comprehensive course description..."
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="typescript">TypeScript</option>
              <option value="c">C</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="ruby">Ruby</option>
              <option value="php">PHP</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags (comma separated)</label>
          <input
            type="text"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="e.g. frontend, react, web"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Thumbnail</label>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="file"
                accept="image/*"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleImageUpload}
                disabled={!imageFile || isUploadingImage}
              >
                {isUploadingImage ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
            {formData.thumbnail ? (
              <div className="w-full max-w-sm h-40 overflow-hidden rounded-md border border-border bg-muted">
                <img
                  src={formData.thumbnail}
                  alt="Course thumbnail preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
          </div>
          <label className="text-sm font-medium">Thumbnail URL (optional manual)</label>
          <input
            type="url"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.thumbnail}
            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
            placeholder="https://example.com/image.png"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isPublished"
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
          />
          <label htmlFor="isPublished" className="text-sm font-medium cursor-pointer">
            Publish immediately
          </label>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Link href="/admin/courses">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Course"}
          </Button>
        </div>
      </form>
    </div>
  );
}
