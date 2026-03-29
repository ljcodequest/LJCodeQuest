"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import { Plus, ArrowLeft, MoreVertical, Edit, Trash, ArrowUp, ArrowDown, HelpCircle, Eye, EyeOff } from "lucide-react";
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
  order: number;
  isPublished: boolean;
  xpReward: number;
  totalQuestions: number;
}

export default function AdminCourseTracksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}/tracks`);
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
  }, [courseId]);

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
    if (!confirm("Are you sure? This will also delete all questions inside this track.")) return;
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}`, { method: "DELETE" });
      if (res.ok) fetchTracks();
    } catch (error) {
      console.error("Failed to delete track", error);
    }
  };

  const moveTrack = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tracks.length - 1) return;

    const newTracks = [...tracks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap tracks locally
    const temp = newTracks[index];
    newTracks[index] = newTracks[swapIndex];
    newTracks[swapIndex] = temp;
    
    setTracks(newTracks);
    setIsReordering(true);

    try {
      const trackIds = newTracks.map(t => t._id);
      await fetch(`/api/admin/courses/${courseId}/tracks/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackIds })
      });
    } catch (error) {
      console.error("Reorder failed", error);
      fetchTracks(); // Revert on failure
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Tracks</h2>
          <p className="text-muted-foreground">Reorder and edit curriculum modules for this course.</p>
        </div>
        <div className="ml-auto">
          <Link href={`/admin/courses/${courseId}/tracks/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Track
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium w-20">Order</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium text-center">Questions</th>
                <th className="px-6 py-3 font-medium text-center">XP Reward</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading tracks...
                  </td>
                </tr>
              ) : tracks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No tracks in this course yet.
                  </td>
                </tr>
              ) : (
                tracks.map((track, index) => (
                  <tr key={track._id} className="hover:bg-muted/50 transition-colors">
                     <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          disabled={index === 0 || isReordering}
                          onClick={() => moveTrack(index, 'up')}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <span className="font-mono text-xs">{index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          disabled={index === tracks.length - 1 || isReordering}
                          onClick={() => moveTrack(index, 'down')}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{track.title}</td>
                    <td className="px-6 py-4 text-center">{track.totalQuestions || 0}</td>
                    <td className="px-6 py-4 text-center">{track.xpReward} XP</td>
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
                          <DropdownMenuItem className="cursor-pointer" render={<Link href={`/admin/tracks/${track._id}/edit?courseId=${courseId}`} className="flex items-center w-full" />}>
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
