"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical, Edit, Trash, Eye, EyeOff, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Course {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  language: string;
  isPublished: boolean;
  createdAt: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/courses${searchTerm ? `?search=${searchTerm}` : ''}`);
      const data = await res.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [searchTerm]);

  const togglePublish = async (id: string, isPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      if (res.ok) fetchCourses();
    } catch (error) {
      console.error("Failed to toggle publish status", error);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) fetchCourses();
    } catch (error) {
      console.error("Failed to delete course", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
          <p className="text-muted-foreground">Manage platform learning courses and tracks.</p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Course
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Difficulty</th>
                <th className="px-6 py-3 font-medium">Language</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Loading courses...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No courses found. Create one to get started.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{course.title}</td>
                    <td className="px-6 py-4 capitalize">{course.difficulty}</td>
                    <td className="px-6 py-4 capitalize">{course.language}</td>
                    <td className="px-6 py-4">
                      {course.isPublished ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 hover:bg-accent rounded-md cursor-pointer">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer" render={<Link href={`/admin/courses/${course._id}`} className="flex items-center w-full" />}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" render={<Link href={`/admin/courses/${course._id}/tracks`} className="flex items-center w-full" />}>
                            <ListOrdered className="mr-2 h-4 w-4" />
                            <span>Manage Tracks</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => togglePublish(course._id, course.isPublished)}
                          >
                            {course.isPublished ? (
                              <><EyeOff className="mr-2 h-4 w-4" /><span>Unpublish</span></>
                            ) : (
                              <><Eye className="mr-2 h-4 w-4" /><span>Publish</span></>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => deleteCourse(course._id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
