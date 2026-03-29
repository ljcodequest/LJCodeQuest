"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BookOpen, Clock, BarChart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Course {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  thumbnail?: string;
  estimatedHours: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        // Note: We need to implement /api/courses to fetch public courses
        const res = await fetch("/api/courses");
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
    
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || course.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="bg-muted border-b border-border py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Course Catalog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Choose your learning path. Explore our interactive curriculum spanning from fundamental programming concepts to advanced cloud patterns.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between bg-card p-4 rounded-lg border border-border">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-auto flex gap-4">
            <select
              className="w-full md:w-auto bg-background border border-border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
             <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
             <h3 className="text-xl font-bold">No courses found</h3>
             <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => (
              <Link key={course._id} href={`/courses/${course.slug}`}>
                <div className="bg-card group hover:-translate-y-1 transition-all duration-300 h-full rounded-xl border border-border overflow-hidden flex flex-col hover:shadow-lg hover:shadow-primary/5">
                  <div className="h-48 bg-muted relative overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:scale-105 transition-transform duration-500">
                         <BookOpen className="w-12 h-12 text-primary/50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className={`uppercase text-[10px] tracking-wider font-bold ${
                        course.difficulty === 'beginner' ? 'bg-green-500 hover:bg-green-600' :
                        course.difficulty === 'intermediate' ? 'bg-yellow-500 hover:bg-yellow-600 font-bold text-black' :
                        'bg-red-500 hover:bg-red-600 font-bold text-white'
                      }`}>
                        {course.difficulty}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                      {course.shortDescription}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {course.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                          {tag}
                        </span>
                      ))}
                      {course.tags && course.tags.length > 3 && (
                        <span className="text-[10px] font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                          +{course.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <Button variant="ghost" className="p-0 h-auto font-semibold text-primary group-hover:translate-x-1 transition-transform">
                        View Curriculum <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
