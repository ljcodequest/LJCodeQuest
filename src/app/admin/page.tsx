import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, CheckSquare, Trophy } from "lucide-react";
import dbConnect from "@/lib/db";
import { UserModel, CourseModel } from "@/models";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await dbConnect();
  
  // Fetch basic stats
  const totalUsers = await UserModel.countDocuments();
  const totalCourses = await CourseModel.countDocuments();
  // Assume we will query SubmissionModel with { status: "pending" } later
  const pendingReviews = 0; 
  const totalTracks = await CourseModel.aggregate([
    { $project: { tracksCount: { $size: { $ifNull: ["$tracks", []] } } } },
    { $group: { _id: null, total: { $sum: "$tracksCount" } } }
  ]);
  
  const trackCount = totalTracks.length > 0 ? totalTracks[0].total : 0;

  const stats = [
    { name: "Total Users", value: totalUsers, icon: Users, description: "Registered platform users" },
    { name: "Active Courses", value: totalCourses, icon: BookOpen, description: "Published learning paths" },
    { name: "Total Tracks", value: trackCount, icon: Trophy, description: "Individual course modules" },
    { name: "Pending Reviews", value: pendingReviews, icon: CheckSquare, description: "Descriptive submissions to review" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Welcome to the LJ CodeQuest Admin Panel. Here's what's happening today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">User table preview will go here.</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">Shortcuts to create courses and review submissions will go here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
