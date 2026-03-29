"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical, Edit, Trash, HelpCircle, Eye, EyeOff, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Track {
  _id: string;
  title: string;
  courseId: {
    _id: string;
    title: string;
  };
  difficulty: string;
  totalQuestions: number;
  xpReward: number;
  isPublished: boolean;
  order: number;
}

export default function AdminTracksGlobalPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/tracks${searchTerm ? `?search=${searchTerm}` : ''}`);
      const data = await res.json();
      if (data.success) {
        setTracks(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tracks", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [searchTerm]);

  const togglePublish = async (trackId: string, isPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      if (res.ok) fetchTracks();
    } catch (error) {
      console.error("Failed to toggle publish status", error);
    }
  };

  const deleteTrack = async (trackId: string) => {
    if (!confirm("Are you sure? This will delete all questions inside this track and cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}`, { method: "DELETE" });
      if (res.ok) fetchTracks();
    } catch (error) {
      console.error("Failed to delete track", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Global Track Management</h2>
          <p className="text-muted-foreground">View and manage all curriculum tracks across all courses.</p>
        </div>
        <Link href="/admin/courses">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Track (Select Course)
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search all tracks..."
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
                <th className="px-6 py-3 font-medium">Track Title</th>
                <th className="px-6 py-3 font-medium">Parent Course</th>
                <th className="px-6 py-3 font-medium">Difficulty</th>
                <th className="px-6 py-3 font-medium text-center">Questions</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading all tracks...
                  </td>
                </tr>
              ) : tracks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No tracks found across any courses.
                  </td>
                </tr>
              ) : (
                tracks.map((track) => (
                  <tr key={track._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-muted-foreground" />
                      {track.title}
                    </td>
                    <td className="px-6 py-4">
                      {track.courseId ? (
                         <Link href={`/admin/courses/${track.courseId._id}/tracks`} className="text-primary hover:underline">
                            {track.courseId.title}
                         </Link>
                      ) : (
                         <span className="text-red-500 text-xs italic">Orphaned Track</span>
                      )}
                    </td>
                    <td className="px-6 py-4 capitalize">{track.difficulty}</td>
                    <td className="px-6 py-4 text-center">{track.totalQuestions || 0}</td>
                    <td className="px-6 py-4 text-center">
                      {track.isPublished ? (
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
                          <DropdownMenuItem className="cursor-pointer" render={<Link href={`/admin/tracks/${track._id}/edit?courseId=${track.courseId?._id}`} className="flex items-center w-full" />}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" render={<Link href={`/admin/tracks/${track._id}/questions`} className="flex items-center w-full" />}>
                            <HelpCircle className="mr-2 h-4 w-4" />
                            <span>Manage Questions</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => togglePublish(track._id, track.isPublished)}
                          >
                            {track.isPublished ? (
                              <><EyeOff className="mr-2 h-4 w-4" /><span>Unpublish</span></>
                            ) : (
                              <><Eye className="mr-2 h-4 w-4" /><span>Publish</span></>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => deleteTrack(track._id)}
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
